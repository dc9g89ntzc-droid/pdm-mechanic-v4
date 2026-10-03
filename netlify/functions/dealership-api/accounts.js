// Port of 14_Accounts + 15_Payroll from PDM Dealership 3.0 -- accounts
// summary, Operating Capital reconciliation, and the Monday settlement /
// payroll cycle (preview -> finalize -> mark paid).
const { selectSql_, rpcSql_, firstRow_, rowData_, auditLog_ } = require('./supabase');
const { requireSession_, requirePermission_, requireEmployeeLink_ } = require('./session');

function nullableNumber_(value) {
  return value === null || value === undefined ? null : Number(value);
}

function cleanPayrollNumber_(value, label) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(label + ' must be 0 or more.');
  }
  return n;
}

function cleanPayrollPercent_(value, label) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100) {
    throw new Error(label + ' must be between 0 and 100.');
  }
  return n;
}

function parseWeek_(weekStartIso, weekEndIso, message) {
  const start = new Date(String(weekStartIso || ''));
  const end = new Date(String(weekEndIso || ''));
  if (isNaN(start) || isNaN(end) || end <= start) {
    throw new Error(message);
  }
  return { start, end };
}

// ============================================================
// ACCOUNTS (14)
// ============================================================

async function getAccountsData(token, startIso, endIso) {
  const user = requireSession_(token);
  requirePermission_(user, 'can_view_accounts');

  startIso = String(startIso || '').trim();
  endIso = String(endIso || '').trim();

  if (!startIso || !endIso) {
    throw new Error('Accounts date range is required.');
  }

  const start = new Date(startIso);
  const end = new Date(endIso);

  if (isNaN(start) || isNaN(end)) {
    throw new Error('Invalid accounts date range.');
  }

  if (end <= start) {
    throw new Error('Accounts end date must be after the start date.');
  }

  const [summary, recent, capital, periodCapital] = await Promise.all([
    rpcSql_('dealership_accounts_summary', {
      p_start: start.toISOString(),
      p_end: end.toISOString()
    }),
    selectSql_(
      'dealership_financial_activity',
      '?select=activity_id,activity_type,activity_date,transaction_id,' +
      'transaction_ref,batch_id,vehicle_id,vehicle_name,quantity,' +
      'cash_in,cash_out,cogs,realized_profit,profit_basis,' +
      'employee_name,counterparty,notes' +
      '&activity_date=gte.' + encodeURIComponent(start.toISOString()) +
      '&activity_date=lt.' + encodeURIComponent(end.toISOString()) +
      '&order=activity_date.desc&limit=300'
    ),
    rpcSql_('dealership_operating_capital_breakdown', {
      p_employee_id: user.employee_id
    }),
    rpcSql_('dealership_operating_capital_period', {
      p_employee_id: user.employee_id,
      p_start: start.toISOString(),
      p_end: end.toISOString()
    })
  ]);

  const data = rowData_(summary);

  if (!data) {
    throw new Error('Accounts summary returned no data.');
  }

  data.recent_activity = (recent || []).map(r => ({
    activity_id: r.activity_id,
    activity_type: r.activity_type || '',
    activity_date: r.activity_date,
    transaction_id: r.transaction_id,
    transaction_ref: r.transaction_ref || '',
    batch_id: r.batch_id || '',
    vehicle_id: r.vehicle_id,
    vehicle_name: r.vehicle_name || '',
    quantity: Number(r.quantity || 0),
    cash_in: Number(r.cash_in || 0),
    cash_out: Number(r.cash_out || 0),
    cogs: nullableNumber_(r.cogs),
    realized_profit: nullableNumber_(r.realized_profit),
    profit_basis: r.profit_basis || '',
    employee_name: r.employee_name || '',
    counterparty: r.counterparty || '',
    notes: r.notes || ''
  }));

  data.operating_capital = rowData_(capital) || {};
  data.period_operating_capital = rowData_(periodCapital) || {};

  return data;
}

async function setOperatingCapitalBaseline(token, balance, reason) {
  const user = requireSession_(token);

  const role = String(user.role || '').toUpperCase();

  if (role !== 'OWNER' && role !== 'MANAGER' && user.can_manage_payroll !== true) {
    throw new Error('You do not have permission to reconcile Operating Capital.');
  }

  requireEmployeeLink_(user);

  balance = Number(balance);
  reason = String(reason || '').trim();

  if (!Number.isFinite(balance) || balance < 0) {
    throw new Error('Operating Capital must be 0 or more.');
  }

  if (!reason) {
    throw new Error('A reconciliation reason is required.');
  }

  const data = firstRow_(await rpcSql_('dealership_set_operating_capital_baseline', {
    p_employee_id: user.employee_id,
    p_employee_name: user.employee_name,
    p_balance: balance,
    p_reason: reason
  }));

  await auditLog_(user, 'RECONCILE', 'OPERATING_CAPITAL', '1',
    'Reconciled PDM Operating Capital', { balance, reason });

  return data;
}

// ============================================================
// MONDAY SETTLEMENT + PAYROLL (15)
// ============================================================

function requirePayrollManager_(user) {
  if (!user) throw new Error('SESSION_EXPIRED');

  const role = String(user.role || '').toUpperCase();

  if (role === 'OWNER' || role === 'MANAGER') {
    return true;
  }

  if (user.can_manage_payroll === true) {
    return true;
  }

  throw new Error('You do not have permission to manage payroll.');
}

async function getPayrollConfiguration(token) {
  const user = requireSession_(token);
  requirePayrollManager_(user);

  return rowData_(await rpcSql_('dealership_payroll_configuration', {}));
}

async function getPayrollPreview(token, weekStartIso, weekEndIso) {
  const user = requireSession_(token);
  requirePayrollManager_(user);

  const { start, end } = parseWeek_(weekStartIso, weekEndIso, 'Invalid payroll week.');

  return rowData_(await rpcSql_('dealership_monday_settlement_preview', {
    p_week_start: start.toISOString(),
    p_week_end: end.toISOString()
  }));
}

async function savePayrollSettings(token, payload) {
  const user = requireSession_(token);
  requirePayrollManager_(user);

  payload = payload || {};
  requireEmployeeLink_(user);

  const operatingFloat = cleanPayrollNumber_(payload.operating_float, 'Operating float');
  const rainy = cleanPayrollPercent_(payload.rainy_day_percent, 'Rainy Day percentage');
  const importPoints = cleanPayrollNumber_(payload.import_points, 'Import points');
  const exportPoints = cleanPayrollNumber_(payload.export_points, 'Export points');
  const buybackPoints = cleanPayrollNumber_(payload.buyback_points, 'Buyback points');
  const salePoints = cleanPayrollNumber_(payload.sale_points, 'Sale points');

  const result = await rpcSql_('dealership_save_payroll_settings', {
    p_employee_id: user.employee_id,
    p_employee_name: user.employee_name,
    p_operating_float: operatingFloat,
    p_rainy_day_percent: rainy,
    p_import_points: importPoints,
    p_export_points: exportPoints,
    p_buyback_points: buybackPoints,
    p_sale_points: salePoints
  });

  await auditLog_(user, 'UPDATE', 'PAYROLL_SETTINGS', '1',
    'Updated Monday settlement settings', {
      operating_float: operatingFloat,
      rainy_day_percent: rainy,
      import_points: importPoints,
      export_points: exportPoints,
      buyback_points: buybackPoints,
      sale_points: salePoints
    });

  return firstRow_(result);
}

async function saveEmployeeCompensation(token, targetEmployeeId, payrollEligible, stakeholderPercent) {
  const user = requireSession_(token);
  requirePayrollManager_(user);
  requireEmployeeLink_(user);

  targetEmployeeId = String(targetEmployeeId || '').trim();

  if (!targetEmployeeId) {
    throw new Error('Employee ID is required.');
  }

  const stake = cleanPayrollPercent_(stakeholderPercent, 'Stakeholder percentage');

  const result = await rpcSql_('dealership_save_employee_compensation', {
    p_employee_id: user.employee_id,
    p_employee_name: user.employee_name,
    p_target_employee_id: targetEmployeeId,
    p_payroll_eligible: payrollEligible === true,
    p_stakeholder_percent: stake
  });

  await auditLog_(user, 'UPDATE', 'EMPLOYEE_COMPENSATION', targetEmployeeId,
    'Updated employee payroll / stakeholder configuration', {
      payroll_eligible: payrollEligible === true,
      stakeholder_percent: stake
    });

  return firstRow_(result);
}

async function finalizePayrollSettlement(token, weekStartIso, weekEndIso) {
  const user = requireSession_(token);
  requirePayrollManager_(user);
  requireEmployeeLink_(user);

  const { start, end } = parseWeek_(weekStartIso, weekEndIso, 'Invalid payroll week.');

  const data = firstRow_(await rpcSql_('dealership_finalize_payroll_settlement', {
    p_employee_id: user.employee_id,
    p_employee_name: user.employee_name,
    p_week_start: start.toISOString(),
    p_week_end: end.toISOString()
  }));

  await auditLog_(user, 'FINALIZE', 'PAYROLL_SETTLEMENT',
    data && data.settlement_id ? data.settlement_id : '',
    'Finalized Monday payroll settlement', {
      week_start: start.toISOString(),
      week_end: end.toISOString()
    });

  return data;
}

async function markPayrollSettlementPaid(token, settlementId) {
  const user = requireSession_(token);
  requirePayrollManager_(user);
  requireEmployeeLink_(user);

  settlementId = String(settlementId || '').trim();

  if (!settlementId) {
    throw new Error('Settlement ID is required.');
  }

  const data = firstRow_(await rpcSql_('dealership_mark_payroll_paid', {
    p_employee_id: user.employee_id,
    p_employee_name: user.employee_name,
    p_settlement_id: settlementId
  }));

  await auditLog_(user, 'PAY', 'PAYROLL_SETTLEMENT', settlementId,
    'Marked Monday payroll settlement paid', {});

  return data;
}

async function getPayrollHistory(token) {
  const user = requireSession_(token);
  requirePayrollManager_(user);

  return rowData_(await rpcSql_('dealership_payroll_history', {}));
}

module.exports = {
  parseWeek_,
  functions: {
    getAccountsData,
    setOperatingCapitalBaseline,
    getPayrollConfiguration,
    getPayrollPreview,
    savePayrollSettings,
    saveEmployeeCompensation,
    finalizePayrollSettlement,
    markPayrollSettlementPaid,
    getPayrollHistory
  }
};
