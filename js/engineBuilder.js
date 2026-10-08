// Engine Building leg's builder (job-items.html, type=engine_building):
// engine type + cylinder layout + style -> every engine part with its
// quantity and a sensible default part, which the mechanic can swap via a
// dropdown per part. Engine internals only (Joanna's call) -- turbos,
// tyres, suspension etc. stay on the Performance leg.
//
// Builds on js/performanceBuild.js (load it first): its teardown-derived
// rules (bankCount, camshaftCount, mainBearingCount, VALVES_PER_CYLINDER,
// CYLINDER_COUNT, ROTOR_COUNT), its curated material ladders and
// VALVETRAIN_TIERS. Pure data + pure functions here; resolving names to
// real catalogue rows happens in the page.

// Styles: the six from the Performance panel plus Economy, Performance,
// Durability, Rally and Heavy Machinery. Each style names its own pick for
// every part (reassessed 2026-10-08 -- a single "how far up the ladder"
// setting gave unrealistic results, e.g. aluminium rods on a Performance
// build or steel heads on Comfort). Where a style lists several options,
// the first one the catalogue actually has for that engine is used (not
// every layout comes in every material).
//
// Real-world reasoning behind the picks:
//   block    cast iron = cheap/tough; cast aluminium = light road engine;
//            CGI (compacted graphite iron) = heavy-duty/diesel strength;
//            billet aluminium = drag/race. Billet steel is never a default
//            (too heavy -- billet blocks are an aluminium race item).
//   crank    cast (OEM) < forged (best fatigue life, heavy duty) < billet (race)
//   rods     powder metal / forged steel I-beam = road; H-beam steel =
//            performance & boost; aluminium = drag only (absorbs shock,
//            short life); titanium = race
//   pistons  cast aluminium = road; forged aluminium = performance/boost;
//            billet aluminium = extreme; forged STEEL = heavy-duty diesel
//            practice. Domed = high-compression NA, Dished = boost-safe.
//   rings    standard < steel performance < moly-coated race (boost/heat)
//   bearings aluminium-tin = OEM economy; tri-metal = heavy-duty load
//            bearing; bi-metal race = performance/race
//   heads    iron = heavy duty; aluminium otherwise (steel heads aren't a
//            real thing); ported & polished for performance styles
//   cams     mild for economy/comfort/durability, torque/tow for low-end
//            work (off-road, heavy machinery), broad Performance cam for
//            rally, Race only for drift/drag/race -- always capped by what
//            the valvetrain can run (VALVETRAIN_TIERS: OHV tops out at
//            Street Perf, SOHC at Performance)
//   tappets  hydraulic roller = self-adjusting, quiet, low maintenance;
//            hydraulic flat = cheapest; solid roller only with a race cam
//   springs  type follows the tappet (valveSpringTypeForTappet); steel only
//   timing   belt = cheap/quiet; chain = general; gears = never stretch
//            (durability, heavy machinery, drag/race)
//   plugs    copper = cheapest; platinum = OEM long life; iridium = longest
//            life and best spark
const ENGINE_STYLE_PROFILES = {
  economy: { label: 'Economy', hint: 'Cheapest sensible parts for a reliable daily engine: cast iron, cast aluminium pistons, mild cam.',
    block: ['Cast Iron', 'Cast Aluminum'], crank: 'Cast', rod: ['I-Beam Powder Metal', 'I-Beam Cast Steel'],
    piston: ['Flat Top Cast Aluminum'], rings: 'Cast Iron (Standard) Ring Pack', bearings: 'Aluminum-Tin',
    head: ['Factory Cast Iron', 'Factory Cast Aluminum'], cam: 'Stock/Mild Camshaft', tappet: 'Hydraulic Flat Tappet Set',
    spring: 'Cast Steel', timing: 'Timing Belt Kit', plugs: 'Copper Standard Spark Plug' },
  comfort: { label: 'Comfort', hint: 'Smooth, quiet and long-lasting: light aluminium engine, mild cam, self-adjusting valvetrain.',
    block: ['Cast Aluminum', 'Cast Iron'], crank: 'Cast', rod: ['I-Beam Powder Metal', 'I-Beam Forged Steel'],
    piston: ['Flat Top Cast Aluminum'], rings: 'Cast Iron (Standard) Ring Pack', bearings: 'Aluminum-Tin',
    head: ['Factory Cast Aluminum', 'Factory Cast Iron'], cam: 'Stock/Mild Camshaft', tappet: 'Hydraulic Roller Tappet Set',
    spring: 'Forged Steel', timing: 'Timing Belt Kit', plugs: 'Iridium Spark Plug' },
  street: { label: 'Street', hint: 'Balanced everyday performance: forged crank and pistons, ported heads, street cam.',
    block: ['Cast Aluminum', 'Cast Iron'], crank: 'Forged', rod: ['I-Beam Forged Steel', 'H-Beam Forged Steel'],
    piston: ['Flat Top Forged Aluminum', 'Flat Top Cast Aluminum'], rings: 'Steel Performance Ring Pack', bearings: 'Aluminum-Tin',
    head: ['Ported & Polished Cast Aluminum'], cam: 'Street Perf Camshaft', tappet: 'Hydraulic Roller Tappet Set',
    spring: 'Forged Steel', timing: 'Timing Chain Kit', plugs: 'Platinum Spark Plug' },
  performance: { label: 'Performance', hint: 'Strong all-round power that still lasts: forged internals, high-compression domed pistons, naturally aspirated.',
    block: ['Cast Aluminum', 'Compacted Graphite Iron', 'Cast Iron'], crank: 'Forged', rod: ['H-Beam Forged Steel'],
    piston: ['Domed Forged Aluminum'], rings: 'Steel Performance Ring Pack', bearings: 'Bi-Metal Race',
    head: ['Ported & Polished Forged Aluminum', 'Ported & Polished Cast Aluminum'], cam: 'Performance Camshaft', tappet: 'Hydraulic Roller Tappet Set',
    spring: 'Billet Steel', timing: 'Timing Chain Kit', plugs: 'Iridium Spark Plug' },
  durability: { label: 'Durability', hint: 'Built to last: CGI block, forged steel internals, heavy-duty bearings, mild cam and gear-driven timing.',
    block: ['Compacted Graphite Iron', 'Cast Iron'], crank: 'Forged', rod: ['H-Beam Forged Steel', 'I-Beam Forged Steel'],
    piston: ['Flat Top Forged Steel'], rings: 'Steel Performance Ring Pack', bearings: 'Tri-Metal',
    head: ['Factory Cast Iron', 'Factory Cast Aluminum'], cam: 'Stock/Mild Camshaft', tappet: 'Hydraulic Roller Tappet Set',
    spring: 'Billet Steel', timing: 'Timing Gears', plugs: 'Iridium Spark Plug' },
  heavy_machinery: { label: 'Heavy Machinery', hint: 'Low-revving torque for hauling and work vehicles: CGI/iron, forged steel pistons, torque cam, gear timing.',
    block: ['Compacted Graphite Iron', 'Cast Iron'], crank: 'Forged', rod: ['I-Beam Forged Steel', 'H-Beam Forged Steel'],
    piston: ['Flat Top Forged Steel'], rings: 'Steel Performance Ring Pack', bearings: 'Tri-Metal',
    head: ['Factory Cast Iron'], cam: 'Torque/Tow Camshaft', tappet: 'Hydraulic Roller Tappet Set',
    spring: 'Billet Steel', timing: 'Timing Gears', plugs: 'Iridium Spark Plug' },
  offroad: { label: 'Off-Road', hint: 'Tough, torquey and forgiving: iron block, forged internals, heavy-duty bearings, torque cam.',
    block: ['Cast Iron', 'Compacted Graphite Iron'], crank: 'Forged', rod: ['H-Beam Forged Steel'],
    piston: ['Flat Top Forged Aluminum'], rings: 'Steel Performance Ring Pack', bearings: 'Tri-Metal',
    head: ['Factory Cast Aluminum', 'Factory Cast Iron'], cam: 'Torque/Tow Camshaft', tappet: 'Hydraulic Roller Tappet Set',
    spring: 'Forged Steel', timing: 'Timing Chain Kit', plugs: 'Platinum Spark Plug' },
  rally: { label: 'Rally', hint: 'Boosted and abused for whole stages: strong block, forged internals, broad-powerband cam, reliable hydraulic valvetrain.',
    block: ['Compacted Graphite Iron', 'Cast Aluminum', 'Cast Iron'], crank: 'Forged', rod: ['H-Beam Billet Steel', 'H-Beam Forged Steel'],
    piston: ['Dished Forged Aluminum'], rings: 'Moly-Coated Race Ring Pack', bearings: 'Bi-Metal Race',
    head: ['Ported & Polished Forged Aluminum'], cam: 'Performance Camshaft', tappet: 'Hydraulic Roller Tappet Set',
    spring: 'Billet Steel', timing: 'Timing Chain Kit', plugs: 'Iridium Spark Plug' },
  drift: { label: 'Drift', hint: 'Sustained high revs under boost: strong block, billet steel rods, forged pistons, race valvetrain.',
    block: ['Compacted Graphite Iron', 'Cast Aluminum', 'Cast Iron'], crank: 'Forged', rod: ['H-Beam Billet Steel', 'H-Beam Forged Steel'],
    piston: ['Dished Forged Aluminum'], rings: 'Moly-Coated Race Ring Pack', bearings: 'Bi-Metal Race',
    head: ['Ported & Polished Forged Aluminum'], cam: 'Race Camshaft', tappet: 'Solid Roller Tappet Set',
    spring: 'Billet Steel', timing: 'Timing Chain Kit', plugs: 'Iridium Spark Plug' },
  drag: { label: 'Drag', hint: 'Maximum power in short bursts under big boost: billet block and crank, aluminium rods, billet pistons.',
    block: ['Billet Aluminum', 'Compacted Graphite Iron', 'Cast Iron'], crank: 'Billet', rod: ['H-Beam Billet Aluminum', 'H-Beam Forged Aluminum'],
    piston: ['Dished Billet Aluminum', 'Dished Forged Aluminum'], rings: 'Moly-Coated Race Ring Pack', bearings: 'Bi-Metal Race',
    head: ['Ported & Polished Forged Aluminum'], cam: 'Race Camshaft', tappet: 'Solid Roller Tappet Set',
    spring: 'Billet Steel', timing: 'Timing Gears', plugs: 'Iridium Spark Plug' },
  race: { label: 'Race', hint: 'Lightest, fastest parts regardless of longevity: billet aluminium, titanium rods, race valvetrain.',
    block: ['Billet Aluminum', 'Cast Aluminum', 'Cast Iron'], crank: 'Billet', rod: ['H-Beam Titanium', 'H-Beam Billet Steel'],
    piston: ['Dished Billet Aluminum', 'Dished Forged Aluminum'], rings: 'Moly-Coated Race Ring Pack', bearings: 'Bi-Metal Race',
    head: ['Ported & Polished Forged Aluminum'], cam: 'Race Camshaft', tappet: 'Solid Roller Tappet Set',
    spring: 'Billet Steel', timing: 'Timing Gears', plugs: 'Iridium Spark Plug' }
};
const ENGINE_STYLE_OPTIONS = Object.entries(ENGINE_STYLE_PROFILES).map(([value, p]) => ({ value, label: p.label, hint: p.hint }));

// Which configurations each engine type can be built as. Rotary only ever
// pairs with a rotor housing; every piston valvetrain with a real block.
function engineConfigurationsFor(valvetrain) {
  const wantRotor = valvetrain === 'Rotary';
  return ENGINE_CONFIGURATIONS.filter((c) => (c.subcategory === 'Rotor Housings') === wantRotor).map((c) => c.value);
}

// Cams ranked mildest -> most aggressive. A valvetrain can't safely run past
// its own ceiling (VALVETRAIN_TIERS' fastest pick), so a style's cam is
// capped to that; Torque/Tow is a low-rpm grind every valvetrain can run.
const CAM_RANK = ['Stock/Mild Camshaft', 'Torque/Tow Camshaft', 'Street Perf Camshaft', 'Performance Camshaft', 'Race Camshaft'];

function camAndTappetFor(profile, valvetrain) {
  const ceiling = VALVETRAIN_TIERS[valvetrain].fastest.camshaft;
  const cam = CAM_RANK.indexOf(profile.cam) > CAM_RANK.indexOf(ceiling) ? ceiling : profile.cam;
  let tappet = profile.tappet;
  // A solid roller only belongs with a race cam; pushrod (OHV) engines here
  // only ever run hydraulic lifters (VALVETRAIN_TIERS.OHV).
  if (tappet === 'Solid Roller Tappet Set' && cam !== 'Race Camshaft') tappet = 'Hydraulic Roller Tappet Set';
  if (valvetrain === 'OHV' && tappet.startsWith('Solid')) tappet = 'Hydraulic Roller Tappet Set';
  return { cam, tappet };
}

// Every part slot of the engine, in build order. `defaultNames` are the
// style's picks in preference order (the first one the catalogue has wins);
// `match` decides which catalogue rows the slot's dropdown offers.
function buildEngineSpec({ valvetrain, configuration, style }) {
  const profile = ENGINE_STYLE_PROFILES[style] || ENGINE_STYLE_PROFILES.street;
  const isRotary = configuration in ROTOR_COUNT;
  const slots = [];
  const add = (slot) => slots.push({ ...slot, defaultName: slot.defaultNames[0] });

  if (isRotary) {
    const rotors = ROTOR_COUNT[configuration];
    add({ key: 'rotor_housing', label: 'Rotor housing', quantity: 1,
      match: (name) => name.toLowerCase().includes(`${configuration} Rotor Housing`.toLowerCase()),
      defaultNames: profile.block.map((m) => `${m} ${configuration} Rotor Housing`) });
    add({ key: 'apex_seals', label: 'Apex seals', quantity: rotors * 3,
      match: (name) => /apex seals?$/i.test(name), defaultNames: ['Apex Seals'] });
    // Real Wankels run twin plugs per rotor (leading + trailing).
    add({ key: 'spark_plugs', label: 'Spark plugs', quantity: rotors * 2,
      match: (name) => /spark plug$/i.test(name), defaultNames: [profile.plugs] });
    return { isRotary, rotors, cylinders: 0, banks: 0, totalValves: 0, profile, slots };
  }

  const cylinders = CYLINDER_COUNT[configuration] || 1;
  const banks = bankCount(configuration);
  const totalValves = cylinders * VALVES_PER_CYLINDER[valvetrain];
  const camCount = camshaftCount(valvetrain, banks);
  const { cam, tappet } = camAndTappetFor(profile, valvetrain);

  add({ key: 'block', label: 'Engine block', quantity: 1,
    match: (name) => name.toLowerCase().endsWith(` ${configuration} Engine Block`.toLowerCase()),
    defaultNames: profile.block.map((m) => blockName(m, configuration)) });
  add({ key: 'crankshaft', label: 'Crankshaft', quantity: 1,
    match: (name) => /crankshaft$/i.test(name), defaultNames: [`${profile.crank} Crankshaft`] });
  add({ key: 'conrods', label: 'Connecting rods', quantity: cylinders,
    match: (name) => /connecting rod$/i.test(name), defaultNames: profile.rod.map((r) => `${r} Connecting Rod`) });
  add({ key: 'pistons', label: 'Pistons', quantity: cylinders,
    match: (name) => /piston$/i.test(name), defaultNames: profile.piston.map((p) => `${p} Piston`) });
  add({ key: 'rings', label: 'Piston ring packs', quantity: cylinders,
    match: (name) => /ring pack$/i.test(name), defaultNames: [profile.rings] });
  add({ key: 'conrod_bearings', label: 'Conrod bearings', quantity: cylinders,
    match: (name) => /conrod bearing$/i.test(name), defaultNames: [`${profile.bearings} Conrod Bearing`] });
  add({ key: 'main_bearings', label: 'Main bearings', quantity: mainBearingCount(cylinders, banks),
    match: (name) => /main bearing$/i.test(name), defaultNames: [`${profile.bearings} Main Bearing`] });
  add({ key: 'heads', label: 'Cylinder heads', quantity: banks,
    match: (name) => /cylinder head$/i.test(name), defaultNames: profile.head.map((h) => `${h} Cylinder Head`) });
  add({ key: 'camshafts', label: 'Camshafts', quantity: camCount,
    match: (name) => /camshaft$/i.test(name), defaultNames: [cam] });
  add({ key: 'tappets', label: 'Tappets', quantity: totalValves,
    match: (name) => /tappet( set)?$/i.test(name), defaultNames: [tappet] });
  add({ key: 'valve_springs', label: 'Valve springs', quantity: totalValves,
    match: (name) => /valve spring set$/i.test(name),
    defaultNames: [`${valveSpringTypeForTappet(tappet)} ${profile.spring} Valve Spring Set`] });
  add({ key: 'head_gasket', label: 'Head gasket', quantity: 1,
    match: (name) => /head gasket/i.test(name), defaultNames: ['Head Gasket Set'] });
  add({ key: 'timing', label: 'Timing system', quantity: 1,
    match: (name) => /^timing (chain|belt|gear)/i.test(name), defaultNames: [profile.timing] });
  add({ key: 'spark_plugs', label: 'Spark plugs', quantity: cylinders,
    match: (name) => /spark plug$/i.test(name), defaultNames: [profile.plugs] });

  return { isRotary, rotors: 0, cylinders, banks, totalValves, profile, slots };
}

// Loose name comparison -- a few seeded catalogue names have stray
// characters (e.g. OCR artefacts), so an exact match isn't guaranteed.
function engineNameKey(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// The catalogue rows a slot can use, and which one it starts on. Matched by
// name pattern rather than sub-category: the catalogue has been re-sorted
// into new sub-categories before (sql/033), and names are the stable part.
function engineSlotOptions(slot, items) {
  const options = items
    .filter((i) => slot.match(i.name))
    .sort((a, b) => (Number(a.customer_price) || 0) - (Number(b.customer_price) || 0) || a.name.localeCompare(b.name));
  // The style's picks in preference order -- first one this catalogue has.
  let preferred = null;
  for (const name of slot.defaultNames || [slot.defaultName]) {
    const key = engineNameKey(name);
    preferred = options.find((o) => engineNameKey(o.name) === key) || null;
    if (preferred) break;
  }
  return { options, preferred };
}

// The in-game engine builder flags a valve spring type that doesn't suit the
// tappets (see valveSpringTypeForTappet in performanceBuild.js).
function valveSpringMismatch(tappetName, springName) {
  if (!tappetName || !springName) return null;
  const expected = valveSpringTypeForTappet(tappetName);
  return springName.toLowerCase().startsWith(expected.toLowerCase())
    ? null
    : `${tappetName} works best with ${expected} valve springs -- the in-game builder flags this pairing for extra wear.`;
}

// Joanna supplies the real engine pictures: upload them to the
// mechanic-item-icons bucket's engines/ folder as
//   <engine type>-<layout>.png   e.g. dohc-v8.png, ohv-inline-6.png, rotary-twin-rotor.png
//   or just <layout>.png         e.g. v8.png (used for any engine type)
// The page tries those in order, then falls back to the selected block's own
// catalogue image.
function engineImageCandidates(valvetrain, configuration) {
  const slug = (v) => String(v).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const base = `${SUPABASE_URL}/storage/v1/object/public/mechanic-item-icons/engines/`;
  return [`${base}${slug(valvetrain)}-${slug(configuration)}.png`, `${base}${slug(configuration)}.png`];
}

function engineSpecLabel(spec) {
  if (!spec) return '';
  const style = ENGINE_STYLE_PROFILES[spec.style]?.label || spec.style;
  return spec.valvetrain === 'Rotary'
    ? `${spec.configuration} rotary · ${style} spec`
    : `${spec.valvetrain} ${spec.configuration} · ${style} spec`;
}
