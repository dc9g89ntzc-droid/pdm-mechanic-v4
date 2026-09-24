// Style + engine -> three parts-tier suggestions for the Performance leg's
// job-items.html panel. Pure static data + one pure function, no Supabase
// calls -- same shape as CHECKLIST_ITEM_SERVICE/BODY_ZONE_SERVICE in
// js/inspection.js. Resolving the item names below to real catalogue_items
// rows (id/price/stock) happens in job-items.html, not here.
//
// Every name referenced here was verified against the real seeded
// catalogue_items.name from sql/033_catalogue_master_pricing.sql -- nothing
// here is invented. Where the catalogue's priciest option in a subcategory
// isn't actually the realistic "best" pick (Magnesium Alloy blocks,
// Titanium pistons/valve springs), that option is excluded from the ladder
// entirely rather than silently allowed to win by price.

const VALVETRAIN_OPTIONS = ['OHV', 'SOHC', 'DOHC'];

const STYLE_OPTIONS = [
  { value: 'comfort', label: 'Comfort' },
  { value: 'street', label: 'Street' },
  { value: 'offroad', label: 'Off-Road' },
  { value: 'drift', label: 'Drift' },
  { value: 'drag', label: 'Drag' },
  { value: 'race', label: 'Race' }
];

// Real block configurations from catalogue_items (Engine Blocks / Rotor
// Housings). "L4" is deliberately excluded -- it's an exact duplicate of
// "Inline 4" at identical prices in every material tier (a catalogue
// seeding duplicate, not a real distinct product), flagged to Joanna
// separately rather than silently worked around here.
const ENGINE_CONFIGURATIONS = [
  'Flat 2', 'Flat 4', 'Flat 6', 'Flat 8',
  'Inline 3', 'Inline 4', 'Inline 5', 'Inline 6', 'Inline 8',
  'Single Piston', 'V-Twin',
  'V4', 'V6', 'V8', 'V10', 'V12', 'V16',
  'W6', 'W8', 'W12', 'W16', 'W18'
].map((value) => ({ value, subcategory: 'Engine Blocks', suffix: 'Engine Block' }))
  .concat(['Single Rotor', 'Twin Rotor', 'Three Rotor', 'Four Rotor'].map((value) =>
    ({ value, subcategory: 'Rotor Housings', suffix: 'Rotor Housing' })));

// Real cylinder counts per configuration.
const CYLINDER_COUNT = {
  'Flat 2': 2, 'Flat 4': 4, 'Flat 6': 6, 'Flat 8': 8,
  'Inline 3': 3, 'Inline 4': 4, 'Inline 5': 5, 'Inline 6': 6, 'Inline 8': 8,
  'Single Piston': 1, 'V-Twin': 2,
  V4: 4, V6: 6, V8: 8, V10: 10, V12: 12, V16: 16,
  W6: 6, W8: 8, W12: 12, W16: 16, W18: 18
};
// A real Wankel rotor is a Reuleaux triangle -- exactly 3 apex seals per
// rotor, always. Confident enough to scale without asking.
const ROTOR_COUNT = { 'Single Rotor': 1, 'Twin Rotor': 2, 'Three Rotor': 3, 'Four Rotor': 4 };

// Bank count and per-cylinder valve/camshaft rules below were derived from
// five real in-game teardowns Joanna supplied (DOHC Inline-6, DOHC V12,
// OHV V-Twin, SOHC Flat-6, DOHC W16), not assumed -- each was
// cross-checked against at least one other example before being treated
// as confirmed. See commit history for the worked-out arithmetic.
//
// Bank count: every V/Flat/W configuration (and V-Twin) counts as 2 banks
// in-game, regardless of a W-block's real-world physical row count (a real
// W16 is arguably 4 rows -- this game treats it the same as a V16, 2
// banks with more cylinders each, confirmed via the W16 example: 4
// camshafts / 2-per-bank-for-DOHC = 2 banks, 2 cylinder heads, and a 9/9
// main bearing count that only matches (16 cylinders / 2 banks) + 1).
// Inline and Single Piston are the only 1-bank configurations.
function bankCount(configuration) {
  return (configuration.startsWith('Inline') || configuration === 'Single Piston') ? 1 : 2;
}

// Valves per cylinder, confirmed per valvetrain (OHV 4÷2=2, SOHC 18÷6=3,
// DOHC confirmed three times: 24÷6, 48÷12, 64÷16, all =4).
const VALVES_PER_CYLINDER = { OHV: 2, SOHC: 3, DOHC: 4 };

// Camshafts per bank -- OHV is a flat 1 for the *whole engine* regardless
// of bank count (one shared cam in the block driving every bank via
// pushrods, confirmed on the V-Twin: still just 1 camshaft slot despite 2
// banks). SOHC and DOHC scale per bank instead (confirmed: SOHC Flat-6 =
// 2 camshafts for 2 banks; DOHC Inline-6 = 2 for 1 bank, DOHC V12/W16 = 4
// for 2 banks).
function camshaftCount(valvetrain, banks) {
  return valvetrain === 'OHV' ? 1 : banks * (valvetrain === 'DOHC' ? 2 : 1);
}

// Main bearings = cylinders-per-bank + 1, not total-cylinders + 1 --
// confirmed on all five examples (Inline-6: 6+1=7; V12: 6+1=7, not 13;
// V-Twin: 1+1=2; Flat-6: 3+1=4; W16: 8+1=9). Matches real engine design:
// a V-block's crank throw count tracks cylinders-per-bank, not the total.
function mainBearingCount(cylinders, banks) {
  return Math.round(cylinders / banks) + 1;
}

// ---- Quality ladders (cheap -> best), curated by hand from real
// engine-building logic, not raw price sort. ----

// General ladders, used by street/offroad/drag/race via STYLE_REACH.
const PISTON_MATERIAL_LADDER = ['Cast Iron', 'Cast Steel', 'Cast Aluminum', 'Powder Metal', 'Forged Steel', 'Forged Aluminum', 'Billet Steel', 'Billet Aluminum'];
// Titanium excluded -- titanium's real race use is rods/valve gear, not
// pistons (wrong thermal-expansion behaviour for the application).
const CONROD_MATERIAL_LADDER = ['Cast Iron', 'Cast Steel', 'Cast Aluminum', 'Powder Metal', 'Forged Steel', 'Forged Aluminum', 'Billet Steel', 'Billet Aluminum', 'Titanium'];
// Titanium IS included here (unlike pistons) -- real top-tier race rods
// genuinely are titanium; only Race's reach (1.0) actually reaches it.
const CYLINDER_HEAD_MATERIAL_LADDER = ['Cast Iron', 'Cast Steel', 'Cast Aluminum', 'Forged Steel', 'Forged Aluminum'];
const VALVE_SPRING_MATERIAL_LADDER = ['Cast Steel', 'Forged Steel', 'Billet Steel'];
// Titanium excluded -- a spring's realistic limit is fatigue life, not raw
// strength, so steel alloys are the real choice regardless of price.
const BEARING_LADDER = ['Tri-Metal', 'Aluminum-Tin', 'Bi-Metal Race'];
const RING_PACK_LADDER = ['Cast Iron (Standard) Ring Pack', 'Steel Performance Ring Pack', 'Moly-Coated Race Ring Pack'];
const CRANKSHAFT_LADDER = ['Cast', 'Forged', 'Billet'];
const SPARK_PLUG_LADDER = ['Copper Standard Spark Plug', 'Platinum Spark Plug', 'Iridium Spark Plug'];

// Block and connecting-rod ladders that top out at Billet Steel instead of
// Billet Aluminum/Titanium -- used by Off-Road (durability over weight,
// real off-road builds favour toughness over shaving grams) and Drag
// (sudden shock loading from a hard launch/nitrous spike is better
// resisted by steel than aluminum -- unlike pistons, where aluminum wins
// on thermal/weight grounds regardless of use case, so pistons stay on the
// general ladder for every style).
const BLOCK_MATERIAL_LADDER = ['Cast Iron', 'Cast Aluminum', 'Compacted Graphite Iron', 'Billet Steel', 'Billet Aluminum'];
// Magnesium Alloy excluded -- real magnesium isn't used structurally for a
// combustion-pressure engine block, despite being the priciest option.
const BLOCK_MATERIAL_LADDER_TOUGH = ['Cast Iron', 'Compacted Graphite Iron', 'Billet Steel'];
const CONROD_MATERIAL_LADDER_TOUGH = ['Cast Steel', 'Forged Steel', 'Billet Steel'];

// How far up a *general* ladder each active style reaches at its own
// "best" tier (0 = stays at the cheapest rung, 1 = all the way to the top
// of the realistic ladder). "medium" always lands halfway to that style's
// own best; "cheap" is always the cheapest realistic rung, never literally
// nothing -- matches Joanna's own "cheap/unreliable" framing (a real, if
// bad, part). Comfort doesn't use this at all -- it never touches these
// subcategories.
const STYLE_REACH = { street: 0.45, offroad: 0.6, drift: 0.85, drag: 0.85, race: 1 };
// Off-Road, Drift, and Drag always reach the top of their *tough* ladders
// (already capped appropriately) rather than the general reach value --
// drift joins Off-Road/Drag here because sustained sideways loading and
// repeated clutch kicks are the same "durability over ultimate weight
// savings" case as a hard launch or rough terrain.
const TOUGH_STYLES = new Set(['offroad', 'drift', 'drag']);

function pickFromLadder(ladder, style) {
  const reach = TOUGH_STYLES.has(style) ? 1 : STYLE_REACH[style];
  const bestIdx = Math.round(reach * (ladder.length - 1));
  const mediumIdx = Math.round(bestIdx * 0.5);
  return { cheap: ladder[0], medium: ladder[mediumIdx], best: ladder[bestIdx] };
}

// Camshaft + tappet are capped by valvetrain, not by style -- a pushrod
// (OHV) engine physically can't safely follow a more aggressive lobe
// profile at speed, no matter the customer's budget. DOHC is the only
// valvetrain that reaches a genuine Race Camshaft/Solid Roller Tappet Set.
const VALVETRAIN_TIERS = {
  OHV: {
    cheap: { camshaft: 'Stock/Mild Camshaft', tappet: 'Hydraulic Flat Tappet Set' },
    medium: { camshaft: 'Torque/Tow Camshaft', tappet: 'Hydraulic Roller Tappet Set' },
    best: { camshaft: 'Street Perf Camshaft', tappet: 'Hydraulic Roller Tappet Set' }
  },
  SOHC: {
    cheap: { camshaft: 'Torque/Tow Camshaft', tappet: 'Hydraulic Roller Tappet Set' },
    medium: { camshaft: 'Street Perf Camshaft', tappet: 'Hydraulic Roller Tappet Set' },
    best: { camshaft: 'Performance Camshaft', tappet: 'Solid Flat Tappet Set' }
  },
  DOHC: {
    cheap: { camshaft: 'Street Perf Camshaft', tappet: 'Hydraulic Roller Tappet Set' },
    medium: { camshaft: 'Performance Camshaft', tappet: 'Solid Flat Tappet Set' },
    best: { camshaft: 'Race Camshaft', tappet: 'Solid Roller Tappet Set' }
  }
};

// Radiator/suspension are named by real tier already (Street/Sport/Race,
// Stock/Off-Road/Sport/Race) but don't cleanly form one shared ladder --
// hand-picked per style instead of via STYLE_REACH.
const RADIATOR_BY_STYLE = {
  street: { cheap: 'Street Radiator', medium: 'Sport Radiator', best: 'Sport Radiator' },
  offroad: { cheap: 'Street Radiator', medium: 'Sport Radiator', best: 'Sport Radiator' },
  drag: { cheap: 'Street Radiator', medium: 'Street Radiator', best: 'Sport Radiator' },
  // A drag pass is a short burst, not sustained load -- cooling matters far
  // less here than for a circuit car, so even "best" doesn't need Race.
  drift: { cheap: 'Street Radiator', medium: 'Sport Radiator', best: 'Race Radiator' },
  // Drift is the opposite of drag here -- long sustained runs at high RPM
  // under load build real heat, closer to circuit racing than a single pass.
  race: { cheap: 'Sport Radiator', medium: 'Race Radiator', best: 'Race Radiator' }
  // Sustained circuit heat is a real reliability risk -- a race build
  // shouldn't run less than Sport radiator even at its cheap tier.
};
const SUSPENSION_BY_STYLE = {
  street: { cheap: 'Stock Suspension', medium: 'Sport Suspension', best: 'Sport Suspension' },
  offroad: { cheap: 'Stock Suspension', medium: 'Off-Road Suspension', best: 'Off-Road Suspension' },
  // Off-Road's own suspension is the correct tool here, not "upgrading
  // toward Race" -- Race suspension is stiff/track-tuned, wrong job.
  drift: { cheap: 'Stock Suspension', medium: 'Sport Suspension', best: 'Race Suspension' },
  // Suspension geometry (angle, response) is arguably THE core drift mod in
  // reality -- no dedicated "Drift Suspension" item exists in the catalogue,
  // so Race is the closest real analogue (stiff, precise, adjustable).
  race: { cheap: 'Sport Suspension', medium: 'Race Suspension', best: 'Race Suspension' }
  // A genuine track build shouldn't run Stock suspension even as the
  // budget option -- drag intentionally has no suspension entry below
  // (straight-line racing rarely touches suspension at all).
};

// Not engine-internal, but a real performance upgrade category same as
// suspension -- per Joanna's own note that this shouldn't stay
// engine-only. Quantity is 4 (a full set) for every tier.
const TIRE_BY_STYLE = {
  comfort: { cheap: 'Stock Tire', medium: 'Street Tire', best: 'Street Tire' },
  street: { cheap: 'Stock Tire', medium: 'Street Tire', best: 'Sport Tire' },
  offroad: { cheap: 'Stock Tire', medium: 'Off-Road Tire', best: 'Off-Road Tire' },
  drift: { cheap: 'Street Tire', medium: 'Drift Tire', best: 'Drift Tire' },
  drag: { cheap: 'Street Tire', medium: 'Drag Tire', best: 'Drag Tire' },
  // Slick Tires are priced *below* Track Tire in the catalogue, which
  // doesn't match real motorsport (slicks are normally the specialist/
  // priciest choice) -- kept as Race's "best" anyway since slicks are
  // genuinely the ultimate-grip real-world pick, price aside. Worth a
  // second look if that catalogue price turns out to be a typo.
  race: { cheap: 'Sport Tire', medium: 'Track Tire', best: 'Slick Tires' }
};
const BRAKE_PADS_BY_STYLE = {
  street: { cheap: 'Stock Brake Pads', medium: 'Street Brake Pads', best: 'Sport Brake Pads' },
  offroad: { cheap: 'Stock Brake Pads', medium: 'Street Brake Pads', best: 'Street Brake Pads' },
  // Threshold/trail braking to initiate a slide matters, but pure bite
  // isn't the point the way it is for a circuit car -- Sport caps it.
  drift: { cheap: 'Stock Brake Pads', medium: 'Street Brake Pads', best: 'Sport Brake Pads' },
  drag: { cheap: 'Stock Brake Pads', medium: 'Street Brake Pads', best: 'Sport Brake Pads' },
  race: { cheap: 'Street Brake Pads', medium: 'Sport Brake Pads', best: 'Race Brake Pads' }
  // A genuine track build needs real stopping power even at its cheap
  // tier -- Stock brakes aren't a safe "budget" option for Race.
};

// Forced induction is Drift/Drag/Race only. Each tier bundles a sized
// turbocharger + matching intercooler; Boost Controller and the
// style-specific "signature" extra (Nitrous for Drag, Anti-Lag for
// Drift/Race) only show up from medium/best, not cheap.
const FORCED_INDUCTION_BY_STYLE = {
  drift: {
    cheap: [{ itemName: 'Turbocharger — Small Compressor / Medium Turbine', quantity: 1 }, { itemName: 'Stock Intercooler', quantity: 1 }],
    medium: [{ itemName: 'Turbocharger — Medium Compressor / Medium Turbine', quantity: 1 }, { itemName: 'Street Intercooler', quantity: 1 }, { itemName: 'Boost Controller', quantity: 1 }],
    best: [{ itemName: 'Turbocharger — Medium Compressor / Large Turbine', quantity: 1 }, { itemName: 'Race Intercooler', quantity: 1 }, { itemName: 'Boost Controller', quantity: 1 }, { itemName: 'Anti-Lag System Kit', quantity: 1 }]
    // A bigger turbine than compressor here on purpose -- drift needs
    // predictable, controllable power delivery through a slide, not just
    // outright peak, so it's biased toward flow/response over the
    // straight-line-max Large/Large combo Drag and Race reach for. Real
    // drift cars (2JZ/RB26/SR20 swaps) also lean heavily on anti-lag to
    // keep boost up between the constant throttle blips of a transition --
    // arguably even more central to drift than to circuit racing.
  },
  drag: {
    cheap: [{ itemName: 'Turbocharger — Small Compressor / Small Turbine', quantity: 1 }, { itemName: 'Stock Intercooler', quantity: 1 }],
    medium: [{ itemName: 'Turbocharger — Medium Compressor / Medium Turbine', quantity: 1 }, { itemName: 'Street Intercooler', quantity: 1 }, { itemName: 'Boost Controller', quantity: 1 }],
    best: [{ itemName: 'Turbocharger — Large Compressor / Large Turbine', quantity: 1 }, { itemName: 'Race Intercooler', quantity: 1 }, { itemName: 'Boost Controller', quantity: 1 }, { itemName: 'Nitrous Kit — 100 Shot', quantity: 1 }]
  },
  race: {
    cheap: [{ itemName: 'Turbocharger — Small Compressor / Medium Turbine', quantity: 1 }, { itemName: 'Stock Intercooler', quantity: 1 }],
    medium: [{ itemName: 'Turbocharger — Medium Compressor / Large Turbine', quantity: 1 }, { itemName: 'Street Intercooler', quantity: 1 }, { itemName: 'Boost Controller', quantity: 1 }],
    best: [{ itemName: 'Turbocharger — Large Compressor / Large Turbine', quantity: 1 }, { itemName: 'Race Intercooler', quantity: 1 }, { itemName: 'Boost Controller', quantity: 1 }, { itemName: 'Anti-Lag System Kit', quantity: 1 }]
    // Anti-Lag is a genuine rally/circuit-race part (keeps the turbo
    // spooled between shifts) -- authentic here in a way it wouldn't be
    // for a straight-line drag pass.
  }
};

// Transmission -- unlike Suspension/Radiator/Tires, none of these are
// named by generic tier (Stock/Sport/Race); they're real, distinct
// gearboxes (brand + speed count + auto/manual), so each style picks the
// specific box that actually suits its character rather than climbing one
// shared ladder. This is included for every style, including Comfort --
// transmission feel is as much a comfort factor as anything else here.
const TRANSMISSION_BY_STYLE = {
  // A smooth modern auto is the real "comfort" pick; Comfort skips the
  // add-on upgrade parts below like it skips everything else aggressive.
  comfort: { cheap: 'Declasse TH400 Transmission (3-speed auto)', medium: 'Benefactor 722.6 / NAG1 Transmission (5-speed auto)', best: 'Benefactor 7G-Drive Transmission (7-speed auto)' },
  // A manual for driver engagement, climbing toward the most refined
  // manual in the catalogue.
  street: { cheap: 'Bullworth T-5 Transmission (5-speed manual)', medium: 'Tarmac TR-6060 Transmission (6-speed manual)', best: 'Pfister 7MT Transmission (7-speed manual)' },
  // Declasse 4L80-E is a real heavy-duty tow/off-road automatic; Zancudo's
  // brand styling (rugged/utility) fits an 8-speed HD auto as the top end.
  offroad: { cheap: 'Declasse TH400 Transmission (3-speed auto)', medium: 'Declasse 4L80-E Transmission (4-speed auto)', best: 'Zancudo 8HP Transmission (8-speed auto)' },
  // Manual, and deliberately NOT climbing past 6-speed -- drift favours a
  // close, predictable ratio set for quick mid-slide shifts over more
  // gears; "best" instead comes from the shift-speed upgrades below.
  drift: { cheap: 'Bullworth T-5 Transmission (5-speed manual)', medium: 'Tarmac TR-6060 Transmission (6-speed manual)', best: 'Tarmac TR-6060 Transmission (6-speed manual)' },
  // Declasse Powerslide is a real Powerglide-style 2-speed drag auto --
  // about as authentic a signature pick as Drift Tire was for Drift.
  drag: { cheap: 'Declasse TH400 Transmission (3-speed auto)', medium: 'Declasse Powerslide Transmission (2-speed auto)', best: 'Declasse Powerslide Transmission (2-speed auto)' },
  // The Race Sequential transmissions are a literal, unambiguous match.
  // Cheap stays a normal manual rather than jumping straight to a
  // several-thousand-dollar sequential box, matching the "cheap tier is
  // still real, just not exotic" framing used everywhere else.
  race: { cheap: 'Tarmac TR-6060 Transmission (6-speed manual)', medium: 'Race 8-Speed Sequential Transmission (manual)', best: 'Race 10-Speed Sequential Transmission (manual)' }
};

// Bolt-on transmission upgrades, matched to whether that style's base box
// is manual or automatic -- Upgraded Synchronizers only make sense on a
// synchromesh manual (Street/Drift), Upgraded Clutch Packs and Built Valve
// Body are automatic-transmission upgrades (Off-Road/Drag). Race is
// deliberately left off Synchronizers: a real sequential gearbox uses dog
// engagement, not synchros, so that part wouldn't belong there even at
// Race's cheap (still-synchromesh) tier -- Pneumatic Shifter at Race's
// best instead, a genuinely authentic pairing with a full sequential box.
const TRANSMISSION_UPGRADES_BY_STYLE = {
  street: { medium: ['Upgraded Synchronizers'], best: ['Upgraded Synchronizers'] },
  offroad: { medium: ['Upgraded Clutch Packs'], best: ['Upgraded Clutch Packs'] },
  drift: { medium: ['Upgraded Synchronizers'], best: ['Upgraded Synchronizers', 'Pneumatic Shifter'] },
  drag: { medium: ['Upgraded Clutch Packs'], best: ['Upgraded Clutch Packs', 'Built Valve Body'] },
  race: { best: ['Pneumatic Shifter'] }
};

// Drivetrain conversion -- only suggested where the real-world signal is
// strong enough to act on. Always suggests the ideal drivetrain for the
// style regardless of what the vehicle already has (no "current
// drivetrain" input exists yet), so this can suggest a conversion kit for
// a car that's already the right layout -- a deliberate simplicity
// tradeoff, not an oversight. Comfort and Street are left out entirely: a
// drivetrain swap is a major, invasive job neither of those styles calls
// for. Same single kit at every tier -- there's no material/quality
// grading on a conversion kit the way there is on, say, a block.
const DRIVETRAIN_BY_STYLE = {
  // 4WD over AWD -- genuine off-road capability, not just an all-weather
  // on-road compromise.
  offroad: { cheap: '4WD Conversion Kit', medium: '4WD Conversion Kit', best: '4WD Conversion Kit' },
  // About as close to mandatory as this gets -- RWD is close to the
  // definition of drift.
  drift: { cheap: 'RWD Conversion Kit', medium: 'RWD Conversion Kit', best: 'RWD Conversion Kit' },
  // Drag and Race genuinely vary by class/car in reality (AWD launch cars
  // are legitimate for both) -- RWD is the more traditional default, not a
  // hard rule.
  drag: { cheap: 'RWD Conversion Kit', medium: 'RWD Conversion Kit', best: 'RWD Conversion Kit' },
  race: { cheap: 'RWD Conversion Kit', medium: 'RWD Conversion Kit', best: 'RWD Conversion Kit' }
};

function blockName(material, configuration) {
  const cfg = ENGINE_CONFIGURATIONS.find((c) => c.value === configuration);
  const suffix = cfg ? cfg.suffix : 'Engine Block';
  return `${material} ${configuration} ${suffix}`;
}

// A few configurations don't have full material coverage in the catalogue
// (verified directly against sql/033's seeded catalogue_items, not
// assumed) -- override with only what actually exists there rather than
// suggest a block that isn't real. Inline 3 only exists in Cast Iron/Billet
// Steel/Magnesium Alloy; V12/W12 exist in every general-ladder material
// except Billet Steel (they jump straight to Billet Aluminum), which only
// matters for the *tough* ladder since Off-Road/Drag's reach always lands
// exactly on Billet Steel.
const BLOCK_LADDER_OVERRIDES = {
  'Inline 3': { general: ['Cast Iron', 'Billet Steel'], tough: ['Cast Iron', 'Billet Steel'] },
  V12: { tough: ['Cast Iron', 'Compacted Graphite Iron'] },
  W12: { tough: ['Cast Iron', 'Compacted Graphite Iron'] }
};

function pickBlock(style, configuration) {
  const tough = TOUGH_STYLES.has(style);
  const overrides = BLOCK_LADDER_OVERRIDES[configuration];
  const ladder = (overrides && overrides[tough ? 'tough' : 'general'])
    || (tough ? BLOCK_MATERIAL_LADDER_TOUGH : BLOCK_MATERIAL_LADDER);
  const picked = pickFromLadder(ladder, style);
  return {
    cheap: { itemName: blockName(picked.cheap, configuration), quantity: 1 },
    medium: { itemName: blockName(picked.medium, configuration), quantity: 1 },
    best: { itemName: blockName(picked.best, configuration), quantity: 1 }
  };
}

function pickPistons(style, boosted, cylinders) {
  // Dished pistons lower static compression to run safely under boost;
  // Flat Top is the safe neutral default for a naturally-aspirated build.
  const topStyle = boosted ? 'Dished' : 'Flat Top';
  const picked = pickFromLadder(PISTON_MATERIAL_LADDER, style);
  return {
    cheap: { itemName: `${topStyle} ${picked.cheap} Piston`, quantity: cylinders },
    medium: { itemName: `${topStyle} ${picked.medium} Piston`, quantity: cylinders },
    best: { itemName: `${topStyle} ${picked.best} Piston`, quantity: cylinders }
  };
}

function pickRings(style, cylinders) {
  // One ring pack fits one piston.
  return mapTiers(pickFromLadder(RING_PACK_LADDER, style), (name) => ({ itemName: name, quantity: cylinders }));
}

function pickConrod(style, cylinders) {
  const ladder = TOUGH_STYLES.has(style) ? CONROD_MATERIAL_LADDER_TOUGH : CONROD_MATERIAL_LADDER;
  return mapTiers(pickFromLadder(ladder, style), (material) => ({ itemName: `H-Beam ${material} Connecting Rod`, quantity: cylinders }));
}

function pickCrankshaft(style) {
  return mapTiers(pickFromLadder(CRANKSHAFT_LADDER, style), (process) => ({ itemName: `${process} Crankshaft`, quantity: 1 }));
}

function pickBearings(style, cylinders, banks) {
  // One conrod bearing per rod journal; main bearings = cylinders-per-bank
  // + 1 (see mainBearingCount).
  return mapTiers(pickFromLadder(BEARING_LADDER, style), (material) => ([
    { itemName: `${material} Conrod Bearing`, quantity: cylinders },
    { itemName: `${material} Main Bearing`, quantity: mainBearingCount(cylinders, banks) }
  ]));
}

function pickCylinderHead(style, banks) {
  // One head per bank -- confirmed across every example regardless of
  // valvetrain (an OHV V-Twin gets 2 heads same as a DOHC V12).
  return mapTiers(pickFromLadder(CYLINDER_HEAD_MATERIAL_LADDER, style), (material) => ({ itemName: `Ported & Polished ${material} Cylinder Head`, quantity: banks }));
}

function pickValveSprings(style, totalValves) {
  // One set per valve, not per cylinder -- confirmed: total valve springs
  // always equals cylinders x valves-per-cylinder, same count as tappets.
  // Beehive is the modern high-RPM standard (lighter, less spring mass
  // than Dual) across every active style here.
  return mapTiers(pickFromLadder(VALVE_SPRING_MATERIAL_LADDER, style), (material) => ({ itemName: `Beehive ${material} Valve Spring Set`, quantity: totalValves }));
}

function pickSparkPlugs(cylinders) {
  // One plug per cylinder is about as universal a rule as engine building
  // has -- confident to scale without asking.
  return mapTiers({ cheap: SPARK_PLUG_LADDER[0], medium: SPARK_PLUG_LADDER[1], best: SPARK_PLUG_LADDER[2] }, (name) => ({ itemName: name, quantity: cylinders }));
}

function pickTransmission(style) {
  const upgrades = TRANSMISSION_UPGRADES_BY_STYLE[style] || {};
  return mapTiers(TRANSMISSION_BY_STYLE[style], (name, tier) => {
    const items = [{ itemName: name, quantity: 1 }];
    (upgrades[tier] || []).forEach((upgradeName) => items.push({ itemName: upgradeName, quantity: 1 }));
    return items;
  });
}

function mapTiers(tiers, fn) {
  return { cheap: fn(tiers.cheap, 'cheap'), medium: fn(tiers.medium, 'medium'), best: fn(tiers.best, 'best') };
}

function pushTiered(target, tiered) {
  ['cheap', 'medium', 'best'].forEach((tier) => {
    const entry = tiered[tier];
    if (Array.isArray(entry)) target[tier].push(...entry);
    else target[tier].push(entry);
  });
}

// Matches Joanna's own "cheap/unreliable" framing -- the aggressive styles
// are exactly where a bottom-tier part under real load is a genuine risk,
// not just a smaller number. Street/Off-Road/Comfort don't get this: their
// cheap tier is a legitimate budget pick, not a warning. Drift joins
// Drag/Race here -- sustained sideways loading and clutch kicks stress
// budget parts just as much as a hard launch does.
function cheapTierCaveat(style) {
  return (style === 'drift' || style === 'drag' || style === 'race')
    ? 'Budget parts under high stress -- real risk of failure under boost/load.'
    : null;
}

// The one function this file exposes. `configuration` must be one of
// ENGINE_CONFIGURATIONS' `value`s, `valvetrain` one of VALVETRAIN_OPTIONS,
// `style` one of STYLE_OPTIONS' `value`s. Returns
// { cheap: [{itemName, quantity}], medium: [...], best: [...] }.
function suggestPerformanceBuild({ style, valvetrain, configuration }) {
  const result = { cheap: [], medium: [], best: [] };
  const isRotary = configuration in ROTOR_COUNT;
  const cylinders = CYLINDER_COUNT[configuration] || 1;
  // Real Wankels run twin plugs per rotor (leading + trailing) -- confident
  // enough to use without asking, same as the one-per-cylinder rule above.
  const sparkPlugQty = isRotary ? ROTOR_COUNT[configuration] * 2 : cylinders;

  pushTiered(result, pickSparkPlugs(sparkPlugQty));
  if (TRANSMISSION_BY_STYLE[style]) pushTiered(result, pickTransmission(style));

  // Comfort stays deliberately minimal -- reliability + ride polish, not
  // an engine build. Tires and transmission are the two non-engine items
  // it still touches (both genuine comfort factors); everything else
  // below is skipped.
  if (style === 'comfort') {
    if (TIRE_BY_STYLE[style]) pushTiered(result, mapTiers(TIRE_BY_STYLE[style], (name) => ({ itemName: name, quantity: 4 })));
    return result;
  }

  pushTiered(result, pickBlock(style, configuration));

  if (isRotary) {
    const rotorCount = ROTOR_COUNT[configuration];
    pushTiered(result, mapTiers({ cheap: 'Apex Seals', medium: 'Apex Seals', best: 'Apex Seals' }, (name) => ({ itemName: name, quantity: rotorCount * 3 })));
    // No camshaft/tappet/pistons/rings/conrod/crankshaft/cylinder head/
    // valve springs/head gasket/timing kit here -- a Wankel doesn't have
    // any of these, and this catalogue has no rotary equivalent for the
    // eccentric shaft (its "crankshaft"), so that's left out rather than
    // guessed at.
  } else {
    const banks = bankCount(configuration);
    const totalValves = cylinders * VALVES_PER_CYLINDER[valvetrain];
    const camCount = camshaftCount(valvetrain, banks);

    ['cheap', 'medium', 'best'].forEach((tier) => {
      const vt = VALVETRAIN_TIERS[valvetrain][tier];
      result[tier].push({ itemName: vt.camshaft, quantity: camCount }, { itemName: vt.tappet, quantity: totalValves });
    });
    const boosted = style === 'drift' || style === 'drag' || style === 'race';
    pushTiered(result, pickPistons(style, boosted, cylinders));
    pushTiered(result, pickRings(style, cylinders));
    pushTiered(result, pickConrod(style, cylinders));
    pushTiered(result, pickCrankshaft(style));
    pushTiered(result, pickBearings(style, cylinders, banks));
    pushTiered(result, pickCylinderHead(style, banks));
    pushTiered(result, pickValveSprings(style, totalValves));
    // Head Gasket and Timing Kit are both flat 1 regardless of bank/head
    // count -- confirmed on every example including multi-head ones.
    // Timing system (Chain/Belt/Gears) doesn't appear to follow from
    // style/valvetrain/configuration at all (two DOHC examples and one
    // OHV example all used Chain, but the one SOHC example used Gears) --
    // defaulting to Timing Chain Kit as the safest general-purpose pick
    // pending Joanna's call on whether to add it as its own input.
    result.cheap.push({ itemName: 'Head Gasket Set', quantity: 1 }, { itemName: 'Timing Chain Kit', quantity: 1 });
    result.medium.push({ itemName: 'Head Gasket Set', quantity: 1 }, { itemName: 'Timing Chain Kit', quantity: 1 });
    result.best.push({ itemName: 'Head Gasket Set', quantity: 1 }, { itemName: 'Timing Chain Kit', quantity: 1 });
  }

  if (RADIATOR_BY_STYLE[style]) {
    pushTiered(result, mapTiers(RADIATOR_BY_STYLE[style], (name) => ({ itemName: name, quantity: 1 })));
  }
  if (SUSPENSION_BY_STYLE[style]) {
    pushTiered(result, mapTiers(SUSPENSION_BY_STYLE[style], (name) => ({ itemName: name, quantity: 1 })));
  }
  if (TIRE_BY_STYLE[style]) {
    pushTiered(result, mapTiers(TIRE_BY_STYLE[style], (name) => ({ itemName: name, quantity: 4 })));
  }
  if (BRAKE_PADS_BY_STYLE[style]) {
    pushTiered(result, mapTiers(BRAKE_PADS_BY_STYLE[style], (name) => ({ itemName: name, quantity: 4 })));
  }
  if (FORCED_INDUCTION_BY_STYLE[style]) {
    pushTiered(result, FORCED_INDUCTION_BY_STYLE[style]);
  }
  if (DRIVETRAIN_BY_STYLE[style]) {
    pushTiered(result, mapTiers(DRIVETRAIN_BY_STYLE[style], (name) => ({ itemName: name, quantity: 1 })));
  }

  return result;
}
