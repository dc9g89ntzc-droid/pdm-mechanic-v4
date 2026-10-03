// Drop-in stand-in for Apps Script's google.script.run, so portal.js and
// showroom.js (ported verbatim from PDM Dealership 3.0) run unchanged.
// Every call becomes a POST to the dealership-api Netlify function, which
// holds the ported server modules -- same function names, same arguments,
// same success/failure handler semantics:
//
//   google.script.run
//     .withSuccessHandler(fn)
//     .withFailureHandler(fn)
//     .getDashboardData(token);
//
// Failure handlers receive an Error whose message is the server's error
// text, matching what Apps Script passed (cleanError() strips nothing
// extra here since there's no "Exception: " prefix anymore).
(function () {
  const ENDPOINT = '/.netlify/functions/dealership-api';

  async function callServer(fnName, args) {
    let res;
    try {
      res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fn: fnName, args })
      });
    } catch (err) {
      throw new Error('Could not reach the dealership server. Check your connection and try again.');
    }

    let body = null;
    try {
      body = await res.json();
    } catch {
      // Non-JSON (e.g. a Netlify 502 page) -- fall through to the generic error.
    }

    if (!res.ok || !body || body.error) {
      throw new Error((body && body.error) || `Server error (${res.status})`);
    }
    return body.result === undefined ? null : body.result;
  }

  function runner(onSuccess, onFailure, userObject) {
    return new Proxy({}, {
      get(_, prop) {
        if (prop === 'withSuccessHandler') return fn => runner(fn, onFailure, userObject);
        if (prop === 'withFailureHandler') return fn => runner(onSuccess, fn, userObject);
        if (prop === 'withUserObject') return obj => runner(onSuccess, onFailure, obj);
        if (typeof prop !== 'string') return undefined;

        return (...args) => {
          callServer(prop, args).then(
            result => { if (onSuccess) onSuccess(result, userObject); },
            err => {
              if (onFailure) onFailure(err, userObject);
              else console.error(`google.script.run.${prop} failed:`, err);
            }
          );
        };
      }
    });
  }

  window.google = window.google || {};
  window.google.script = window.google.script || {};
  window.google.script.run = runner(null, null, undefined);
})();
