// Port of 16_Manager from PDM Dealership 3.0 -- Owner-only staff and
// stakeholder management, per-employee activity/pay insight, and the
// staff audit trail.
const { selectSql_, rpcSql_, firstRow_, rowData_, auditLog_ } = require('./supabase');
const { requireSession_, requireEmployeeLink_ } = require('./session');
const { parseWeek_ } = require('./accounts');

function requireStaffManager_(user) {
  if (!user) {
    throw new Error('SESSION_EXPIRED');
  }

  if (String(user.role || '').toUpperCase() === 'OWNER') {
    return true;
  }

  throw new Error('Owner access is required to manage staff and permissions.');
}

function managerPercent_(value, label) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n < 0 || n > 100) {
    throw new Error(label + ' must be between 0 and 100.');
  }
  return n;
}

function managerMoney_(value, label) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(label + ' must be 0 or more.');
  }
  return n;
}

const PERMISSION_FLAGS_ = [
  'can_sell',
  'can_import',
  'can_buyback',
  'can_export',
  'can_view_accounts',
  'can_manage_payroll',
  'can_manage_stock',
  'can_manage_users',
  'can_manage_vehicles'
];

function permissionFlags_(payload) {
  const flags = {};
  PERMISSION_FLAGS_.forEach(f => { flags[f] = payload[f] === true; });
  return flags;
}

function permissionRpcArgs_(flags) {
  const args = {};
  PERMISSION_FLAGS_.forEach(f => { args['p_' + f] = flags[f]; });
  return args;
}

async function getManagerEmployeeSnapshot_(employeeId) {
  employeeId = String(employeeId || '').trim();

  if (!employeeId) return null;

  const rows = await selectSql_(
    'dealership_staff_management',
    '?select=employee_id,employee_code,employee_name,discord,role,' +
    'can_sell,can_import,can_buyback,can_export,can_view_accounts,' +
    'can_manage_payroll,can_manage_stock,can_manage_users,can_manage_vehicles,' +
    'active,portal_enabled,iban_code,base_pay,payroll_eligible,stakeholder_percent' +
    '&employee_id=eq.' + encodeURIComponent(employeeId) +
    '&limit=1'
  ) || [];

  return rows.length ? rows[0] : null;
}

async function recordManagerStaffAudit_(user, employeeId, employeeName, actionType, oldValues, newValues) {
  if (!user || !user.employee_id) return;

  await rpcSql_('dealership_record_staff_audit', {
    p_actor_employee_id: user.employee_id,
    p_actor_employee_name: user.employee_name,
    p_target_employee_id: employeeId || null,
    p_target_employee_name: employeeName || '',
    p_action_type: actionType,
    p_old_values: oldValues || null,
    p_new_values: newValues || null
  });
}

async function assertLastOwnerSafe_(employeeId, payload, oldSnapshot) {
  if (!oldSnapshot) {
    return true;
  }

  // Only matters if the employee being edited is currently an Owner.
  if (String(oldSnapshot.role || '').toUpperCase() !== 'OWNER') {
    return true;
  }

  const willRemainUsableOwner =
    String(payload.role || '').toUpperCase() === 'OWNER' &&
    payload.active === true &&
    payload.portal_enabled === true;

  if (willRemainUsableOwner) {
    return true;
  }

  const owners = await selectSql_(
    'dealership_staff_management',
    '?select=employee_id,employee_name,role,active,portal_enabled' +
    '&role=eq.OWNER' +
    '&active=eq.true' +
    '&portal_enabled=eq.true'
  ) || [];

  const otherUsableOwners = owners.filter(row =>
    String(row.employee_id || '') !== String(employeeId || '')
  );

  if (otherUsableOwners.length === 0) {
    throw new Error(
      'This change would remove the final active Owner account. ' +
      'Create or enable another Owner first.'
    );
  }

  return true;
}

async function getManagerStaffData(token) {
  const user = requireSession_(token);
  requireStaffManager_(user);
  requireEmployeeLink_(user);

  return rowData_(await rpcSql_('dealership_manager_staff_data', {
    p_employee_id: user.employee_id
  }));
}

async function createDealershipEmployee(token, payload) {
  const user = requireSession_(token);
  requireStaffManager_(user);
  requireEmployeeLink_(user);

  payload = payload || {};

  const name = String(payload.employee_name || '').trim();
  const role = String(payload.role || '').trim();
  const password = String(payload.password || '');

  if (!name) throw new Error('Employee name is required.');
  if (!role) throw new Error('Role is required.');
  if (!password) throw new Error('Initial password is required.');

  const stakeholderPercent = managerPercent_(payload.stakeholder_percent, 'Stakeholder percentage');
  const basePay = managerMoney_(payload.base_pay, 'Base pay');
  const discord = String(payload.discord || '').trim();
  const ibanCode = String(payload.iban_code || '').trim();
  const flags = permissionFlags_(payload);

  // New staff default to active/enabled/eligible unless explicitly false.
  const active = payload.active !== false;
  const portalEnabled = payload.portal_enabled !== false;
  const payrollEligible = payload.payroll_eligible !== false;

  const data = firstRow_(await rpcSql_('dealership_create_employee', Object.assign({
    p_actor_employee_id: user.employee_id,
    p_actor_employee_name: user.employee_name,

    p_employee_name: name,
    p_discord: discord,
    p_role: role,
    p_password: password
  }, permissionRpcArgs_(flags), {
    p_active: active,
    p_portal_enabled: portalEnabled,
    p_iban_code: ibanCode,
    p_base_pay: basePay,

    p_payroll_eligible: payrollEligible,
    p_stakeholder_percent: stakeholderPercent
  })));

  const newEmployeeId = data && data.employee_id ? data.employee_id : null;

  await auditLog_(user, 'CREATE', 'EMPLOYEE', newEmployeeId || '',
    'Created dealership employee ' + name, {
      role,
      stakeholder_percent: stakeholderPercent,
      payroll_eligible: payrollEligible
    });

  await recordManagerStaffAudit_(user, newEmployeeId, name, 'CREATE_EMPLOYEE', null, Object.assign({
    employee_name: name,
    discord: discord,
    role: role
  }, flags, {
    active: active,
    portal_enabled: portalEnabled,
    iban_code: ibanCode,
    base_pay: basePay,
    payroll_eligible: payrollEligible,
    stakeholder_percent: stakeholderPercent
  }));

  return data;
}

async function updateDealershipEmployee(token, employeeId, payload) {
  const user = requireSession_(token);
  requireStaffManager_(user);
  requireEmployeeLink_(user);

  employeeId = String(employeeId || '').trim();
  payload = payload || {};

  if (!employeeId) throw new Error('Employee ID is required.');

  const name = String(payload.employee_name || '').trim();
  const role = String(payload.role || '').trim();

  if (!name) throw new Error('Employee name is required.');
  if (!role) throw new Error('Role is required.');

  const stakeholderPercent = managerPercent_(payload.stakeholder_percent, 'Stakeholder percentage');
  const basePay = managerMoney_(payload.base_pay, 'Base pay');

  const oldSnapshot = await getManagerEmployeeSnapshot_(employeeId);

  await assertLastOwnerSafe_(employeeId, payload, oldSnapshot);

  // Edits are explicit: anything not sent as true becomes false.
  const data = firstRow_(await rpcSql_('dealership_update_employee', Object.assign({
    p_actor_employee_id: user.employee_id,
    p_actor_employee_name: user.employee_name,
    p_target_employee_id: employeeId,

    p_employee_name: name,
    p_discord: String(payload.discord || '').trim(),
    p_role: role
  }, permissionRpcArgs_(permissionFlags_(payload)), {
    p_active: payload.active === true,
    p_portal_enabled: payload.portal_enabled === true,
    p_iban_code: String(payload.iban_code || '').trim(),
    p_base_pay: basePay,

    p_payroll_eligible: payload.payroll_eligible === true,
    p_stakeholder_percent: stakeholderPercent
  })));

  await auditLog_(user, 'UPDATE', 'EMPLOYEE', employeeId,
    'Updated dealership employee ' + name, {
      role,
      stakeholder_percent: stakeholderPercent,
      payroll_eligible: payload.payroll_eligible === true,
      active: payload.active === true,
      portal_enabled: payload.portal_enabled === true
    });

  const newSnapshot = await getManagerEmployeeSnapshot_(employeeId);

  await recordManagerStaffAudit_(user, employeeId, name, 'UPDATE_EMPLOYEE', oldSnapshot, newSnapshot);

  return data;
}

async function resetDealershipEmployeePassword(token, employeeId, newPassword) {
  const user = requireSession_(token);
  requireStaffManager_(user);
  requireEmployeeLink_(user);

  employeeId = String(employeeId || '').trim();
  newPassword = String(newPassword || '');

  if (!employeeId) throw new Error('Employee ID is required.');
  if (!newPassword) throw new Error('New password is required.');

  const result = await rpcSql_('dealership_reset_employee_password', {
    p_actor_employee_id: user.employee_id,
    p_actor_employee_name: user.employee_name,
    p_target_employee_id: employeeId,
    p_new_password: newPassword
  });

  await auditLog_(user, 'UPDATE', 'EMPLOYEE_PASSWORD', employeeId,
    'Reset dealership employee password', {});

  const snapshot = await getManagerEmployeeSnapshot_(employeeId);

  await recordManagerStaffAudit_(
    user,
    employeeId,
    snapshot && snapshot.employee_name ? snapshot.employee_name : '',
    'RESET_PASSWORD',
    null,
    { password_reset: true }
  );

  return firstRow_(result);
}

async function getManagerEmployeeInsight(token, employeeId, weekStartIso, weekEndIso) {
  const user = requireSession_(token);
  requireStaffManager_(user);
  requireEmployeeLink_(user);

  employeeId = String(employeeId || '').trim();

  if (!employeeId) {
    throw new Error('Employee ID is required.');
  }

  const { start, end } = parseWeek_(weekStartIso, weekEndIso, 'Invalid activity week.');

  const preview = rowData_(await rpcSql_('dealership_monday_settlement_preview', {
    p_week_start: start.toISOString(),
    p_week_end: end.toISOString()
  })) || {};

  const employeeRows = Array.isArray(preview.employee_rows) ? preview.employee_rows : [];
  const stakeholderRows = Array.isArray(preview.stakeholder_rows) ? preview.stakeholder_rows : [];

  const employee = employeeRows.find(r => String(r.employee_id || '') === employeeId) || null;
  const stakeholder = stakeholderRows.find(r => String(r.employee_id || '') === employeeId) || null;

  return {
    week_start: start.toISOString(),
    week_end: end.toISOString(),

    operating_capital: Number(preview.operating_capital || 0),
    post_float_profit: Number(preview.post_float_profit || 0),
    employee_pool: Number(preview.employee_pool || 0),
    eligible_points: Number(preview.eligible_points || 0),
    point_value: Number(preview.point_value || 0),

    employee: employee
      ? {
          employee_id: employee.employee_id,
          employee_name: employee.employee_name || '',
          payroll_eligible: employee.payroll_eligible === true,
          stakeholder_percent: Number(employee.stakeholder_percent || 0),

          import_units: Number(employee.import_units || 0),
          export_units: Number(employee.export_units || 0),
          buyback_units: Number(employee.buyback_units || 0),
          sale_units: Number(employee.sale_units || 0),

          activity_points: Number(employee.activity_points || 0),
          employee_pay: Number(employee.employee_pay || 0)
        }
      : null,

    stakeholder: stakeholder
      ? {
          stakeholder_percent: Number(stakeholder.stakeholder_percent || 0),
          stakeholder_amount: Number(stakeholder.stakeholder_amount || 0),
          payroll_eligible: stakeholder.payroll_eligible === true
        }
      : null
  };
}

async function getManagerEmployeeAudit(token, employeeId) {
  const user = requireSession_(token);
  requireStaffManager_(user);
  requireEmployeeLink_(user);

  employeeId = String(employeeId || '').trim();

  if (!employeeId) {
    throw new Error('Employee ID is required.');
  }

  const data = rowData_(await rpcSql_('dealership_staff_audit_history', {
    p_actor_employee_id: user.employee_id,
    p_target_employee_id: employeeId
  }));

  return Array.isArray(data) ? data : [];
}

module.exports = {
  functions: {
    getManagerStaffData,
    createDealershipEmployee,
    updateDealershipEmployee,
    resetDealershipEmployeePassword,
    getManagerEmployeeInsight,
    getManagerEmployeeAudit
  }
};
