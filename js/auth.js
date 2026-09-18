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

function requireSession() {
  const session = getSession();
  if (!session) {
    window.location.href = 'index.html';
  }
  return session;
}

async function login(employeeName, password) {
  const { data, error } = await sb.rpc('mechanic_verify_login', {
    p_employee_name: employeeName,
    p_password: password
  });

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error('Invalid employee name or password.');

  setSession(data[0]);
  return data[0];
}

function logout() {
  clearSession();
  window.location.href = 'index.html';
}
