// Port of 11_Stock from PDM Dealership 3.0 -- stock control centre,
// per-vehicle movement history, and physical-count adjustments.
const { selectSql_, rpcSql_, firstRow_, auditLog_ } = require('./supabase');
const { requireSession_, requirePermission_, requireEmployeeLink_ } = require('./session');

async function getStockManagementData(token) {
  const user = requireSession_(token);
  requirePermission_(user, 'can_manage_stock');

  const rows = await selectSql_(
    'current_vehicle_stock',
    '?select=vehicle_id,vehicle_code,make,model,display_name,category,' +
    'import_cost,msrp,recommended_sale_price,suggested_buyback_price,' +
    'active,retired,stock_qty' +
    '&active=eq.true&retired=eq.false&order=display_name.asc'
  ) || [];

  const stock = rows.map(r => ({
    vehicle_id: r.vehicle_id,
    vehicle_code: r.vehicle_code || '',
    make: r.make || '',
    model: r.model || '',
    display_name: r.display_name || '',
    category: r.category || '',
    import_cost: Number(r.import_cost || 0),
    msrp: Number(r.msrp || 0),
    sale_price: Number(r.recommended_sale_price || 0),
    suggested_buyback_price: Number(r.suggested_buyback_price || 0),
    stock_qty: Number(r.stock_qty || 0)
  }));

  const summary = stock.reduce((out, row) => {
    const positiveQty = Math.max(0, row.stock_qty);

    out.total_units += positiveQty;
    if (row.stock_qty > 0) out.models_in_stock += 1;
    if (row.stock_qty < 0) out.negative_models += 1;

    out.import_value += positiveQty * row.import_cost;
    out.retail_value += positiveQty * row.sale_price;

    return out;
  }, {
    total_units: 0,
    models_in_stock: 0,
    negative_models: 0,
    import_value: 0,
    retail_value: 0
  });

  const categories = [...new Set(stock.map(r => r.category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));

  return { summary, categories, stock };
}

async function getVehicleStockHistory(token, vehicleId) {
  const user = requireSession_(token);
  requirePermission_(user, 'can_manage_stock');

  vehicleId = String(vehicleId || '').trim();
  if (!vehicleId) throw new Error('Vehicle ID is required.');

  const rows = await selectSql_(
    'dealership_stock_history',
    '?select=movement_id,vehicle_id,vehicle_name,movement_date,movement_type,' +
    'quantity_change,source_table,source_id,employee_id,employee_name,reason,notes,is_deleted' +
    '&vehicle_id=eq.' + encodeURIComponent(vehicleId) +
    '&is_deleted=eq.false' +
    '&order=movement_date.desc&limit=250'
  ) || [];

  return rows.map(r => ({
    movement_id: r.movement_id,
    vehicle_id: r.vehicle_id,
    vehicle_name: r.vehicle_name || '',
    movement_date: r.movement_date,
    movement_type: r.movement_type || '',
    quantity_change: Number(r.quantity_change || 0),
    source_table: r.source_table || '',
    source_id: r.source_id || '',
    employee_name: r.employee_name || '',
    reason: r.reason || '',
    notes: r.notes || ''
  }));
}

async function adjustVehicleStock(token, vehicleId, newStock, reason) {
  const user = requireSession_(token);
  requirePermission_(user, 'can_manage_stock');

  vehicleId = String(vehicleId || '').trim();
  reason = String(reason || '').trim();

  if (!vehicleId) throw new Error('Vehicle ID is required.');
  requireEmployeeLink_(user);
  if (newStock === '' || newStock === null || newStock === undefined) {
    throw new Error('Enter the physical stock count.');
  }

  newStock = Number(newStock);
  if (!Number.isInteger(newStock) || newStock < 0) {
    throw new Error('Physical stock must be a whole number of 0 or more.');
  }
  if (!reason) throw new Error('Please enter a reason for this stock adjustment.');

  const data = firstRow_(await rpcSql_('dealership_adjust_vehicle_stock', {
    p_vehicle_id: vehicleId,
    p_employee_id: user.employee_id,
    p_employee_name: user.employee_name,
    p_new_stock: newStock,
    p_reason: reason
  }));

  await auditLog_(user, 'ADJUST', 'VEHICLE_STOCK', vehicleId,
    'Adjusted stock for ' + (data?.vehicle_name || vehicleId) +
    ' from ' + Number(data?.old_stock || 0) +
    ' to ' + Number(data?.new_stock || 0), {
      old_stock: Number(data?.old_stock || 0),
      new_stock: Number(data?.new_stock || 0),
      quantity_change: Number(data?.quantity_change || 0),
      reason: reason
    });

  return data;
}

module.exports = {
  functions: { getStockManagementData, getVehicleStockHistory, adjustVehicleStock }
};
