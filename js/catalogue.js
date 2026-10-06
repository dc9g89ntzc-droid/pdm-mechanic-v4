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
  { value: 'adjustment', label: 'Manual adjustment' },
  { value: 'transfer', label: 'Transfer' }
];

// Where stock physically sits (sql/058). catalogue_items.stock_quantity is
// the combined total; stock_shop / stock_autoparts are the split.
const STOCK_LOCATIONS = [
  { value: 'shop', label: 'Shop storage', short: 'Shop' },
  { value: 'autoparts', label: 'Autoparts store', short: 'Autoparts' }
];

function stockLocationLabel(value, short) {
  const loc = STOCK_LOCATIONS.find((l) => l.value === value);
  return loc ? (short ? loc.short : loc.label) : value;
}

function stockAtLocation(item, location) {
  return Number(location === 'autoparts' ? item.stock_autoparts : item.stock_shop) || 0;
}

// Where a purchased_in transaction's stock actually came from -- matters
// because a private citizen sale price is a one-off, not a stable catalogue
// price, so it's tracked per-purchase rather than as a fixed item field.
const PURCHASE_SOURCE_TYPES = [
  { value: 'autoparts_store', label: 'Autoparts Store' },
  { value: 'scrapyard', label: 'Scrapyard' },
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
// search matches name, description AND notes -- a keyword like "exhaust"
// should still find "Manifold" if that's what "exhaust manifold" got typed
// as, even when "exhaust" itself only appears in the description/notes.
async function listCatalogueItems(filters = {}) {
  let query = sb
    .from('catalogue_items')
    .select(`
      id, name, description, categories, subcategory_id, end_uses,
      sourcing, craft_time_minutes, craft_cost, purchase_cost, shop_price, export_price, customer_price,
      install_time_minutes, usage_type, required_tool,
      stock_quantity, stock_shop, stock_autoparts, reorder_threshold, active, image_url, notes,
      available_autoparts, available_scrapyard,
      catalogue_subcategories ( name )
    `)
    .order('name');

  if (filters.category) query = query.contains('categories', [filters.category]);
  if (filters.subcategoryId) query = query.eq('subcategory_id', filters.subcategoryId);
  if (filters.activeOnly) query = query.eq('active', true);
  if (filters.search) {
    const q = filters.search.replace(/[%,]/g, '');
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,notes.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

// Exact, case-insensitive name lookup -- for callers (the performance
// build suggester) that already know the real catalogue name and just need
// the row, rather than a fuzzy multi-word search. A single .ilike() filter
// like this is safe with any characters in the name (parentheses, commas,
// etc); listCatalogueItems' keyword search below goes through PostgREST's
// .or() syntax instead, which treats those characters as structural and
// breaks on a name like "Race 10-Speed Sequential Transmission (manual)".
async function getCatalogueItemByExactName(name) {
  const { data, error } = await sb
    .from('catalogue_items')
    .select('id, name, customer_price, sourcing, craft_cost, purchase_cost, image_url')
    .ilike('name', name.trim())
    .eq('active', true)
    .limit(1)
    .maybeSingle();
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

async function updateIngredientQuantity(ingredientRowId, quantity) {
  const { error } = await sb.from('catalogue_item_ingredients').update({ quantity }).eq('id', ingredientRowId);
  if (error) throw new Error(error.message);
}

async function removeIngredient(ingredientRowId) {
  const { error } = await sb.from('catalogue_item_ingredients').delete().eq('id', ingredientRowId);
  if (error) throw new Error(error.message);
}

// location: 'shop' | 'autoparts' (sql/058) -- every movement says where.
async function recordInventoryTransaction({ itemId, transactionType, quantity, performedBy, notes, jobId, unitCost, sourceType, batchId, location }) {
  if (!STOCK_LOCATIONS.some((l) => l.value === location)) {
    throw new Error('Stock location is required (shop storage or autoparts store).');
  }
  const { error } = await sb.from('inventory_transactions').insert({
    item_id: itemId,
    transaction_type: transactionType,
    quantity,
    location,
    performed_by: performedBy || null,
    notes: notes || null,
    job_id: jobId || null,
    unit_cost: unitCost ?? null,
    source_type: sourceType ?? null,
    batch_id: batchId || null
  });
  if (error) throw new Error(error.message);
}

// Buying a part -- from the autoparts store, scrapyard, or off a private
// citizen -- is how the shop stocks items it has no craft recipe for yet.
// Logs the movement like any purchase, and rolls the price actually paid
// into catalogue_items.shop_price (what that store charges at its own
// register, ratcheted to "whatever was actually paid most recently" the
// same way this used to update purchase_cost). purchase_cost is left
// alone -- it's the *import* price (what it costs to stock that store's
// inventory in the first place), a separate, Joanna-maintained figure that
// a purchase completing shouldn't silently overwrite.
// batchId (sql/055) ties one checkout's items together for the Logs page;
// location (sql/058) is where the stock is being put.
async function recordPurchase({ itemId, quantity, unitCost, sourceType, performedBy, notes, batchId, location }) {
  await recordInventoryTransaction({
    itemId, transactionType: 'purchased_in', quantity, performedBy, notes, unitCost, sourceType, batchId, location
  });
  const { error } = await sb.from('catalogue_items').update({ shop_price: unitCost }).eq('id', itemId);
  if (error) throw new Error(error.message);
}

// Corrects a miscounted shelf to its real total, rather than logging a
// discrete crafted/purchased/used event -- works out the signed delta from
// currentQuantity and records it as a single 'adjustment' transaction (the
// only primitive that actually exists for changing stock_quantity; there's
// no absolute-set operation at the DB layer, see apply_inventory_transaction
// in sql/008/025). Returns the delta recorded, or null if nothing changed.
// currentQuantity/newQuantity are that one location's count, not the total.
async function setStockQuantity(itemId, currentQuantity, newQuantity, performedBy, notes, location) {
  const delta = Number(newQuantity) - Number(currentQuantity);
  if (delta === 0) return null;
  const correctionNote = `Corrected ${stockLocationLabel(location).toLowerCase()} stock from ${currentQuantity} to ${newQuantity}`;
  await recordInventoryTransaction({
    itemId, transactionType: 'adjustment', quantity: delta, location,
    performedBy, notes: notes ? `${correctionNote} — ${notes}` : correctionNote
  });
  return delta;
}

// Moves stock between the two locations: two 'transfer' rows (out of one,
// into the other) sharing a batch_id, so the total never changes and voiding
// either half voids both (sql/058).
async function transferStock({ itemId, quantity, from, to, performedBy, notes }) {
  const qty = Math.round(Number(quantity));
  if (!Number.isFinite(qty) || qty <= 0) throw new Error('Enter how many to move.');
  if (from === to) throw new Error('Pick two different locations.');
  const batchId = crypto.randomUUID();
  const note = `Moved ${qty} from ${stockLocationLabel(from).toLowerCase()} to ${stockLocationLabel(to).toLowerCase()}${notes ? ` — ${notes}` : ''}`;
  await recordInventoryTransaction({ itemId, transactionType: 'transfer', quantity: -qty, location: from, performedBy, notes: note, batchId });
  await recordInventoryTransaction({ itemId, transactionType: 'transfer', quantity: qty, location: to, performedBy, notes: note, batchId });
}

// Stock used on (positive) or returned from (negative) a job. Usage comes out
// of shop storage first and only dips into the autoparts store for the rest
// (Joanna's rule); anything beyond both comes off the shop, since that's
// where the work physically happened. Returns always go back to the shop.
async function recordJobStockUsage({ itemId, used, performedBy, jobId, notes }) {
  const qty = Number(used);
  if (!qty) return;
  if (qty < 0) {
    await recordInventoryTransaction({ itemId, transactionType: 'used_on_job', quantity: -qty, location: 'shop', performedBy, jobId, notes });
    return;
  }
  const { data, error } = await sb
    .from('catalogue_items')
    .select('stock_shop, stock_autoparts')
    .eq('id', itemId)
    .single();
  if (error) throw new Error(error.message);
  const shop = Math.max(0, Number(data.stock_shop) || 0);
  const autoparts = Math.max(0, Number(data.stock_autoparts) || 0);
  const fromAutoparts = Math.min(Math.max(0, qty - shop), autoparts);
  const fromShop = qty - fromAutoparts;
  if (fromShop > 0) {
    await recordInventoryTransaction({ itemId, transactionType: 'used_on_job', quantity: -fromShop, location: 'shop', performedBy, jobId, notes });
  }
  if (fromAutoparts > 0) {
    await recordInventoryTransaction({ itemId, transactionType: 'used_on_job', quantity: -fromAutoparts, location: 'autoparts', performedBy, jobId, notes });
  }
}

// ---- Reporting (foreman) ----

// filters: { limit, fromDate, toDate, includeVoided }
async function listInventoryTransactions(filters = {}) {
  let query = sb
    .from('inventory_transactions')
    .select(`
      id, item_id, transaction_type, quantity, location, unit_cost, source_type, job_id, batch_id,
      performed_by, notes, created_at, voided_at, voided_by, void_reason, reversal_of,
      catalogue_items ( name )
    `)
    .order('created_at', { ascending: false })
    .limit(filters.limit || 300);
  if (filters.fromDate) query = query.gte('created_at', filters.fromDate);
  if (filters.toDate) query = query.lte('created_at', filters.toDate);
  if (filters.transactionType) query = query.eq('transaction_type', filters.transactionType);
  if (!filters.includeVoided) query = query.is('voided_at', null);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

// Management-only (enforced server-side by is_management_mechanic() inside
// the RPC) -- marks the transaction voided AND inserts a real reversing
// entry, so stock_quantity actually moves back the same way a manual
// 'adjustment' correction already does today (sql/032_logs_admin.sql).
async function voidInventoryTransaction(id, reason) {
  const { error } = await sb.rpc('void_inventory_transaction', { p_id: id, p_reason: reason || null });
  if (error) throw new Error(error.message);
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
    .select('id, name, description, sourcing, customer_price, craft_cost, purchase_cost, shop_price, image_url, usage_type, stock_quantity, reorder_threshold, available_autoparts, available_scrapyard')
    .contains('categories', [category])
    .eq('subcategory_id', subcategoryId)
    .eq('active', true)
    .order('name');
  if (error) throw new Error(error.message);
  return data;
}

// Small "Auto" / "Scrap" tag for wherever a part's real-world source matters
// (item tiles, materials-required panel, the .txt export). Empty when
// neither is known/set yet -- these start false until Joanna marks them via
// catalogue.html, same "unknown stays unmarked" convention as everywhere else.
function sourceStoreLabel(item) {
  const tags = [];
  if (item.available_autoparts) tags.push('Auto');
  if (item.available_scrapyard) tags.push('Scrap');
  return tags.join(' + ');
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

// Sliding-scale markup suggestion for the catalogue management form's
// "Suggest" button (catalogue.html) -- higher % on cheap parts, lower % on
// expensive ones, matching sql/042_markup_increase.sql's formula exactly
// (bumped ~11-13% per band over the original sql/035 rates -- Joanna felt
// pricing was running a bit cheap overall). Never called automatically;
// Joanna clicks to fill the customer price field, and can still edit the
// result by hand.
function suggestedCustomerPrice(purchaseCost) {
  const cost = Number(purchaseCost);
  if (!Number.isFinite(cost) || cost < 0) return null;
  let rate;
  if (cost < 25) rate = 2.25;
  else if (cost < 100) rate = 1.95;
  else if (cost < 500) rate = 1.70;
  else if (cost < 2000) rate = 1.50;
  else if (cost < 10000) rate = 1.40;
  else rate = 1.30;
  return Math.round(cost * rate * 100) / 100;
}

// ---- Job items (what's been added to a job's quote) ----

// jobType, when passed, scopes to one leg (sql/031) -- job-items.html and
// quote.html only want the items picked for the leg currently open;
// receipt.html omits it deliberately to sum every leg into one final bill.
async function listJobItems(jobId, jobType) {
  let query = sb
    .from('job_items')
    .select('id, quantity, unit_price, sourcing_choice, catalogue_item_id, job_type, catalogue_items ( name, image_url, available_autoparts, available_scrapyard, install_time_minutes ) ')
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

  await recordJobStockUsage({
    itemId: catalogueItem.id, used: quantity,
    performedBy, jobId, notes: 'Added via job item picker'
  });
}

async function updateJobItemQuantity(id, catalogueItemId, newQuantity, oldQuantity, performedBy, jobId) {
  const delta = newQuantity - oldQuantity;
  const { error } = await sb.from('job_items').update({ quantity: newQuantity }).eq('id', id);
  if (error) throw new Error(error.message);
  if (delta !== 0) {
    await recordJobStockUsage({
      itemId: catalogueItemId, used: delta,
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
  await recordJobStockUsage({
    itemId: catalogueItemId, used: -quantity,
    performedBy, jobId, notes: 'Removed via job item picker'
  });
}

function sourcingLabel(value) {
  return SOURCING_TYPES.find((s) => s.value === value)?.label || value;
}

function usageLabel(value) {
  return USAGE_TYPES.find((u) => u.value === value)?.label || value;
}
