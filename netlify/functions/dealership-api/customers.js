// Port of 17_Customers from PDM Dealership 3.0. Open to Owners, Managers,
// and anyone who can sell or buy back (they deal with customers directly).
const { rpcSql_, firstRow_, rowData_, auditLog_ } = require('./supabase');
const { requireSession_, requireEmployeeLink_ } = require('./session');

function requireCustomerAccess_(user) {
  if (!user) throw new Error('SESSION_EXPIRED');

  const role = String(user.role || '').toUpperCase();

  if (role === 'OWNER' || role === 'MANAGER') {
    return true;
  }

  if (user.can_sell === true || user.can_buyback === true) {
    return true;
  }

  throw new Error('You do not have permission to access Customers.');
}

async function getCustomersDirectory(token) {
  const user = requireSession_(token);
  requireCustomerAccess_(user);
  requireEmployeeLink_(user);

  return rowData_(await rpcSql_('dealership_customer_directory', {
    p_employee_id: user.employee_id
  }));
}

async function getCustomerDetail(token, customerId) {
  const user = requireSession_(token);
  requireCustomerAccess_(user);
  requireEmployeeLink_(user);

  customerId = String(customerId || '').trim();

  if (!customerId) {
    throw new Error('Customer ID is required.');
  }

  return rowData_(await rpcSql_('dealership_customer_detail', {
    p_employee_id: user.employee_id,
    p_customer_id: customerId
  }));
}

async function createCustomerProfile(token, payload) {
  const user = requireSession_(token);
  requireCustomerAccess_(user);
  requireEmployeeLink_(user);

  payload = payload || {};

  const customerName = String(payload.customer_name || '').trim();

  if (!customerName) {
    throw new Error('Customer name is required.');
  }

  const data = firstRow_(await rpcSql_('dealership_create_customer', {
    p_employee_id: user.employee_id,
    p_employee_name: user.employee_name,
    p_customer_name: customerName,
    p_discord: String(payload.discord || '').trim(),
    p_preferred_contact: String(payload.preferred_contact || '').trim(),
    p_customer_status: String(payload.customer_status || 'REGULAR').trim()
  }));

  await auditLog_(user, 'CREATE', 'CUSTOMER',
    data && data.customer_id ? data.customer_id : '',
    'Created customer profile ' + customerName, {});

  return data;
}

async function updateCustomerProfile(token, customerId, payload) {
  const user = requireSession_(token);
  requireCustomerAccess_(user);
  requireEmployeeLink_(user);

  customerId = String(customerId || '').trim();
  payload = payload || {};

  if (!customerId) {
    throw new Error('Customer ID is required.');
  }

  const result = await rpcSql_('dealership_update_customer', {
    p_employee_id: user.employee_id,
    p_employee_name: user.employee_name,
    p_customer_id: customerId,
    p_discord: String(payload.discord || '').trim(),
    p_preferred_contact: String(payload.preferred_contact || '').trim(),
    p_customer_status: String(payload.customer_status || 'REGULAR').trim(),
    p_active: payload.active !== false
  });

  await auditLog_(user, 'UPDATE', 'CUSTOMER', customerId, 'Updated customer profile', {
    customer_status: String(payload.customer_status || 'REGULAR'),
    active: payload.active !== false
  });

  return firstRow_(result);
}

async function addCustomerNote(token, customerId, note) {
  const user = requireSession_(token);
  requireCustomerAccess_(user);
  requireEmployeeLink_(user);

  customerId = String(customerId || '').trim();
  note = String(note || '').trim();

  if (!customerId) {
    throw new Error('Customer ID is required.');
  }

  if (!note) {
    throw new Error('Note cannot be blank.');
  }

  const data = firstRow_(await rpcSql_('dealership_add_customer_note', {
    p_employee_id: user.employee_id,
    p_employee_name: user.employee_name,
    p_customer_id: customerId,
    p_note: note
  }));

  await auditLog_(user, 'CREATE', 'CUSTOMER_NOTE',
    data && data.note_id ? data.note_id : '',
    'Added customer note', { customer_id: customerId });

  return data;
}

module.exports = {
  functions: {
    getCustomersDirectory,
    getCustomerDetail,
    createCustomerProfile,
    updateCustomerProfile,
    addCustomerNote
  }
};
