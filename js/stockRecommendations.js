// Stock recommendations (stock-recommendations.html): how much of each part
// the shop actually gets through per week, from real usage on jobs, and how
// much to buy so the shelf covers the coming week(s). Gets more reliable as
// more weeks of data build up -- the page always says how much data it's
// working from.
//
// Demand = parts used on jobs (inventory_transactions 'used_on_job', which
// Quick Jobs record too). Net of parts taken back off a job, and ignoring
// voided entries AND their reversal rows (sql/032 writes the reversal with
// the same type and opposite sign) so a voided job counts as no usage
// rather than negative usage. Crafting doesn't take ingredients out of
// stock, so it isn't demand here.

// Supabase caps a single select at 1000 rows -- page through.
async function fetchAllRows(buildQuery, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    rows.push(...data);
    if (data.length < pageSize) return rows;
  }
}

async function listUsageSince(fromIso) {
  return fetchAllRows(() => sb
    .from('inventory_transactions')
    .select('item_id, quantity, job_id, created_at')
    .eq('transaction_type', 'used_on_job')
    .is('voided_at', null)
    .is('reversal_of', null)
    .gte('created_at', fromIso)
    .order('created_at'));
}

// When usage tracking effectively started -- caps the averaging window so
// one week of data isn't divided across four weeks.
async function getFirstUsageDate() {
  const { data, error } = await sb
    .from('inventory_transactions')
    .select('created_at')
    .eq('transaction_type', 'used_on_job')
    .order('created_at')
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? data.created_at : null;
}

async function listItemsForStockPlan() {
  return fetchAllRows(() => sb
    .from('catalogue_items')
    .select('id, name, categories, sourcing, usage_type, stock_quantity, reorder_threshold, purchase_cost, shop_price, available_autoparts, available_scrapyard, image_url')
    .eq('active', true)
    .order('name'));
}

const STOCK_PRIORITIES = {
  urgent: { rank: 0, label: 'Out of stock' },
  buy: { rank: 1, label: 'Buy soon' },
  covered: { rank: 2, label: 'Covered' },
  idle: { rank: 3, label: 'No recent use' }
};

// What one unit is likely to cost to restock -- the store's own price as
// last actually paid, else the import price.
function restockUnitCost(item) {
  const price = item.shop_price ?? item.purchase_cost;
  return price === null || price === undefined ? null : Number(price);
}

// items:     listItemsForStockPlan()
// usage:     listUsageSince() rows inside the window
// onList:    { [catalogue_item_id]: unbought quantity already on the shopping list }
// windowDays: days the usage actually covers (already capped to available data)
// coverWeeks: how many weeks of usage the shelf should hold after buying
function buildStockRecommendations({ items, usage, onList = {}, windowDays, coverWeeks = 1 }) {
  const days = Math.max(1, windowDays);
  const usedById = {};
  const jobsById = {};
  usage.forEach((t) => {
    usedById[t.item_id] = (usedById[t.item_id] || 0) - Number(t.quantity); // used rows are negative
    if (t.job_id) (jobsById[t.item_id] = jobsById[t.item_id] || new Set()).add(t.job_id);
  });

  return items.map((item) => {
    const used = Math.max(0, usedById[item.id] || 0);
    const weekly = (used / days) * 7;
    const stock = Number(item.stock_quantity || 0);
    const listed = Number(onList[item.id] || 0);
    const reusable = item.usage_type === 'reusable';

    // A reusable tool only ever needs one on the shelf; consumables need
    // enough to cover the chosen number of weeks, and never less than the
    // manually-set reorder level.
    let target;
    if (reusable) target = used > 0 ? 1 : 0;
    else target = Math.ceil(weekly * coverWeeks - 1e-9);
    if (item.reorder_threshold !== null && item.reorder_threshold !== undefined) {
      target = Math.max(target, Number(item.reorder_threshold));
    }

    const suggested = Math.max(0, target - stock - listed);
    const weeksCover = weekly > 0 ? Math.max(0, stock) / weekly : null;

    let priority;
    if (used === 0 && suggested === 0) priority = 'idle';
    else if (stock <= 0 && (used > 0 || suggested > 0)) priority = 'urgent';
    else if (suggested > 0) priority = 'buy';
    else priority = 'covered';

    const unitCost = restockUnitCost(item);
    return {
      item,
      used,
      weekly: Math.round(weekly * 10) / 10,
      jobs: jobsById[item.id] ? jobsById[item.id].size : 0,
      stock,
      listed,
      target,
      suggested,
      weeksCover,
      priority,
      unitCost,
      suggestedCost: unitCost === null ? null : Math.round(unitCost * suggested * 100) / 100,
      idleValue: priority === 'idle' && unitCost !== null ? Math.round(unitCost * Math.max(0, stock) * 100) / 100 : 0,
      craftOnly: item.sourcing === 'crafted'
    };
  });
}

// Most necessary first: out of stock, then lowest cover / fastest moving;
// least necessary last: unused stock, biggest money tied up first.
function sortStockRecommendations(rows) {
  return [...rows].sort((a, b) => {
    const pr = STOCK_PRIORITIES[a.priority].rank - STOCK_PRIORITIES[b.priority].rank;
    if (pr) return pr;
    if (a.priority === 'idle') return b.idleValue - a.idleValue || a.item.name.localeCompare(b.item.name);
    const coverA = a.weeksCover === null ? -1 : a.weeksCover;
    const coverB = b.weeksCover === null ? -1 : b.weeksCover;
    return coverA - coverB || b.weekly - a.weekly || a.item.name.localeCompare(b.item.name);
  });
}
