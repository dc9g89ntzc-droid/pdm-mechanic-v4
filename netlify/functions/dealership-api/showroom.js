// Port of 12_PublicStock + 20_PublicSpotlight from PDM Dealership 3.0.
// Public, no login: backs dealership/showroom.html.
//
//   dealership_public_catalogue + dealership_vehicle_photo_map
//     -> joined here -> image_url
const { SUPABASE_URL, selectSql_ } = require('./supabase');

const IMAGE_BASE_URL_ = SUPABASE_URL + '/storage/v1/object/public/vehicle-images/';

// Must match dealership_public_catalogue.category exactly -- the Apps
// Script list said Sport / Sport Classic / Trucks / Trailers, which no
// vehicle uses, so those 251 vehicles could never be spotlighted.
const SPOTLIGHT_CATEGORIES_ = [
  'Compact',
  'Coupe',
  'Electric',
  'Muscle',
  'Sports',
  'Sports Classics',
  'SUV',
  'Truck',
  'Misc',
  'Trailer',
  'Work Truck',
  'Sedans',
  'Semi-Trucks',
  'Heavy',
  'Super'
];

function nullableNumber_(value) {
  return value === null || value === undefined ? null : Number(value);
}

async function getAllVehiclePhotoMappings_() {
  const allRows = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const rows = await selectSql_(
      'dealership_vehicle_photo_map',
      '?select=vehicle_id,photo_key,vehicle_name' +
      '&order=photo_key.asc' +
      '&limit=' + pageSize +
      '&offset=' + offset
    ) || [];

    allRows.push(...rows);

    if (rows.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  return allRows;
}

async function getPublicDealershipCatalogue() {
  const [rows, photoRows] = await Promise.all([
    selectSql_(
      'dealership_public_catalogue',
      '?select=vehicle_id,display_name,make,model,category,sale_price,stock_qty,' +
      'typical_buyback_min,typical_buyback_max' +
      '&order=display_name.asc'
    ),
    getAllVehiclePhotoMappings_()
  ]);

  const photoKeyByVehicleId = {};
  photoRows.forEach(r => {
    const vehicleId = String(r.vehicle_id || '').trim();
    const photoKey = String(r.photo_key || '').trim();
    if (vehicleId && photoKey) {
      photoKeyByVehicleId[vehicleId] = photoKey;
    }
  });

  return {
    updated_at: new Date().toISOString(),

    catalogue: (rows || []).map(r => {
      const vehicleId = String(r.vehicle_id || '').trim();
      const photoKey = photoKeyByVehicleId[vehicleId] || '';

      return {
        vehicle_id: r.vehicle_id,
        display_name: r.display_name || '',
        make: r.make || '',
        model: r.model || '',
        category: r.category || '',

        photo_key: photoKey,

        // Blank if this vehicle has no safe mapping -- the frontend then
        // leaves the original card untouched.
        image_url: photoKey ? IMAGE_BASE_URL_ + encodeURIComponent(photoKey) + '.webp' : '',
        alt_image_url: photoKey ? IMAGE_BASE_URL_ + encodeURIComponent(photoKey) + '_alt.webp' : '',

        sale_price: Number(r.sale_price || 0),
        stock_qty: Number(r.stock_qty || 0),
        typical_buyback_min: nullableNumber_(r.typical_buyback_min),
        typical_buyback_max: nullableNumber_(r.typical_buyback_max)
      };
    })
  };
}

// Keep up to `limit` candidates for ALL plus each category.
// A vehicle appears only once in the returned flat array.
function topSpotlightPerCategory_(rows, limit) {
  const keep = new Set();

  rows.slice(0, limit).forEach(r => keep.add(String(r.vehicle_id)));

  const byCategory = {};
  rows.forEach(r => {
    const category = String(r.category || '').trim();
    if (!category) return;
    if (!byCategory[category]) byCategory[category] = [];
    if (byCategory[category].length < limit) byCategory[category].push(r);
  });

  Object.values(byCategory).forEach(list => list.forEach(r => keep.add(String(r.vehicle_id))));

  return rows.filter(r => keep.has(String(r.vehicle_id)));
}

async function getPublicSpotlight() {
  // Reuse the public catalogue as the single source of truth for
  // photo_key / image_url / alt_image_url.
  const [candidateRows, catalogueData] = await Promise.all([
    selectSql_(
      'dealership_public_spotlight_candidates',
      '?select=source_type,vehicle_id,display_name,make,model,category,' +
      'sale_price,stock_qty,typical_buyback_min,typical_buyback_max,' +
      'featured_priority,metric_value,metric_date'
    ),
    getPublicDealershipCatalogue()
  ]);

  const catalogue = Array.isArray(catalogueData.catalogue) ? catalogueData.catalogue : [];

  const catalogueById = {};
  catalogue.forEach(v => {
    if (v && v.vehicle_id) catalogueById[String(v.vehicle_id)] = v;
  });

  const enrich = row => {
    const publicRow = catalogueById[String(row.vehicle_id || '')] || {};

    return {
      source_type: row.source_type || '',
      vehicle_id: row.vehicle_id,
      display_name: row.display_name || publicRow.display_name || '',
      make: row.make || publicRow.make || '',
      model: row.model || publicRow.model || '',
      category: row.category || publicRow.category || '',
      sale_price: Number(row.sale_price || publicRow.sale_price || 0),
      stock_qty: Number(row.stock_qty || publicRow.stock_qty || 0),

      typical_buyback_min:
        row.typical_buyback_min === null || row.typical_buyback_min === undefined
          ? publicRow.typical_buyback_min ?? null
          : Number(row.typical_buyback_min),

      typical_buyback_max:
        row.typical_buyback_max === null || row.typical_buyback_max === undefined
          ? publicRow.typical_buyback_max ?? null
          : Number(row.typical_buyback_max),

      photo_key: publicRow.photo_key || '',
      image_url: publicRow.image_url || '',
      alt_image_url: publicRow.alt_image_url || '',
      featured_priority: nullableNumber_(row.featured_priority),
      metric_value: nullableNumber_(row.metric_value),
      metric_date: row.metric_date || null
    };
  };

  const rows = (candidateRows || [])
    .filter(r => SPOTLIGHT_CATEGORIES_.includes(String(r.category || '').trim()))
    .map(enrich);

  const picks = rows
    .filter(r => r.source_type === 'PDM_PICK')
    .sort((a, b) =>
      Number(a.featured_priority || 999999) - Number(b.featured_priority || 999999) ||
      Number(b.stock_qty || 0) - Number(a.stock_qty || 0) ||
      String(a.display_name || '').localeCompare(String(b.display_name || ''))
    );

  const arrivals = rows
    .filter(r => r.source_type === 'JUST_ARRIVED')
    .sort((a, b) => new Date(b.metric_date || 0) - new Date(a.metric_date || 0));

  const popular = rows
    .filter(r => r.source_type === 'CUSTOMER_FAVOURITE')
    .sort((a, b) =>
      Number(b.metric_value || 0) - Number(a.metric_value || 0) ||
      Number(b.stock_qty || 0) - Number(a.stock_qty || 0)
    );

  const categories = SPOTLIGHT_CATEGORIES_.filter(category =>
    catalogue.some(v => String(v.category || '').trim() === category)
  );

  return {
    generated_at: new Date().toISOString(),
    categories: categories,
    picks: topSpotlightPerCategory_(picks, 5),
    arrivals: topSpotlightPerCategory_(arrivals, 5),
    popular: topSpotlightPerCategory_(popular, 5)
  };
}

module.exports = {
  functions: { getPublicDealershipCatalogue, getPublicSpotlight }
};
