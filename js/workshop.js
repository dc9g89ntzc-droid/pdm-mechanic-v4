// Data-access helpers for the Workshop check-in form and job board.
// Thin wrappers around the Supabase client (`sb`, from supabaseClient.js).

const JOB_STATUSES = [
  { value: 'awaiting_inspection', label: 'Awaiting inspection' },
  { value: 'inspection_in_progress', label: 'Inspection in progress' },
  { value: 'quote_preparation', label: 'Quote preparation' },
  { value: 'approved', label: 'Approved' },
  { value: 'waiting_for_parts', label: 'Waiting for Parts' },
  { value: 'work_in_progress', label: 'Work in progress' },
  // Engine Building only (sql/062): built, waiting for the customer to come
  // in and have it fitted. Billing still happens after installation.
  { value: 'ready_for_installation', label: 'Ready for installation' },
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
// starts (sql/031_job_legs.sql). Engine Building (its own area since
// sql/060) is last: the engine is built after everything else, then
// installed and billed (Joanna, 2026-10-08). Its parts can still be picked
// up front -- the flow sidebar links to every leg's items page.
const LEG_ORDER = ['repair', 'customisation', 'performance', 'engine_building'];

// Coarse job-level state (sql/031) -- what Billing and the history/reports
// pages actually need. Distinct from JOB_STATUSES/job_legs.status, which
// track per-leg progress.
const JOB_STAGES = [
  { value: 'in_progress', label: 'In progress' },
  { value: 'ready_to_bill', label: 'Ready to bill' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

// The shop's real staff hierarchy, low to high. Stocker sits outside that
// hierarchy entirely (deliveries, not repair work -- paid flat per
// delivery, not the shift-clock hourly wage) so it's appended rather than
// slotted into the skill ladder.
const STAFF_ROLES = [
  { value: 'apprentice', label: 'Apprentice' },
  { value: 'mechanic', label: 'Mechanic' },
  { value: 'master_mechanic', label: 'Master Mechanic' },
  { value: 'foreman', label: 'Foreman' },
  { value: 'manager', label: 'Manager' },
  { value: 'boss', label: 'Boss (Admin)' },
  { value: 'stocker', label: 'Stocker' }
];

function staffRoleLabel(value) {
  return STAFF_ROLES.find((r) => r.value === value)?.label || value;
}

// "Manager and above" -- the app has no ordinal rank field on STAFF_ROLES
// (roles are gated per-area via role_permissions, not by a hierarchy
// comparison), so this is a plain explicit list for the one place that
// genuinely does need a tier check: customers.html gating retire/transfer
// to management, everyone else keeps read-only access to the same page.
const MANAGEMENT_ROLES = ['manager', 'boss'];
function isManagementRole(role) {
  return MANAGEMENT_ROLES.includes(role);
}

// Boss-only -- narrower than MANAGEMENT_ROLES above, for the one place
// that genuinely should be admin-only: catalogue.html's bulk price-sweep
// buttons (raise/lower every visible item's customer_price at once).
function isBossRole(role) {
  return role === 'boss';
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

// Excludes retired duplicates (sql/036_customer_name_cleanup.sql) so a
// cleaned-up name doesn't keep reappearing at check-in and inviting a new
// duplicate -- the whole point of that cleanup.
async function searchCustomers(query) {
  const q = query.trim();
  if (!q) return [];
  const { data, error } = await sb
    .from('customers')
    .select('customer_id, customer_name, phone')
    .eq('active', true)
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

// Full browsable list for customers.html -- unlike searchCustomers() (which
// requires a query and caps at 10 for the check-in autocomplete), this
// supports an empty search (browse everything) and an includeInactive
// toggle so a retired/merged customer can still be found and reviewed.
async function listAllCustomers({ search, includeInactive } = {}) {
  let query = sb.from('customers').select('customer_id, customer_name, phone, notes, active').order('customer_name');
  if (!includeInactive) query = query.eq('active', true);
  const q = (search || '').trim();
  if (q) query = query.or(`customer_name.ilike.%${q}%,phone.ilike.%${q}%`);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

async function updateCustomer(customerId, { name, phone, notes }) {
  const { error } = await sb
    .from('customers')
    .update({ customer_name: name, phone: phone || null, notes: notes || null })
    .eq('customer_id', customerId);
  if (error) throw new Error(error.message);
}

// Retire, never delete -- same convention as jobs/catalogue_items/services
// elsewhere in this app (there's no delete grant on customers at all).
async function setCustomerActive(customerId, active) {
  const { error } = await sb.from('customers').update({ active }).eq('customer_id', customerId);
  if (error) throw new Error(error.message);
}

// Moves every vehicle and job from one customer onto another (the
// "vehicle got checked in under the wrong customer record" case) and
// retires the now-empty source, mirroring the one-off merge
// sql/036_customer_name_cleanup.sql did by hand for duplicate customers.
// Returns counts so the caller can show what actually moved.
async function transferCustomerContents(fromId, toId) {
  if (fromId === toId) throw new Error('Cannot transfer a customer to themselves.');

  const { data: vehiclesMoved, error: vErr } = await sb
    .from('owned_vehicles')
    .update({ owner_id: toId })
    .eq('owner_id', fromId)
    .select('owned_vehicle_id');
  if (vErr) throw new Error(vErr.message);

  const { data: jobsMoved, error: jErr } = await sb
    .from('jobs')
    .update({ customer_id: toId })
    .eq('customer_id', fromId)
    .select('id');
  if (jErr) throw new Error(jErr.message);

  const { error: retireError } = await sb.from('customers').update({ active: false }).eq('customer_id', fromId);
  if (retireError) throw new Error(retireError.message);

  return { vehiclesMoved: vehiclesMoved.length, jobsMoved: jobsMoved.length };
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

// registration is optional -- a vehicle bought from the dealership but not
// yet plated in-game genuinely has none yet (sql/038 dropped the not-null
// constraint for this reason).
async function createVehicle({ registration, make, model, class: vClass, owner_id, mileage }) {
  const reg = (registration || '').trim();
  const { data, error } = await sb
    .from('owned_vehicles')
    .insert({
      registration: reg ? reg.toUpperCase() : null,
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

// Dealership stock catalog (sql/037 backfilled make/model on most of it) --
// read-only soft-suggest for the "+ New vehicle" form so a mechanic can type
// a make/model/display name and pick the real vehicle instead of retyping
// it by hand. Never written to from here -- the dealership app owns this
// table (see sql/002's header).
async function searchCatalogVehicles(query) {
  const q = query.trim();
  if (!q) return [];
  const { data, error } = await sb
    .from('vehicles')
    .select('vehicle_id, make, model, display_name, category')
    .eq('active', true)
    .ilike('display_name', `%${q}%`)
    .order('display_name')
    .limit(8);
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

// Was 10000 (the server's civ-job baseline), which Joanna found paid ~4x too
// much -- cut to a quarter. Only affects shifts clocked out from now on;
// payroll_ledger rows already written keep the amount they were paid at.
const SHIFT_PAY_RATE_PER_HOUR = 2500;

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

// Flat per-delivery pay for the Stocker role -- one delivery run (however
// many shopping-list items it covers, part or full) earns this flat amount,
// not a per-item or per-hour rate. Same payroll_ledger/markPayrollEntryPaid
// mechanism as everyone else's pay -- "pay them at any point" was already
// how that works, this just adds the entry type that feeds it.
const DELIVERY_PAY_AMOUNT = 2500;
async function recordDelivery(mechanicId, notes) {
  const { error } = await sb.from('payroll_ledger').insert({
    mechanic_id: mechanicId, entry_type: 'delivery', amount: DELIVERY_PAY_AMOUNT, notes
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
      id, job_number, quoted_total, labour_fee, discount_type, discount_amount, is_quick_job,
      assigned_staff_id, receipt_generated_at,
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

// Dealership purchase history (sql/040) -- for the "+ New vehicle" form,
// so a car the customer bought but never got checked in still shows up as
// a suggestion instead of the mechanic retyping its make/model from
// scratch. vehicle_sales/vehicle_sale_items are dealership-owned and
// read-only from here, same as `vehicles` itself.
//
// No foreign keys are actually declared between vehicle_sales,
// vehicle_sale_items and vehicles (confirmed via pg_constraint before
// building this), so PostgREST can't auto-embed them -- three plain
// queries joined in JS instead of one nested select.
async function listDealershipPurchasesForCustomer(customerId) {
  const { data: sales, error: salesErr } = await sb
    .from('vehicle_sales')
    .select('sale_id, sale_date')
    .eq('customer_id', customerId)
    .eq('is_deleted', false);
  if (salesErr) throw new Error(salesErr.message);
  if (sales.length === 0) return [];
  const saleDateBySaleId = new Map(sales.map((s) => [s.sale_id, s.sale_date]));

  const { data: items, error: itemsErr } = await sb
    .from('vehicle_sale_items')
    .select('sale_item_id, sale_id, vehicle_id, legacy_vehicle_name')
    .in('sale_id', sales.map((s) => s.sale_id))
    .eq('is_deleted', false);
  if (itemsErr) throw new Error(itemsErr.message);
  if (items.length === 0) return [];

  const vehicleIds = [...new Set(items.map((i) => i.vehicle_id).filter(Boolean))];
  let vehiclesById = new Map();
  if (vehicleIds.length > 0) {
    const { data: vehicles, error: vErr } = await sb
      .from('vehicles')
      .select('vehicle_id, make, model, display_name, category')
      .in('vehicle_id', vehicleIds);
    if (vErr) throw new Error(vErr.message);
    vehiclesById = new Map(vehicles.map((v) => [v.vehicle_id, v]));
  }

  return items
    .map((i) => ({
      sale_item_id: i.sale_item_id,
      legacy_vehicle_name: i.legacy_vehicle_name,
      sale_date: saleDateBySaleId.get(i.sale_id),
      vehicle: vehiclesById.get(i.vehicle_id) || null
    }))
    .sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date));
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
    .select('id, job_type, status, engine_spec, approved_at, work_started_at, completed_at, cancelled_at')
    .eq('job_id', jobId);
  if (error) throw new Error(error.message);
  return data;
}

// Performance upgrades on a job that's also getting a built engine are
// quoted together with the engine and fitted in one go at its installation
// (Joanna, 2026-10-08). Agreeing that quote parks the Performance leg at
// 'approved' -- the marker for "fitted with the engine" (a normal agreed
// quote goes straight to work_in_progress) -- while the engine is built.
function performanceRidesWithEngine(legs) {
  const perf = legs.find((l) => l.job_type === 'performance');
  const engine = legs.find((l) => l.job_type === 'engine_building');
  return !!(perf && engine && perf.status === 'approved'
    && engine.status !== 'completed' && engine.status !== 'cancelled');
}

// Performance and Engine Building both still quoting -> one quote covers both.
function quotesPerformanceWithEngine(legs) {
  const perf = legs.find((l) => l.job_type === 'performance');
  const engine = legs.find((l) => l.job_type === 'engine_building');
  return !!(perf && engine && perf.status === 'quote_preparation' && engine.status === 'quote_preparation');
}

// First leg (in LEG_ORDER) that isn't completed/cancelled, or null if every
// selected leg is finished -- that's what puts a job on a given area board,
// and null is what moves it to Billing. Performance waiting to be fitted
// with the engine is skipped, so the engine build is what's active.
function activeLegForJob(legs) {
  const skipPerformance = performanceRidesWithEngine(legs);
  for (const type of LEG_ORDER) {
    if (type === 'performance' && skipPerformance) continue;
    const leg = legs.find((l) => l.job_type === type);
    if (leg && leg.status !== 'completed' && leg.status !== 'cancelled') return leg;
  }
  return null;
}

// "Quote agreed": starts that leg's work -- except a Performance + Engine
// Building quote, which approves both and starts the engine build (the
// performance parts go on at installation). Returns the leg type to open.
async function agreeLegQuote(jobId, jobType) {
  const legs = await listJobLegs(jobId);
  if ((jobType === 'performance' || jobType === 'engine_building') && quotesPerformanceWithEngine(legs)) {
    await updateLegStatus(jobId, 'performance', 'approved');
    await updateLegStatus(jobId, 'engine_building', 'work_in_progress');
    return 'engine_building';
  }
  await updateLegStatus(jobId, jobType, 'work_in_progress');
  return jobType;
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

// Billing page's "back to work": reopens the last finished leg (in
// LEG_ORDER) so a forgotten part can still be added, and takes the job back
// out of Billing. Callers must only offer this before the job is billed.
// Returns the reopened leg's job_type.
async function reopenLastCompletedLeg(jobId) {
  const legs = await listJobLegs(jobId);
  const leg = [...LEG_ORDER].reverse()
    .map((t) => legs.find((l) => l.job_type === t && l.status === 'completed'))
    .find(Boolean);
  if (!leg) throw new Error('There is no finished work stage to go back to.');

  const { error } = await sb.from('job_legs')
    .update({ status: 'work_in_progress', completed_at: null })
    .eq('id', leg.id);
  if (error) throw new Error(error.message);

  const { error: stageError } = await sb.from('jobs').update({ stage: 'in_progress' }).eq('id', jobId);
  if (stageError) throw new Error(stageError.message);
  return leg.job_type;
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

// Shop policy: labour is a flat charge per distinct component actually
// installed, not time-based. Real hours worked (job_legs.work_started_at ->
// completed_at) used to be the fallback for a leg with no Service attached,
// but that penalised RP pacing rather than measuring what was actually
// done -- a big multi-part build assembled in one focused sitting could
// show LESS billable time than a quick repair left "in progress" while the
// mechanic stepped away. LABOUR_RATE_PER_HOUR stays defined (only) as the
// basis for the mechanic's commission-margin ratio below; it no longer
// drives any bill directly.
const LABOUR_RATE_PER_HOUR = 12500;

// Rate per distinct catalogue item added under that job_type -- quantity
// doesn't matter (64 tappet sets on one Engine Building leg is still one
// charge). The live rates are in labour_rates (sql/060), editable on the
// Accounts page; these are only the fallback if that read fails. Anything
// that calculates labour must `await labourRatesReady` first.
const INSTALL_CHARGE_BY_JOB_TYPE = {
  repair: 100,
  customisation: 250,
  performance: 450,
  engine_building: 450
};

async function loadLabourRates() {
  try {
    const { data, error } = await sb.from('labour_rates').select('job_type, rate_per_part');
    if (error) throw new Error(error.message);
    (data || []).forEach((r) => { INSTALL_CHARGE_BY_JOB_TYPE[r.job_type] = Number(r.rate_per_part); });
  } catch (err) {
    console.error('Using default labour rates:', err.message);
  }
}
// Kicked off as soon as this file loads (sb already exists by then).
const labourRatesReady = loadLabourRates();

async function updateLabourRate(jobType, rate, updatedBy) {
  const { error } = await sb.from('labour_rates')
    .update({ rate_per_part: rate, updated_at: new Date().toISOString(), updated_by: updatedBy || null })
    .eq('job_type', jobType);
  if (error) throw new Error(error.message);
  INSTALL_CHARGE_BY_JOB_TYPE[jobType] = Number(rate);
}

// Engine Building leg's engine (sql/060): { valvetrain, configuration, style }.
async function updateLegEngineSpec(jobId, spec) {
  const { error } = await sb.from('job_legs').update({ engine_spec: spec })
    .eq('job_id', jobId).eq('job_type', 'engine_building');
  if (error) throw new Error(error.message);
}

// Maps a leg's job_type to the matching catalogue_items.categories tag
// (sql/046 synced these from Joanna's own master list) -- used to filter
// the item picker to the categories that actually belong on this leg, so a
// part doesn't end up added under the wrong job_type and billed at the
// wrong install-charge rate. Tools/Scrap Material aren't leg-specific, so
// they show regardless of which leg is open.
const CATEGORY_FOR_JOB_TYPE = {
  repair: 'Repair/Service',
  customisation: 'Customisation',
  performance: 'Performance',
  engine_building: 'Engine Manufacture'
};
const ALWAYS_SHOWN_CATEGORIES = ['Tools', 'Scrap Material'];

// jobItems is listJobItems()'s shape (job_type + catalogue_item_id present
// on every row, no jobType filter applied when fetching -- this needs every
// leg's items to bucket them itself). null (not 0) when nothing's been
// added under this job_type yet, matching this app's "unknown stays null"
// convention -- a job with genuinely zero components isn't a $0 charge, it's
// not started.
function installChargeForType(jobItems, jobType) {
  const distinctIds = new Set(
    (jobItems || []).filter((i) => i.job_type === jobType).map((i) => i.catalogue_item_id)
  );
  if (distinctIds.size === 0) return null;
  const rate = INSTALL_CHARGE_BY_JOB_TYPE[jobType];
  return rate != null ? distinctIds.size * rate : null;
}

// ---- Flat per-service labour (sql/043) ----
//
// A leg with one or more *priced* services bills their flat labour_fee
// instead of the component count below -- a hand-picked price for a named
// job (Turbo Install, Oil Change, ...) takes priority over the generic
// per-component charge once one's been set up. An attached service with no
// price yet (every seeded service starts this way until Joanna sets real
// values on services.html) is treated the same as no service at all --
// falls back to the install charge, rather than blanking out an otherwise
// known number just because someone attached a placeholder service.
function serviceLabourFeeForType(jobServices, jobType) {
  const priced = (jobServices || []).filter((js) => js.job_type === jobType && js.labour_fee != null);
  if (priced.length === 0) return undefined;
  return priced.reduce((sum, js) => sum + Number(js.labour_fee), 0);
}

// One total across every leg on the job: each leg independently prefers
// its own priced services' flat fee, falling back to the per-component
// install charge otherwise. null only once a leg has neither a priced
// service nor any components added yet -- genuinely nothing to charge.
function totalLabourFee(legs, jobServices, jobItems) {
  let total = 0;
  let anyKnown = false;
  (legs || []).forEach((leg) => {
    const svcFee = serviceLabourFeeForType(jobServices, leg.job_type);
    const legFee = svcFee !== undefined ? svcFee : installChargeForType(jobItems, leg.job_type);
    if (legFee != null) { total += legFee; anyKnown = true; }
  });
  return anyKnown ? Math.round(total * 100) / 100 : null;
}

// Commission is a fixed 20% cut of billed labour. It used to be derived as
// (LABOUR_RATE_PER_HOUR - SHIFT_PAY_RATE_PER_HOUR) / LABOUR_RATE_PER_HOUR,
// which came to 20% at the old 10000 wage -- pinned here so cutting the
// shift wage doesn't silently quadruple every mechanic's commission.
const LABOUR_MARGIN_SHARE = 0.2;
function commissionForLabourFee(fee) {
  if (!fee || fee <= 0) return 0;
  return Math.round(fee * LABOUR_MARGIN_SHARE * 100) / 100;
}


// ---- Quick Jobs (sql/055) ----
//
// Rapid-turnover work (a mechanic's own car, or a customer who just needs
// parts fitted now): no inspection, quote or legs -- parts are picked from
// the whole catalogue and billed straight away. Saved as an ordinary job +
// job_items so stock, Accounts and history all treat it like any other job.

const STAFF_DISCOUNT_RATE = 0.1; // 10% off every item's customer price, labour waived
const EMS_DISCOUNT_RATE = 0.1;   // 10% off the final bill

const DISCOUNT_TYPES = [
  { value: '', label: 'No discount' },
  { value: 'staff', label: 'Staff discount (10% off parts, no labour)' },
  { value: 'ems', label: 'EMS discount (10% off final bill)' }
];

// A quick job has no legs, so each part's labour is charged by the job type
// its catalogue category belongs to -- the same per-distinct-component
// install charge regular jobs use (INSTALL_CHARGE_BY_JOB_TYPE). Items tagged
// with more than one category take the cheapest matching rate; Tools/Scrap
// Material map to nothing and carry no labour.
function jobTypeForCatalogueItem(item) {
  const categories = item.categories || [];
  const byRate = Object.keys(CATEGORY_FOR_JOB_TYPE)
    .sort((a, b) => INSTALL_CHARGE_BY_JOB_TYPE[a] - INSTALL_CHARGE_BY_JOB_TYPE[b]);
  return byRate.find((t) => categories.includes(CATEGORY_FOR_JOB_TYPE[t])) || null;
}

function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

// lines: [{ catalogue_item_id, job_type, quantity, unit_price }]. Returns
// everything the bill shows and what gets persisted -- one function so the
// popup, the bill image and the saved job can never disagree.
function quickJobTotals(lines, discountType) {
  const parts = roundMoney(lines.reduce((sum, l) => sum + Number(l.unit_price || 0) * Number(l.quantity), 0));
  let labour = 0;
  Object.keys(INSTALL_CHARGE_BY_JOB_TYPE).forEach((t) => {
    labour += installChargeForType(lines, t) || 0;
  });
  labour = roundMoney(labour);

  let labourCharged = labour;
  let discount = 0;
  if (discountType === 'staff') {
    labourCharged = 0;
    discount = roundMoney(parts * STAFF_DISCOUNT_RATE);
  } else if (discountType === 'ems') {
    discount = roundMoney((parts + labour) * EMS_DISCOUNT_RATE);
  }
  return {
    parts,
    labour: labourCharged,
    subtotal: roundMoney(parts + labourCharged),
    discount,
    total: roundMoney(parts + labourCharged - discount)
  };
}

// Exact (case-insensitive) name match first, so repeat customers don't
// pile up duplicates; creates the customer otherwise.
async function findOrCreateCustomerByName(name) {
  const clean = name.trim();
  const { data, error } = await sb
    .from('customers')
    .select('customer_id, customer_name')
    .ilike('customer_name', clean)
    .eq('active', true)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data || createCustomer({ name: clean });
}

// Plate already on file -> reuse that vehicle even if it's registered to
// someone else (a mechanic's own job on a borrowed car, etc). Otherwise
// create it under this customer.
async function findOrCreateVehicleByPlate(plate, ownerId) {
  const clean = plate.trim().toUpperCase();
  const { data, error } = await sb
    .from('owned_vehicles')
    .select('owned_vehicle_id, registration')
    .ilike('registration', clean)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data || createVehicle({ registration: clean, owner_id: ownerId });
}

// Billing step for a quick job -- bill link, labour/discount snapshot and
// completion in one update (mirrors updateJobReceiptDocument +
// updateJobLabourFee for regular jobs).
async function finalizeQuickJob(jobId, { receiptUrl, labourFee, discountType, discountAmount }) {
  const { error } = await sb.from('jobs').update({
    receipt_document_url: receiptUrl || null,
    receipt_generated_at: new Date().toISOString(),
    labour_fee: labourFee,
    discount_type: discountType || null,
    discount_amount: discountAmount || null,
    status: 'completed',
    stage: 'completed'
  }).eq('id', jobId);
  if (error) throw new Error(error.message);
}

// What a job actually charged -- discounts (quick jobs) included.
function jobBilledTotal(job) {
  return roundMoney(Number(job.quoted_total || 0) + Number(job.labour_fee || 0) - Number(job.discount_amount || 0));
}

// Logs' Jobs tab: every job in the window, newest first, with whatever's
// needed to show its bill.
async function listJobsForLog({ fromDate, toDate, limit = 300 } = {}) {
  let query = sb
    .from('jobs')
    .select(`
      id, job_number, job_types, stage, is_quick_job, quoted_total, labour_fee,
      discount_type, discount_amount, assigned_staff_id, created_at,
      receipt_document_url, receipt_generated_at,
      customers ( customer_name ),
      owned_vehicles ( registration, make, model )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (fromDate) query = query.gte('created_at', fromDate);
  if (toDate) query = query.lte('created_at', toDate);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

// ---- Quantity steppers ----
//
// Every "- qty +" control also lets the number itself be typed. Markup is
// <input type="number" class="qty-input"> between the two buttons; this
// wires it up. Saves on Enter or blur (not per keystroke, which would
// write half-typed numbers), Escape cancels. Whole numbers only -- stock
// movements (inventory_transactions.quantity) are integers. 0 means
// remove, same as pressing - down to zero; anything invalid snaps back.
function bindQtyInput(input, currentQty, onCommit) {
  input.value = currentQty;
  input.min = '0';
  input.step = '1';
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { input.value = currentQty; input.blur(); }
  });
  input.addEventListener('focus', () => input.select());
  input.addEventListener('change', () => {
    const raw = input.value.trim();
    const n = Number(raw);
    if (raw === '' || !Number.isFinite(n) || n < 0) { input.value = currentQty; return; }
    const qty = Math.round(n);
    if (qty === Number(currentQty)) { input.value = currentQty; return; }
    onCommit(qty);
  });
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
