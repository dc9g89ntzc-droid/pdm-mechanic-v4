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
// Durability, Rally and Heavy Machinery. Each one is a profile describing
// how it picks along the existing ladders:
//   ladder   'general' (light / performance materials) or 'tough' (steel/iron)
//   rung     how far up that ladder: bottom | low | mid | high | top
//   cams     VALVETRAIN_TIERS tier (cheap | durable | fastest), or 'torque'
//   piston   crown shape: Flat Top (neutral), Domed (high-compression NA),
//            Dished (lower compression, safe under boost)
//   head     Factory (stock) or Ported & Polished (better flow)
//   rod      beam design: I-Beam (stock), H-Beam (performance), X-Beam
//   timing   Belt (cheap/quiet), Chain (general purpose), Gears (heavy duty / race)
const ENGINE_STYLE_PROFILES = {
  economy: { label: 'Economy', hint: 'Cheapest sensible parts for a reliable daily engine.',
    ladder: 'general', rung: 'bottom', cams: 'cheap', piston: 'Flat Top', head: 'Factory', rod: 'I-Beam', timing: 'Timing Belt Kit' },
  comfort: { label: 'Comfort', hint: 'Smooth and quiet, a step up from the cheapest parts.',
    ladder: 'general', rung: 'low', cams: 'cheap', piston: 'Flat Top', head: 'Factory', rod: 'I-Beam', timing: 'Timing Belt Kit' },
  street: { label: 'Street', hint: 'Balanced everyday performance.',
    ladder: 'general', rung: 'mid', cams: 'durable', piston: 'Flat Top', head: 'Ported & Polished', rod: 'H-Beam', timing: 'Timing Chain Kit' },
  performance: { label: 'Performance', hint: 'Strong all-round power with lightweight internals; naturally aspirated, high compression.',
    ladder: 'general', rung: 'high', cams: 'durable', piston: 'Domed', head: 'Ported & Polished', rod: 'H-Beam', timing: 'Timing Chain Kit' },
  durability: { label: 'Durability', hint: 'Built to last: the toughest steel and iron parts, mild valvetrain.',
    ladder: 'tough', rung: 'top', cams: 'durable', piston: 'Flat Top', head: 'Factory', rod: 'H-Beam', timing: 'Timing Chain Kit' },
  heavy_machinery: { label: 'Heavy Machinery', hint: 'Low-revving torque for hauling and work vehicles: tough parts, torque cam, gear-driven timing.',
    ladder: 'tough', rung: 'top', cams: 'torque', piston: 'Flat Top', head: 'Factory', rod: 'I-Beam', timing: 'Timing Gears' },
  offroad: { label: 'Off-Road', hint: 'Tough internals that shrug off shocks and abuse.',
    ladder: 'tough', rung: 'high', cams: 'durable', piston: 'Flat Top', head: 'Factory', rod: 'H-Beam', timing: 'Timing Chain Kit' },
  rally: { label: 'Rally', hint: 'Tough enough for jumps and gravel, aggressive enough to win; built for boost.',
    ladder: 'tough', rung: 'top', cams: 'fastest', piston: 'Dished', head: 'Ported & Polished', rod: 'H-Beam', timing: 'Timing Chain Kit' },
  drift: { label: 'Drift', hint: 'Sustained high revs and clutch kicks; tough internals built for boost.',
    ladder: 'tough', rung: 'top', cams: 'fastest', piston: 'Dished', head: 'Ported & Polished', rod: 'H-Beam', timing: 'Timing Chain Kit' },
  drag: { label: 'Drag', hint: 'Outright power for short bursts; lightest top-tier parts, built for boost.',
    ladder: 'general', rung: 'top', cams: 'fastest', piston: 'Dished', head: 'Ported & Polished', rod: 'X-Beam', timing: 'Timing Gears' },
  race: { label: 'Race', hint: 'Lightest, fastest parts regardless of longevity; built for boost.',
    ladder: 'general', rung: 'top', cams: 'fastest', piston: 'Dished', head: 'Ported & Polished', rod: 'H-Beam', timing: 'Timing Gears' }
};
const ENGINE_STYLE_OPTIONS = Object.entries(ENGINE_STYLE_PROFILES).map(([value, p]) => ({ value, label: p.label, hint: p.hint }));

// Which configurations each engine type can be built as. Rotary only ever
// pairs with a rotor housing; every piston valvetrain with a real block.
function engineConfigurationsFor(valvetrain) {
  const wantRotor = valvetrain === 'Rotary';
  return ENGINE_CONFIGURATIONS.filter((c) => (c.subcategory === 'Rotor Housings') === wantRotor).map((c) => c.value);
}

function pickRung(ladder, rung) {
  const n = ladder.length;
  const index = { bottom: 0, low: Math.round((n - 1) * 0.25), mid: Math.floor((n - 1) / 2), high: n - 2, top: n - 1 }[rung];
  return ladder[Math.max(0, Math.min(n - 1, index ?? 0))];
}

function engineMaterial(profile, generalLadder, toughLadder) {
  return pickRung(profile.ladder === 'tough' ? toughLadder : generalLadder, profile.rung);
}

// The Performance panel only ever uses the top and bottom of the general
// block ladder, but styles here also land in the middle -- and V12/W12 have
// no Billet Steel block in the catalogue, so their general ladder skips it.
const ENGINE_BLOCK_GENERAL_OVERRIDES = {
  V12: { general: ['Cast Iron', 'Cast Aluminum', 'Compacted Graphite Iron', 'Billet Aluminum'] },
  W12: { general: ['Cast Iron', 'Cast Aluminum', 'Compacted Graphite Iron', 'Billet Aluminum'] }
};

function housingName(material, configuration) {
  return `${material} ${configuration} Rotor Housing`;
}

// Every part slot of the engine, in build order. `defaultName` is the style's
// pick (a real catalogue name, same ladders the Performance panel uses);
// `match` decides which catalogue rows the slot's dropdown offers.
function buildEngineSpec({ valvetrain, configuration, style }) {
  const profile = ENGINE_STYLE_PROFILES[style] || ENGINE_STYLE_PROFILES.street;
  const isRotary = configuration in ROTOR_COUNT;
  const slots = [];
  const add = (slot) => slots.push(slot);

  if (isRotary) {
    const rotors = ROTOR_COUNT[configuration];
    add({ key: 'rotor_housing', label: 'Rotor housing', quantity: 1,
      match: (name) => name.toLowerCase().includes(`${configuration} Rotor Housing`.toLowerCase()),
      defaultName: housingName(engineMaterial(profile, BLOCK_MATERIAL_LADDER, BLOCK_MATERIAL_LADDER_TOUGH), configuration) });
    add({ key: 'apex_seals', label: 'Apex seals', quantity: rotors * 3,
      match: (name) => /apex seals?$/i.test(name), defaultName: 'Apex Seals' });
    // Real Wankels run twin plugs per rotor (leading + trailing).
    add({ key: 'spark_plugs', label: 'Spark plugs', quantity: rotors * 2,
      match: (name) => /spark plug$/i.test(name), defaultName: pickRung(SPARK_PLUG_LADDER, profile.rung) });
    return { isRotary, rotors, cylinders: 0, banks: 0, totalValves: 0, profile, slots };
  }

  const cylinders = CYLINDER_COUNT[configuration] || 1;
  const banks = bankCount(configuration);
  const totalValves = cylinders * VALVES_PER_CYLINDER[valvetrain];
  const camCount = camshaftCount(valvetrain, banks);
  const valvetrainPick = profile.cams === 'torque'
    ? { camshaft: 'Torque/Tow Camshaft', tappet: 'Hydraulic Roller Tappet Set' }
    : VALVETRAIN_TIERS[valvetrain][profile.cams];

  const overrides = { ...(BLOCK_LADDER_OVERRIDES[configuration] || {}), ...(ENGINE_BLOCK_GENERAL_OVERRIDES[configuration] || {}) };
  add({ key: 'block', label: 'Engine block', quantity: 1,
    match: (name) => name.toLowerCase().endsWith(` ${configuration} Engine Block`.toLowerCase()),
    defaultName: blockName(engineMaterial(profile, overrides.general || BLOCK_MATERIAL_LADDER, overrides.tough || BLOCK_MATERIAL_LADDER_TOUGH), configuration) });
  add({ key: 'crankshaft', label: 'Crankshaft', quantity: 1,
    match: (name) => /crankshaft$/i.test(name), defaultName: `${pickRung(CRANKSHAFT_LADDER, profile.rung)} Crankshaft` });
  add({ key: 'conrods', label: 'Connecting rods', quantity: cylinders,
    match: (name) => /connecting rod$/i.test(name), defaultName: `${profile.rod} ${engineMaterial(profile, CONROD_MATERIAL_LADDER, CONROD_MATERIAL_LADDER_TOUGH)} Connecting Rod` });
  add({ key: 'pistons', label: 'Pistons', quantity: cylinders,
    match: (name) => /piston$/i.test(name), defaultName: `${profile.piston} ${engineMaterial(profile, PISTON_MATERIAL_LADDER, PISTON_MATERIAL_LADDER_TOUGH)} Piston` });
  add({ key: 'rings', label: 'Piston ring packs', quantity: cylinders,
    match: (name) => /ring pack$/i.test(name), defaultName: pickRung(RING_PACK_LADDER, profile.rung) });
  const bearing = pickRung(BEARING_LADDER, profile.rung);
  add({ key: 'conrod_bearings', label: 'Conrod bearings', quantity: cylinders,
    match: (name) => /conrod bearing$/i.test(name), defaultName: `${bearing} Conrod Bearing` });
  add({ key: 'main_bearings', label: 'Main bearings', quantity: mainBearingCount(cylinders, banks),
    match: (name) => /main bearing$/i.test(name), defaultName: `${bearing} Main Bearing` });
  add({ key: 'heads', label: 'Cylinder heads', quantity: banks,
    match: (name) => /cylinder head$/i.test(name), defaultName: `${profile.head} ${engineMaterial(profile, CYLINDER_HEAD_MATERIAL_LADDER, CYLINDER_HEAD_MATERIAL_LADDER_TOUGH)} Cylinder Head` });
  add({ key: 'camshafts', label: 'Camshafts', quantity: camCount,
    match: (name) => /camshaft$/i.test(name), defaultName: valvetrainPick.camshaft });
  add({ key: 'tappets', label: 'Tappets', quantity: totalValves,
    match: (name) => /tappet( set)?$/i.test(name), defaultName: valvetrainPick.tappet });
  add({ key: 'valve_springs', label: 'Valve springs', quantity: totalValves,
    match: (name) => /valve spring set$/i.test(name),
    defaultName: `${valveSpringTypeForTappet(valvetrainPick.tappet)} ${pickRung(VALVE_SPRING_MATERIAL_LADDER, profile.rung)} Valve Spring Set` });
  add({ key: 'head_gasket', label: 'Head gasket', quantity: 1,
    match: (name) => /head gasket/i.test(name), defaultName: 'Head Gasket Set' });
  add({ key: 'timing', label: 'Timing system', quantity: 1,
    match: (name) => /^timing (chain|belt|gear)/i.test(name), defaultName: profile.timing });
  add({ key: 'spark_plugs', label: 'Spark plugs', quantity: cylinders,
    match: (name) => /spark plug$/i.test(name), defaultName: pickRung(SPARK_PLUG_LADDER, profile.rung) });

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
  const key = engineNameKey(slot.defaultName);
  const preferred = options.find((o) => engineNameKey(o.name) === key) || null;
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
