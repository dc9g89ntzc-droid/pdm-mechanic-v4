// Data-access helpers for the shopping list (sql/044) -- restock requests
// conglomerated across however many jobs asked for the same part, checked
// off as bought, then converted into real stock in one go on purchasing.html.

async function listShoppingList() {
  const { data, error } = await sb
    .from('shopping_list_items')
    .select(`
      id, quantity, bought, bought_at, created_at,
      catalogue_items ( id, name, image_url, purchase_cost, shop_price, available_autoparts, available_scrapyard )
    `)
    .order('created_at');
  if (error) throw new Error(error.message);
  return data;
}

// One row per catalogue item -- adding the same item again increases its
// quantity instead of creating a duplicate (the "conglomerate across
// several different orders" behaviour). Newly-added quantity un-ticks
// `bought` if the row had already been checked off, since there's now more
// of it that genuinely hasn't been bought yet.
async function addToShoppingList(catalogueItemId, quantity, performedBy) {
  const { data: existing, error: findErr } = await sb
    .from('shopping_list_items')
    .select('id, quantity')
    .eq('catalogue_item_id', catalogueItemId)
    .maybeSingle();
  if (findErr) throw new Error(findErr.message);

  if (existing) {
    const { error } = await sb
      .from('shopping_list_items')
      .update({ quantity: Number(existing.quantity) + Number(quantity), bought: false, bought_at: null, bought_by: null })
      .eq('id', existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await sb
      .from('shopping_list_items')
      .insert({ catalogue_item_id: catalogueItemId, quantity, added_by: performedBy || null });
    if (error) throw new Error(error.message);
  }
}

// jobItems is listJobItems()'s shape (job-items.html's materials-required
// lines) -- lets "Add to shopping list" send a whole job's materials in
// one go, same conglomerating behaviour per line.
async function addJobItemsToShoppingList(jobItems, performedBy) {
  for (const line of jobItems) {
    if (!line.catalogue_item_id) continue;
    await addToShoppingList(line.catalogue_item_id, Number(line.quantity), performedBy);
  }
}

async function updateShoppingListItemQuantity(id, quantity) {
  const { error } = await sb.from('shopping_list_items').update({ quantity }).eq('id', id);
  if (error) throw new Error(error.message);
}

async function setShoppingListItemBought(id, bought, performedBy) {
  const { error } = await sb
    .from('shopping_list_items')
    .update({ bought, bought_at: bought ? new Date().toISOString() : null, bought_by: bought ? (performedBy || null) : null })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

async function removeFromShoppingList(id) {
  const { error } = await sb.from('shopping_list_items').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

async function clearShoppingListItems(ids) {
  if (!ids || ids.length === 0) return;
  const { error } = await sb.from('shopping_list_items').delete().in('id', ids);
  if (error) throw new Error(error.message);
}
