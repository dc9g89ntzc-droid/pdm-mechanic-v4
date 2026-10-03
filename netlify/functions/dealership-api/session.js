// Port of 02_Auth from PDM Dealership 3.0.
//
// The Apps Script version minted a random UUID and stored the user in
// CacheService + Script Properties, because Apps Script has nowhere else
// to keep state between calls. Here the token *is* the session: an HS256
// JWT carrying the same user row dealership_verify_login returned, signed
// so it can't be edited client-side. Login check itself is unchanged.
//
// Deliberately NOT signed with SUPABASE_JWT_SECRET (the mechanic-login.js
// secret): the mechanic tables' RLS policies are `to authenticated using
// (true)`, so any Supabase-valid token would unlock the whole mechanic
// shop. This secret is derived from the service key instead, so these
// tokens are only meaningful to this function and need no extra env var.
const crypto = require('crypto');
const { getSupabaseConfig_, rpcSql_, auditLog_ } = require('./supabase');

const SESSION_TTL_SECONDS = 12 * 60 * 60; // matches mechanic-login.js

function sessionSecret_() {
  return crypto
    .createHmac('sha256', getSupabaseConfig_().key)
    .update('pdm-dealership-session-v1')
    .digest();
}

function signSession_(user) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ user, iat: now, exp: now + SESSION_TTL_SECONDS })).toString('base64url');
  const signature = crypto.createHmac('sha256', sessionSecret_()).update(header + '.' + payload).digest('base64url');
  return header + '.' + payload + '.' + signature;
}

function getSession_(token) {
  const parts = String(token || '').trim().split('.');
  if (parts.length !== 3) return null;

  const expected = crypto.createHmac('sha256', sessionSecret_()).update(parts[0] + '.' + parts[1]).digest();
  const given = Buffer.from(parts[2], 'base64url');
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (!payload.user || !payload.exp || Date.now() / 1000 >= payload.exp) return null;
    return payload.user;
  } catch {
    return null;
  }
}

function requireSession_(token) {
  const user = getSession_(token);
  if (!user) {
    throw new Error('SESSION_EXPIRED');
  }
  return user;
}

function requirePermission_(user, permission) {
  if (!user) {
    throw new Error('SESSION_EXPIRED');
  }

  const role = String(user.role || '').toUpperCase();

  // Owners have full access.
  if (role === 'OWNER') {
    return true;
  }

  // Staff/user administration is OWNER ONLY.
  if (permission === 'can_manage_users') {
    throw new Error('Owner access is required to manage staff and permissions.');
  }

  // Managers have automatic access to normal management
  // and dealership operation functions.
  if (role === 'MANAGER') {
    return true;
  }

  // Other employees rely on their individual permissions.
  if (!user[permission]) {
    throw new Error('You do not have permission to use this feature.');
  }

  return true;
}

function requireEmployeeLink_(user) {
  if (!user.employee_id) {
    throw new Error('Your portal account is not linked to an employee record.');
  }
}

function publicUser_(user) {
  return {
    user_id: user.user_id,
    employee_id: user.employee_id,
    employee_name: user.employee_name,
    discord: user.discord || '',
    role: user.role,

    permissions: {
      can_sell: !!user.can_sell,
      can_import: !!user.can_import,
      can_buyback: !!user.can_buyback,
      can_export: !!user.can_export,
      can_view_accounts: !!user.can_view_accounts,
      can_manage_payroll: !!user.can_manage_payroll,
      can_manage_stock: !!user.can_manage_stock,
      can_manage_vehicles: !!user.can_manage_vehicles,
      can_manage_users: !!user.can_manage_users
    }
  };
}

async function loginDealership(employeeName, password) {
  employeeName = String(employeeName || '').trim();
  password = String(password || '');

  if (!employeeName || !password) {
    throw new Error('Enter your employee name and password.');
  }

  const rows = await rpcSql_('dealership_verify_login', {
    p_employee_name: employeeName,
    p_password: password
  }) || [];

  if (!rows.length) {
    throw new Error('Invalid login or portal access disabled.');
  }

  const user = rows[0];

  return {
    token: signSession_(user),
    user: publicUser_(user)
  };
}

async function resumeDealershipSession(token) {
  const user = requireSession_(token);
  return { user: publicUser_(user) };
}

// Tokens are stateless, so there's nothing server-side to delete -- the
// portal already drops it from localStorage before calling this. Kept for
// the audit trail the Apps Script version wrote.
async function logoutDealership(token) {
  const user = getSession_(token);
  if (user) {
    await auditLog_(user, 'LOGOUT', 'USER', user.user_id, 'Portal logout', {});
  }
  return { ok: true };
}

module.exports = {
  requireSession_,
  requirePermission_,
  requireEmployeeLink_,
  publicUser_,
  functions: { loginDealership, resumeDealershipSession, logoutDealership }
};
