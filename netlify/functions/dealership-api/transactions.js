// Port of 06_Sales, 08_Imports, 09_Buybacks, 10_Exports from PDM
// Dealership 3.0 -- the four batch-entry screens. Each one loads its
// picker data, then submits a whole batch through one RPC.
const { selectSql_, rpcSql_, firstRow_, auditLog_ } = require('./supabase');
const { requireSession_, requirePermission_, requireEmployeeLink_ } = require('./session');

function stockMap_(stockRows) {
  const stockByVehicle = {};
  (stockRows || []).forEach(row => {
    if (row.vehicle_id) {
      stockByVehicle[String(row.vehicle_id)] = Number(row.stock_qty || 0);
    }
  });
  return stockByVehicle;
}

// ============================================================
// SELL VEHICLE (06_Sales)
// ============================================================

async function getSellVehicleData(token) {
  const user = requireSession_(token);
  requirePermission_(user, 'can_sell');

  const [vehicles, stockRows, customers] = await Promise.all([
    selectSql_(
      'vehicles',
      '?select=vehicle_id,display_name,category,import_cost,msrp,recommended_sale_price,active,retired' +
      '&active=eq.true&retired=eq.false&order=display_name.asc'
    ),
    selectSql_('current_vehicle_stock', '?select=*&stock_qty=gt.0'),
    selectSql_(
      'customers',
      '?select=customer_name,last_transaction_at' +
      '&order=last_transaction_at.desc.nullslast&limit=1000'
    )
  ]);

  const stockByVehicle = stockMap_(stockRows);

  const inStock = (vehicles || [])
    .map(v => ({
      vehicle_id: v.vehicle_id,
      display_name: v.display_name,
      category: v.category || '',
      import_cost: Number(v.import_cost || 0),
      msrp: Number(v.msrp || 0),
      pdm_price: Number(v.recommended_sale_price || 0),
      stock_qty: Number(stockByVehicle[String(v.vehicle_id)] || 0)
    }))
    .filter(v => v.stock_qty > 0);

  return {
    vehicles: inStock,
    customers: (customers || [])
      .map(c => String(c.customer_name || '').trim())
      .filter(Boolean)
      .filter((name, i, arr) =>
        arr.findIndex(x => x.toLowerCase() === name.toLowerCase()) === i
      )
  };
}

async function submitSalesBatch(token, rows) {
  const user = requireSession_(token);
  requirePermission_(user, 'can_sell');

  if (!Array.isArray(rows) || !rows.length) {
    throw new Error('Add at least one sale row.');
  }

  const cleanRows = rows.map((row, index) => {
    const customer = String(row.customer_name || '').trim();
    const vehicleId = String(row.vehicle_id || '').trim();
    const salePrice = Number(row.sale_price);

    if (!customer) {
      throw new Error('Row ' + (index + 1) + ': customer name is required.');
    }
    if (!vehicleId) {
      throw new Error('Row ' + (index + 1) + ': select a vehicle.');
    }
    if (!Number.isFinite(salePrice) || salePrice < 0) {
      throw new Error('Row ' + (index + 1) + ': enter a valid sale price.');
    }

    return {
      customer_name: customer,
      vehicle_id: vehicleId,
      sale_price: salePrice,
      notes: String(row.notes || '').trim()
    };
  });

  const data = firstRow_(await rpcSql_('dealership_submit_sales_batch', {
    p_employee_id: user.employee_id,
    p_employee_name: user.employee_name,
    p_rows: cleanRows
  }));

  await auditLog_(
    user,
    'SALE_BATCH',
    'SALE_BATCH',
    data && data.batch_id ? data.batch_id : null,
    'Submitted ' + cleanRows.length + ' vehicle sale' + (cleanRows.length === 1 ? '' : 's'),
    {
      sales_count: cleanRows.length,
      revenue: data && data.revenue ? data.revenue : 0,
      profit: data && data.profit ? data.profit : 0
    }
  );

  return data;
}

// ============================================================
// IMPORT VEHICLES (08_Imports) -- historical demand + stock recommendations
// ============================================================

async function getImportVehicleData(token) {
  const user = requireSession_(token);
  requirePermission_(user, 'can_import');

  const [vehicles, stockRows, demandResult] = await Promise.all([
    selectSql_(
      'vehicles',
      '?select=vehicle_id,display_name,category,import_cost,active,retired' +
      '&active=eq.true&retired=eq.false&order=display_name.asc'
    ),
    selectSql_('current_vehicle_stock', '?select=vehicle_id,stock_qty'),
    rpcSql_('dealership_import_demand_stats', {})
  ]);

  const stockByVehicle = stockMap_(stockRows);

  const demandByVehicle = {};
  (Array.isArray(demandResult) ? demandResult : []).forEach(row => {
    if (!row.vehicle_id) return;

    demandByVehicle[String(row.vehicle_id)] = {
      sales_30: Number(row.sales_30 || 0),
      sales_90: Number(row.sales_90 || 0),
      last_sale: row.last_sale || null
    };
  });

  return {
    vehicles: (vehicles || []).map(v => {
      const vehicleId = String(v.vehicle_id);
      const stockQty = Number(stockByVehicle[vehicleId] || 0);

      const demand = demandByVehicle[vehicleId] || {
        sales_30: 0,
        sales_90: 0,
        last_sale: null
      };

      const recommendation = calculateImportRecommendation_(
        stockQty,
        demand.sales_30,
        demand.sales_90
      );

      return {
        vehicle_id: v.vehicle_id,
        display_name: v.display_name,
        category: v.category || '',
        import_cost: Number(v.import_cost || 0),
        stock_qty: stockQty,

        sales_30: demand.sales_30,
        sales_90: demand.sales_90,
        last_sale: demand.last_sale,

        target_stock: recommendation.target_stock,
        suggested_import_qty: recommendation.suggested_import_qty,
        recommendation_reason: recommendation.reason
      };
    })
  };
}

function calculateImportRecommendation_(stockQty, sales30, sales90) {
  stockQty = Math.max(0, Number(stockQty || 0));
  sales30 = Math.max(0, Number(sales30 || 0));
  sales90 = Math.max(0, Number(sales90 || 0));

  // Approximate weekly velocity from recent history.
  // Recent 30-day behaviour takes precedence when demand is accelerating.
  const weekly30 = sales30 / 4;
  const weekly90 = sales90 / 12;

  const weeklyDemand = Math.max(weekly30, weekly90);

  // "Shelf target" is what we'd ideally still have after fulfilling
  // a single customer request.
  const targetStock = weeklyDemand > 0 ? Math.max(1, Math.ceil(weeklyDemand)) : 0;

  // Assume one customer has requested one vehicle. Recommend enough to
  // fulfil that one request and leave the target shelf stock afterwards.
  // Kept conservative: never more than 5.
  const suggested = Math.min(5, Math.max(0, 1 + targetStock - stockQty));

  let reason = '';

  if (suggested === 0) {
    reason = 'Existing stock can fulfil the request while retaining the target stock level.';
  } else if (sales30 === 0 && sales90 === 0) {
    reason = stockQty > 0
      ? 'No recent sales history. Existing stock is sufficient.'
      : 'No recent sales history. Import only the requested vehicle.';
  } else if (sales30 >= Math.max(4, sales90 / 3)) {
    reason = 'Strong recent demand. Recommendation protects a small shelf-stock buffer.';
  } else {
    reason = 'Recommendation is based on recent sales velocity and current stock.';
  }

  return {
    target_stock: targetStock,
    suggested_import_qty: suggested,
    reason: reason
  };
}

async function submitImportBatch(token, rows) {
  const user = requireSession_(token);
  requirePermission_(user, 'can_import');

  if (!Array.isArray(rows) || !rows.length) {
    throw new Error('Add at least one import row.');
  }

  const cleanRows = rows.map((row, index) => {
    const vehicleId = String(row.vehicle_id || '').trim();
    const quantity = Number(row.quantity);

    if (!vehicleId) {
      throw new Error('Row ' + (index + 1) + ': select a vehicle.');
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error('Row ' + (index + 1) + ': quantity must be a whole number of at least 1.');
    }

    return {
      vehicle_id: vehicleId,
      quantity: quantity,
      notes: String(row.notes || '').trim()
    };
  });

  const data = firstRow_(await rpcSql_('dealership_submit_import_batch', {
    p_employee_id: user.employee_id,
    p_employee_name: user.employee_name,
    p_rows: cleanRows
  }));

  const vehicleCount = Number(data && data.vehicle_count || 0);

  await auditLog_(
    user,
    'IMPORT_BATCH',
    'IMPORT_BATCH',
    data && data.batch_id ? data.batch_id : null,
    'Imported ' + vehicleCount + ' vehicle' + (vehicleCount === 1 ? '' : 's'),
    {
      row_count: Number(data && data.row_count || cleanRows.length),
      vehicle_count: vehicleCount,
      total_cost: Number(data && data.total_cost || 0)
    }
  );

  return data;
}

// ============================================================
// BUYBACKS (09_Buybacks)
// ============================================================

async function getBuybackVehicleData(token) {
  const user = requireSession_(token);
  requirePermission_(user, 'can_buyback');

  const [vehicles, stockRows, customers] = await Promise.all([
    selectSql_(
      'vehicles',
      '?select=vehicle_id,display_name,category,import_cost,recommended_sale_price,active,retired' +
      '&active=eq.true&retired=eq.false&order=display_name.asc'
    ),
    selectSql_('current_vehicle_stock', '?select=vehicle_id,stock_qty'),
    selectSql_(
      'customers',
      '?select=customer_id,customer_name,last_transaction_at' +
      '&order=last_transaction_at.desc&limit=500'
    )
  ]);

  const stockByVehicle = stockMap_(stockRows);

  return {
    vehicles: (vehicles || []).map(v => ({
      vehicle_id: v.vehicle_id,
      display_name: v.display_name,
      category: v.category || '',
      import_cost: Number(v.import_cost || 0),
      sale_price: Number(v.recommended_sale_price || 0),
      stock_qty: Number(stockByVehicle[String(v.vehicle_id)] || 0)
    })),

    customers: (customers || []).map(c => ({
      customer_id: c.customer_id,
      customer_name: c.customer_name || ''
    }))
  };
}

async function submitBuybackBatch(token, payload) {
  const user = requireSession_(token);
  requirePermission_(user, 'can_buyback');

  payload = payload || {};
  const sellerName = String(payload.seller_name || '').trim();
  const notes = String(payload.notes || '').trim();
  const rows = Array.isArray(payload.rows) ? payload.rows : [];

  if (!sellerName) throw new Error('Seller name is required.');
  requireEmployeeLink_(user);
  if (!rows.length) throw new Error('Add at least one buyback row.');

  const cleanRows = rows.map((row, i) => {
    const vehicleId = String(row.vehicle_id || '').trim();
    const price = Number(row.buyback_price);
    if (!vehicleId) throw new Error('Row ' + (i + 1) + ': select a vehicle.');
    if (!Number.isFinite(price) || price < 0) throw new Error('Row ' + (i + 1) + ': enter a valid buyback price.');
    return { vehicle_id: vehicleId, buyback_price: price };
  });

  const data = firstRow_(await rpcSql_('dealership_submit_buyback_batch', {
    p_seller_name: sellerName,
    p_employee_id: user.employee_id,
    p_employee_name: user.employee_name,
    p_rows: cleanRows,
    p_notes: notes || null
  }));

  await auditLog_(
    user,
    'BUYBACK_BATCH',
    'BUYBACK_BATCH',
    data && data.batch_id ? data.batch_id : null,
    'Bought ' + Number(data && data.vehicle_count || 0) + ' vehicle(s) from ' + sellerName,
    {
      seller_name: sellerName,
      vehicle_count: Number(data && data.vehicle_count || cleanRows.length),
      total_cost: Number(data && data.total_cost || 0),
      destination: 'STOCK'
    }
  );

  return data;
}

// ============================================================
// EXPORTS (10_Exports)
// ============================================================

async function getExportVehicleData(token) {
  const user = requireSession_(token);
  requirePermission_(user, 'can_export');

  const [vehicles, stockRows] = await Promise.all([
    selectSql_(
      'vehicles',
      '?select=vehicle_id,display_name,category,import_cost,recommended_sale_price,active,retired' +
      '&active=eq.true&retired=eq.false&order=display_name.asc'
    ),
    selectSql_('current_vehicle_stock', '?select=vehicle_id,stock_qty&stock_qty=gt.0')
  ]);

  const stockByVehicle = stockMap_(stockRows);

  return {
    vehicles: (vehicles || [])
      .filter(v => Number(stockByVehicle[String(v.vehicle_id)] || 0) > 0)
      .map(v => ({
        vehicle_id: v.vehicle_id,
        display_name: v.display_name,
        category: v.category || '',
        export_value: Number(v.import_cost || 0),
        sale_price: Number(v.recommended_sale_price || 0),
        stock_qty: Number(stockByVehicle[String(v.vehicle_id)] || 0)
      }))
  };
}

async function submitExportBatch(token, payload) {
  const user = requireSession_(token);
  requirePermission_(user, 'can_export');

  payload = payload || {};
  const notes = String(payload.notes || '').trim();
  const rows = Array.isArray(payload.rows) ? payload.rows : [];

  requireEmployeeLink_(user);

  if (!rows.length) {
    throw new Error('Add at least one export row.');
  }

  const cleanRows = rows.map((row, index) => {
    const vehicleId = String(row.vehicle_id || '').trim();
    const quantity = Number(row.quantity);

    if (!vehicleId) {
      throw new Error('Row ' + (index + 1) + ': select a vehicle.');
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error('Row ' + (index + 1) + ': quantity must be a whole number of at least 1.');
    }

    return {
      vehicle_id: vehicleId,
      quantity: quantity
    };
  });

  const data = firstRow_(await rpcSql_('dealership_submit_export_batch', {
    p_employee_id: user.employee_id,
    p_employee_name: user.employee_name,
    p_rows: cleanRows,
    p_notes: notes || null
  }));

  const vehicleCount = Number(data && data.vehicle_count || 0);

  await auditLog_(
    user,
    'EXPORT_BATCH',
    'EXPORT_BATCH',
    data && data.batch_id ? data.batch_id : null,
    'Exported ' + vehicleCount + ' vehicle' + (vehicleCount === 1 ? '' : 's') + ' from dealership stock',
    {
      vehicle_count: vehicleCount,
      total_value: Number(data && data.total_value || 0),
      origin: 'STOCK'
    }
  );

  return data;
}

module.exports = {
  calculateImportRecommendation_,
  functions: {
    getSellVehicleData,
    submitSalesBatch,
    getImportVehicleData,
    submitImportBatch,
    getBuybackVehicleData,
    submitBuybackBatch,
    getExportVehicleData,
    submitExportBatch
  }
};
