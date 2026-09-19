// Data-access helpers for the Workshop check-in form and job board.
// Thin wrappers around the Supabase client (`sb`, from supabaseClient.js).

const JOB_STATUSES = [
  { value: 'awaiting_inspection', label: 'Awaiting inspection' },
  { value: 'inspection_in_progress', label: 'Inspection in progress' },
  { value: 'quote_preparation', label: 'Quote preparation' },
  { value: 'approved', label: 'Approved' },
  { value: 'waiting_for_parts', label: 'Waiting for Parts' },
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

// The shop's real staff hierarchy, low to high.
const STAFF_ROLES = [
  { value: 'apprentice', label: 'Apprentice' },
  { value: 'mechanic', label: 'Mechanic' },
  { value: 'master_mechanic', label: 'Master Mechanic' },
  { value: 'foreman', label: 'Foreman' },
  { value: 'manager', label: 'Manager' },
  { value: 'boss', label: 'Boss (Admin)' }
];

function staffRoleLabel(value) {
  return STAFF_ROLES.find((r) => r.value === value)?.label || value;
}

// Foreman and above run the shop; apprentice/mechanic/master_mechanic are
// the tool-turning tiers. This is UI-level gating only, not a real
// security boundary: every mechanic's browser uses the same anon key
// regardless of who's logged in (no per-user Supabase Auth session), so a
// technical user could bypass it. It's there to stop honest mistakes (a
// mechanic wandering into the catalogue editor), not to stop misuse.
const MANAGEMENT_ROLES = ['foreman', 'manager', 'boss'];

function hasManagementAccess(session) {
  return !!session && MANAGEMENT_ROLES.includes((session.role || '').toLowerCase());
}

// Hides nav links to management-only pages for everyone else. Call after
// requireSession() on every page that has these links in its header.
function applyRoleNav(session) {
  if (hasManagementAccess(session)) return;
  document.querySelectorAll('nav a[href^="catalogue.html"], nav a[href^="reports.html"], nav a[href^="staff.html"], nav a[href^="payroll.html"]').forEach((el) => el.remove());
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

// ---- Shift clock & payroll ----

async function getOpenShift(mechanicId) {
  const { data, error } = await sb
    .from('shift_log')
    .select('id, clock_in')
    .eq('mechanic_id', mechanicId)
    .is('clock_out', null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function clockIn(mechanicId) {
  const { data, error } = await sb
    .from('shift_log')
    .insert({ mechanic_id: mechanicId })
    .select('id, clock_in')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function clockOutShift(shiftId, reason) {
  const { error } = await sb
    .from('shift_log')
    .update({ clock_out: new Date().toISOString(), clock_out_reason: reason })
    .eq('id', shiftId);
  if (error) throw new Error(error.message);
}

const SHIFT_PAY_RATE_PER_HOUR = 10000; // matches the server's general civ-job baseline

async function recordShiftPay(mechanicId, shiftId, clockInAt, clockOutAt) {
  const hours = (new Date(clockOutAt) - new Date(clockInAt)) / 3600000;
  if (hours <= 0) return;
  const amount = Math.round(hours * SHIFT_PAY_RATE_PER_HOUR * 100) / 100;
  const { error } = await sb.from('payroll_ledger').insert({
    mechanic_id: mechanicId, entry_type: 'shift_pay', amount, reference_id: shiftId,
    notes: `${hours.toFixed(2)}h on shift`
  });
  if (error) throw new Error(error.message);
}

async function recordCommission(mechanicId, jobId, amount, notes) {
  const { error } = await sb.from('payroll_ledger').insert({
    mechanic_id: mechanicId, entry_type: 'commission', amount, reference_id: jobId, notes
  });
  if (error) throw new Error(error.message);
}

// from/to are ISO timestamps -- pass both to scope to one pay period.
async function listPayrollLedger({ from, to, limit = 300 } = {}) {
  let query = sb
    .from('payroll_ledger')
    .select('id, mechanic_id, entry_type, amount, reference_id, notes, paid, paid_at, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (from) query = query.gte('created_at', from);
  if (to) query = query.lt('created_at', to);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

// The shop's pay periods run Monday 12:00 GMT to the following Monday
// 12:00 GMT (i.e. up to 11:59:59 that morning) -- fixed weekly boundaries,
// not the calendar week. "GMT" here is literal UTC+0 year-round, not
// London local time, so this doesn't shift with British daylight saving.
function getPayPeriodStart(date) {
  const d = new Date(date);
  const daysSinceMonday = (d.getUTCDay() + 6) % 7; // Mon=0 ... Sun=6
  const candidate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - daysSinceMonday, 12, 0, 0, 0));
  if (candidate.getTime() > d.getTime()) candidate.setUTCDate(candidate.getUTCDate() - 7);
  return candidate;
}

function formatPayPeriodLabel(start) {
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  const fmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  return `${fmt(start)} 12:00 GMT — ${fmt(end)} 12:00 GMT`;
}

async function markPayrollEntryPaid(id) {
  const { error } = await sb.from('payroll_ledger').update({ paid: true, paid_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}

// ---- Vehicle & customer history ----

async function getOwnedVehicle(id) {
  const { data, error } = await sb
    .from('owned_vehicles')
    .select('owned_vehicle_id, registration, make, model, class, mileage, owner_id, customers ( customer_id, customer_name, phone )')
    .eq('owned_vehicle_id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function getCustomer(id) {
  const { data, error } = await sb
    .from('customers')
    .select('customer_id, customer_name, phone, notes')
    .eq('customer_id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function listVehiclesForCustomer(customerId) {
  const { data, error } = await sb
    .from('owned_vehicles')
    .select('owned_vehicle_id, registration, make, model, class')
    .eq('owner_id', customerId)
    .order('registration');
  if (error) throw new Error(error.message);
  return data;
}

async function listJobsForVehicle(vehicleId) {
  const { data, error } = await sb
    .from('jobs')
    .select(`
      id, job_number, status, job_types, quoted_total, arrival_time, created_at,
      quote_document_url, receipt_document_url,
      customers ( customer_name ),
      owned_vehicles ( registration, make, model )
    `)
    .eq('owned_vehicle_id', vehicleId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

async function listJobsForCustomer(customerId) {
  const { data, error } = await sb
    .from('jobs')
    .select(`
      id, job_number, status, job_types, quoted_total, arrival_time, created_at,
      quote_document_url, receipt_document_url,
      customers ( customer_name ),
      owned_vehicles ( registration, make, model )
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
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

// mechanic_employees has zero anon policies (it holds password_hash and,
// as of 020, citizen_id/iban/discord_id -- more sensitive than
// employee_name/role), so these go through security-definer RPCs rather
// than direct table access -- same pattern as mechanic_verify_login.
async function createStaff({ employeeName, password, role, citizenId, phoneNumber, iban, discordId }) {
  const { data, error } = await sb.rpc('mechanic_create_staff', {
    p_employee_name: employeeName, p_password: password, p_role: role,
    p_citizen_id: citizenId || null, p_phone_number: phoneNumber || null,
    p_iban: iban || null, p_discord_id: discordId || null
  });
  if (error) throw new Error(error.message);
  return data?.[0];
}

async function updateStaff({ id, role, active, citizenId, phoneNumber, iban, discordId }) {
  const { data, error } = await sb.rpc('mechanic_update_staff', {
    p_id: id, p_role: role, p_active: active,
    p_citizen_id: citizenId || null, p_phone_number: phoneNumber || null,
    p_iban: iban || null, p_discord_id: discordId || null
  });
  if (error) throw new Error(error.message);
  return data?.[0];
}

// Full record (citizen_id/phone/iban/discord included) for the Staff
// management page only -- everywhere else keeps using listAllStaff /
// listActiveMechanics, which stay on the safe staff_directory view.
async function listAllStaffFull() {
  const { data, error } = await sb.rpc('mechanic_list_staff_full');
  if (error) throw new Error(error.message);
  return data;
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
      customer_id, owned_vehicle_id,
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

// Shop policy: a 10% labour fee on top of the parts subtotal, paid in full
// to the job's assigned mechanic as commission. jobs.quoted_total (the DB
// trigger-maintained sum of job_items) stays parts-only on purpose -- the
// labour fee and grand total are always derived from it, never stored, so
// they can't drift out of sync if quoted_total changes.
const LABOUR_FEE_RATE = 0.10;

function labourFeeFor(partsSubtotal) {
  if (partsSubtotal === null || partsSubtotal === undefined) return null;
  return Math.round(Number(partsSubtotal) * LABOUR_FEE_RATE * 100) / 100;
}

function grandTotalFor(partsSubtotal) {
  if (partsSubtotal === null || partsSubtotal === undefined) return null;
  return Math.round(Number(partsSubtotal) * (1 + LABOUR_FEE_RATE) * 100) / 100;
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
