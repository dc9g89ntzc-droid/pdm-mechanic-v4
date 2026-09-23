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
const STYLE_REACH = { street: 0.45, offroad: 0.6, drag: 0.85, race: 1 };
// Off-Road and Drag always reach the top of their *tough* ladders (already
// capped appropriately) rather than the general reach value.
const TOUGH_STYLES = new Set(['offroad', 'drag']);

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
  race: { cheap: 'Sport Radiator', medium: 'Race Radiator', best: 'Race Radiator' }
  // Sustained circuit heat is a real reliability risk -- a race build
  // shouldn't run less than Sport radiator even at its cheap tier.
};
const SUSPENSION_BY_STYLE = {
  street: { cheap: 'Stock Suspension', medium: 'Sport Suspension', best: 'Sport Suspension' },
  offroad: { cheap: 'Stock Suspension', medium: 'Off-Road Suspension', best: 'Off-Road Suspension' },
  // Off-Road's own suspension is the correct tool here, not "upgrading
  // toward Race" -- Race suspension is stiff/track-tuned, wrong job.
  race: { cheap: 'Sport Suspension', medium: 'Race Suspension', best: 'Race Suspension' }
  // A genuine track build shouldn't run Stock suspension even as the
  // budget option -- drag intentionally has no suspension entry below
  // (straight-line racing rarely touches suspension at all).
};

// Forced induction is Drag/Race only. Each tier bundles a sized
// turbocharger + matching intercooler; Boost Controller and the
// style-specific "signature" extra (Nitrous for Drag, Anti-Lag for Race)
// only show up from medium/best, not cheap.
const FORCED_INDUCTION_BY_STYLE = {
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

function pickPistons(style, boosted) {
  // Dished pistons lower static compression to run safely under boost;
  // Flat Top is the safe neutral default for a naturally-aspirated build.
  const topStyle = boosted ? 'Dished' : 'Flat Top';
  const picked = pickFromLadder(PISTON_MATERIAL_LADDER, style);
  return {
    cheap: { itemName: `${topStyle} ${picked.cheap} Piston`, quantity: 1 },
    medium: { itemName: `${topStyle} ${picked.medium} Piston`, quantity: 1 },
    best: { itemName: `${topStyle} ${picked.best} Piston`, quantity: 1 }
  };
}

function pickRings(style) {
  return mapTiers(pickFromLadder(RING_PACK_LADDER, style), (name) => ({ itemName: name, quantity: 1 }));
}

function pickConrod(style) {
  const ladder = TOUGH_STYLES.has(style) ? CONROD_MATERIAL_LADDER_TOUGH : CONROD_MATERIAL_LADDER;
  return mapTiers(pickFromLadder(ladder, style), (material) => ({ itemName: `H-Beam ${material} Connecting Rod`, quantity: 1 }));
}

function pickCrankshaft(style) {
  return mapTiers(pickFromLadder(CRANKSHAFT_LADDER, style), (process) => ({ itemName: `${process} Crankshaft`, quantity: 1 }));
}

function pickBearings(style) {
  // Real bearing count depends on cylinder/main count -- this suggests one
  // of each type as a representative starting point, not an exact count.
  return mapTiers(pickFromLadder(BEARING_LADDER, style), (material) => ([
    { itemName: `${material} Conrod Bearing`, quantity: 1 },
    { itemName: `${material} Main Bearing`, quantity: 1 }
  ]));
}

function pickCylinderHead(style) {
  return mapTiers(pickFromLadder(CYLINDER_HEAD_MATERIAL_LADDER, style), (material) => ({ itemName: `Ported & Polished ${material} Cylinder Head`, quantity: 1 }));
}

function pickValveSprings(style) {
  // Beehive is the modern high-RPM standard (lighter, less spring mass
  // than Dual) across every active style here.
  return mapTiers(pickFromLadder(VALVE_SPRING_MATERIAL_LADDER, style), (material) => ({ itemName: `Beehive ${material} Valve Spring Set`, quantity: 1 }));
}

function pickSparkPlugs() {
  return mapTiers({ cheap: SPARK_PLUG_LADDER[0], medium: SPARK_PLUG_LADDER[1], best: SPARK_PLUG_LADDER[2] }, (name) => ({ itemName: name, quantity: 1 }));
}

function mapTiers(tiers, fn) {
  return { cheap: fn(tiers.cheap), medium: fn(tiers.medium), best: fn(tiers.best) };
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
// cheap tier is a legitimate budget pick, not a warning.
function cheapTierCaveat(style) {
  return (style === 'drag' || style === 'race')
    ? 'Budget parts under high stress -- real risk of failure under boost/load.'
    : null;
}

// The one function this file exposes. `configuration` must be one of
// ENGINE_CONFIGURATIONS' `value`s, `valvetrain` one of VALVETRAIN_OPTIONS,
// `style` one of STYLE_OPTIONS' `value`s. Returns
// { cheap: [{itemName, quantity}], medium: [...], best: [...] }.
function suggestPerformanceBuild({ style, valvetrain, configuration }) {
  const result = { cheap: [], medium: [], best: [] };

  // Comfort stays deliberately minimal -- reliability polish, not an
  // engine build. Everything else below is skipped on purpose.
  pushTiered(result, pickSparkPlugs());
  if (style === 'comfort') return result;

  ['cheap', 'medium', 'best'].forEach((tier) => {
    const vt = VALVETRAIN_TIERS[valvetrain][tier];
    result[tier].push({ itemName: vt.camshaft, quantity: 1 }, { itemName: vt.tappet, quantity: 1 });
  });

  pushTiered(result, pickBlock(style, configuration));
  const boosted = style === 'drag' || style === 'race';
  pushTiered(result, pickPistons(style, boosted));
  pushTiered(result, pickRings(style));
  pushTiered(result, pickConrod(style));
  pushTiered(result, pickCrankshaft(style));
  pushTiered(result, pickBearings(style));
  pushTiered(result, pickCylinderHead(style));
  pushTiered(result, pickValveSprings(style));

  if (RADIATOR_BY_STYLE[style]) {
    pushTiered(result, mapTiers(RADIATOR_BY_STYLE[style], (name) => ({ itemName: name, quantity: 1 })));
  }
  if (SUSPENSION_BY_STYLE[style]) {
    pushTiered(result, mapTiers(SUSPENSION_BY_STYLE[style], (name) => ({ itemName: name, quantity: 1 })));
  }
  if (FORCED_INDUCTION_BY_STYLE[style]) {
    pushTiered(result, FORCED_INDUCTION_BY_STYLE[style]);
  }

  return result;
}
