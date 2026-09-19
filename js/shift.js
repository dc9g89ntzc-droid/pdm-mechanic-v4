// Self-mounting shift clock + idle detection. Include after auth.js/
// workshop.js on every authenticated page -- it finds its own DOM anchor
// (#logoutBtn, present in every page's header) and injects its own widget
// and "still working?" modal, so no per-page HTML changes are needed.
//
// Model: logging into any page clocks a mechanic in (or resumes their
// existing open shift). No activity for 30 minutes prompts "Still
// working?"; no response within 5 more minutes clocks them out (pay
// stops, they stay logged into the app -- "Resume shift" is one click).
// An explicit Clock out button covers stepping away on purpose. Because
// the idle timer only runs while a browser tab is open, a crashed client
// leaves no one to fire it -- as a backstop, an open shift older than the
// safety-net ceiling gets auto-closed the next time that same mechanic's
// shift is looked up (their next login), rather than paying out forever.

(function () {
  const IDLE_PROMPT_AFTER_MS = 30 * 60 * 1000; // 30 min of no activity
  const IDLE_GRACE_MS = 5 * 60 * 1000; // 5 min to respond to the prompt
  const SAFETY_NET_MAX_SHIFT_MS = 10 * 60 * 60 * 1000; // 10h -- crashed-client backstop
  const CHECK_INTERVAL_MS = 60 * 1000;

  const session = typeof getSession === 'function' ? getSession() : null;
  if (!session) return; // not logged in (or this ran on a page without auth.js) -- nothing to do

  let shiftId = null;
  let clockInAt = null;
  let lastActivityAt = Date.now();
  let promptShownAt = null;
  let checkTimer = null;
  let tickTimer = null;

  // ---- DOM ----
  const style = document.createElement('style');
  style.textContent = `
    .shift-widget { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-dim, #9c9691); }
    .shift-widget .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-dim, #9c9691); flex: 0 0 auto; }
    .shift-widget.on-shift .dot { background: var(--green, #22c55e); }
    .shift-widget button { background: transparent; border: 1px solid var(--panel-border, #2a2b2e); color: var(--text, #f0ebe4); border-radius: 6px; padding: 5px 10px; font-size: 12px; cursor: pointer; }
    .shift-widget button:hover { border-color: var(--red, #d81f27); }
    .shift-modal-backdrop { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.65); align-items: center; justify-content: center; z-index: 100; }
    .shift-modal-backdrop.open { display: flex; }
    .shift-modal { background: var(--panel, #17181a); border: 1px solid var(--panel-border, #2a2b2e); border-radius: 12px; padding: 24px; width: 100%; max-width: 340px; color: var(--text, #f0ebe4); font-family: inherit; text-align: center; }
    .shift-modal h2 { font-size: 16px; margin: 0 0 8px; }
    .shift-modal p { font-size: 13px; color: var(--text-dim, #9c9691); margin: 0 0 18px; }
    .shift-modal button { width: 100%; background: var(--red, #d81f27); border: none; color: white; padding: 11px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
  `;
  document.head.appendChild(style);

  const widget = document.createElement('div');
  widget.className = 'shift-widget';
  widget.innerHTML = `<span class="dot"></span><span class="shift-label">—</span><button class="shift-btn">Clock in</button>`;
  const anchor = document.getElementById('logoutBtn');
  if (anchor && anchor.parentNode) {
    anchor.parentNode.insertBefore(widget, anchor);
  } else {
    document.body.appendChild(widget);
  }
  const labelEl = widget.querySelector('.shift-label');
  const btnEl = widget.querySelector('.shift-btn');

  const modalBackdrop = document.createElement('div');
  modalBackdrop.className = 'shift-modal-backdrop';
  modalBackdrop.innerHTML = `
    <div class="shift-modal">
      <h2>Still working?</h2>
      <p>No activity for a while -- confirm you're still on shift, or you'll be clocked out in 5 minutes.</p>
      <button id="shiftStillHereBtn">I'm still here</button>
    </div>
  `;
  document.body.appendChild(modalBackdrop);
  modalBackdrop.querySelector('#shiftStillHereBtn').addEventListener('click', () => {
    markActivity();
  });

  function formatElapsed(ms) {
    const totalMin = Math.floor(ms / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h}:${String(m).padStart(2, '0')}`;
  }

  function renderWidget() {
    if (shiftId) {
      widget.classList.add('on-shift');
      labelEl.textContent = `On shift · ${formatElapsed(Date.now() - new Date(clockInAt).getTime())}`;
      btnEl.textContent = 'Clock out';
    } else {
      widget.classList.remove('on-shift');
      labelEl.textContent = 'Clocked out';
      btnEl.textContent = 'Clock in';
    }
  }

  function markActivity() {
    lastActivityAt = Date.now();
    if (promptShownAt) {
      promptShownAt = null;
      modalBackdrop.classList.remove('open');
    }
  }

  async function startShift() {
    try {
      let open = await getOpenShift(session.id);
      if (open) {
        const age = Date.now() - new Date(open.clock_in).getTime();
        if (age > SAFETY_NET_MAX_SHIFT_MS) {
          // Crashed-client backstop: close the stale shift, pay for it, start fresh.
          const closedAt = new Date(new Date(open.clock_in).getTime() + SAFETY_NET_MAX_SHIFT_MS).toISOString();
          await clockOutShift(open.id, 'safety_net');
          await recordShiftPay(session.id, open.id, open.clock_in, closedAt).catch(() => {});
          open = null;
        }
      }
      if (!open) {
        open = await clockIn(session.id);
      }
      shiftId = open.id;
      clockInAt = open.clock_in;
      markActivity();
    } catch (err) {
      console.error('Failed to start shift:', err.message);
    }
    renderWidget();
  }

  async function endShift(reason) {
    if (!shiftId) return;
    const closingId = shiftId;
    const closingStart = clockInAt;
    shiftId = null;
    clockInAt = null;
    modalBackdrop.classList.remove('open');
    promptShownAt = null;
    renderWidget();
    try {
      await clockOutShift(closingId, reason);
      await recordShiftPay(session.id, closingId, closingStart, new Date().toISOString());
    } catch (err) {
      console.error('Failed to end shift:', err.message);
    }
  }

  btnEl.addEventListener('click', async () => {
    btnEl.disabled = true;
    if (shiftId) {
      await endShift('manual');
    } else {
      await startShift();
    }
    btnEl.disabled = false;
  });

  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach((evt) => {
    document.addEventListener(evt, markActivity, { passive: true });
  });

  checkTimer = setInterval(() => {
    if (!shiftId) return;
    const idleFor = Date.now() - lastActivityAt;
    if (!promptShownAt && idleFor >= IDLE_PROMPT_AFTER_MS) {
      promptShownAt = Date.now();
      modalBackdrop.classList.add('open');
    } else if (promptShownAt && Date.now() - promptShownAt >= IDLE_GRACE_MS) {
      endShift('idle_timeout');
    }
  }, CHECK_INTERVAL_MS);

  tickTimer = setInterval(renderWidget, 30000);

  // Exposed so js/auth.js's logout() can end the shift (stopping the pay
  // clock) before navigating away. logout() awaits this itself rather than
  // this file racing it with a second click listener -- an in-flight
  // clock-out request would otherwise risk getting cancelled by the page
  // unloading before it finishes.
  window.clockOutForLogout = () => (shiftId ? endShift('manual') : Promise.resolve());

  startShift();
})();
