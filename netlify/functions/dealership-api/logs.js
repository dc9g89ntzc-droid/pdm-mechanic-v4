// Port of 07_Logs from PDM Dealership 3.0 -- Owner/Manager-only views of
// sales/imports/buybacks/exports, with soft-delete + restore. The four
// log types are identical apart from table, columns, search fields and
// RPC names, so they're described once in LOG_TYPES rather than written
// out four times like the Apps Script version.
const { selectSql_, rpcSql_, firstRow_, auditLog_ } = require('./supabase');
const { requireSession_, requireEmployeeLink_ } = require('./session');

function requireManager_(user) {
  if (!user || !['MANAGER', 'OWNER'].includes(String(user.role || '').toUpperCase())) {
    throw new Error('You do not have permission to access dealership logs.');
  }
}

async function readLog_(token, options, view, select, dateColumn, searchFields) {
  const user = requireSession_(token);
  requireManager_(user);

  options = options || {};
  const showDeleted = options.show_deleted === true;
  const search = String(options.search || '').trim().toLowerCase();

  let query = '?select=' + select + '&order=' + dateColumn + '.desc&limit=500';
  if (!showDeleted) query += '&is_deleted=eq.false';

  let rows = await selectSql_(view, query) || [];

  if (search) {
    rows = rows.filter(r =>
      searchFields.some(f => String(r[f] || '').toLowerCase().includes(search))
    );
  }

  return rows;
}

async function getSalesLog(token, options) {
  return readLog_(
    token, options, 'dealership_sales_log',
    'sale_id,sale_ref,sale_batch_id,sale_date,customer_name,employee_name,total_price,notes,' +
    'is_deleted,deleted_at,deleted_by,deleted_by_name,delete_reason,vehicle_id,vehicle_name,unit_import_cost,line_total,profit',
    'sale_date',
    ['sale_ref', 'sale_batch_id', 'vehicle_name', 'customer_name', 'employee_name', 'deleted_by_name']
  );
}

async function getImportsLog(token, options) {
  return readLog_(
    token, options, 'dealership_imports_log',
    'import_id,import_ref,import_batch_id,import_date,employee_name,total_cost,notes,' +
    'is_deleted,deleted_at,deleted_by_name,delete_reason,vehicle_id,vehicle_name,quantity,unit_cost,line_total',
    'import_date',
    ['import_ref', 'import_batch_id', 'vehicle_name', 'employee_name', 'deleted_by_name']
  );
}

async function getBuybacksLog(token, options) {
  return readLog_(
    token, options, 'dealership_buybacks_log',
    'buyback_id,buyback_ref,buyback_batch_id,buyback_date,seller_name,employee_name,' +
    'destination,verified,total_cost,notes,is_deleted,deleted_at,deleted_by,deleted_by_name,' +
    'delete_reason,vehicle_id,vehicle_name,quantity,unit_buyback_price,line_total,' +
    'import_export_value,pdm_sale_price',
    'buyback_date',
    ['buyback_ref', 'buyback_batch_id', 'vehicle_name', 'seller_name', 'employee_name', 'destination', 'deleted_by_name']
  );
}

async function getExportsLog(token, options) {
  return readLog_(
    token, options, 'dealership_exports_log',
    'export_id,export_ref,export_batch_id,export_date,employee_name,' +
    'linked_buyback_id,export_origin,verified,total_value,notes,is_deleted,' +
    'deleted_at,deleted_by,deleted_by_name,delete_reason,vehicle_id,vehicle_name,' +
    'quantity,unit_export_price,line_total,pdm_sale_price',
    'export_date',
    ['export_ref', 'export_batch_id', 'vehicle_name', 'employee_name', 'export_origin', 'deleted_by_name']
  );
}

// Sales and imports' delete/restore RPCs predate employee_id being passed
// through; buybacks and exports take it. Kept exactly as the RPCs expect.
async function deleteSaleFromLog(token, saleId, reason) {
  const user = requireSession_(token);
  requireManager_(user);

  saleId = String(saleId || '').trim();
  reason = String(reason || '').trim();

  if (!saleId) throw new Error('Sale ID is required.');
  if (!reason) throw new Error('Please enter a reason for deleting this sale.');

  const data = firstRow_(await rpcSql_('dealership_delete_sale', {
    p_sale_id: saleId,
    p_employee_name: user.employee_name,
    p_reason: reason
  }));

  await auditLog_(user, 'DELETE', 'VEHICLE_SALE', saleId,
    'Soft-deleted sale ' + (data && data.sale_ref ? data.sale_ref : saleId),
    { reason: reason, stock_change: 1 });

  return data;
}

async function restoreSaleFromLog(token, saleId) {
  const user = requireSession_(token);
  requireManager_(user);

  saleId = String(saleId || '').trim();
  if (!saleId) throw new Error('Sale ID is required.');

  const data = firstRow_(await rpcSql_('dealership_restore_sale', {
    p_sale_id: saleId,
    p_employee_name: user.employee_name
  }));

  await auditLog_(user, 'RESTORE', 'VEHICLE_SALE', saleId,
    'Restored sale ' + (data && data.sale_ref ? data.sale_ref : saleId),
    { stock_change: -1 });

  return data;
}

async function deleteImportFromLog(token, importId, reason) {
  const user = requireSession_(token);
  requireManager_(user);

  importId = String(importId || '').trim();
  reason = String(reason || '').trim();

  if (!importId) throw new Error('Import ID is required.');
  if (!reason) throw new Error('Please enter a reason for deleting this import.');

  const data = firstRow_(await rpcSql_('dealership_delete_import', {
    p_import_id: importId,
    p_employee_name: user.employee_name,
    p_reason: reason
  }));

  await auditLog_(user, 'DELETE', 'VEHICLE_IMPORT', importId,
    'Soft-deleted import ' + (data && data.import_ref ? data.import_ref : importId),
    {
      reason: reason,
      quantity: Number(data && data.quantity || 0),
      stock_change: Number(data && data.stock_change || 0)
    });

  return data;
}

async function restoreImportFromLog(token, importId) {
  const user = requireSession_(token);
  requireManager_(user);

  importId = String(importId || '').trim();
  if (!importId) throw new Error('Import ID is required.');

  const data = firstRow_(await rpcSql_('dealership_restore_import', {
    p_import_id: importId,
    p_employee_name: user.employee_name
  }));

  await auditLog_(user, 'RESTORE', 'VEHICLE_IMPORT', importId,
    'Restored import ' + (data && data.import_ref ? data.import_ref : importId),
    {
      quantity: Number(data && data.quantity || 0),
      stock_change: Number(data && data.stock_change || 0)
    });

  return data;
}

async function deleteBuybackFromLog(token, buybackId, reason) {
  const user = requireSession_(token);
  requireManager_(user);

  buybackId = String(buybackId || '').trim();
  reason = String(reason || '').trim();

  if (!buybackId) throw new Error('Buyback ID is required.');
  if (!reason) throw new Error('Please enter a reason for deleting this buyback.');
  requireEmployeeLink_(user);

  const data = firstRow_(await rpcSql_('dealership_delete_buyback', {
    p_buyback_id: buybackId,
    p_employee_id: user.employee_id,
    p_employee_name: user.employee_name,
    p_reason: reason
  }));

  await auditLog_(user, 'DELETE', 'VEHICLE_BUYBACK', buybackId,
    'Soft-deleted buyback ' + (data && data.buyback_ref ? data.buyback_ref : buybackId),
    {
      reason: reason,
      quantity: Number(data && data.quantity || 0),
      stock_change: Number(data && data.stock_change || 0)
    });

  return data;
}

async function restoreBuybackFromLog(token, buybackId) {
  const user = requireSession_(token);
  requireManager_(user);

  buybackId = String(buybackId || '').trim();

  if (!buybackId) throw new Error('Buyback ID is required.');
  requireEmployeeLink_(user);

  const data = firstRow_(await rpcSql_('dealership_restore_buyback', {
    p_buyback_id: buybackId,
    p_employee_id: user.employee_id,
    p_employee_name: user.employee_name
  }));

  await auditLog_(user, 'RESTORE', 'VEHICLE_BUYBACK', buybackId,
    'Restored buyback ' + (data && data.buyback_ref ? data.buyback_ref : buybackId),
    {
      quantity: Number(data && data.quantity || 0),
      stock_change: Number(data && data.stock_change || 0)
    });

  return data;
}

async function deleteExportFromLog(token, exportId, reason) {
  const user = requireSession_(token);
  requireManager_(user);

  exportId = String(exportId || '').trim();
  reason = String(reason || '').trim();

  if (!exportId) throw new Error('Export ID is required.');
  if (!reason) throw new Error('Please enter a reason for deleting this export.');
  requireEmployeeLink_(user);

  const data = firstRow_(await rpcSql_('dealership_delete_export', {
    p_export_id: exportId,
    p_employee_id: user.employee_id,
    p_employee_name: user.employee_name,
    p_reason: reason
  }));

  await auditLog_(user, 'DELETE', 'VEHICLE_EXPORT', exportId,
    'Soft-deleted export ' + (data && data.export_ref ? data.export_ref : exportId),
    {
      reason: reason,
      quantity: Number(data && data.quantity || 0),
      stock_change: Number(data && data.stock_change || 0)
    });

  return data;
}

async function restoreExportFromLog(token, exportId) {
  const user = requireSession_(token);
  requireManager_(user);

  exportId = String(exportId || '').trim();

  if (!exportId) throw new Error('Export ID is required.');
  requireEmployeeLink_(user);

  const data = firstRow_(await rpcSql_('dealership_restore_export', {
    p_export_id: exportId,
    p_employee_id: user.employee_id,
    p_employee_name: user.employee_name
  }));

  await auditLog_(user, 'RESTORE', 'VEHICLE_EXPORT', exportId,
    'Restored export ' + (data && data.export_ref ? data.export_ref : exportId),
    {
      quantity: Number(data && data.quantity || 0),
      stock_change: Number(data && data.stock_change || 0)
    });

  return data;
}

module.exports = {
  functions: {
    getSalesLog,
    getImportsLog,
    getBuybacksLog,
    getExportsLog,
    deleteSaleFromLog,
    restoreSaleFromLog,
    deleteImportFromLog,
    restoreImportFromLog,
    deleteBuybackFromLog,
    restoreBuybackFromLog,
    deleteExportFromLog,
    restoreExportFromLog
  }
};
