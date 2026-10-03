// Port of 03_Dashboard + 05_Portal from PDM Dealership 3.0.
const { APP_NAME, selectSql_, rpcSql_, rowData_ } = require('./supabase');
const { requireSession_, requireEmployeeLink_, publicUser_ } = require('./session');

// Canonical PDM week: Monday 12:00 UTC -> following Monday 12:00 UTC.
// Shared with My PDM (19_MyPDM had an identical copy).
function financialWeek_() {
  const now = new Date();

  const candidate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    12, 0, 0, 0
  ));

  const day = candidate.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  candidate.setUTCDate(candidate.getUTCDate() + diffToMonday);

  if (now < candidate) {
    candidate.setUTCDate(candidate.getUTCDate() - 7);
  }

  const end = new Date(candidate);
  end.setUTCDate(end.getUTCDate() + 7);

  return {
    start: candidate.toISOString(),
    end: end.toISOString()
  };
}

async function getDashboardData(token) {
  const user = requireSession_(token);
  requireEmployeeLink_(user);

  const week = financialWeek_();

  const data = rowData_(await rpcSql_('dealership_dashboard_v12', {
    p_employee_id: user.employee_id,
    p_week_start: week.start,
    p_week_end: week.end
  }));

  if (!data) {
    throw new Error('Dashboard returned no data.');
  }

  // Most historical transaction headers contain employee_name but no
  // employee_id. This helper safely resolves those names back to employees
  // and counts VEHICLE QUANTITY so Dashboard matches Payroll.
  const staffData = rowData_(await rpcSql_('dealership_dashboard_staff_activity', {
    p_employee_id: user.employee_id,
    p_week_start: week.start,
    p_week_end: week.end
  }));

  data.staff_activity = Array.isArray(staffData) ? staffData : [];

  return data;
}

async function getPortalBootstrap(token) {
  const user = requireSession_(token);
  return {
    app_name: APP_NAME,
    user: publicUser_(user)
  };
}

async function getStockPreview(token) {
  requireSession_(token);

  return await selectSql_(
    'current_vehicle_stock',
    '?select=vehicle_id,display_name,category,stock_qty' +
    '&stock_qty=gt.0&order=display_name.asc&limit=500'
  ) || [];
}

module.exports = {
  financialWeek_,
  functions: { getDashboardData, getPortalBootstrap, getStockPreview }
};
