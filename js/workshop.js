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

// The fixed sequence a job's selected legs run in -- a job with more than
// one type doesn't work them at once, it finishes one fully before the next
// starts (sql/031_job_legs.sql). Engine Building is intentionally excluded
// here -- no checkbox, no leg -- until it gets its own later slice.
const LEG_ORDER = ['repair', 'customisation', 'performance'];

// Coarse job-level state (sql/031) -- what Billing and the history/reports
// pages actually need. Distinct from JOB_STATUSES/job_legs.status, which
// track per-leg progress.
const JOB_STAGES = [
  { value: 'in_progress', label: 'In progress' },
  { value: 'ready_to_bill', label: 'Ready to bill' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
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

// Which areas exist as gated pages, and (for nav hiding) which page each
// one is. Access per role is configurable from the Staff page's permissions
// matrix (role_permissions table, sql/027) rather than hardcoded -- these
// are just the fixed list of areas that exist, not who can reach them.
const PERMISSION_AREAS = [
  { value: 'catalogue', label: 'Catalogue' },
  { value: 'services', label: 'Services' },
  { value: 'purchasing', label: 'Purchasing' },
  { value: 'reports', label: 'Reports' },
  { value: 'logs', label: 'Logs' },
  { value: 'staff', label: 'Staff' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'accounts', label: 'Accounts' }
];

// catalogue/services aren't here -- both sit behind the shared "Configure"
// nav link (configure.html), handled as a special case in applyRoleNav()
// below rather than the generic one-area-to-one-link loop.
const AREA_NAV_HREF = {
  purchasing: 'purchasing.html', reports: 'reports.html', logs: 'logs.html',
  staff: 'staff.html', payroll: 'payroll.html', accounts: 'accounts.html'
};

// Real boundary is RLS (has_area_permission() in Postgres, sql/027) -- this
// is just what the UI uses to decide what to show. Fetches the whole
// role_permissions table once per page load (36 rows, cheap) and caches it
// so a gated page's own check and applyRoleNav don't both fetch it.
let _permissionMapCache = null;

async function loadPermissionMap() {
  if (_permissionMapCache) return _permissionMapCache;
  const { data, error } = await sb.from('role_permissions').select('role, area, allowed');
  if (error) throw new Error(error.message);
  const map = {};
  data.forEach((row) => {
    if (!map[row.role]) map[row.role] = {};
    map[row.role][row.area] = row.allowed;
  });
  _permissionMapCache = map;
  return map;
}

async function hasAreaAccess(session, area) {
  if (!session) return false;
  const map = await loadPermissionMap();
  return !!map[session.role]?.[area];
}

// Hides nav links to areas this role can't reach. Called as a bare,
// unawaited statement on every page (same as before) -- nav links disappear
// a moment after paint instead of instantly now, which is fine since the
// real boundary is RLS + each gated page's own hasAreaAccess check, not this.
async function applyRoleNav(session) {
  if (!session) return;
  const map = await loadPermissionMap();
  const allowed = (area) => !!map[session.role]?.[area];

  // Configure fronts two areas -- only hide it if the role can reach
  // neither. Whichever page it lands on (configure.html, catalogue.html,
  // services.html) does its own hasAreaAccess check for the specific area.
  if (!allowed('catalogue') && !allowed('services')) {
    document.querySelectorAll('nav a[href^="configure.html"]').forEach((el) => el.remove());
  }

  Object.keys(AREA_NAV_HREF).forEach((area) => {
    if (!allowed(area)) {
      document.querySelectorAll(`nav a[href^="${AREA_NAV_HREF[area]}"]`).forEach((el) => el.remove());
    }
  });
}

async function updateRolePermission(role, area, allowed) {
  const { error } = await sb.from('role_permissions').update({ allowed }).eq('role', role).eq('area', area);
  if (error) throw new Error(error.message);
  if (_permissionMapCache) {
    if (!_permissionMapCache[role]) _permissionMapCache[role] = {};
    _permissionMapCache[role][area] = allowed;
  }
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
async function listPayrollLedger({ from, to, mechanicId, limit = 300 } = {}) {
  let query = sb
    .from('payroll_ledger')
    .select('id, mechanic_id, entry_type, amount, reference_id, notes, paid, paid_at, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (from) query = query.gte('created_at', from);
  if (to) query = query.lt('created_at', to);
  if (mechanicId) query = query.eq('mechanic_id', mechanicId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

// Closed shifts overlapping [from, to) plus, if the mechanic is currently
// clocked in, their still-open shift -- callers add elapsed-so-far
// themselves since "now" keeps moving.
async function listShiftsForMechanic(mechanicId, from, to) {
  let query = sb
    .from('shift_log')
    .select('id, clock_in, clock_out, clock_out_reason')
    .eq('mechanic_id', mechanicId)
    .order('clock_in', { ascending: false });
  if (from) query = query.gte('clock_in', from);
  if (to) query = query.lt('clock_in', to);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

// Same shape, every mechanic -- for Payroll's one-row-per-employee table
// (hours worked this period), rather than one mechanic's own dashboard.
async function listShiftsForPeriod(from, to) {
  let query = sb
    .from('shift_log')
    .select('id, mechanic_id, clock_in, clock_out')
    .order('clock_in', { ascending: false });
  if (from) query = query.gte('clock_in', from);
  if (to) query = query.lt('clock_in', to);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

// Jobs billed (receipt generated) in a window -- the basis for Accounts'
// revenue figures.
async function listBilledJobs({ from, to, limit = 300 } = {}) {
  let query = sb
    .from('jobs')
    .select(`
      id, job_number, quoted_total, labour_fee, assigned_staff_id, receipt_generated_at,
      customers ( customer_name ),
      owned_vehicles ( registration, make, model )
    `)
    .not('receipt_generated_at', 'is', null)
    .order('receipt_generated_at', { ascending: false })
    .limit(limit);
  if (from) query = query.gte('receipt_generated_at', from);
  if (to) query = query.lt('receipt_generated_at', to);
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
      id, job_number, status, stage, job_types, quoted_total, arrival_time, created_at,
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
      id, job_number, status, stage, job_types, quoted_total, arrival_time, created_at,
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
      id, job_number, job_types, status, stage, short_description, quoted_total,
      arrival_time, expected_completion, created_at, assigned_staff_id,
      customer_id, owned_vehicle_id, quote_document_url, receipt_document_url,
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
      id, job_number, status, stage, job_types, quoted_total, assigned_staff_id,
      internal_notes, quote_document_url, quote_generated_at,
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
    .update({
      receipt_document_url: url, receipt_generated_at: new Date().toISOString(),
      status: 'completed', stage: 'completed'
    })
    .eq('id', jobId);
  if (error) throw new Error(error.message);
}

// Snapshotted once at billing time -- same reasoning as job_items.unit_price
// already being a snapshot (013/023): a historical bill must never
// silently change if LABOUR_RATE_PER_HOUR gets retuned later.
async function updateJobLabourFee(jobId, fee) {
  const { error } = await sb.from('jobs').update({ labour_fee: fee }).eq('id', jobId);
  if (error) throw new Error(error.message);
}

async function updateJobStatus(jobId, status) {
  const { error } = await sb.from('jobs').update({ status }).eq('id', jobId);
  if (error) throw new Error(error.message);
}

// Work type can be changed any time before completion -- e.g. the customer
// adds a customisation request after the repair's already under way, or a
// leg gets dropped because they've changed their mind (see syncJobLegs).
async function updateJobTypes(jobId, jobTypes) {
  const { error } = await sb.from('jobs').update({ job_types: jobTypes }).eq('id', jobId);
  if (error) throw new Error(error.message);
}

// ---- Job legs (sql/031) -- per-work-type progress, run one at a time in
// LEG_ORDER. A job's "active" leg is the first non-finished one in that
// fixed order; the job falls into Billing once none remain. ----

// Repair legs start with an inspection; customisation/performance skip
// straight to item-selection (quote_preparation already covers "pick items
// then generate a quote", see job-items.html/quote.html).
function initialLegStatus(jobType) {
  return jobType === 'repair' ? 'awaiting_inspection' : 'quote_preparation';
}

async function listJobLegs(jobId) {
  const { data, error } = await sb
    .from('job_legs')
    .select('id, job_type, status, approved_at, work_started_at, completed_at, cancelled_at')
    .eq('job_id', jobId);
  if (error) throw new Error(error.message);
  return data;
}

// First leg (in LEG_ORDER) that isn't completed/cancelled, or null if every
// selected leg is finished -- that's what puts a job on a given area board,
// and null is what moves it to Billing.
function activeLegForJob(legs) {
  for (const type of LEG_ORDER) {
    const leg = legs.find((l) => l.job_type === type);
    if (leg && leg.status !== 'completed' && leg.status !== 'cancelled') return leg;
  }
  return null;
}

// Keeps job_legs in sync with jobs.job_types -- called at check-in and
// whenever the type-checkbox editor is saved. Adds a leg (at its correct
// starting status) for any newly-selected type; a deselected type's leg is
// cancelled, not deleted, so it stays as history rather than vanishing.
async function syncJobLegs(jobId, jobTypes) {
  const existing = await listJobLegs(jobId);
  const existingTypes = new Set(existing.map((l) => l.job_type));

  const toInsert = jobTypes
    .filter((t) => !existingTypes.has(t))
    .map((t) => ({ job_id: jobId, job_type: t, status: initialLegStatus(t) }));
  if (toInsert.length > 0) {
    const { error } = await sb.from('job_legs').insert(toInsert);
    if (error) throw new Error(error.message);
  }

  const toCancel = existing.filter(
    (l) => !jobTypes.includes(l.job_type) && l.status !== 'cancelled' && l.status !== 'completed'
  );
  for (const leg of toCancel) {
    const { error } = await sb
      .from('job_legs')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', leg.id);
    if (error) throw new Error(error.message);
  }

  // jobs.job_types is what the flow sidebar and every "which leg is next"
  // check read -- keep it in lockstep with the legs that actually exist,
  // whether this call came from the board's type editor or the sidebar's
  // "+ Add work type" button.
  await updateJobTypes(jobId, jobTypes);
}

const LEG_STATUS_TIMESTAMP_COLUMN = {
  approved: 'approved_at',
  work_in_progress: 'work_started_at',
  completed: 'completed_at',
  cancelled: 'cancelled_at'
};

// After moving a leg to its new status, checks whether every selected leg
// is now finished -- if so the job itself flips to ready_to_bill, which is
// what puts it on the Billing tab.
async function updateLegStatus(jobId, jobType, status) {
  const update = { status };
  const tsCol = LEG_STATUS_TIMESTAMP_COLUMN[status];
  if (tsCol) update[tsCol] = new Date().toISOString();

  const { error } = await sb.from('job_legs').update(update).eq('job_id', jobId).eq('job_type', jobType);
  if (error) throw new Error(error.message);

  const legs = await listJobLegs(jobId);
  if (!activeLegForJob(legs) && legs.some((l) => l.status === 'completed')) {
    const { error: stageError } = await sb.from('jobs').update({ stage: 'ready_to_bill' }).eq('id', jobId);
    if (stageError) throw new Error(stageError.message);
  }
}

// What each area tab on the board renders: every job whose ACTIVE leg
// (per activeLegForJob) is this jobType. Fetches every non-terminal leg
// once, groups by job client-side -- a job with a completed repair leg and
// an open customisation leg should only ever show on the Customisation tab.
async function listJobsForArea(jobType, filters = {}) {
  const { data: allLegs, error } = await sb
    .from('job_legs')
    .select('id, job_id, job_type, status');
  if (error) throw new Error(error.message);

  const legsByJob = {};
  allLegs
    .filter((leg) => leg.status !== 'completed' && leg.status !== 'cancelled')
    .forEach((leg) => {
      (legsByJob[leg.job_id] = legsByJob[leg.job_id] || []).push(leg);
    });

  const matchingJobIds = Object.keys(legsByJob).filter((jobId) => {
    const active = activeLegForJob(legsByJob[jobId]);
    return active && active.job_type === jobType;
  });
  if (matchingJobIds.length === 0) return [];

  const jobs = await listJobs(filters);
  return jobs
    .filter((j) => matchingJobIds.includes(j.id))
    .map((j) => ({ ...j, legStatus: activeLegForJob(legsByJob[j.id]).status, legs: legsByJob[j.id] }));
}

// What the Billing tab renders -- jobs where every selected leg is done.
async function listJobsReadyToBill(filters = {}) {
  const jobs = await listJobs(filters);
  return jobs.filter((j) => j.stage === 'ready_to_bill');
}

// Where a mechanic should land to keep working this job -- one shared rule
// used by check-in's redirect, the board's card click, and My Dashboard's
// active-jobs list, so "come back to this ticket" always means the same
// page everywhere. job-items.html itself decides add-materials vs
// materials-required framing from the leg's own status, so this mostly
// only needs to choose between inspection, items, and billing -- except
// repair's quote stage, which (unlike customisation/performance) skips
// the add-materials stop and goes straight to the quote screen, since the
// inspection findings are what tell the mechanic what to add there.
function jobFlowUrlFor(jobId, legs) {
  const active = activeLegForJob(legs);
  if (!active) return `receipt.html?job=${jobId}`;
  if (active.job_type === 'repair') {
    if (['awaiting_inspection', 'inspection_in_progress'].includes(active.status)) {
      return `inspection.html?job=${jobId}`;
    }
    if (active.status === 'quote_preparation') {
      return `quote.html?job=${jobId}`;
    }
  }
  return `job-items.html?job=${jobId}&type=${active.job_type}`;
}

function jobStatusLabel(value) {
  return JOB_STATUSES.find((s) => s.value === value)?.label || value;
}

function jobStageLabel(value) {
  return JOB_STAGES.find((s) => s.value === value)?.label || value;
}

function jobTypeLabel(value) {
  return JOB_TYPES.find((t) => t.value === value)?.label || value;
}

// "Overdue" is judged against jobs.created_at (no separate status-change
// timestamp exists) -- different job shapes get different grace periods
// since a fast repair sitting for 3 hours means something different than
// an engine build.
const OVERDUE_THRESHOLD_MS = {
  engine_building: 12 * 60 * 60 * 1000,
  default: 3 * 60 * 60 * 1000
};

function overdueThresholdFor(job) {
  if ((job.job_types || []).includes('engine_building')) return OVERDUE_THRESHOLD_MS.engine_building;
  return OVERDUE_THRESHOLD_MS.default;
}

function isJobOverdue(job) {
  if (job.stage === 'completed' || job.stage === 'cancelled') return false;
  return (Date.now() - new Date(job.created_at).getTime()) > overdueThresholdFor(job);
}

function jobAgeLabel(job) {
  const ms = Date.now() - new Date(job.created_at).getTime();
  const hours = ms / 3600000;
  if (hours < 1) return `${Math.max(1, Math.round(ms / 60000))}m open`;
  if (hours < 48) return `${hours.toFixed(1)}h open`;
  return `${(hours / 24).toFixed(1)}d open`;
}

function formatMoney(value) {
  if (value === null || value === undefined) return 'To confirm';
  return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Shop policy (replacing the old flat-10%-of-parts model): labour is
// billed as real hours worked on the job x a flat shop rate, the way real
// shops price labour -- hours x rate, not a cut of the parts bill. The
// rate sits comfortably above the mechanic's own guaranteed
// SHIFT_PAY_RATE_PER_HOUR wage so the difference is the shop's own margin
// on the labour line, separate from parts margin entirely.
const LABOUR_RATE_PER_HOUR = 12500;

// job_legs.work_started_at/completed_at are already recorded on every real
// status transition (updateLegStatus below) -- this is genuine elapsed
// time on that specific leg, not inferred from anything.
function hoursForLeg(leg) {
  if (!leg || !leg.work_started_at || !leg.completed_at) return 0;
  const hours = (new Date(leg.completed_at) - new Date(leg.work_started_at)) / 3600000;
  return hours > 0 ? hours : 0;
}

// A job can have more than one leg (repair/customisation/performance/
// engine_building), each with its own start/complete times -- the bill
// covers every completed leg, not just one.
function totalBillableHours(legs) {
  return (legs || []).reduce((sum, leg) => sum + hoursForLeg(leg), 0);
}

// null (not 0) until at least one leg is actually complete -- matches this
// app's "null = To confirm" convention for every other unset price, since
// the real figure genuinely isn't knowable before then.
function labourFeeForHours(hours) {
  if (!hours || hours <= 0) return null;
  return Math.round(hours * LABOUR_RATE_PER_HOUR * 100) / 100;
}

// The mechanic's commission is only the shop's own margin slice on
// labour (billed rate minus their already-guaranteed wage rate) x hours --
// paying the full labour fee as commission on top of the guaranteed
// per-hour wage would double-pay the same hours.
function commissionForHours(hours) {
  if (!hours || hours <= 0) return 0;
  return Math.round(hours * (LABOUR_RATE_PER_HOUR - SHIFT_PAY_RATE_PER_HOUR) * 100) / 100;
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
// filters: { limit, fromDate, toDate, includeVoided }
async function listActivityLog(filters = {}) {
  let query = sb
    .from('activity_log')
    .select('id, actor_id, action, entity_type, entity_id, summary, detail, created_at, voided_at, voided_by, void_reason')
    .order('created_at', { ascending: false })
    .limit(filters.limit || 100);
  if (filters.fromDate) query = query.gte('created_at', filters.fromDate);
  if (filters.toDate) query = query.lte('created_at', filters.toDate);
  if (!filters.includeVoided) query = query.is('voided_at', null);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

// Management-only (enforced server-side by is_management_mechanic() inside
// the RPC) -- marks the entry voided. No reversal: unlike a stock
// transaction, a status-change/quote-generated action has no generic
// mechanical inverse, so this is a pure "mark this record invalid" action.
async function voidActivityLogEntry(id, reason) {
  const { error } = await sb.rpc('void_activity_log_entry', { p_id: id, p_reason: reason || null });
  if (error) throw new Error(error.message);
}
