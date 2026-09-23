function getSession() {
  try {
    return JSON.parse(localStorage.getItem('pdm_mechanic_session') || 'null');
  } catch {
    return null;
  }
}

function setSession(user) {
  localStorage.setItem('pdm_mechanic_session', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('pdm_mechanic_session');
}

// The signed session token proving who this is to Postgres (RLS) -- kept
// separate from the plain session object above, which is just display data
// (employee_name/role shown in the header etc). js/supabaseClient.js reads
// this same key to attach it as the Authorization header.
function getToken() {
  return localStorage.getItem('pdm_mechanic_token');
}

function setToken(token) {
  localStorage.setItem('pdm_mechanic_token', token);
}

function clearToken() {
  localStorage.removeItem('pdm_mechanic_token');
}

// Decodes a JWT's payload without verifying the signature -- fine here
// since this is just the client deciding whether its own token is stale
// enough to not bother sending (Postgres/PostgREST still does the real,
// signature-checked expiry enforcement on every request regardless).
function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = token && decodeJwtPayload(token);
  if (!payload || !payload.exp) return true;
  return Date.now() / 1000 >= payload.exp;
}

function hasValidSession() {
  return !!(getSession() && getToken() && !isTokenExpired(getToken()));
}

// A stale tab left open past the 12h token lifetime (mechanic-login.js)
// used to surface as a raw "JWT expired" Postgres error the moment the
// page tried to load anything. Checking the token's own exp claim here --
// the one choke point every page already calls before doing real work --
// catches that up front and sends the mechanic back to a clean sign-in
// instead.
function requireSession() {
  const session = getSession();
  const token = getToken();
  if (!session || !token || isTokenExpired(token)) {
    const hadSession = !!session;
    clearSession();
    clearToken();
    window.location.href = hadSession ? 'index.html?expired=1' : 'index.html';
    return null;
  }
  return session;
}

async function login(employeeName, password) {
  const res = await fetch('/.netlify/functions/mechanic-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeName, password })
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Invalid employee name or password.');

  setSession(body.session);
  setToken(body.token);
  return body.session;
}

async function changeOwnPassword(currentPassword, newPassword) {
  const { error } = await sb.rpc('mechanic_change_own_password', {
    p_current_password: currentPassword,
    p_new_password: newPassword
  });
  if (error) throw new Error(error.message);
}

// Async so it can wait for shift.js's clock-out (if that script is present
// and a shift is open) to actually finish before navigating away -- an
// unawaited clock-out call would risk getting cancelled by the navigation.
async function logout() {
  if (typeof window.clockOutForLogout === 'function') {
    try {
      await window.clockOutForLogout();
    } catch (err) {
      console.error('Failed to clock out on sign out:', err.message);
    }
  }
  clearSession();
  clearToken();
  window.location.href = 'index.html';
}
