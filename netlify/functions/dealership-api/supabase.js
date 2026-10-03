// Port of 00_Config / 01_Supabase / 04_Audit from PDM Dealership 3.0.
//
// Same thin REST wrapper as the Apps Script version, same key: the
// dealership tables have RLS on with zero policies, so they're only
// reachable with the service key -- which is why this lives server-side
// in a Netlify function rather than in the browser like the mechanic
// pages. SUPABASE_SERVICE_KEY is the exact value that was in the Apps
// Script project's Script Properties as SUPABASE_KEY (set it in Netlify:
// Site settings -> Environment variables). Never commit it.
const SUPABASE_URL = 'https://ucvsnxexmvxpccyatmmk.supabase.co';

const APP_NAME = 'PDM Dealership';

function getSupabaseConfig_() {
  const key = String(process.env.SUPABASE_SERVICE_KEY || '').trim();
  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_KEY in Netlify environment variables.');
  }
  return { url: SUPABASE_URL, key };
}

async function supabaseRequest_(path, options) {
  const cfg = getSupabaseConfig_();
  const opts = options || {};

  const res = await fetch(cfg.url + path, {
    method: String(opts.method || 'get').toUpperCase(),
    headers: Object.assign({
      apikey: cfg.key,
      Authorization: 'Bearer ' + cfg.key,
      'Content-Type': 'application/json',
      Prefer: opts.prefer || 'return=representation'
    }, opts.headers || {}),
    body: opts.payload !== undefined ? JSON.stringify(opts.payload) : undefined
  });

  const body = await res.text();

  if (!res.ok) {
    throw new Error('Supabase ' + res.status + ': ' + body);
  }

  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

function selectSql_(table, queryString) {
  return supabaseRequest_('/rest/v1/' + table + (queryString || ''), { method: 'get' });
}

function insertSql_(table, row) {
  return supabaseRequest_('/rest/v1/' + table, { method: 'post', payload: row });
}

function updateSql_(table, queryString, patch) {
  return supabaseRequest_('/rest/v1/' + table + (queryString || ''), { method: 'patch', payload: patch });
}

function rpcSql_(fnName, args) {
  return supabaseRequest_('/rest/v1/rpc/' + fnName, { method: 'post', payload: args || {} });
}

// RPCs here return either a bare object, a one-row array, or a one-row
// array wrapping { data: ... } -- the Apps Script modules unwrapped these
// the same two ways over and over, so they're named once here.
function firstRow_(result) {
  return Array.isArray(result) ? result[0] : result;
}

function rowData_(result) {
  const row = firstRow_(result);
  return row && row.data ? row.data : row;
}

async function auditLog_(user, actionType, entityType, entityId, summary, details) {
  try {
    await insertSql_('dealership_audit_log', {
      user_id: user && user.user_id ? user.user_id : null,
      employee_name: user && user.employee_name ? user.employee_name : null,
      action_type: String(actionType || 'UNKNOWN'),
      entity_type: entityType || null,
      entity_id: entityId == null ? null : String(entityId),
      summary: summary || null,
      details: details || {}
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}

module.exports = {
  APP_NAME,
  SUPABASE_URL,
  getSupabaseConfig_,
  selectSql_,
  insertSql_,
  updateSql_,
  rpcSql_,
  firstRow_,
  rowData_,
  auditLog_
};
