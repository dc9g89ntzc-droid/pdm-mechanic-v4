// Port of 13_VehicleManagement, 21_CatalogueIntelligence and
// 22_PhotoCaptureBridge from PDM Dealership 3.0.
const { getSupabaseConfig_, selectSql_, insertSql_, rpcSql_, firstRow_, auditLog_ } = require('./supabase');
const { requireSession_, requireEmployeeLink_ } = require('./session');

// 13_VehicleManagement checked user.can_manage_vehicles; 21/22 also
// accepted user.permissions.can_manage_vehicles. The session user is the
// raw dealership_verify_login row (flat can_* flags), so both spellings
// are accepted in one place.
function requireVehicleManager_(user) {
  if (!user) throw new Error('SESSION_EXPIRED');

  const role = String(user.role || '').toUpperCase();

  if (role === 'OWNER' || role === 'MANAGER') {
    return true;
  }

  if (user.can_manage_vehicles === true || (user.permissions || {}).can_manage_vehicles === true) {
    return true;
  }

  throw new Error('You do not have permission to manage vehicles.');
}

function cleanVehicleMoney_(value, label) {
  const n = Number(value || 0);

  if (!Number.isFinite(n) || n < 0) {
    throw new Error(label + ' must be 0 or more.');
  }

  return n;
}

// ============================================================
// VEHICLE MANAGEMENT (13)
// ============================================================

async function getVehicleManagementData(token) {
  const user = requireSession_(token);
  requireVehicleManager_(user);

  const rows = await selectSql_(
    'current_vehicle_stock',
    '?select=vehicle_id,vehicle_code,make,model,display_name,category,' +
    'import_cost,msrp,recommended_sale_price,suggested_buyback_price,' +
    'active,retired,stock_qty&order=display_name.asc'
  ) || [];

  const vehicles = rows.map(r => ({
    vehicle_id: r.vehicle_id,
    vehicle_code: r.vehicle_code || '',
    make: r.make || '',
    model: r.model || '',
    display_name: r.display_name || '',
    category: r.category || '',
    import_cost: Number(r.import_cost || 0),
    msrp: Number(r.msrp || 0),
    sale_price: Number(r.recommended_sale_price || 0),
    suggested_buyback_price: Number(r.suggested_buyback_price || 0),
    active: r.active === true,
    retired: r.retired === true,
    stock_qty: Number(r.stock_qty || 0)
  }));

  const activeCurrent = vehicles.filter(v => v.active && !v.retired);

  const summary = {
    total_vehicles: vehicles.length,
    active_vehicles: activeCurrent.length,
    retired_vehicles: vehicles.filter(v => v.retired).length,
    missing_sale_price: activeCurrent.filter(v => v.sale_price <= 0).length,
    missing_buyback: activeCurrent.filter(v => v.suggested_buyback_price <= 0).length,
    sale_below_import: activeCurrent.filter(v =>
      v.sale_price > 0 &&
      v.import_cost > 0 &&
      v.sale_price < v.import_cost
    ).length,
    buyback_above_sale: activeCurrent.filter(v =>
      v.sale_price > 0 &&
      v.suggested_buyback_price > v.sale_price
    ).length
  };

  const categories = [...new Set(vehicles.map(v => v.category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));

  return { vehicles, categories, summary };
}

function vehiclePayload_(payload, missingReasonMessage) {
  const displayName = String(payload.display_name || '').trim();
  const category = String(payload.category || '').trim();
  const reason = String(payload.reason || '').trim();

  if (!displayName) throw new Error('Display name is required.');
  if (!category) throw new Error('Category is required.');
  if (!reason) throw new Error(missingReasonMessage);

  return {
    displayName,
    category,
    reason,
    importCost: cleanVehicleMoney_(payload.import_cost, 'Import / Export value'),
    msrp: cleanVehicleMoney_(payload.msrp, 'MSRP'),
    salePrice: cleanVehicleMoney_(payload.sale_price, 'PDM sale price'),
    buyback: cleanVehicleMoney_(payload.suggested_buyback_price, 'Suggested buyback')
  };
}

async function addDealershipVehicle(token, payload) {
  const user = requireSession_(token);
  requireVehicleManager_(user);

  payload = payload || {};
  requireEmployeeLink_(user);

  const v = vehiclePayload_(payload, 'Please enter a reason for adding this vehicle.');

  const data = firstRow_(await rpcSql_('dealership_add_vehicle', {
    p_employee_id: user.employee_id,
    p_employee_name: user.employee_name,
    p_display_name: v.displayName,
    p_make: String(payload.make || '').trim(),
    p_model: String(payload.model || '').trim(),
    p_category: v.category,
    p_import_cost: v.importCost,
    p_msrp: v.msrp,
    p_sale_price: v.salePrice,
    p_suggested_buyback: v.buyback,
    p_active: payload.active !== false,
    p_retired: payload.retired === true,
    p_reason: v.reason
  }));

  await auditLog_(
    user,
    'CREATE',
    'VEHICLE',
    data && data.vehicle_id ? data.vehicle_id : '',
    'Created vehicle ' + (data && data.vehicle_code ? data.vehicle_code + ' · ' : '') + v.displayName,
    {
      reason: v.reason,
      import_cost: v.importCost,
      msrp: v.msrp,
      sale_price: v.salePrice,
      suggested_buyback_price: v.buyback
    }
  );

  return data;
}

async function updateDealershipVehicle(token, vehicleId, payload) {
  const user = requireSession_(token);
  requireVehicleManager_(user);

  vehicleId = String(vehicleId || '').trim();
  payload = payload || {};

  if (!vehicleId) throw new Error('Vehicle ID is required.');
  requireEmployeeLink_(user);

  const v = vehiclePayload_(payload, 'Please enter a reason for this vehicle update.');

  const data = firstRow_(await rpcSql_('dealership_update_vehicle', {
    p_vehicle_id: vehicleId,
    p_employee_id: user.employee_id,
    p_employee_name: user.employee_name,
    p_display_name: v.displayName,
    p_make: String(payload.make || '').trim(),
    p_model: String(payload.model || '').trim(),
    p_category: v.category,
    p_import_cost: v.importCost,
    p_msrp: v.msrp,
    p_sale_price: v.salePrice,
    p_suggested_buyback: v.buyback,
    p_active: payload.active === true,
    p_retired: payload.retired === true,
    p_reason: v.reason
  }));

  await auditLog_(
    user,
    'UPDATE',
    'VEHICLE',
    vehicleId,
    'Updated vehicle ' + v.displayName,
    {
      reason: v.reason,
      import_cost: v.importCost,
      msrp: v.msrp,
      sale_price: v.salePrice,
      suggested_buyback_price: v.buyback,
      active: payload.active === true,
      retired: payload.retired === true
    }
  );

  return data;
}

async function getVehicleCatalogueChanges(token, vehicleId) {
  const user = requireSession_(token);
  requireVehicleManager_(user);

  vehicleId = String(vehicleId || '').trim();
  if (!vehicleId) throw new Error('Vehicle ID is required.');

  return await selectSql_(
    'dealership_vehicle_change_log',
    '?select=change_id,vehicle_id,vehicle_code,vehicle_name,action_type,' +
    'old_values,new_values,reason,employee_name,created_at' +
    '&vehicle_id=eq.' + encodeURIComponent(vehicleId) +
    '&order=created_at.desc&limit=100'
  ) || [];
}

// ============================================================
// CATALOGUE INTELLIGENCE (21)
// ============================================================

async function getVehicleCatalogueIntelligence(token) {
  const user = requireSession_(token);
  requireVehicleManager_(user);

  const rows = await selectSql_(
    'dealership_vehicle_catalogue_intelligence',
    '?select=vehicle_id,vehicle_code,display_name,category,active,retired,' +
    'featured_priority,stock_qty,photo_key,has_photo,' +
    'units_sold_month,units_sold_30d,last_sale_at,' +
    'first_import_at,last_import_at,last_positive_stock_at,' +
    'is_in_stock,is_low_stock,is_new_arrival,is_popular,' +
    'is_slow_mover,is_back_in_stock,is_pdm_pick,is_retired_with_stock'
  ) || [];

  const activeRows = rows.filter(r => r.active === true && r.retired !== true);
  const activeCount = activeRows.length;
  const photoCount = activeRows.filter(r => r.has_photo === true).length;

  return {
    generated_at: new Date().toISOString(),
    summary: {
      active_vehicles: activeCount,
      photo_coverage_percent:
        activeCount ? Math.round((photoCount / activeCount) * 1000) / 10 : 0,
      missing_photo: activeRows.filter(r => r.has_photo !== true).length,
      in_stock: rows.filter(r => r.is_in_stock === true).length,
      low_stock: rows.filter(r => r.is_low_stock === true).length,
      new_arrivals: rows.filter(r => r.is_new_arrival === true).length,
      popular: rows.filter(r => r.is_popular === true).length,
      slow_movers: rows.filter(r => r.is_slow_mover === true).length,
      back_in_stock: rows.filter(r => r.is_back_in_stock === true).length,
      pdm_picks: rows.filter(r => r.is_pdm_pick === true).length,
      retired_with_stock: rows.filter(r => r.is_retired_with_stock === true).length
    },
    vehicles: rows
  };
}

// ============================================================
// PHOTO CAPTURE BRIDGE (22)
//
// Storage-safe photo keys: dealership_vehicle_photo_map.photo_key stays
// unchanged; only the Storage filename is ASCII-folded
// (SPO-Überm-1605 -> SPO-Uberm-1605.webp).
//
// The Apps Script version stashed each pdmphoto:// URL in CacheService
// behind a one-use ticket and served a launcher page from doGet. Here the
// launcher is a static page (dealership/photo-launch.html) and the
// protocol URL rides in the #fragment, which browsers never send to any
// server -- so the signed upload URL still never lands in a server log.
// ============================================================

const PDM_PHOTO_BUCKET_ = 'vehicle-images';
const PHOTO_LAUNCHER_PATH_ = '/dealership/photo-launch.html';

function pdmStorageSafePhotoKey_(value) {
  const original = String(value || '').trim();

  if (!original) {
    return '';
  }

  const safe = original
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x00-\x7F]/g, '');

  if (!safe) {
    throw new Error('Photo key could not be converted to a valid Storage filename.');
  }

  return safe;
}

async function createSupabaseVehicleSignedUpload_(filename) {
  const cfg = getSupabaseConfig_();

  const url = cfg.url + '/storage/v1/object/upload/sign/' +
    encodeURIComponent(PDM_PHOTO_BUCKET_) + '/' + encodeURIComponent(filename);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: cfg.key,
      Authorization: 'Bearer ' + cfg.key,
      'Content-Type': 'application/json',
      'x-upsert': 'true'
    },
    body: JSON.stringify({ upsert: true })
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error('Could not create Supabase signed upload URL (' + res.status + '): ' + text);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Supabase returned an invalid signed-upload response.');
  }

  const relativeUrl = String(data.url || data.signedURL || data.signedUrl || '').trim();

  if (!relativeUrl) {
    throw new Error('Supabase did not return a signed upload URL.');
  }

  if (/^https?:\/\//i.test(relativeUrl)) {
    return relativeUrl;
  }

  return cfg.url + '/storage/v1' + (relativeUrl.startsWith('/') ? '' : '/') + relativeUrl;
}

function buildPdmPhotoProtocolUrl_(data) {
  return 'pdmphoto://capture?' + [
    'vehicle=' + encodeURIComponent(data.vehicle_name || ''),
    'photo_key=' + encodeURIComponent(data.photo_key || ''),
    'filename=' + encodeURIComponent(data.filename || ''),
    'alt=' + (data.is_alt ? '1' : '0'),
    'upload_url=' + encodeURIComponent(data.upload_url || '')
  ].join('&');
}

function photoLauncherUrl_(protocolUrl) {
  return PHOTO_LAUNCHER_PATH_ + '#' + encodeURIComponent(protocolUrl);
}

async function createVehiclePhotoCaptureLinks(token, vehicleId) {
  const user = requireSession_(token);
  requireVehicleManager_(user);

  vehicleId = String(vehicleId || '').trim();

  if (!vehicleId) {
    throw new Error('Vehicle ID is required.');
  }

  const vehicleRows = await selectSql_(
    'vehicles',
    '?select=vehicle_id,vehicle_code,display_name' +
    '&vehicle_id=eq.' + encodeURIComponent(vehicleId) +
    '&limit=1'
  ) || [];

  if (!vehicleRows.length) {
    throw new Error('Vehicle could not be found.');
  }

  const vehicle = vehicleRows[0];

  const mapRows = await selectSql_(
    'dealership_vehicle_photo_map',
    '?select=photo_key,vehicle_name,vehicle_id' +
    '&vehicle_id=eq.' + encodeURIComponent(vehicleId) +
    '&limit=1'
  ) || [];

  let photoKey = mapRows.length ? String(mapRows[0].photo_key || '').trim() : '';

  // For genuinely new vehicles that have never had a legacy photo key,
  // use the permanent PDM vehicle code as the logical photo key.
  if (!photoKey) {
    photoKey = String(vehicle.vehicle_code || '').trim();

    if (!photoKey) {
      throw new Error('This vehicle has no usable photo key or vehicle code.');
    }

    await insertSql_('dealership_vehicle_photo_map', {
      photo_key: photoKey,
      vehicle_name: String(vehicle.display_name || ''),
      vehicle_id: vehicleId
    });
  }

  const storagePhotoKey = pdmStorageSafePhotoKey_(photoKey);
  const primaryFilename = storagePhotoKey + '.webp';
  const altFilename = storagePhotoKey + '_alt.webp';

  const [primarySigned, altSigned] = await Promise.all([
    createSupabaseVehicleSignedUpload_(primaryFilename),
    createSupabaseVehicleSignedUpload_(altFilename)
  ]);

  await auditLog_(
    user,
    'CREATE',
    'VEHICLE_PHOTO_UPLOAD',
    vehicleId,
    'Prepared signed vehicle photo upload links',
    {
      vehicle_code: String(vehicle.vehicle_code || ''),
      photo_key: photoKey,
      storage_photo_key: storagePhotoKey
    }
  );

  const vehicleName = String(vehicle.display_name || '');

  return {
    primary_launcher_url: photoLauncherUrl_(buildPdmPhotoProtocolUrl_({
      vehicle_name: vehicleName,
      photo_key: photoKey,
      filename: primaryFilename,
      is_alt: false,
      upload_url: primarySigned
    })),

    alt_launcher_url: photoLauncherUrl_(buildPdmPhotoProtocolUrl_({
      vehicle_name: vehicleName,
      photo_key: photoKey,
      filename: altFilename,
      is_alt: true,
      upload_url: altSigned
    }))
  };
}

module.exports = {
  functions: {
    getVehicleManagementData,
    addDealershipVehicle,
    updateDealershipVehicle,
    getVehicleCatalogueChanges,
    getVehicleCatalogueIntelligence,
    createVehiclePhotoCaptureLinks
  }
};
