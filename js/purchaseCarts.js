// Data-access helpers for shared purchase carts (sql/059) -- the Active
// Purchases board on purchasing.html. One active cart per employee; anyone
// with Purchasing access can view any cart, only the assignee can change it
// (enforced by RLS), and a manager/boss can reassign it.

const CART_SOURCE_TYPES = PURCHASE_SOURCE_TYPES; // autoparts_store | scrapyard | private_citizen

const CART_LINE_SELECT = `
  id, cart_id, quantity, unit_cost, catalogue_item_id, created_at,
  catalogue_items ( id, name, image_url, purchase_cost, shop_price, available_autoparts, available_scrapyard )
`;

async function listActiveCarts() {
  const { data, error } = await sb
    .from('purchase_carts')
    .select(`id, cart_number, source_type, location, notes, status, assigned_to, created_by, created_at, updated_at,
             purchase_cart_lines ( ${CART_LINE_SELECT} )`)
    .eq('status', 'active')
    .order('created_at');
  if (error) throw new Error(error.message);
  return data;
}

async function getCart(cartId) {
  const { data, error } = await sb
    .from('purchase_carts')
    .select(`id, cart_number, source_type, location, notes, status, assigned_to, created_by, created_at, updated_at,
             purchase_cart_lines ( ${CART_LINE_SELECT} )`)
    .eq('id', cartId)
    .single();
  if (error) throw new Error(error.message);
  data.purchase_cart_lines.sort((a, b) => a.created_at.localeCompare(b.created_at));
  return data;
}

async function getMyActiveCart(mechanicId) {
  const { data, error } = await sb
    .from('purchase_carts')
    .select('id')
    .eq('assigned_to', mechanicId)
    .eq('status', 'active')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? getCart(data.id) : null;
}

async function createCart({ sourceType, location, notes, mechanicId }) {
  const { data, error } = await sb
    .from('purchase_carts')
    .insert({
      source_type: sourceType, location: location || 'shop', notes: notes || null,
      assigned_to: mechanicId, created_by: mechanicId
    })
    .select('id')
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('You already have an active purchase -- complete or cancel it first.');
    throw new Error(error.message);
  }
  return getCart(data.id);
}

async function updateCart(cartId, fields) {
  const { error } = await sb.from('purchase_carts').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', cartId);
  if (error) throw new Error(error.message);
}

// Adding an item that's already in the cart tops up its quantity rather than
// making a second line (one line per item, sql/059's unique constraint).
// Price defaults to the last price actually paid at a store, if known.
async function addCartLine(cartId, item, quantity, mechanicId) {
  const qty = Math.round(Number(quantity));
  if (!qty || qty <= 0) throw new Error('Enter a quantity above 0.');
  const { data: existing, error: findErr } = await sb
    .from('purchase_cart_lines')
    .select('id, quantity')
    .eq('cart_id', cartId)
    .eq('catalogue_item_id', item.id)
    .maybeSingle();
  if (findErr) throw new Error(findErr.message);
  if (existing) {
    return updateCartLine(existing.id, { quantity: Number(existing.quantity) + qty });
  }
  const { error } = await sb.from('purchase_cart_lines').insert({
    cart_id: cartId, catalogue_item_id: item.id, quantity: qty,
    unit_cost: item.shop_price ?? null, added_by: mechanicId || null
  });
  if (error) throw new Error(error.message);
}

async function updateCartLine(lineId, fields) {
  const { error } = await sb.from('purchase_cart_lines').update(fields).eq('id', lineId);
  if (error) throw new Error(error.message);
}

async function removeCartLine(lineId) {
  const { error } = await sb.from('purchase_cart_lines').delete().eq('id', lineId);
  if (error) throw new Error(error.message);
}

async function reassignCart(cartId, newAssigneeId) {
  const { error } = await sb.rpc('purchase_cart_reassign', { p_cart_id: cartId, p_new_assignee: newAssigneeId });
  if (error) throw new Error(error.message);
}

// Totals the board and the cart panel both show:
//   withdraw = what's paid at the counter (unit_cost x qty)
//   deposit  = the store's import price (purchase_cost x qty), what has to be
//              deposited for an import run
function cartTotals(lines) {
  let withdraw = 0;
  let deposit = 0;
  let missingPrice = 0;
  let missingImport = false;
  (lines || []).forEach((l) => {
    const qty = Number(l.quantity);
    if (l.unit_cost === null || l.unit_cost === undefined || l.unit_cost === '') missingPrice += 1;
    else withdraw += Number(l.unit_cost) * qty;
    const imp = l.catalogue_items?.purchase_cost;
    if (imp === null || imp === undefined) missingImport = true;
    else deposit += Number(imp) * qty;
  });
  return {
    withdraw: Math.round(withdraw * 100) / 100,
    deposit: Math.round(deposit * 100) / 100,
    missingPrice,
    missingImport
  };
}

// Does this store actually sell the item? (Private citizens can sell anything.)
function cartSourceSellsItem(sourceType, item) {
  if (sourceType === 'autoparts_store') return !!item.available_autoparts;
  if (sourceType === 'scrapyard') return !!item.available_scrapyard;
  return true;
}
