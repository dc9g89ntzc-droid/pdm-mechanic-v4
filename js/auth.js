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

function requireSession() {
  const session = getSession();
  if (!session) {
    window.location.href = 'index.html';
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
