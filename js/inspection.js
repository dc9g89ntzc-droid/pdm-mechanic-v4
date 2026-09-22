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
  { key: 'right_taillight', label: 'Right Taillight', shape: 'path', d: 'M926 713 Q941 709 953 716 Q960 726 958 738 Q937 744 916 739 Q918 722 926 713Z' },

  // Wheels: user marked circles/rects over the same reference image at a
  // different crop (x aligned, y offset +1 vs. this file's viewBox once
  // the image's own y=315 SVG placement is also accounted for -- easy to
  // get wrong, as a first pass here did, by converting to the cropped
  // PNG's own pixel space and forgetting the SVG re-adds that offset).
  // Positions cross-checked against existing headlight/bumper/taillight
  // x-ranges in each view to confirm front/rear and left/right, then
  // verified by overlaying on the real viewBox="0 315 1080 620" SVG
  // structure (not just the flat PNG) before trusting the alignment.
  // Each wheel is a circle in its own side view plus a small mark in the
  // front/rear view, like bumpers/lights above.
  { key: 'left_front_wheel', label: 'Left Front Wheel', shape: 'path', d: 'M133 505 A48 48 0 1 0 229 505 A48 48 0 1 0 133 505Z' },
  { key: 'left_front_wheel', label: 'Left Front Wheel', shape: 'path', d: 'M708 522 L760 522 L760 557 L708 557Z' },
  { key: 'left_rear_wheel', label: 'Left Rear Wheel', shape: 'path', d: 'M494 505 A49 49 0 1 0 592 505 A49 49 0 1 0 494 505Z' },
  { key: 'left_rear_wheel', label: 'Left Rear Wheel', shape: 'path', d: 'M707 808 L759 808 L759 844 L707 844Z' },
  { key: 'right_front_wheel', label: 'Right Front Wheel', shape: 'path', d: 'M509 793 A48 48 0 1 0 605 793 A48 48 0 1 0 509 793Z' },
  { key: 'right_front_wheel', label: 'Right Front Wheel', shape: 'path', d: 'M921 524 L975 524 L975 559 L921 559Z' },
  { key: 'right_rear_wheel', label: 'Right Rear Wheel', shape: 'path', d: 'M147 792 A48 48 0 1 0 243 792 A48 48 0 1 0 147 792Z' },
  { key: 'right_rear_wheel', label: 'Right Rear Wheel', shape: 'path', d: 'M916 805 L972 805 L972 840 L916 840Z' }
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

// Links a checklist item to the real service (sql/030_services_seed.sql)
// whose service_materials cover fixing it, so a below-'ok' finding can
// suggest (advisory) or auto-add (fail) the right parts to the job's
// basket. Only items that actually have an advisory/fail option are worth
// mapping -- transmission/gears/drive/hardware are descriptive, not
// condition checks, so they're left out on purpose. 'alignment' is also
// left out: Wheel Alignment is labour-only with no service_materials rows,
// so there'd be nothing to suggest. 'timing_belt' points at "Timing Chain
// Replacement" -- the closest real service, even though the checklist
// label says belt and the service says chain.
const CHECKLIST_ITEM_SERVICE = {
  oil_level: 'Oil Change',
  oil_condition: 'Oil Change',
  brake_fluid: 'Brake Fluid Flush',
  coolant: 'Coolant Flush',
  accessory_belt: 'Accessory Belt Replacement',
  timing_belt: 'Timing Chain Replacement',
  water_pump: 'Water Pump Replacement',
  spark_plugs: 'Spark Plug Service',
  air_filter: 'Air Filter Replacement',
  oil_filter: 'Oil Change',
  fuel_filter: 'Fuel Filter Replacement',
  chassis: 'Chassis Rebuild',
  brake_pads_front: 'Brake Pads (install set)',
  brake_pads_rear: 'Brake Pads (install set)',
  rotors_front: 'Brake Rotors (install set)',
  rotors_rear: 'Brake Rotors (install set)',
  shocks: 'Shock Absorber Replacement',
  springs: 'Spring Replacement',
  brake_lines: 'Brake Line Replacement',
  sway_bars: 'Sway Bar Replacement',
  bushings: 'Bushing Replacement',
  torque_converter: 'Torque Converter Replacement',
  gear_train: 'Transmission Rebuild',
  center_differential: 'Center Differential Rebuild',
  front_differential: 'Front Differential Rebuild',
  rear_differential: 'Rear Differential Rebuild'
};

// Same idea for the vehicle diagram (BODY_ZONES) -- a tagged zone is
// always a defect (there's no "pristine" finding, only the absence of
// one), so every tagged zone is a candidate; severity decides suggest vs.
// auto-add the same way pass_status does for the checklist (see
// bodyZoneTierFromSeverity below). "Rear Window" is the existing service
// for the rear windshield specifically (sql/030 links it to the same
// 'Windshield' catalogue item as the front "Windshield" service) -- the
// two rear side windows get their own new services instead (sql/034),
// mirroring Front Left/Right Window rather than reusing the ambiguous
// "Rear Window" name for them. Two zones are still left deliberately
// unmapped, per this project's "flag, don't guess" convention -- neither
// has a real service or catalogue item to point at:
//   front_bumper / rear_bumper -- no bumper service/catalogue item exists.
//   left_front_wheel / left_rear_wheel / right_front_wheel /
//     right_rear_wheel -- diagram wheel damage isn't the same thing as a
//     tire-wear service.
const BODY_ZONE_SERVICE = {
  body_overall: 'Body Repair',
  front_left_door: 'Front Left Door',
  front_right_door: 'Front Right Door',
  rear_left_door: 'Rear Left Door',
  rear_right_door: 'Rear Right Door',
  hood: 'Hood',
  trunk: 'Trunk',
  left_front_window: 'Front Left Window',
  right_front_window: 'Front Right Window',
  left_rear_window: 'Rear Left Window',
  right_rear_window: 'Rear Right Window',
  front_windshield: 'Windshield',
  rear_windshield: 'Rear Window',
  left_headlight: 'Light Repair',
  right_headlight: 'Light Repair',
  left_taillight: 'Light Repair',
  right_taillight: 'Light Repair'
};

// minor/moderate -> suggest (one-click add); severe/replacement_required
// -> auto-add, matching the checklist's advisory/fail split.
function bodyZoneTierFromSeverity(severity) {
  return (severity === 'severe' || severity === 'replacement_required') ? 'fail' : 'advisory';
}

// Cached per service name for the life of the page -- the mapping above is
// static, so there's no reason to re-fetch a service's materials every
// time a second checklist item happens to point at the same service (e.g.
// oil_level and oil_filter both -> Oil Change).
const _serviceMaterialsCache = {};
async function getServiceMaterialsByName(serviceName) {
  if (Object.prototype.hasOwnProperty.call(_serviceMaterialsCache, serviceName)) return _serviceMaterialsCache[serviceName];
  const services = await listServices({ search: serviceName, activeOnly: true });
  const service = services.find((s) => s.name.toLowerCase() === serviceName.toLowerCase());
  console.log('[suggestedParts] lookup', JSON.stringify(serviceName), '-> services matched:', services.map((s) => s.name), '-> exact match:', service ? service.id : null);
  const materials = service ? await listServiceMaterials(service.id) : [];
  _serviceMaterialsCache[serviceName] = materials;
  return materials;
}

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

  // The status pill shows the repair leg's own progress (sql/031), not the
  // vestigial flat jobs.status -- this page is only ever reached while
  // that leg is awaiting/undergoing inspection.
  const { data: repairLeg, error: legError } = await sb
    .from('job_legs')
    .select('status')
    .eq('job_id', jobId)
    .eq('job_type', 'repair')
    .maybeSingle();
  if (legError) throw new Error(legError.message);
  data.legStatus = repairLeg ? repairLeg.status : data.status;
  return data;
}

// Reuses an existing open inspection for this job if one exists, otherwise
// creates one and (if the repair leg is still awaiting_inspection) advances
// that leg to inspection_in_progress.
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

  const { error: legError } = await sb
    .from('job_legs')
    .update({ status: 'inspection_in_progress' })
    .eq('job_id', jobId)
    .eq('job_type', 'repair')
    .eq('status', 'awaiting_inspection');
  if (legError) throw new Error(legError.message);

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

// Shared by the interactive diagram (inspection.html, with click-to-tag)
// and the read-only copy printed on the quote (no click handler passed).
const SVG_NS = 'http://www.w3.org/2000/svg';

// Quote-only: draws the same diagram onto a <canvas> instead of live SVG.
// html2canvas can't reliably rasterize an <image> nested inside an SVG
// with a non-zero viewBox origin (ours is "0 315 1080 620") -- it comes
// out mispositioned/garbled in the exported PNG even though the zone
// <path> overlays render fine, since those go through a different code
// path. A canvas has no such issue: html2canvas just copies its pixels
// directly. The quote diagram is read-only anyway (no click-to-tag), so
// there's no interactivity lost by not using real SVG here.
function renderBodyDiagramCanvas(canvas, findings) {
  return new Promise((resolve, reject) => {
    const ctx = canvas.getContext('2d');
    canvas.width = 1080;
    canvas.height = 620;

    const img = new Image();
    img.onload = () => {
      ctx.save();
      ctx.translate(0, -315); // matches the SVG viewBox's "0 315 1080 620" origin

      ctx.fillStyle = '#f2f2f2';
      ctx.fillRect(0, 315, 1080, 620);
      ctx.drawImage(img, 0, 315, 1080, 620);

      BODY_ZONES.forEach((zone) => {
        if (zone.shape === 'external') return;
        const finding = findings.find((f) => f.finding_type === 'body_area' && f.area === zone.key);
        if (!finding) return;
        const path = new Path2D(zone.d);
        const color = severityColor(finding.severity);
        ctx.globalAlpha = 0.65;
        ctx.fillStyle = color;
        ctx.fill(path);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke(path);
      });

      ctx.fillStyle = '#888';
      ctx.font = '20px Georgia, "Times New Roman", serif';
      ctx.textAlign = 'center';
      ctx.fillText('Left Side', 155, 345);
      ctx.fillText('Front', 840, 345);
      ctx.fillText('Right Side', 155, 590);
      ctx.fillText('Rear', 840, 590);

      ctx.restore();
      resolve();
    };
    img.onerror = reject;
    img.src = 'images/vehicle-diagram.png';
  });
}

function renderBodyZones(zonesGroupEl, findings, onZoneClick) {
  zonesGroupEl.innerHTML = '';
  BODY_ZONES.forEach((zone) => {
    if (zone.shape === 'external') return;
    const finding = findings.find((f) => f.finding_type === 'body_area' && f.area === zone.key);

    const el = document.createElementNS(SVG_NS, 'path');
    el.setAttribute('d', zone.d);
    el.setAttribute('class', finding ? 'zone tagged' : 'zone');
    if (finding) {
      // Inline style (not setAttribute) so this wins over the .zone CSS
      // class rule -- SVG presentation attributes rank below stylesheet
      // rules in the cascade and would otherwise be silently overridden.
      const color = severityColor(finding.severity);
      el.style.fill = color;
      el.style.fillOpacity = '0.65';
      el.style.stroke = color;
      el.style.strokeWidth = '1.5';
    }
    el.dataset.zone = zone.key;
    if (onZoneClick) el.addEventListener('click', () => onZoneClick(zone));
    zonesGroupEl.appendChild(el);
  });
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

  // Inspection only ever belongs to the repair leg (sql/031) -- customisation
  // and performance legs never go through this page.
  await updateLegStatus(jobId, 'repair', 'quote_preparation');
}

function severityColor(value) {
  return SEVERITIES.find((s) => s.value === value)?.color || null;
}

function severityLabel(value) {
  return SEVERITIES.find((s) => s.value === value)?.label || value;
}
