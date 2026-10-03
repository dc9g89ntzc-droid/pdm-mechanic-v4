// The PDM Dealership 3.0 Apps Script backend, ported to one Netlify
// function. dealership/js/gasShim.js turns every
// google.script.run.someFunction(...args) call into a POST here of
// { fn: 'someFunction', args: [...] }, and this dispatches it to the
// ported module with the same name. Each function still does its own
// session + permission check, exactly as in Apps Script.
//
// Old Apps Script file -> module here:
//   00_Config, 01_Supabase, 04_Audit        -> supabase.js
//   02_Auth                                 -> session.js
//   03_Dashboard, 05_Portal                 -> dashboard.js
//   06_Sales, 08_Imports, 09_Buybacks,
//   10_Exports                              -> transactions.js
//   07_Logs                                 -> logs.js
//   11_Stock                                -> stock.js
//   12_PublicStock, 20_PublicSpotlight      -> showroom.js
//   13_VehicleManagement,
//   21_CatalogueIntelligence,
//   22_PhotoCaptureBridge                   -> vehicles.js
//   14_Accounts, 15_Payroll                 -> accounts.js
//   16_Manager                              -> staff.js
//   17_Customers                            -> customers.js
//   19_MyPDM                                -> myPdm.js
//   Code (doGet routing)                    -> static pages in dealership/
const modules = [
  require('./session'),
  require('./dashboard'),
  require('./transactions'),
  require('./logs'),
  require('./stock'),
  require('./showroom'),
  require('./vehicles'),
  require('./accounts'),
  require('./staff'),
  require('./customers'),
  require('./myPdm')
];

// Only names exported under `functions` are callable -- the trailing-
// underscore helpers (Apps Script's convention for private) never are.
const FUNCTIONS = {};
modules.forEach(m => {
  Object.entries(m.functions).forEach(([name, fn]) => {
    if (FUNCTIONS[name]) throw new Error('Duplicate dealership function: ' + name);
    FUNCTIONS[name] = fn;
  });
});

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  let request;
  try {
    request = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid request body.' });
  }

  const fnName = String(request.fn || '');
  const fn = Object.prototype.hasOwnProperty.call(FUNCTIONS, fnName) ? FUNCTIONS[fnName] : null;
  if (!fn) {
    return json(404, { error: 'Unknown dealership function: ' + fnName });
  }

  try {
    const args = Array.isArray(request.args) ? request.args : [];
    const result = await fn(...args);
    return json(200, { result: result === undefined ? null : result });
  } catch (err) {
    // Same as Apps Script: the thrown message is what the failure handler
    // shows (or 'SESSION_EXPIRED', which the portal turns into a logout).
    console.error(fnName + ' failed:', err);
    return json(400, { error: err && err.message ? err.message : String(err) });
  }
};

exports.FUNCTIONS = FUNCTIONS;
