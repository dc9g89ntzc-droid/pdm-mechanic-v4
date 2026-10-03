// Port of 19_MyPDM from PDM Dealership 3.0 -- every employee's own pay
// estimate, activity, profile and payroll history, plus self-service
// password change. Open to any logged-in employee.
const { selectSql_, rpcSql_, firstRow_, rowData_, auditLog_ } = require('./supabase');
const { requireSession_, requireEmployeeLink_, publicUser_ } = require('./session');
const { financialWeek_ } = require('./dashboard');

function findOwnPayrollRow_(rows, user) {
  rows = Array.isArray(rows) ? rows : [];

  const ownId = String(user.employee_id || '');
  const ownName = String(user.employee_name || '').trim().toLowerCase();

  return rows.find(row => {
    const rowId = String(row.employee_id || '');
    const rowName = String(row.employee_name || '').trim().toLowerCase();

    if (ownId && rowId) {
      return ownId === rowId;
    }

    return ownName && rowName && ownName === rowName;
  }) || null;
}

function findResolvedActivityRow_(rows, user) {
  rows = Array.isArray(rows) ? rows : [];

  const ownId = String(user.employee_id || '');
  const ownName = String(user.employee_name || '').trim().toLowerCase();

  // Strongest match: resolved employee UUID.
  const byId = rows.find(row => ownId && String(row.employee_id || '') === ownId);

  if (byId) {
    return byId;
  }

  // Safe fallback for accounts whose transaction history already uses
  // the same display name as the current portal account.
  return rows.find(row =>
    ownName && String(row.employee_name || '').trim().toLowerCase() === ownName
  ) || null;
}

function maskIban_(value) {
  const clean = String(value || '').replace(/\s+/g, '');

  if (!clean) {
    return '';
  }

  if (clean.length <= 4) {
    return '••••' + clean;
  }

  return '••••' + clean.slice(-4);
}

async function getMyPdmData(token) {
  const user = requireSession_(token);
  requireEmployeeLink_(user);

  const week = financialWeek_();

  // Calls the Payroll preview RPC directly rather than getPayrollPreview(),
  // which intentionally requires payroll-management permission. Only this
  // employee's row is returned to the browser.
  //
  // Personal activity comes from the Dashboard's staff-activity resolver
  // instead of the preview, because most historical transaction headers
  // carry employee_name but not employee_id.
  const [previewResult, activityResult, portalRows, employeeProfileRows, historyResult, compRows] = await Promise.all([
    rpcSql_('dealership_monday_settlement_preview', {
      p_week_start: week.start,
      p_week_end: week.end
    }),
    rpcSql_('dealership_dashboard_staff_activity', {
      p_employee_id: user.employee_id,
      p_week_start: week.start,
      p_week_end: week.end
    }),
    selectSql_(
      'dealership_users',
      '?select=' +
        'employee_id,employee_name,discord,role,' +
        'iban_code,base_pay,last_login,' +
        'can_sell,can_import,can_buyback,can_export,' +
        'can_view_accounts,can_manage_payroll,' +
        'can_manage_stock,can_manage_users,can_manage_vehicles,' +
        'active,portal_enabled' +
      '&employee_id=eq.' + encodeURIComponent(user.employee_id) +
      '&limit=1'
    ),
    selectSql_(
      'employees',
      '?select=employee_id,employee_code,name,discord,role,last_login,' +
        'active,portal_enabled' +
      '&employee_id=eq.' + encodeURIComponent(user.employee_id) +
      '&limit=1'
    ),
    rpcSql_('dealership_my_pdm_history', {
      p_employee_id: user.employee_id
    }),
    selectSql_('employee_compensation_settings', '?select=employee_id,payroll_eligible')
  ]);

  const preview = rowData_(previewResult) || {};
  const employeeRows = Array.isArray(preview.employee_rows) ? preview.employee_rows : [];
  const stakeholderRows = Array.isArray(preview.stakeholder_rows) ? preview.stakeholder_rows : [];

  const activityRows = rowData_(activityResult);
  const resolvedActivityRows = Array.isArray(activityRows) ? activityRows : [];

  const myResolvedActivity = findResolvedActivityRow_(resolvedActivityRows, user);
  const myEmployee = findOwnPayrollRow_(employeeRows, user);
  const myStakeholder = findOwnPayrollRow_(stakeholderRows, user);

  const portalProfile = (portalRows || [])[0] || {};
  const employeeProfile = (employeeProfileRows || [])[0] || {};
  const history = rowData_(historyResult) || {};

  const employeePay = myEmployee && myEmployee.payroll_eligible === true
    ? Number(myEmployee.employee_pay || 0)
    : 0;

  const stakeholderPay = myStakeholder ? Number(myStakeholder.stakeholder_amount || 0) : 0;

  const configuredBasePay = Number(portalProfile.base_pay || 0);

  // The live Payroll RPC remains the source of truth for employee_pay.
  // This derived value is shown as an explanatory estimate only.
  const estimatedActivityComponent = Math.max(0, employeePay - configuredBasePay);

  const myPoints = Number(myResolvedActivity && myResolvedActivity.activity_points || 0);

  // Dashboard activity includes all resolved staff. For the percentage,
  // restrict the denominator to employees who are payroll eligible.
  const eligibleById = {};
  (compRows || []).forEach(row => {
    if (row.employee_id) {
      eligibleById[String(row.employee_id)] = row.payroll_eligible === true;
    }
  });

  const eligiblePoints = resolvedActivityRows.reduce((sum, row) => {
    const id = String(row.employee_id || '');
    if (!id || eligibleById[id] !== true) return sum;
    return sum + Number(row.activity_points || 0);
  }, 0);

  const activityShare = eligiblePoints > 0 ? (myPoints / eligiblePoints) * 100 : 0;

  const historyRows = Array.isArray(history.rows) ? history.rows : [];

  const lastCompleted = historyRows.find(r =>
    ['FINALIZED', 'PAID'].includes(String(r.status || '').toUpperCase())
  ) || null;

  return {
    week_start: week.start,
    week_end: week.end,

    payroll_status: preview.existing_settlement
      ? String(preview.existing_settlement.status || 'FINALIZED')
      : 'ESTIMATED',

    profile: {
      employee_id: user.employee_id,
      employee_code: employeeProfile.employee_code || '',
      employee_name: user.employee_name || '',
      discord: portalProfile.discord || employeeProfile.discord || '',
      role: employeeProfile.role || user.role || '',
      iban_masked: maskIban_(portalProfile.iban_code),
      last_login: portalProfile.last_login || employeeProfile.last_login || null,
      active: portalProfile.active !== false,
      portal_enabled: portalProfile.portal_enabled !== false
    },

    // The Apps Script version read user.permissions here, but the session
    // held the raw login row (flat can_* flags, no .permissions object),
    // so every badge on My PDM always showed as off. publicUser_ builds the
    // same shape the rest of the portal already gets at login.
    permissions: publicUser_(user).permissions,

    pay: {
      payroll_eligible: myEmployee ? myEmployee.payroll_eligible === true : false,
      configured_base_pay: configuredBasePay,
      estimated_employee_pay: employeePay,
      estimated_activity_component: estimatedActivityComponent,
      stakeholder_percent: myStakeholder ? Number(myStakeholder.stakeholder_percent || 0) : 0,
      estimated_stakeholder_pay: stakeholderPay,
      estimated_total: employeePay + stakeholderPay,
      employee_pool: Number(preview.employee_pool || 0),
      eligible_points: eligiblePoints,
      point_value: Number(preview.point_value || 0),
      paid_to_date: Number(history.paid_to_date || 0),
      last_completed: lastCompleted
    },

    activity: {
      import_units: Number(myResolvedActivity && myResolvedActivity.imports || 0),
      export_units: Number(myResolvedActivity && myResolvedActivity.exports || 0),
      buyback_units: Number(myResolvedActivity && myResolvedActivity.buybacks || 0),
      sale_units: Number(myResolvedActivity && myResolvedActivity.sales || 0),
      activity_points: myPoints,
      activity_share_percent: activityShare
    },

    history: historyRows
  };
}

async function changeMyPdmPassword(token, currentPassword, newPassword) {
  const user = requireSession_(token);
  requireEmployeeLink_(user);

  currentPassword = String(currentPassword || '');
  newPassword = String(newPassword || '');

  if (!currentPassword) {
    throw new Error('Current password is required.');
  }

  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters.');
  }

  const result = await rpcSql_('dealership_change_own_password', {
    p_employee_id: user.employee_id,
    p_current_password: currentPassword,
    p_new_password: newPassword
  });

  await auditLog_(user, 'UPDATE', 'OWN_PASSWORD', user.employee_id, 'Changed own portal password', {});

  return firstRow_(result);
}

module.exports = {
  functions: { getMyPdmData, changeMyPdmPassword }
};
