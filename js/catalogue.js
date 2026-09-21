// Data-access helpers for the Items Configurator (management tool) and the
// job-scoped tile browser (category -> subcategory -> item) used to add
// catalogue items onto a job. Categories are free-form tags (see
// 009_catalogue_categories_freeform.sql), not tied to job_type.

const SOURCING_TYPES = [
  { value: 'crafted', label: 'Crafted only' },
  { value: 'purchased', label: 'Purchased only' },
  { value: 'both', label: 'Crafted or purchased' }
];

const USAGE_TYPES = [
  { value: 'single_use', label: 'Single use (consumed on install)' },
  { value: 'reusable', label: 'Reusable / infinite use' }
];

const TRANSACTION_TYPES = [
  { value: 'crafted_in', label: 'Crafted' },
  { value: 'purchased_in', label: 'Purchased' },
  { value: 'used_on_job', label: 'Used on a job' },
  { value: 'adjustment', label: 'Manual adjustment' }
];

// Where a purchased_in transaction's stock actually came from -- matters
// because a private citizen sale price is a one-off, not a stable catalogue
// price, so it's tracked per-purchase rather than as a fixed item field.
const PURCHASE_SOURCE_TYPES = [
  { value: 'autoparts_store', label: 'Autoparts Store' },
  { value: 'private_citizen', label: 'Private Citizen Sale' }
];

function purchaseSourceLabel(value) {
  return PURCHASE_SOURCE_TYPES.find((s) => s.value === value)?.label || value;
}

async function listDistinctCategories() {
  const { data, error } = await sb.from('catalogue_items').select('categories');
  if (error) throw new Error(error.message);
  const set = new Set();
  data.forEach((row) => (row.categories || []).forEach((c) => set.add(c)));
  return Array.from(set).sort();
}

const CATEGORY_PALETTE = ['#f0888c', '#f0a52c', '#22c55e', '#a78bfa', '#38bdf8', '#f472b6', '#facc15', '#4ade80'];

function categoryColor(category) {
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length];
}

async function listSubcategories() {
  const { data, error } = await sb
    .from('catalogue_subcategories')
    .select('id, name, sort_order')
    .order('sort_order')
    .order('name');
  if (error) throw new Error(error.message);
  return data;
}

async function createSubcategory(name) {
  const { data, error } = await sb
    .from('catalogue_subcategories')
    .insert({ name: name.trim() })
    .select('id, name, sort_order')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function deleteSubcategory(id) {
  const { error } = await sb.from('catalogue_subcategories').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// filters: { category, subcategoryId, search, activeOnly }
async function listCatalogueItems(filters = {}) {
  let query = sb
    .from('catalogue_items')
    .select(`
      id, name, description, categories, subcategory_id, end_uses,
      sourcing, craft_time_minutes, craft_cost, purchase_cost, customer_price,
      install_time_minutes, usage_type, required_tool,
      stock_quantity, reorder_threshold, active, image_url, notes,
      catalogue_subcategories ( name )
    `)
    .order('name');

  if (filters.category) query = query.contains('categories', [filters.category]);
  if (filters.subcategoryId) query = query.eq('subcategory_id', filters.subcategoryId);
  if (filters.activeOnly) query = query.eq('active', true);
  if (filters.search) query = query.ilike('name', `%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

async function getCatalogueItem(id) {
  const { data, error } = await sb
    .from('catalogue_items')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function createCatalogueItem(item) {
  const { data, error } = await sb
    .from('catalogue_items')
    .insert(item)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function updateCatalogueItem(id, item) {
  const { error } = await sb.from('catalogue_items').update(item).eq('id', id);
  if (error) throw new Error(error.message);
}

async function listAllItemsForPicker() {
  const { data, error } = await sb
    .from('catalogue_items')
    .select('id, name, categories')
    .eq('active', true)
    .order('name');
  if (error) throw new Error(error.message);
  return data;
}

async function listIngredients(itemId) {
  const { data, error } = await sb
    .from('catalogue_item_ingredients')
    .select('id, quantity, ingredient_item_id, catalogue_items!catalogue_item_ingredients_ingredient_item_id_fkey ( name )')
    .eq('item_id', itemId);
  if (error) throw new Error(error.message);
  return data;
}

async function addIngredient(itemId, ingredientItemId, quantity) {
  const { error } = await sb
    .from('catalogue_item_ingredients')
    .insert({ item_id: itemId, ingredient_item_id: ingredientItemId, quantity });
  if (error) throw new Error(error.message);
}

async function removeIngredient(ingredientRowId) {
  const { error } = await sb.from('catalogue_item_ingredients').delete().eq('id', ingredientRowId);
  if (error) throw new Error(error.message);
}

async function recordInventoryTransaction({ itemId, transactionType, quantity, performedBy, notes, jobId, unitCost, sourceType }) {
  const { error } = await sb.from('inventory_transactions').insert({
    item_id: itemId,
    transaction_type: transactionType,
    quantity,
    performed_by: performedBy || null,
    notes: notes || null,
    job_id: jobId || null,
    unit_cost: unitCost ?? null,
    source_type: sourceType ?? null
  });
  if (error) throw new Error(error.message);
}

// Buying a part -- from the autoparts store or off a private citizen -- is
// how the shop stocks items it has no craft recipe or configured cost for
// yet. Logs the movement like any purchase, but also rolls the price
// actually paid into catalogue_items.purchase_cost so later job costing
// (effectiveUnitCost) and Accounts' COGS calc use a real, current price
// instead of a stale or never-set one.
async function recordPurchase({ itemId, quantity, unitCost, sourceType, performedBy, notes }) {
  await recordInventoryTransaction({
    itemId, transactionType: 'purchased_in', quantity, performedBy, notes, unitCost, sourceType
  });
  const { error } = await sb.from('catalogue_items').update({ purchase_cost: unitCost }).eq('id', itemId);
  if (error) throw new Error(error.message);
}

// ---- Reporting (foreman) ----

async function listInventoryTransactions(limit = 300) {
  const { data, error } = await sb
    .from('inventory_transactions')
    .select('id, item_id, transaction_type, quantity, unit_cost, source_type, job_id, performed_by, notes, created_at, catalogue_items ( name )')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

// PostgREST can't compare two columns of the same row in a filter
// (stock_quantity <= reorder_threshold), so fetch active items that have
// a threshold set and filter client-side -- fine at this catalogue's size.
async function listLowStockItems() {
  const { data, error } = await sb
    .from('catalogue_items')
    .select('id, name, stock_quantity, reorder_threshold, categories')
    .not('reorder_threshold', 'is', null)
    .eq('active', true)
    .order('name');
  if (error) throw new Error(error.message);
  return data.filter((item) => item.stock_quantity <= item.reorder_threshold);
}

// ---- Tile browser (category -> subcategory -> item) ----

async function listSubcategoriesForCategory(category) {
  const { data, error } = await sb
    .from('catalogue_items')
    .select('subcategory_id, catalogue_subcategories ( id, name )')
    .contains('categories', [category])
    .eq('active', true);
  if (error) throw new Error(error.message);
  const map = new Map();
  data.forEach((row) => {
    if (!row.catalogue_subcategories) return;
    const key = row.catalogue_subcategories.id;
    if (!map.has(key)) map.set(key, { id: key, name: row.catalogue_subcategories.name, count: 0 });
    map.get(key).count += 1;
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

async function listItemsForTile(category, subcategoryId) {
  const { data, error } = await sb
    .from('catalogue_items')
    .select('id, name, description, sourcing, customer_price, craft_cost, purchase_cost, image_url, usage_type, stock_quantity, reorder_threshold')
    .contains('categories', [category])
    .eq('subcategory_id', subcategoryId)
    .eq('active', true)
    .order('name');
  if (error) throw new Error(error.message);
  return data;
}

// Which internal cost applies to a unit of this item, given how it's
// actually being sourced this time (matters for sourcing='both' items,
// where the mechanic picks crafted vs purchased per job).
function effectiveUnitCost(catalogueItem, sourcingChoice) {
  const sourcing = sourcingChoice || catalogueItem.sourcing;
  if (sourcing === 'crafted') return catalogueItem.craft_cost;
  if (sourcing === 'purchased') return catalogueItem.purchase_cost;
  return null;
}

// ---- Job items (what's been added to a job's quote) ----

// jobType, when passed, scopes to one leg (sql/031) -- job-items.html and
// quote.html only want the items picked for the leg currently open;
// receipt.html omits it deliberately to sum every leg into one final bill.
async function listJobItems(jobId, jobType) {
  let query = sb
    .from('job_items')
    .select('id, quantity, unit_price, sourcing_choice, catalogue_item_id, job_type, catalogue_items ( name, image_url ) ')
    .eq('job_id', jobId)
    .order('created_at');
  if (jobType) query = query.eq('job_type', jobType);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

// For Accounts' cost-of-goods calculation -- unit_cost only exists on
// items added after 023_job_item_cost_snapshot.sql shipped, so older rows
// contribute null and get excluded (see accounts.html's caveat note).
async function listJobItemsForJobs(jobIds) {
  if (!jobIds || jobIds.length === 0) return [];
  const { data, error } = await sb
    .from('job_items')
    .select('job_id, quantity, unit_cost')
    .in('job_id', jobIds);
  if (error) throw new Error(error.message);
  return data;
}

// Adding the same item (with the same sourcing choice) again increments
// quantity on the existing row instead of creating a duplicate, and logs
// the matching stock movement so inventory_transactions stays the source
// of truth for "what got used on this job."
async function addJobItem({ jobId, catalogueItem, quantity, sourcingChoice, performedBy, jobType }) {
  let existingQuery = sb
    .from('job_items')
    .select('id, quantity')
    .eq('job_id', jobId)
    .eq('catalogue_item_id', catalogueItem.id)
    .is('sourcing_choice', sourcingChoice || null);
  // Same catalogue item picked for two different legs on one job (e.g. the
  // customisation leg and the performance leg both want a set of tyres) has
  // to stay two separate rows, not merge quantities across legs.
  existingQuery = jobType ? existingQuery.eq('job_type', jobType) : existingQuery.is('job_type', null);
  const existing = await existingQuery.maybeSingle();
  if (existing.error) throw new Error(existing.error.message);

  if (existing.data) {
    const { error } = await sb
      .from('job_items')
      .update({ quantity: Number(existing.data.quantity) + quantity })
      .eq('id', existing.data.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await sb.from('job_items').insert({
      job_id: jobId,
      catalogue_item_id: catalogueItem.id,
      quantity,
      unit_price: catalogueItem.customer_price,
      unit_cost: effectiveUnitCost(catalogueItem, sourcingChoice),
      sourcing_choice: sourcingChoice || null,
      job_type: jobType || null,
      added_by: performedBy || null
    });
    if (error) throw new Error(error.message);
  }

  await recordInventoryTransaction({
    itemId: catalogueItem.id, transactionType: 'used_on_job', quantity: -quantity,
    performedBy, jobId, notes: 'Added via job item picker'
  });
}

async function updateJobItemQuantity(id, catalogueItemId, newQuantity, oldQuantity, performedBy, jobId) {
  const delta = newQuantity - oldQuantity;
  const { error } = await sb.from('job_items').update({ quantity: newQuantity }).eq('id', id);
  if (error) throw new Error(error.message);
  if (delta !== 0) {
    await recordInventoryTransaction({
      itemId: catalogueItemId, transactionType: 'used_on_job', quantity: -delta,
      performedBy, jobId, notes: 'Quantity adjusted on job item picker'
    });
  }
}

// Price is independent of stock, so this never touches inventory_transactions
// -- just the quoted line, which flows into jobs.quoted_total via the DB
// trigger. Callers log the override to activity_log themselves since only
// they know the old price for a readable summary.
async function updateJobItemUnitPrice(id, unitPrice) {
  const { error } = await sb.from('job_items').update({ unit_price: unitPrice }).eq('id', id);
  if (error) throw new Error(error.message);
}

async function removeJobItem(id, catalogueItemId, quantity, performedBy, jobId) {
  const { error } = await sb.from('job_items').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await recordInventoryTransaction({
    itemId: catalogueItemId, transactionType: 'used_on_job', quantity,
    performedBy, jobId, notes: 'Removed via job item picker'
  });
}

function sourcingLabel(value) {
  return SOURCING_TYPES.find((s) => s.value === value)?.label || value;
}

function usageLabel(value) {
  return USAGE_TYPES.find((u) => u.value === value)?.label || value;
}
