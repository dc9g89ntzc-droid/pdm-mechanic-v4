// Data-access helpers for the Inspection screen.
// Thin wrappers around the Supabase client (`sb`, from supabaseClient.js).

// Body/glass/lighting zones -- matches the shop's real in-game inspection
// checklist exactly (Exterior / Body card), not the generic spec draft.
// Coordinates are exact path outlines the user hand-marked over the real
// reference diagram (images/vehicle-diagram.png, displayed 1:1 via viewBox
// 0 315 1080 620) -- a 4-view line-art sheet (left side / front / right
// side / rear). Several logical parts are visible in more than one view
// (e.g. the front bumper appears in the left-side, front, and right-side
// views), so those keys have multiple region entries; each is looked up by
// the same `key`, so tagging one paints all of a part's visible regions
// and clicking any of them edits the same finding. 'external' has no
// diagram geometry (rendered as a button instead, e.g. overall Body).
const BODY_ZONES = [
  { key: 'body_overall', label: 'Body (overall condition)', shape: 'external' },

  { key: 'front_left_door', label: 'Front Left Door', shape: 'path', d: 'M251 420 L396 415 Q388 441 392 505 L251 507 Q240 463 251 420Z' },
  { key: 'rear_left_door', label: 'Rear Left Door', shape: 'path', d: 'M399 415 L532 411 Q528 431 504 458 L477 494 Q472 504 458 505 L394 506 Q388 451 399 415Z' },
  { key: 'left_front_window', label: 'Left Front Window', shape: 'path', d: 'M298 392 Q340 362 398 362 L387 411 L298 415Z' },
  { key: 'left_rear_window', label: 'Left Rear Window', shape: 'path', d: 'M420 363 Q463 364 496 379 L491 408 L412 411Z' },
  { key: 'left_rear_window', label: 'Left Rear Window', shape: 'path', d: 'M502 382 Q523 393 529 402 L527 407 L499 407Z' },

  { key: 'rear_right_door', label: 'Rear Right Door', shape: 'path', d: 'M213 701 L343 704 Q352 740 349 792 L280 791 Q269 790 261 776 L234 730Z' },
  { key: 'front_right_door', label: 'Front Right Door', shape: 'path', d: 'M347 704 L488 710 Q500 743 491 792 L353 792 Q354 739 347 704Z' },
  { key: 'right_rear_window', label: 'Right Rear Window', shape: 'path', d: 'M245 664 Q278 651 322 650 L330 697 L251 695Z' },
  { key: 'right_front_window', label: 'Right Front Window', shape: 'path', d: 'M345 650 Q391 652 444 685 L444 701 L356 698Z' },
  { key: 'right_rear_window', label: 'Right Rear Window', shape: 'path', d: 'M238 668 L244 695 L215 693 L212 686Z' },

  { key: 'front_windshield', label: 'Front Windshield', shape: 'path', d: 'M768 365 Q839 356 915 365 L933 408 Q843 403 751 409Z' },
  { key: 'rear_windshield', label: 'Rear Windshield', shape: 'path', d: 'M766 650 Q841 642 918 650 L930 686 L754 687Z' },

  { key: 'front_bumper', label: 'Front Bumper', shape: 'path', d: 'M66 478 L130 479 Q126 501 129 522 L74 518 L67 517 L70 504Z' },
  { key: 'rear_bumper', label: 'Rear Bumper', shape: 'path', d: 'M584 463 Q627 459 665 451 L671 462 L668 493 Q666 503 656 505 L599 515 Q600 485 584 463Z' },
  { key: 'rear_bumper', label: 'Rear Bumper', shape: 'path', d: 'M79 744 L153 753 Q142 773 143 800 L88 791 Q77 790 74 778 L72 754Z' },
  { key: 'front_bumper', label: 'Front Bumper', shape: 'path', d: 'M610 756 L674 764 L678 777 L673 788 L677 804 L626 809 Q631 779 610 756Z' },
  { key: 'front_bumper', label: 'Front Bumper', shape: 'path', d: 'M719 477 Q745 492 791 489 L892 489 Q939 491 965 477 L961 516 Q960 522 953 522 L731 521 Q722 521 721 513Z' },
  { key: 'rear_bumper', label: 'Rear Bumper', shape: 'path', d: 'M716 777 L965 777 L962 801 L930 804 Q929 793 917 793 L768 793 Q755 793 752 804 L728 803 Q719 803 716 794Z' },

  { key: 'left_headlight', label: 'Left Headlight', shape: 'path', d: 'M78 469 Q87 450 104 446 Q137 434 136 444 Q120 465 94 468Z' },
  { key: 'right_headlight', label: 'Right Headlight', shape: 'path', d: 'M607 729 Q619 723 646 737 Q658 744 666 756 Q647 757 628 746 Q612 738 607 729Z' },
  { key: 'left_headlight', label: 'Left Headlight', shape: 'path', d: 'M727 444 Q736 435 756 447 Q774 458 777 471 Q753 475 728 467Z' },
  { key: 'right_headlight', label: 'Right Headlight', shape: 'path', d: 'M910 459 Q928 442 945 443 Q958 442 957 465 Q940 473 908 472Z' },

  { key: 'hood', label: 'Hood', shape: 'path', d: 'M86 440 Q135 416 224 412 L214 419 Q144 426 105 438Z' },
  { key: 'hood', label: 'Hood', shape: 'path', d: 'M517 698 Q608 702 652 726 L632 720 Q575 709 517 704Z' },
  { key: 'hood', label: 'Hood', shape: 'path', d: 'M745 414 Q842 408 936 414 L913 443 L902 452 Q843 445 784 451 L772 445Z' },

  { key: 'trunk', label: 'Trunk', shape: 'path', d: 'M600 400 L660 407 L658 422 L630 423Z' },
  { key: 'trunk', label: 'Trunk', shape: 'path', d: 'M82 695 L137 688 L121 710 L83 708Z' },
  { key: 'trunk', label: 'Trunk', shape: 'path', d: 'M755 695 Q842 689 926 695 L915 720 L908 747 Q906 755 898 755 L785 755 Q777 755 774 748 L766 723Z' },

  { key: 'left_taillight', label: 'Left Taillight', shape: 'path', d: 'M659 425 L641 426 Q632 432 629 445 L659 445Z' },
  { key: 'right_taillight', label: 'Right Taillight', shape: 'path', d: 'M82 713 L98 714 Q108 720 113 732 L82 732Z' },
  { key: 'left_taillight', label: 'Left Taillight', shape: 'path', d: 'M728 714 Q742 709 754 713 Q763 721 766 739 Q747 744 723 738 Q722 723 728 714Z' },
  { key: 'right_taillight', label: 'Right Taillight', shape: 'path', d: 'M926 713 Q941 709 953 716 Q960 726 958 738 Q937 744 916 739 Q918 722 926 713Z' }
];

const SEVERITIES = [
  { value: 'minor', label: 'Minor', color: '#f0a52c' },
  { value: 'moderate', label: 'Moderate', color: '#e08a1a' },
  { value: 'severe', label: 'Severe', color: '#d81f27' },
  { value: 'replacement_required', label: 'Replacement required', color: '#7a1013' }
];

// The shop's real inspection checklist (Engine Bay / Undercarriage /
// Drivetrain / Performance Parts). Each option carries a tier so the row
// can be colour-coded and pass_status derived automatically -- no separate
// urgency/pass dropdown needed for these, unlike a custom finding.
const INSPECTION_CHECKLIST = {
  'Engine Bay': [
    { key: 'oil_level', label: 'Oil Level', icon: '🛢️', options: [
      { value: 'Full', tier: 'ok' }, { value: '3/4', tier: 'ok' }, { value: 'Half', tier: 'advisory' },
      { value: 'Low', tier: 'advisory' }, { value: 'Empty', tier: 'fail' }
    ] },
    { key: 'oil_condition', label: 'Oil Condition', options: [
      { value: 'Honey Colored', tier: 'ok' }, { value: 'Dark / Dirty', tier: 'advisory' },
      { value: 'Milky (Contaminated)', tier: 'fail' }, { value: 'Burnt Smell', tier: 'fail' }
    ] },
    { key: 'brake_fluid', label: 'Brake Fluid', icon: '🛑', options: [
      { value: 'Full', tier: 'ok' }, { value: 'Low', tier: 'advisory' },
      { value: 'Empty', tier: 'fail' }, { value: 'Contaminated', tier: 'fail' }
    ] },
    { key: 'coolant', label: 'Coolant', icon: '❄️', options: [
      { value: 'To the Overflow Fill Line', tier: 'ok' }, { value: 'Low', tier: 'advisory' },
      { value: 'Empty', tier: 'fail' }, { value: 'Contaminated', tier: 'fail' }
    ] },
    { key: 'accessory_belt', label: 'Accessory Belt', options: [
      { value: 'OK', tier: 'ok' }, { value: 'Cracked', tier: 'advisory' },
      { value: 'Frayed', tier: 'advisory' }, { value: 'Missing', tier: 'fail' }
    ] },
    { key: 'timing_belt', label: 'Timing Belt', options: [
      { value: 'OK', tier: 'ok' }, { value: 'Worn', tier: 'advisory' }, { value: 'Needs Replacement', tier: 'fail' }
    ] },
    { key: 'water_pump', label: 'Water Pump', options: [
      { value: 'No Play, No Weep', tier: 'ok' }, { value: 'Weeping', tier: 'advisory' }, { value: 'Failed', tier: 'fail' }
    ] },
    { key: 'spark_plugs', label: 'Spark Plugs', options: [
      { value: 'Electrodes Clean', tier: 'ok' }, { value: 'Fouled', tier: 'advisory' },
      { value: 'Worn', tier: 'advisory' }, { value: 'Missing', tier: 'fail' }
    ] },
    { key: 'air_filter', label: 'Air Filter', options: [
      { value: 'Clean', tier: 'ok' }, { value: 'Dirty', tier: 'advisory' }, { value: 'Needs Replacement', tier: 'fail' }
    ] },
    { key: 'oil_filter', label: 'Oil Filter', options: [
      { value: 'Clean', tier: 'ok' }, { value: 'Dirty', tier: 'advisory' }, { value: 'Needs Replacement', tier: 'fail' }
    ] },
    { key: 'fuel_filter', label: 'Fuel Filter', options: [
      { value: 'Clean', tier: 'ok' }, { value: 'Dirty', tier: 'advisory' }, { value: 'Needs Replacement', tier: 'fail' }
    ] }
  ],
  'Undercarriage': [
    { key: 'chassis', label: 'Chassis', options: [
      { value: 'Pristine Frame', tier: 'ok' }, { value: 'Surface Rust', tier: 'advisory' },
      { value: 'Structural Rust', tier: 'fail' }, { value: 'Bent / Damaged', tier: 'fail' }
    ] },
    { key: 'brake_pads_front', label: 'Brake Pads (Front)', options: [
      { value: 'Good', tier: 'ok' }, { value: 'Worn', tier: 'advisory' }, { value: 'Needs Replacement', tier: 'fail' }
    ] },
    { key: 'brake_pads_rear', label: 'Brake Pads (Rear)', options: [
      { value: 'Good', tier: 'ok' }, { value: 'Worn', tier: 'advisory' }, { value: 'Needs Replacement', tier: 'fail' }
    ] },
    { key: 'rotors_front', label: 'Rotors (Front)', options: [
      { value: 'Smooth', tier: 'ok' }, { value: 'Scored', tier: 'advisory' }, { value: 'Warped', tier: 'fail' }
    ] },
    { key: 'rotors_rear', label: 'Rotors (Rear)', options: [
      { value: 'Smooth', tier: 'ok' }, { value: 'Scored', tier: 'advisory' }, { value: 'Warped', tier: 'fail' }
    ] },
    { key: 'shocks', label: 'Shocks', options: [
      { value: 'Good', tier: 'ok' }, { value: 'Leaking', tier: 'advisory' }, { value: 'Worn', tier: 'fail' }
    ] },
    { key: 'springs', label: 'Springs', options: [
      { value: 'Good', tier: 'ok' }, { value: 'Sagging', tier: 'advisory' }, { value: 'Broken', tier: 'fail' }
    ] },
    { key: 'brake_lines', label: 'Brake Lines', options: [
      { value: 'Sealed', tier: 'ok' }, { value: 'Corroded', tier: 'advisory' }, { value: 'Leaking', tier: 'fail' }
    ] },
    { key: 'sway_bars', label: 'Sway Bars', options: [
      { value: 'Good', tier: 'ok' }, { value: 'Worn', tier: 'advisory' }, { value: 'Broken', tier: 'fail' }
    ] },
    { key: 'bushings', label: 'Bushings', options: [
      { value: 'Good', tier: 'ok' }, { value: 'Worn', tier: 'advisory' }, { value: 'Cracked', tier: 'fail' }
    ] },
    { key: 'alignment', label: 'Alignment', options: [
      { value: 'In Spec', tier: 'ok' }, { value: 'Out of Spec', tier: 'advisory' }
    ] }
  ],
  'Drivetrain': [
    { key: 'transmission', label: 'Transmission', options: [
      { value: 'Automatic', tier: 'ok' }, { value: 'Manual', tier: 'ok' }, { value: 'CVT', tier: 'ok' }, { value: 'DCT', tier: 'ok' }
    ] },
    { key: 'gears', label: 'Gears', options: [
      { value: '4-Speed', tier: 'ok' }, { value: '5-Speed', tier: 'ok' }, { value: '6-Speed', tier: 'ok' },
      { value: '7-Speed', tier: 'ok' }, { value: '8-Speed', tier: 'ok' }, { value: '9-Speed', tier: 'ok' },
      { value: '10-Speed', tier: 'ok' }, { value: 'CVT', tier: 'ok' }
    ] },
    { key: 'torque_converter', label: 'Torque Converter', options: [
      { value: 'Good', tier: 'ok' }, { value: 'Slipping', tier: 'advisory' },
      { value: 'Shuddering', tier: 'advisory' }, { value: 'Failed', tier: 'fail' }
    ] },
    { key: 'drive', label: 'Drive', options: [
      { value: 'FWD', tier: 'ok' }, { value: 'RWD', tier: 'ok' }, { value: 'AWD', tier: 'ok' }, { value: 'Selectable 4WD', tier: 'ok' }
    ] },
    { key: 'gear_train', label: 'Gear Train', options: [
      { value: 'Good', tier: 'ok' }, { value: 'Worn', tier: 'advisory' }, { value: 'Noisy', tier: 'advisory' }, { value: 'Failed', tier: 'fail' }
    ] },
    { key: 'center_differential', label: 'Center Differential', options: [
      { value: 'Good', tier: 'ok' }, { value: 'Worn', tier: 'advisory' }, { value: 'Leaking', tier: 'advisory' }, { value: 'Failed', tier: 'fail' }
    ] },
    { key: 'front_differential', label: 'Front Differential', options: [
      { value: 'Good', tier: 'ok' }, { value: 'Worn', tier: 'advisory' }, { value: 'Leaking', tier: 'advisory' }, { value: 'Failed', tier: 'fail' }
    ] },
    { key: 'rear_differential', label: 'Rear Differential', options: [
      { value: 'Good', tier: 'ok' }, { value: 'Worn', tier: 'advisory' }, { value: 'Leaking', tier: 'advisory' }, { value: 'Failed', tier: 'fail' }
    ] }
  ],
  'Performance Parts': [
    { key: 'hardware', label: 'Hardware', options: [
      { value: 'All stock — no aftermarket parts', tier: 'ok' },
      { value: 'Some aftermarket parts installed', tier: 'advisory' },
      { value: 'Fully built', tier: 'advisory' }
    ] }
  ]
};

const TIER_COLORS = { ok: 'var(--green)', advisory: 'var(--amber)', fail: 'var(--red)' };
const TIER_TO_PASS_STATUS = { ok: 'pass', advisory: 'advisory', fail: 'fail' };

// Kept for the "+ Add custom finding" fallback, which covers anything not
// on the standard checklist.
const MECHANICAL_CATEGORIES = [
  'Body', 'Glass', 'Brakes', 'Electrical', 'Engine', 'Cooling',
  'Drivetrain', 'Fuel', 'Suspension', 'Fluids', 'Tires', 'Chassis'
];

const URGENCIES = [
  { value: 'monitor', label: 'Monitor' },
  { value: 'soon', label: 'Soon' },
  { value: 'immediate', label: 'Immediate' }
];

const PASS_STATUSES = [
  { value: 'pass', label: 'Pass' },
  { value: 'advisory', label: 'Advisory' },
  { value: 'fail', label: 'Fail' }
];

async function getJobContext(jobId) {
  const { data, error } = await sb
    .from('jobs')
    .select(`
      id, job_number, status, mileage_at_checkin,
      customers ( customer_name ),
      owned_vehicles ( registration, make, model )
    `)
    .eq('id', jobId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Reuses an existing open inspection for this job if one exists, otherwise
// creates one and (if the job is still awaiting_inspection) advances the
// job to inspection_in_progress.
async function getOrCreateInspection(jobId, staffId) {
  const { data: existing, error: existingError } = await sb
    .from('inspections')
    .select('id, job_id, started_at, completed_at, mileage_at_inspection')
    .eq('job_id', jobId)
    .is('completed_at', null)
    .order('started_at', { ascending: false })
    .limit(1);
  if (existingError) throw new Error(existingError.message);
  if (existing && existing.length > 0) return existing[0];

  const { data: created, error: createError } = await sb
    .from('inspections')
    .insert({ job_id: jobId, performed_by: staffId })
    .select('id, job_id, started_at, completed_at, mileage_at_inspection')
    .single();
  if (createError) throw new Error(createError.message);

  const { error: statusError } = await sb
    .from('jobs')
    .update({ status: 'inspection_in_progress' })
    .eq('id', jobId)
    .eq('status', 'awaiting_inspection');
  if (statusError) throw new Error(statusError.message);

  return created;
}

// Read-only lookup for pages (like the quote) that want to show inspection
// results without creating an inspection if none exists yet.
async function getLatestInspectionForJob(jobId) {
  const { data, error } = await sb
    .from('inspections')
    .select('id, completed_at')
    .eq('job_id', jobId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

function bodyZoneLabel(key) {
  return BODY_ZONES.find((z) => z.key === key)?.label || key;
}

async function listFindings(inspectionId) {
  const { data, error } = await sb
    .from('inspection_findings')
    .select('*')
    .eq('inspection_id', inspectionId)
    .order('created_at');
  if (error) throw new Error(error.message);
  return data;
}

async function upsertBodyFinding(inspectionId, existingFindingId, zoneKey, severity) {
  if (existingFindingId) {
    const { error } = await sb
      .from('inspection_findings')
      .update({ severity })
      .eq('id', existingFindingId);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await sb
    .from('inspection_findings')
    .insert({ inspection_id: inspectionId, finding_type: 'body_area', area: zoneKey, severity });
  if (error) throw new Error(error.message);
}

// Checklist items live in inspection_findings too: area = category (e.g.
// "Engine Bay"), item_label = the specific item (e.g. "Oil Level"),
// condition = the selected value, pass_status derived from its tier.
async function upsertChecklistFinding(inspectionId, existingFindingId, category, itemLabel, value, tier) {
  const payload = { condition: value, pass_status: TIER_TO_PASS_STATUS[tier] || null };
  if (existingFindingId) {
    const { error } = await sb.from('inspection_findings').update(payload).eq('id', existingFindingId);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await sb.from('inspection_findings').insert({
    inspection_id: inspectionId,
    finding_type: 'mechanical',
    area: category,
    item_label: itemLabel,
    ...payload
  });
  if (error) throw new Error(error.message);
}

// Bootstraps a brand-new inspection with every checklist item defaulted to
// its first (best-case) option, so the mechanic only has to touch the rows
// that are actually a problem. Only runs once -- guarded by the caller
// checking there are no mechanical findings yet at all, so a deliberate
// "Deselect all" on one category later doesn't get silently re-seeded on
// the next page load (some other category will still have findings).
async function seedDefaultChecklistFindings(inspectionId) {
  const rows = [];
  Object.entries(INSPECTION_CHECKLIST).forEach(([category, items]) => {
    items.forEach((item) => {
      const first = item.options[0];
      rows.push({
        inspection_id: inspectionId,
        finding_type: 'mechanical',
        area: category,
        item_label: item.label,
        condition: first.value,
        pass_status: TIER_TO_PASS_STATUS[first.tier] || null
      });
    });
  });
  const { error } = await sb.from('inspection_findings').insert(rows);
  if (error) throw new Error(error.message);
}

async function deselectChecklistCategory(inspectionId, category) {
  const { error } = await sb
    .from('inspection_findings')
    .delete()
    .eq('inspection_id', inspectionId)
    .eq('finding_type', 'mechanical')
    .eq('area', category);
  if (error) throw new Error(error.message);
}

async function addMechanicalFinding(finding) {
  const { error } = await sb
    .from('inspection_findings')
    .insert({ ...finding, finding_type: 'mechanical' });
  if (error) throw new Error(error.message);
}

async function deleteFinding(findingId) {
  const { error } = await sb.from('inspection_findings').delete().eq('id', findingId);
  if (error) throw new Error(error.message);
}

async function completeInspection(inspectionId, jobId) {
  const { error: inspectionError } = await sb
    .from('inspections')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', inspectionId);
  if (inspectionError) throw new Error(inspectionError.message);

  const { error: jobError } = await sb
    .from('jobs')
    .update({ status: 'quote_preparation' })
    .eq('id', jobId);
  if (jobError) throw new Error(jobError.message);
}

function severityColor(value) {
  return SEVERITIES.find((s) => s.value === value)?.color || null;
}

function severityLabel(value) {
  return SEVERITIES.find((s) => s.value === value)?.label || value;
}
