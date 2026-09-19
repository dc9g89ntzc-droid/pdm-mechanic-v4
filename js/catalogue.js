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

async function recordInventoryTransaction({ itemId, transactionType, quantity, performedBy, notes, jobId }) {
  const { error } = await sb.from('inventory_transactions').insert({
    item_id: itemId,
    transaction_type: transactionType,
    quantity,
    performed_by: performedBy || null,
    notes: notes || null,
    job_id: jobId || null
  });
  if (error) throw new Error(error.message);
}

// ---- Reporting (foreman) ----

async function listInventoryTransactions(limit = 300) {
  const { data, error } = await sb
    .from('inventory_transactions')
    .select('id, item_id, transaction_type, quantity, job_id, performed_by, notes, created_at, catalogue_items ( name )')
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
    .select('id, name, description, sourcing, customer_price, image_url, usage_type, stock_quantity, reorder_threshold')
    .contains('categories', [category])
    .eq('subcategory_id', subcategoryId)
    .eq('active', true)
    .order('name');
  if (error) throw new Error(error.message);
  return data;
}

// ---- Job items (what's been added to a job's quote) ----

async function listJobItems(jobId) {
  const { data, error } = await sb
    .from('job_items')
    .select('id, quantity, unit_price, sourcing_choice, catalogue_item_id, catalogue_items ( name, image_url ) ')
    .eq('job_id', jobId)
    .order('created_at');
  if (error) throw new Error(error.message);
  return data;
}

// Adding the same item (with the same sourcing choice) again increments
// quantity on the existing row instead of creating a duplicate, and logs
// the matching stock movement so inventory_transactions stays the source
// of truth for "what got used on this job."
async function addJobItem({ jobId, catalogueItem, quantity, sourcingChoice, performedBy }) {
  const existing = await sb
    .from('job_items')
    .select('id, quantity')
    .eq('job_id', jobId)
    .eq('catalogue_item_id', catalogueItem.id)
    .is('sourcing_choice', sourcingChoice || null)
    .maybeSingle();
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
      sourcing_choice: sourcingChoice || null,
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
