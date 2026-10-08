// Engine storage (sql/062): built engines a customer didn't take. The shop
// keeps them to resell -- fitted to another job's Engine Building leg, or
// stripped for parts. Every change goes through the RPCs so the job, its
// parts and stock all move together.

async function listStoredEngines() {
  const { data, error } = await sb
    .from('stored_engines')
    .select('*, source_job:jobs!stored_engines_source_job_id_fkey ( job_number, customers ( customer_name ) )')
    .eq('status', 'in_storage')
    .order('stored_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

// cancelLeg: true when the customer changed their mind (the leg must be
// Ready for installation); false when a builder swaps a stored engine back
// out of a job that's still quoting.
async function storeJobEngine(jobId, { cancelLeg = true, notes = null } = {}) {
  const { data, error } = await sb.rpc('store_job_engine', { p_job_id: jobId, p_cancel_leg: cancelLeg, p_notes: notes });
  if (error) throw new Error(error.message);
  return data;
}

async function fitStoredEngine(engineId, jobId) {
  const { data, error } = await sb.rpc('fit_stored_engine', { p_engine_id: engineId, p_job_id: jobId });
  if (error) throw new Error(error.message);
  return data;
}

async function stripStoredEngine(engineId) {
  const { error } = await sb.rpc('strip_stored_engine', { p_engine_id: engineId });
  if (error) throw new Error(error.message);
}

// "Engine #3 — DOHC V8 · Race spec". Uses the Engine Builder's own label
// where that script is loaded (job-items), a plain one elsewhere.
function storedEngineLabel(engine) {
  const spec = engine?.engine_spec;
  let what = 'Engine';
  if (spec && typeof engineSpecLabel === 'function') what = engineSpecLabel(spec);
  else if (spec) {
    const style = spec.style === 'fleet' ? 'Emergency / Fleet'
      : String(spec.style || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    what = [spec.valvetrain, spec.configuration].filter(Boolean).join(' ') + (style ? ` · ${style} spec` : '');
  }
  return `Engine #${engine.engine_number} — ${what}`;
}

function storedEnginePartsSummary(engine) {
  const parts = engine?.parts || [];
  return `${parts.length} part type${parts.length === 1 ? '' : 's'} · parts value ${formatMoney(engine.parts_value)}`;
}
