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
    .select('id, quantity, catalogue_item_id, catalogue_items ( name, customer_price )')
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
