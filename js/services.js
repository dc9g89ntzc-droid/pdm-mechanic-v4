// Data-access helpers for the Services Configurator (management tool) --
// named jobs the shop offers, organised by the same job_type vocabulary as
// the job board, each built from a list of real catalogue_items materials.
// Mirrors js/catalogue.js's shape closely; see sql/029_services_configurator.sql
// for why services live in their own tables rather than inside
// catalogue_items (job_items.catalogue_item_id is a hard FK to
// catalogue_items, so a service can't be one).

async function listServiceSubcategories() {
  const { data, error } = await sb
    .from('service_subcategories')
    .select('id, name, sort_order')
    .order('sort_order')
    .order('name');
  if (error) throw new Error(error.message);
  return data;
}

async function createServiceSubcategory(name) {
  const { data, error } = await sb
    .from('service_subcategories')
    .insert({ name: name.trim() })
    .select('id, name, sort_order')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function deleteServiceSubcategory(id) {
  const { error } = await sb.from('service_subcategories').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// filters: { jobTypeCategory, subcategoryId, search, activeOnly }
async function listServices(filters = {}) {
  let query = sb
    .from('services')
    .select(`
      id, name, description, job_type_category, subcategory_id, labour_fee, active, notes,
      service_subcategories ( name )
    `)
    .order('name');

  if (filters.jobTypeCategory) query = query.eq('job_type_category', filters.jobTypeCategory);
  if (filters.subcategoryId) query = query.eq('subcategory_id', filters.subcategoryId);
  if (filters.activeOnly) query = query.eq('active', true);
  if (filters.search) query = query.ilike('name', `%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

async function getService(id) {
  const { data, error } = await sb
    .from('services')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function createService(service) {
  const { data, error } = await sb
    .from('services')
    .insert(service)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function updateService(id, service) {
  const { error } = await sb.from('services').update(service).eq('id', id);
  if (error) throw new Error(error.message);
}

async function listServiceMaterials(serviceId) {
  const { data, error } = await sb
    .from('service_materials')
    .select('id, quantity, catalogue_item_id, catalogue_items ( name, customer_price, sourcing, craft_cost, purchase_cost, stock_quantity, reorder_threshold )')
    .eq('service_id', serviceId);
  if (error) throw new Error(error.message);
  return data;
}

async function addServiceMaterial(serviceId, catalogueItemId, quantity) {
  const { error } = await sb
    .from('service_materials')
    .insert({ service_id: serviceId, catalogue_item_id: catalogueItemId, quantity });
  if (error) throw new Error(error.message);
}

async function removeServiceMaterial(materialRowId) {
  const { error } = await sb.from('service_materials').delete().eq('id', materialRowId);
  if (error) throw new Error(error.message);
}

// One query for every service's material count (for the services table's
// "Materials" column) instead of one query per row.
async function listServiceMaterialCounts() {
  const { data, error } = await sb.from('service_materials').select('service_id');
  if (error) throw new Error(error.message);
  const counts = {};
  data.forEach((row) => { counts[row.service_id] = (counts[row.service_id] || 0) + 1; });
  return counts;
}

// ---- Attaching a service to a job (sql/043) ----

async function listJobServices(jobId, jobType) {
  let query = sb
    .from('job_services')
    .select('id, service_id, job_type, labour_fee, created_at, services ( name )')
    .eq('job_id', jobId)
    .order('created_at');
  if (jobType) query = query.eq('job_type', jobType);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

// Snapshots the service's current labour_fee (permanent, same convention
// as job_items.unit_price -- a later edit to services.labour_fee must not
// retroactively change an already-attached job) and expands every material
// onto job_items via the existing addJobItem() path, so stock tracking
// stays exactly as if each part had been added by hand.
async function addServiceToJob({ jobId, jobType, service, performedBy }) {
  const { error } = await sb.from('job_services').insert({
    job_id: jobId, service_id: service.id, job_type: jobType,
    labour_fee: service.labour_fee, added_by: performedBy || null
  });
  if (error) throw new Error(error.message);

  const materials = await listServiceMaterials(service.id);
  for (const m of materials) {
    if (!m.catalogue_items) continue; // material's catalogue item was deleted -- skip rather than crash
    await addJobItem({
      jobId,
      catalogueItem: { id: m.catalogue_item_id, ...m.catalogue_items },
      quantity: Number(m.quantity),
      sourcingChoice: null,
      performedBy,
      jobType
    });
  }
}

// Detaches the service record only -- materials it added stay on the job
// (they're tracked independently in job_items from that point on, same as
// anything added by hand; removing them individually is a separate action
// via the existing remove button, not implied by detaching the service).
async function removeServiceFromJob(jobServiceId) {
  const { error } = await sb.from('job_services').delete().eq('id', jobServiceId);
  if (error) throw new Error(error.message);
}
