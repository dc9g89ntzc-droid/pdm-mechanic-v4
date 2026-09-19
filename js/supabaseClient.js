const SUPABASE_URL = 'https://ucvsnxexmvxpccyatmmk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdnNueGV4bXZ4cGNjeWF0bW1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNTAxMDAsImV4cCI6MjEwMTYyNjEwMH0.oPPdgGSM4Hut7H32fpOYZtR7O3pzeM9RnsIn7TiMYbY';

// If a signed session token exists (see js/auth.js's login()), attach it so
// Postgres RLS policies see who this really is instead of just the shared
// anon key. Read straight from localStorage (not getSession()/getToken() --
// this file loads before auth.js) since `sb` has to exist before any page
// script runs. Safe to decide once at page load: login/logout both do a
// full page navigation, so a stale token here never outlives its page.
function storedAuthToken() {
  try {
    return localStorage.getItem('pdm_mechanic_token');
  } catch {
    return null;
  }
}

const authToken = storedAuthToken();
const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  authToken ? { global: { headers: { Authorization: `Bearer ${authToken}` } } } : undefined
);
