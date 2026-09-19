// Signs a real session token after a successful login, so requests after
// this point carry proof of who's calling instead of just the shared public
// anon key. The login check itself is unchanged -- mechanic_verify_login
// already does its own bcrypt verification (security definer, granted to
// anon) -- this function just adds a signature on top of what it returns.
// Mirrors upload-quote.js: plain handler, secret read via process.env, zero
// npm dependencies (JWT signing is ~15 lines of built-in `crypto`, not worth
// a package.json this repo has never needed before).
const crypto = require('crypto');

const SUPABASE_URL = 'https://ucvsnxexmvxpccyatmmk.supabase.co';
// Public by design, same key already committed in js/supabaseClient.js --
// RLS/RPC grants are the real boundary, not keeping this secret.
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdnNueGV4bXZ4cGNjeWF0bW1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNTAxMDAsImV4cCI6MjEwMTYyNjEwMH0.oPPdgGSM4Hut7H32fpOYZtR7O3pzeM9RnsIn7TiMYbY';

const SESSION_LIFETIME_SECONDS = 12 * 60 * 60; // 12h -- comfortably longer than any real shift

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function signJwt(claims, secret, expiresInSeconds) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = { ...claims, iat: now, exp: now + expiresInSeconds };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (!jwtSecret) {
    return { statusCode: 500, body: JSON.stringify({ error: 'SUPABASE_JWT_SECRET is not configured' }) };
  }

  try {
    const { employeeName, password } = JSON.parse(event.body || '{}');
    if (!employeeName || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: 'employeeName and password are required' }) };
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/mechanic_verify_login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ p_employee_name: employeeName, p_password: password })
    });
    const rows = await res.json();

    if (!res.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Login check failed', detail: rows }) };
    }
    if (!Array.isArray(rows) || rows.length === 0) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid employee name or password.' }) };
    }

    const mechanic = rows[0];
    const token = signJwt(
      {
        role: 'authenticated',
        mechanic_id: mechanic.id,
        mechanic_role: mechanic.role,
        employee_name: mechanic.employee_name
      },
      jwtSecret,
      SESSION_LIFETIME_SECONDS
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        token,
        session: { id: mechanic.id, employee_name: mechanic.employee_name, role: mechanic.role }
      })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
