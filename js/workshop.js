// Data-access helpers for the Workshop check-in form and job board.
// Thin wrappers around the Supabase client (`sb`, from supabaseClient.js).

const JOB_STATUSES = [
  { value: 'awaiting_inspection', label: 'Awaiting inspection' },
  { value: 'inspection_in_progress', label: 'Inspection in progress' },
  { value: 'quote_preparation', label: 'Quote preparation' },
  { value: 'approved', label: 'Approved' },
  { value: 'work_in_progress', label: 'Work in progress' },
  { value: 'ready_to_bill', label: 'Ready to bill' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const JOB_TYPES = [
  { value: 'repair', label: 'Repair and Service' },
  { value: 'customisation', label: 'Customisation' },
  { value: 'performance', label: 'Performance' },
  { value: 'engine_building', label: 'Engine Building' }
];

// Role naming isn't standardised yet (live data has "manager"; earlier
// test data used "foreman") -- check against a small set of elevated
// names rather than one exact string. This is UI-level gating only, not
// a real security boundary: every mechanic's browser uses the same anon
// key regardless of who's logged in (no per-user Supabase Auth session),
// so a technical user could bypass it. It's there to stop honest mistakes
// (a mechanic wandering into the catalogue editor), not to stop misuse.
const MANAGEMENT_ROLES = ['manager', 'foreman', 'admin', 'owner'];

function hasManagementAccess(session) {
  return !!session && MANAGEMENT_ROLES.includes((session.role || '').toLowerCase());
}

// Hides nav links to management-only pages for everyone else. Call after
// requireSession() on every page that has these links in its header.
function applyRoleNav(session) {
  if (hasManagementAccess(session)) return;
  document.querySelectorAll('nav a[href^="catalogue.html"], nav a[href^="reports.html"], nav a[href^="staff.html"]').forEach((el) => el.remove());
}

async function searchCustomers(query) {
  const q = query.trim();
  if (!q) return [];
  const { data, error } = await sb
    .from('customers')
    .select('customer_id, customer_name, phone')
    .or(`customer_name.ilike.%${q}%,phone.ilike.%${q}%`)
    .order('customer_name')
    .limit(10);
  if (error) throw new Error(error.message);
  return data;
}

async function createCustomer({ name, phone, notes }) {
  const { data, error } = await sb
    .from('customers')
    .insert({ customer_name: name, phone: phone || null, notes: notes || null, active: true })
    .select('customer_id, customer_name, phone')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function searchVehicleByRegistration(registration) {
  const q = registration.trim();
  if (!q) return [];
  const { data, error } = await sb
    .from('owned_vehicles')
    .select('owned_vehicle_id, registration, make, model, class, owner_id, mileage, customers(customer_id, customer_name, phone)')
    .ilike('registration', `%${q}%`)
    .order('registration')
    .limit(10);
  if (error) throw new Error(error.message);
  return data;
}

async function createVehicle({ registration, make, model, class: vClass, owner_id, mileage }) {
  const { data, error } = await sb
    .from('owned_vehicles')
    .insert({
      registration: registration.trim().toUpperCase(),
      make: make || null,
      model: model || null,
      class: vClass || null,
      owner_id,
      mileage: mileage || null
    })
    .select('owned_vehicle_id, registration, make, model, class, owner_id, mileage')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Unfiltered version of listActiveMechanics, for resolving actor names on
// historical records (activity log, old jobs) where the mechanic may have
// since gone inactive.
async function listAllStaff() {
  const { data, error } = await sb
    .from('staff_directory')
    .select('id, employee_name, role')
    .order('employee_name');
  if (error) throw new Error(error.message);
  return data;
}

// mechanic_employees has zero anon policies (it holds password_hash), so
// these go through security-definer RPCs (019_staff_management_rpcs.sql)
// rather than direct table access -- same pattern as mechanic_verify_login.
async function createStaff({ employeeName, password, role }) {
  const { data, error } = await sb.rpc('mechanic_create_staff', {
    p_employee_name: employeeName, p_password: password, p_role: role
  });
  if (error) throw new Error(error.message);
  return data?.[0];
}

async function updateStaff({ id, role, active }) {
  const { data, error } = await sb.rpc('mechanic_update_staff', { p_id: id, p_role: role, p_active: active });
  if (error) throw new Error(error.message);
  return data?.[0];
}

async function resetStaffPassword(id, newPassword) {
  const { data, error } = await sb.rpc('mechanic_reset_password', { p_id: id, p_new_password: newPassword });
  if (error) throw new Error(error.message);
  return data?.[0];
}

async function listActiveMechanics() {
  const { data, error } = await sb
    .from('staff_directory')
    .select('id, employee_name, role')
    .eq('active', true)
    .order('employee_name');
  if (error) throw new Error(error.message);
  return data;
}

// Not filtered to active=true -- a job assigned to a mechanic who's since
// gone inactive should still show their name on historical documents.
async function getStaffMember(id) {
  const { data, error } = await sb
    .from('staff_directory')
    .select('id, employee_name, role')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function createJob(job) {
  const { data, error } = await sb
    .from('jobs')
    .insert(job)
    .select('id, job_number')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// filters: { mechanicId, jobType, status, fromDate, toDate }
async function listJobs(filters = {}) {
  // staff_directory is a view, not the table jobs.assigned_staff_id has an
  // FK to, so PostgREST can't auto-embed it -- resolve the mechanic's name
  // client-side instead (see listActiveMechanics + mechanicName in the pages).
  let query = sb
    .from('jobs')
    .select(`
      id, job_number, job_types, status, short_description, quoted_total,
      arrival_time, expected_completion, created_at, assigned_staff_id,
      customers ( customer_name ),
      owned_vehicles ( registration, make, model )
    `)
    .order('created_at', { ascending: false });

  if (filters.mechanicId) query = query.eq('assigned_staff_id', filters.mechanicId);
  if (filters.jobType) query = query.contains('job_types', [filters.jobType]);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.fromDate) query = query.gte('arrival_time', filters.fromDate);
  if (filters.toDate) query = query.lte('arrival_time', filters.toDate);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

async function getJobSummary(jobId) {
  const { data, error } = await sb
    .from('jobs')
    .select(`
      id, job_number, status, job_types, quoted_total, assigned_staff_id,
      quote_document_url, quote_generated_at,
      receipt_document_url, receipt_generated_at,
      customers ( customer_name ),
      owned_vehicles ( registration, make, model )
    `)
    .eq('id', jobId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function updateJobQuoteDocument(jobId, url) {
  const { error } = await sb
    .from('jobs')
    .update({ quote_document_url: url, quote_generated_at: new Date().toISOString() })
    .eq('id', jobId);
  if (error) throw new Error(error.message);
}

// Sets the receipt link and flips the job to completed in one call --
// generating a receipt is what "billed" means for this shop, there's no
// separate payment-processing step.
async function updateJobReceiptDocument(jobId, url) {
  const { error } = await sb
    .from('jobs')
    .update({ receipt_document_url: url, receipt_generated_at: new Date().toISOString(), status: 'completed' })
    .eq('id', jobId);
  if (error) throw new Error(error.message);
}

async function updateJobStatus(jobId, status) {
  const { error } = await sb.from('jobs').update({ status }).eq('id', jobId);
  if (error) throw new Error(error.message);
}

// Work types are discovered during inspection and can keep growing until
// the job is completed -- not a one-time choice made at check-in.
async function updateJobTypes(jobId, jobTypes) {
  const { error } = await sb.from('jobs').update({ job_types: jobTypes }).eq('id', jobId);
  if (error) throw new Error(error.message);
}

function jobStatusLabel(value) {
  return JOB_STATUSES.find((s) => s.value === value)?.label || value;
}

function jobTypeLabel(value) {
  return JOB_TYPES.find((t) => t.value === value)?.label || value;
}

function formatMoney(value) {
  if (value === null || value === undefined) return 'To confirm';
  return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateTime(value) {
  if (!value) return 'Unknown';
  return new Date(value).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

// For customer-facing documents (quotes/receipts) -- the server runs on
// US Eastern time regardless of the mechanic's own timezone, so these are
// always shown in America/New_York rather than the browser's local zone.
// timeZoneName 'short' prints the correct EST/EDT label for the actual date.
function formatDateTimeEST(value) {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
  });
}

// Append-only activity trail (see 018_activity_log.sql) covering the
// actions inventory_transactions doesn't: job status changes, catalogue
// edits/deletions, quote/receipt generation. Never throws -- a logging
// failure shouldn't block the actual action the user was trying to do,
// so callers fire-and-forget this (errors just go to the console).
async function logActivity({ actorId, action, entityType, entityId, summary, detail }) {
  try {
    const { error } = await sb.from('activity_log').insert({
      actor_id: actorId || null,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      summary,
      detail: detail || null
    });
    if (error) console.error('Failed to log activity:', error.message);
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
}

// actor_id has a real FK to mechanic_employees, but anon has no grant on
// that base table (see 002_workshop_checkin.sql -- password_hash lives
// there), so PostgREST can't auto-embed it. Resolve names client-side via
// staff_directory instead, same workaround as listJobs' mechanicName.
async function listActivityLog(limit = 100) {
  const { data, error } = await sb
    .from('activity_log')
    .select('id, actor_id, action, entity_type, summary, detail, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}
