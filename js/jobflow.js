// Shared "job flow" chrome for the per-job pages (inspection/job-items/
// quote/receipt): a sidebar stepper showing where this ticket is, and a
// summary panel -- so working one ticket start-to-finish reads as one
// continuous flow instead of separate disconnected screens. Depends on
// js/workshop.js (LEG_ORDER, jobTypeLabel, syncJobLegs).

const FLOW_STEP_DEFS = {
  repair: [
    { key: 'discovery', label: 'Repair Inspection' },
    { key: 'quote', label: 'Repair Quote' },
    { key: 'work', label: 'Repair Work' }
  ],
  customisation: [
    { key: 'discovery', label: 'Customisation Additions' },
    { key: 'quote', label: 'Customisation Quote' },
    { key: 'work', label: 'Customisation Work' }
  ],
  performance: [
    { key: 'discovery', label: 'Performance Additions' },
    { key: 'quote', label: 'Performance Quote' },
    { key: 'work', label: 'Performance Work' }
  ]
};

// Which of a leg's 3 steps is done/current/pending, derived from
// job_legs.status. There's no status distinct from quote_preparation for
// "quote generated, awaiting agreement" vs "still adding items" -- that
// whole window reads as one "Quote" step, which matches the real page flow
// either way (job-items add-mode -> quote.html both happen while the leg
// is still quote_preparation). Non-repair legs have no discovery sub-phase
// at all (initialLegStatus skips straight to quote_preparation for them),
// so their first step is trivially done as soon as the leg exists.
function legStepStates(leg) {
  const s = leg ? leg.status : null;
  const isRepair = leg && leg.job_type === 'repair';
  const discoveryCurrent = isRepair && ['awaiting_inspection', 'inspection_in_progress'].includes(s);
  const discoveryDone = !discoveryCurrent && !!s;
  const quoteCurrent = s === 'quote_preparation';
  const quoteDone = ['approved', 'waiting_for_parts', 'work_in_progress', 'completed'].includes(s);
  const workCurrent = ['approved', 'waiting_for_parts', 'work_in_progress'].includes(s);
  const workDone = s === 'completed';
  return {
    discovery: discoveryDone ? 'done' : discoveryCurrent ? 'current' : 'pending',
    quote: quoteDone ? 'done' : quoteCurrent ? 'current' : 'pending',
    work: workDone ? 'done' : workCurrent ? 'current' : 'pending'
  };
}

// onAdded: called (and awaited) after a work type is added mid-flow, so the
// calling page can reload its own leg/job data and re-render everything
// that depends on it (this function only re-renders itself).
function renderFlowSidebar(container, { jobId, jobTypes, legs, onAdded }) {
  const legByType = {};
  legs.forEach((l) => { legByType[l.job_type] = l; });

  const steps = [
    '<div class="flow-step done"><span class="flow-dot">&#10003;</span><div><div class="flow-label">New Job</div><div class="flow-state">Completed</div></div></div>'
  ];

  LEG_ORDER.filter((t) => jobTypes.includes(t)).forEach((t) => {
    const states = legStepStates(legByType[t]);
    FLOW_STEP_DEFS[t].forEach((stepDef) => {
      const state = states[stepDef.key];
      const stateLabel = state === 'done' ? 'Completed' : state === 'current' ? 'In progress' : 'Pending';
      const icon = state === 'done' ? '&#10003;' : state === 'current' ? '&#9679;' : '';
      steps.push(`
        <div class="flow-step ${state}">
          <span class="flow-dot">${icon}</span>
          <div><div class="flow-label">${stepDef.label}</div><div class="flow-state">${stateLabel}</div></div>
        </div>
      `);
    });
  });

  const addableTypes = LEG_ORDER.filter((t) => !jobTypes.includes(t));
  const addHtml = addableTypes.length > 0 ? `
    <div class="flow-add">
      <div class="flow-add-label">Add work type</div>
      ${addableTypes.map((t) => `<button type="button" class="flow-add-btn" data-type="${t}">+ ${jobTypeLabel(t)}</button>`).join('')}
    </div>
  ` : '';

  container.innerHTML = `
    <div class="flow-title">Workshop Flow</div>
    <div class="flow-steps">${steps.join('')}</div>
    ${addHtml}
  `;

  container.querySelectorAll('.flow-add-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        await syncJobLegs(jobId, [...jobTypes, btn.dataset.type]);
        if (onAdded) await onAdded();
      } catch (err) {
        alert(`Failed to add work type: ${err.message}`);
        btn.disabled = false;
      }
    });
  });
}

// mechanicName: pre-resolved by the caller (pages already do this lookup
// for their own printable quote/receipt sheets) so this stays a plain sync
// render, no fetch of its own.
function renderJobSummaryPanel(container, job, mechanicName) {
  const vehicle = job.owned_vehicles
    ? `${job.owned_vehicles.make || ''} ${job.owned_vehicles.model || ''}`.trim() || 'Unknown vehicle'
    : 'Unknown vehicle';
  const reg = job.owned_vehicles?.registration || 'Unknown';
  const typeBadges = (job.job_types && job.job_types.length > 0)
    ? job.job_types.map((t) => `<span class="badge type-${t}">${jobTypeLabel(t)}</span>`).join('')
    : '<span class="badge type-unclassified">To confirm</span>';

  container.innerHTML = `
    <div class="summary-title">Job Summary</div>
    <div class="summary-row"><span class="summary-label">Job number</span><span>#${job.job_number}</span></div>
    <div class="summary-row"><span class="summary-label">Customer</span><span>${job.customers?.customer_name || 'Unknown'}</span></div>
    <div class="summary-row"><span class="summary-label">Vehicle</span><span>${vehicle} &middot; ${reg}</span></div>
    <div class="summary-row"><span class="summary-label">Mechanic</span><span>${mechanicName || 'Unassigned'}</span></div>
    <div class="summary-section-label">Work types</div>
    <div class="badges">${typeBadges}</div>
    ${job.internal_notes ? `<div class="summary-section-label">Notes</div><div class="summary-notes">${job.internal_notes}</div>` : ''}
  `;
}
