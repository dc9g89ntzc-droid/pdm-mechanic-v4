-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Replaces catalogue pricing/categorisation with Joanna's reviewed real
-- autoparts-store + scrapyard data (the CSVs built across this session).
-- Existing items are matched by name (case-insensitively, and via a small
-- known-typo map for rows misspelled in the original 010 seed) and UPDATED
-- in place -- ids stay stable so job_items/service_materials references
-- never break. Names not already in the catalogue are INSERTed as new.
-- purchase_cost is always the Autoparts Store price when the item is sold
-- at both stores; the scrapyard price is informational only (schema has no
-- second purchase-cost slot) -- see notes on individual rows for the ones
-- where that mattered.

insert into catalogue_subcategories (name) values
  ('Chassis'),
  ('Exhaust'),
  ('Fluids'),
  ('Head Gasket'),
  ('Misc'),
  ('Scrap Material'),
  ('Spark Plug')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- Updates: 412 existing catalogue items
-- ---------------------------------------------------------------------
-- Aircraft Engine
update catalogue_items set
  name = 'Aircraft Engine',
  categories = '{"Aircraft"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Aircraft Parts'),
  sourcing = 'purchased',
  purchase_cost = 18050.0,
  customer_price = 19855.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Aircraft Engine'));

-- Aircraft Tire
update catalogue_items set
  name = 'Aircraft Tire',
  categories = '{"Aircraft"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Aircraft Parts'),
  sourcing = 'purchased',
  purchase_cost = 855.0,
  customer_price = 940.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Aircraft Tire'));

-- Landing Strut
update catalogue_items set
  name = 'Landing Strut',
  categories = '{"Aircraft"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Aircraft Parts'),
  sourcing = 'purchased',
  purchase_cost = 3087.5,
  customer_price = 3396.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Landing Strut'));

-- Body Filler
update catalogue_items set
  name = 'Body Filler',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Body & Panels'),
  sourcing = 'purchased',
  purchase_cost = 22.8,
  customer_price = 25.08,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Body Filler'));

-- Body Patch
update catalogue_items set
  name = 'Body Patch',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Body & Panels'),
  sourcing = 'purchased',
  purchase_cost = 49.2,
  customer_price = 54.12,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Body Patch'));

-- Exterior Cosmetics
update catalogue_items set
  name = 'Exterior Cosmetics',
  categories = '{"Customisation"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Body & Panels'),
  sourcing = 'purchased',
  purchase_cost = 35.5,
  customer_price = 39.05,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Exterior Cosmetics'));

-- Fiberglass Sheet
update catalogue_items set
  name = 'Fiberglass Sheet',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Body & Panels'),
  sourcing = 'purchased',
  purchase_cost = 93.0,
  customer_price = 102.3,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Fiberglass Sheet'));

-- Front Fender
update catalogue_items set
  name = 'Front Fender',
  categories = '{"Repair/Service","Customisation"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Body & Panels'),
  sourcing = 'purchased',
  purchase_cost = 162.6,
  customer_price = 178.86,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Front Fender'));

-- Hood
update catalogue_items set
  name = 'Hood',
  categories = '{"Repair/Service","Customisation"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Body & Panels'),
  sourcing = 'purchased',
  purchase_cost = 220.8,
  customer_price = 242.88,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Hood'));

-- Rear Fender
update catalogue_items set
  name = 'Rear Fender',
  categories = '{"Repair/Service","Customisation"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Body & Panels'),
  sourcing = 'purchased',
  purchase_cost = 162.6,
  customer_price = 178.86,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Rear Fender'));

-- Trunk Lid
update catalogue_items set
  name = 'Trunk Lid',
  categories = '{"Repair/Service","Customisation"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Body & Panels'),
  sourcing = 'purchased',
  purchase_cost = 197.4,
  customer_price = 217.14,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Trunk Lid'));

-- Vehicle Exhaust
update catalogue_items set
  name = 'Vehicle Exhaust',
  categories = '{"Repair/Service","Customisation"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Body & Panels'),
  sourcing = 'purchased',
  purchase_cost = 61.5,
  customer_price = 67.65,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Vehicle Exhaust'));

-- Vehicle Extra Part
update catalogue_items set
  name = 'Vehicle Extra Part',
  categories = '{"Repair/Service","Customisation"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Body & Panels'),
  sourcing = 'purchased',
  purchase_cost = 470.0,
  customer_price = 517.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Vehicle Extra Part'));

-- Vehicle Front Bumper
update catalogue_items set
  name = 'Vehicle Front Bumper',
  categories = '{"Repair/Service","Customisation"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Body & Panels'),
  sourcing = 'purchased',
  purchase_cost = 87.5,
  customer_price = 96.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Vehicle Front Bumper'));

-- Vehicle Grille
update catalogue_items set
  name = 'Vehicle Grille',
  categories = '{"Repair/Service","Customisation"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Body & Panels'),
  sourcing = 'purchased',
  purchase_cost = 64.0,
  customer_price = 70.4,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Vehicle Grille'));

-- Vehicle Rear Bumper
update catalogue_items set
  name = 'Vehicle Rear Bumper',
  categories = '{"Repair/Service","Customisation"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Body & Panels'),
  sourcing = 'purchased',
  purchase_cost = 95.0,
  customer_price = 104.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Vehicle Rear Bumper'));

-- Vehicle Roof
update catalogue_items set
  name = 'Vehicle Roof',
  categories = '{"Repair/Service","Customisation"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Body & Panels'),
  sourcing = 'purchased',
  purchase_cost = 68.5,
  customer_price = 75.35,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Vehicle Roof'));

-- Vehicle Skirts
update catalogue_items set
  name = 'Vehicle Skirts',
  categories = '{"Repair/Service","Customisation"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Body & Panels'),
  sourcing = 'purchased',
  purchase_cost = 47.5,
  customer_price = 52.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Vehicle Skirts'));

-- Vehicle Spoiler
update catalogue_items set
  name = 'Vehicle Spoiler',
  categories = '{"Repair/Service","Customisation"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Body & Panels'),
  sourcing = 'purchased',
  purchase_cost = 47.5,
  customer_price = 52.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Vehicle Spoiler'));

-- Brake Rotor
update catalogue_items set
  name = 'Brake Rotor',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Brakes'),
  sourcing = 'purchased',
  purchase_cost = 151.2,
  customer_price = 166.32,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Brake Rotor'));

-- Race Brake Pads
update catalogue_items set
  name = 'Race Brake Pads',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Brakes'),
  sourcing = 'purchased',
  purchase_cost = 1513.2,
  customer_price = 1664.52,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Race Brake Pads'));

-- Sport Brake Pads
update catalogue_items set
  name = 'Sport Brake Pads',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Brakes'),
  sourcing = 'purchased',
  purchase_cost = 756.6,
  customer_price = 832.26,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Sport Brake Pads'));

-- Stock Brake Pads
update catalogue_items set
  name = 'Stock Brake Pads',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Brakes'),
  sourcing = 'purchased',
  purchase_cost = 174.6,
  customer_price = 192.06,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Stock Brake Pads'));

-- Street Brake Pads
update catalogue_items set
  name = 'Street Brake Pads',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Brakes'),
  sourcing = 'purchased',
  purchase_cost = 378.0,
  customer_price = 415.8,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Street Brake Pads'));

-- Performance Camshaft
update catalogue_items set
  name = 'Performance Camshaft',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Camshafts'),
  sourcing = 'purchased',
  purchase_cost = 261.0,
  customer_price = 287.1,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Performance Camshaft'));

-- Race Camshaft
update catalogue_items set
  name = 'Race Camshaft',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Camshafts'),
  sourcing = 'purchased',
  purchase_cost = 760.0,
  customer_price = 836.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Race Camshaft'));

-- Stock/Mild Camshaft
update catalogue_items set
  name = 'Stock/Mild Camshaft',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Camshafts'),
  sourcing = 'purchased',
  purchase_cost = 71.0,
  customer_price = 78.1,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Stock/Mild Camshaft'));

-- Street Perf Camshaft
update catalogue_items set
  name = 'Street Perf Camshaft',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Camshafts'),
  sourcing = 'purchased',
  purchase_cost = 180.5,
  customer_price = 198.55,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Street Perf Camshaft'));

-- Torque/Tow Camshaft
update catalogue_items set
  name = 'Torque/Tow Camshaft',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Camshafts'),
  sourcing = 'purchased',
  purchase_cost = 152.0,
  customer_price = 167.2,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Torquenow Camshaft'));

-- H-Beam Billet Aluminum Connecting Rod
update catalogue_items set
  name = 'H-Beam Billet Aluminum Connecting Rod',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Connecting Rods'),
  sourcing = 'purchased',
  purchase_cost = 218.5,
  customer_price = 240.35,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('H-Beam Billet Aluminum Connecting Rod'));

-- H-Beam Billet Steel Connecting Rod
update catalogue_items set
  name = 'H-Beam Billet Steel Connecting Rod',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Connecting Rods'),
  sourcing = 'purchased',
  purchase_cost = 175.5,
  customer_price = 193.05,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('H-Beam Billet Steel Connecting Rod'));

-- H-Beam Cast Aluminum Connecting Rod
update catalogue_items set
  name = 'H-Beam Cast Aluminum Connecting Rod',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Connecting Rods'),
  sourcing = 'purchased',
  purchase_cost = 63.6,
  customer_price = 69.96,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('H-Beam Cast Aluminum Connecting Rod'));

-- H-Beam Cast Iron Connecting Rod
update catalogue_items set
  name = 'H-Beam Cast Iron Connecting Rod',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Connecting Rods'),
  sourcing = 'purchased',
  purchase_cost = 40.2,
  customer_price = 44.22,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('H-Beam Cast Iron Connecting Rod'));

-- H-Beam Cast Steel Connecting Rod
update catalogue_items set
  name = 'H-Beam Cast Steel Connecting Rod',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Connecting Rods'),
  sourcing = 'purchased',
  purchase_cost = 58.2,
  customer_price = 64.02,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('H-Beam Cast Steel Connecting Rod'));

-- H-Beam Forged Aluminum Connecting Rod
update catalogue_items set
  name = 'H-Beam Forged Aluminum Connecting Rod',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Connecting Rods'),
  sourcing = 'purchased',
  purchase_cost = 123.5,
  customer_price = 135.85,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('H-Beam Forged Aluminum Connecting Rod'));

-- H-Beam Forged Steel Connecting Rod
update catalogue_items set
  name = 'H-Beam Forged Steel Connecting Rod',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Connecting Rods'),
  sourcing = 'purchased',
  purchase_cost = 90.0,
  customer_price = 99.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('H-Beam Forged Steel Connecting Rod'));

-- H-Beam Powder Metal Connecting Rod
update catalogue_items set
  name = 'H-Beam Powder Metal Connecting Rod',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Connecting Rods'),
  sourcing = 'purchased',
  purchase_cost = 71.0,
  customer_price = 78.1,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('H-Beam Powder Metal Connecting Rod'));

-- H-Beam Titanium Connecting Rod
update catalogue_items set
  name = 'H-Beam Titanium Connecting Rod',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Connecting Rods'),
  sourcing = 'purchased',
  purchase_cost = 408.5,
  customer_price = 449.35,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('H-Beam Titanium Connecting Rod'));

-- I-Beam Billet Aluminum Connecting Rod
update catalogue_items set
  name = 'I-Beam Billet Aluminum Connecting Rod',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Connecting Rods'),
  sourcing = 'purchased',
  purchase_cost = 190.0,
  customer_price = 209.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('I-Beam Billet Aluminum Connecting Rod'));

-- I-Beam Billet Steel Connecting Rod
update catalogue_items set
  name = 'I-Beam Billet Steel Connecting Rod',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Connecting Rods'),
  sourcing = 'purchased',
  purchase_cost = 152.0,
  customer_price = 167.2,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('I-Beam Billet Steel Connecting Rod'));

-- I-Beam Cast Aluminum Connecting Rod
update catalogue_items set
  name = 'I-Beam Cast Aluminum Connecting Rod',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Connecting Rods'),
  sourcing = 'purchased',
  purchase_cost = 55.2,
  customer_price = 60.72,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('I-Beam Cast Aluminum Connecting Rod'));

-- I-Beam Cast Iron Connecting Rod
update catalogue_items set
  name = 'I-Beam Cast Iron Connecting Rod',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Connecting Rods'),
  sourcing = 'purchased',
  purchase_cost = 34.8,
  customer_price = 38.28,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('I-Beam Cast Iron Connecting Rod'));

-- I-Beam Cast Steel Connecting Rod
update catalogue_items set
  name = 'I-Beam Cast Steel Connecting Rod',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Connecting Rods'),
  sourcing = 'purchased',
  purchase_cost = 49.2,
  customer_price = 54.12,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('I-Beam Cast Steel Connecting Rod'));

-- I-Beam Forged Aluminum Connecting Rod
update catalogue_items set
  name = 'I-Beam Forged Aluminum Connecting Rod',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Connecting Rods'),
  sourcing = 'purchased',
  purchase_cost = 109.0,
  customer_price = 119.9,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('I-Beam Forged Aluminum Connecting Rod'));

-- I-Beam Forged Steel Connecting Rod
update catalogue_items set
  name = 'I-Beam Forged Steel Connecting Rod',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Connecting Rods'),
  sourcing = 'purchased',
  purchase_cost = 76.0,
  customer_price = 83.6,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('I-Beam Forged Steel Connecting Rod'));

-- I-Beam Powder Metal Connecting Rod
update catalogue_items set
  name = 'I-Beam Powder Metal Connecting Rod',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Connecting Rods'),
  sourcing = 'purchased',
  purchase_cost = 61.5,
  customer_price = 67.65,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('I-Beam Powder Metal Connecting Rod'));

-- I-Beam Titanium Connecting Rod
update catalogue_items set
  name = 'I-Beam Titanium Connecting Rod',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Connecting Rods'),
  sourcing = 'purchased',
  purchase_cost = 356.0,
  customer_price = 391.6,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('I-Beam Titanium Connecting Rod'));

-- X-Beam Billet Aluminum Connecting Rod
update catalogue_items set
  name = 'X-Beam Billet Aluminum Connecting Rod',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Connecting Rods'),
  sourcing = 'purchased',
  purchase_cost = 247.0,
  customer_price = 271.7,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('X-Beam Billet Aluminum Connecting Rod'));

-- X-Beam Billet Steel Connecting Rod
update catalogue_items set
  name = 'X-Beam Billet Steel Connecting Rod',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Connecting Rods'),
  sourcing = 'purchased',
  purchase_cost = 199.5,
  customer_price = 219.45,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('X-Beam Billet Steel Connecting Rod'));

-- X-Beam Cast Aluminum Connecting Rod
update catalogue_items set
  name = 'X-Beam Cast Aluminum Connecting Rod',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Connecting Rods'),
  sourcing = 'purchased',
  purchase_cost = 69.6,
  customer_price = 76.56,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('X-Beam Cast Aluminum Connecting Rod'));

-- X-Beam Cast Iron Connecting Rod
update catalogue_items set
  name = 'X-Beam Cast Iron Connecting Rod',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Connecting Rods'),
  sourcing = 'purchased',
  purchase_cost = 46.2,
  customer_price = 50.82,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('X-Beam Cast Iron Connecting Rod'));

-- X-Beam Cast Steel Connecting Rod
update catalogue_items set
  name = 'X-Beam Cast Steel Connecting Rod',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Connecting Rods'),
  sourcing = 'purchased',
  purchase_cost = 63.6,
  customer_price = 69.96,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('X-Beam Cast Steel Connecting Rod'));

-- X-Beam Forged Aluminum Connecting Rod
update catalogue_items set
  name = 'X-Beam Forged Aluminum Connecting Rod',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Connecting Rods'),
  sourcing = 'purchased',
  purchase_cost = 142.5,
  customer_price = 156.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('X-Beam Forged Aluminum Connecting Rod'));

-- X-Beam Forged Steel Connecting Rod
update catalogue_items set
  name = 'X-Beam Forged Steel Connecting Rod',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Connecting Rods'),
  sourcing = 'purchased',
  purchase_cost = 99.5,
  customer_price = 109.45,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('X-Beam Forged Steel Connecting Rod'));

-- X-Beam Powder Metal Connecting Rod
update catalogue_items set
  name = 'X-Beam Powder Metal Connecting Rod',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Connecting Rods'),
  sourcing = 'purchased',
  purchase_cost = 80.5,
  customer_price = 88.55,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('X-Beam Powder Metal Connecting Rod'));

-- X-Beam Titanium Connecting Rod
update catalogue_items set
  name = 'X-Beam Titanium Connecting Rod',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Connecting Rods'),
  sourcing = 'purchased',
  purchase_cost = 465.5,
  customer_price = 512.05,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('X-Beam Titanium Connecting Rod'));

-- Race Radiator
update catalogue_items set
  name = 'Race Radiator',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Cooling'),
  sourcing = 'purchased',
  purchase_cost = 1140.0,
  customer_price = 1254.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Race Radiator'));

-- Sport Radiator
update catalogue_items set
  name = 'Sport Radiator',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Cooling'),
  sourcing = 'purchased',
  purchase_cost = 712.5,
  customer_price = 783.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Sport Radiator'));

-- Street Radiator
update catalogue_items set
  name = 'Street Radiator',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Cooling'),
  sourcing = 'purchased',
  purchase_cost = 427.5,
  customer_price = 470.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Street Radiator'));

-- Billet Crankshaft
update catalogue_items set
  name = 'Billet Crankshaft',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Crankshafts'),
  sourcing = 'purchased',
  purchase_cost = 2137.5,
  customer_price = 2351.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Crankshaft'));

-- Cast Crankshaft
update catalogue_items set
  name = 'Cast Crankshaft',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Crankshafts'),
  sourcing = 'purchased',
  purchase_cost = 261.6,
  customer_price = 287.76,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Crankshaft'));

-- Forged Crankshaft
update catalogue_items set
  name = 'Forged Crankshaft',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Crankshafts'),
  sourcing = 'purchased',
  purchase_cost = 570.0,
  customer_price = 627.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Forged Crankshaft'));

-- Factory Cast Aluminum Cylinder Head
update catalogue_items set
  name = 'Factory Cast Aluminum Cylinder Head',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Cylinder Heads'),
  sourcing = 'purchased',
  purchase_cost = 407.4,
  customer_price = 448.14,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Factory Cast Aluminum Cylinder Head'));

-- Factory Cast Iron Cylinder Head
update catalogue_items set
  name = 'Factory Cast Iron Cylinder Head',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Cylinder Heads'),
  sourcing = 'purchased',
  purchase_cost = 291.0,
  customer_price = 320.1,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Factory Cast Iron Cylinder Head'));

-- Factory Cast Steel Cylinder Head
update catalogue_items set
  name = 'Factory Cast Steel Cylinder Head',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Cylinder Heads'),
  sourcing = 'purchased',
  purchase_cost = 349.2,
  customer_price = 384.12,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Factory Cast Steel Cylinder Head'));

-- Factory Forged Aluminum Cylinder Head
update catalogue_items set
  name = 'Factory Forged Aluminum Cylinder Head',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Cylinder Heads'),
  sourcing = 'purchased',
  purchase_cost = 855.0,
  customer_price = 940.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Factory Forged Aluminum Cylinder Head'));

-- Factory Forged Steel Cylinder Head
update catalogue_items set
  name = 'Factory Forged Steel Cylinder Head',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Cylinder Heads'),
  sourcing = 'purchased',
  purchase_cost = 522.5,
  customer_price = 574.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Factory Forged Steel Cylinder Head'));

-- Ported & Polished Cast Aluminum Cylinder Head
update catalogue_items set
  name = 'Ported & Polished Cast Aluminum Cylinder Head',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Cylinder Heads'),
  sourcing = 'purchased',
  purchase_cost = 522.5,
  customer_price = 574.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Ported & Polished Cast Aluminum Cylinder Head'));

-- Ported & Polished Cast Iron Cylinder Head
update catalogue_items set
  name = 'Ported & Polished Cast Iron Cylinder Head',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Cylinder Heads'),
  sourcing = 'purchased',
  purchase_cost = 380.0,
  customer_price = 418.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Ported & Polished Cast Iron Cylinder Head'));

-- Ported & Polished Cast Steel Cylinder Head
update catalogue_items set
  name = 'Ported & Polished Cast Steel Cylinder Head',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Cylinder Heads'),
  sourcing = 'purchased',
  purchase_cost = 456.0,
  customer_price = 501.6,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Ported & Polished Cast Steel Cylinder Head'));

-- Ported & Polished Forged Aluminum Cylinder Head
update catalogue_items set
  name = 'Ported & Polished Forged Aluminum Cylinder Head',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Cylinder Heads'),
  sourcing = 'purchased',
  purchase_cost = 1377.5,
  customer_price = 1515.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Ported & Polished Forged Aluminum Cylinder Head'));

-- Ported & Polished Forged Steel Cylinder Head
update catalogue_items set
  name = 'Ported & Polished Forged Steel Cylinder Head',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Cylinder Heads'),
  sourcing = 'purchased',
  purchase_cost = 831.0,
  customer_price = 914.1,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Ported & Polished Forgetsteel Cylinder Head'));

-- 4WD Conversion Kit
update catalogue_items set
  name = '4WD Conversion Kit',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Drivetrain'),
  sourcing = 'purchased',
  purchase_cost = 2850.0,
  customer_price = 3135.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('4WD Conversion Kit'));

-- AWD Conversion Kit
update catalogue_items set
  name = 'AWD Conversion Kit',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Drivetrain'),
  sourcing = 'purchased',
  purchase_cost = 2612.5,
  customer_price = 2873.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('AWD Conversion Kit'));

-- Differential Re-Gear Kit
update catalogue_items set
  name = 'Differential Re-Gear Kit',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Drivetrain'),
  sourcing = 'purchased',
  purchase_cost = 617.5,
  customer_price = 679.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Differential Re-Gear Kit'));

-- Drivetrain Part
update catalogue_items set
  name = 'Drivetrain Part',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Drivetrain'),
  sourcing = 'purchased',
  purchase_cost = 308.5,
  customer_price = 339.35,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Drivetrain Part'));

-- FWD Conversion Kit
update catalogue_items set
  name = 'FWD Conversion Kit',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Drivetrain'),
  sourcing = 'purchased',
  purchase_cost = 1425.0,
  customer_price = 1567.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('FWD Conversion Kit'));

-- RWD Conversion Kit
update catalogue_items set
  name = 'RWD Conversion Kit',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Drivetrain'),
  sourcing = 'purchased',
  purchase_cost = 1425.0,
  customer_price = 1567.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('RWD Conversion Kit'));

-- EV Drive Motor
update catalogue_items set
  name = 'EV Drive Motor',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'EV Components'),
  sourcing = 'purchased',
  purchase_cost = 6412.5,
  customer_price = 7053.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('EV Drive Motor'));

-- EV Power Inverter
update catalogue_items set
  name = 'EV Power Inverter',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'EV Components'),
  sourcing = 'purchased',
  purchase_cost = 1995.0,
  customer_price = 2194.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('EV Power Inverter'));

-- EV Traction Battery
update catalogue_items set
  name = 'EV Traction Battery',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'EV Components'),
  sourcing = 'purchased',
  purchase_cost = 3206.0,
  customer_price = 3526.6,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('EV Traction Battery'));

-- Air Filter
update catalogue_items set
  name = 'Air Filter',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine'),
  sourcing = 'purchased',
  purchase_cost = 24.0,
  customer_price = 26.4,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Air Filter'));

-- Copper Standard Spark Plug
update catalogue_items set
  name = 'Copper Standard Spark Plug',
  categories = '{"Repair/Service","Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Spark Plug'),
  sourcing = 'purchased',
  purchase_cost = 11.4,
  customer_price = 12.54,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Copper Standard Spark Plug'));

-- Head Gasket Set
update catalogue_items set
  name = 'Head Gasket Set',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Head Gasket'),
  sourcing = 'purchased',
  purchase_cost = 71.0,
  customer_price = 78.1,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Head Gasket Set'));

-- Iridium Spark Plug
update catalogue_items set
  name = 'Iridium Spark Plug',
  categories = '{"Repair/Service","Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Spark Plug'),
  sourcing = 'purchased',
  purchase_cost = 34.8,
  customer_price = 38.28,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Iridium Spark Plug'));

-- Platinum Spark Plug
update catalogue_items set
  name = 'Platinum Spark Plug',
  categories = '{"Repair/Service","Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Spark Plug'),
  sourcing = 'purchased',
  purchase_cost = 19.8,
  customer_price = 21.78,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Platinum Spark Plug'));

-- Aluminum-Tin Conrod Bearing
update catalogue_items set
  name = 'Aluminum-Tin Conrod Bearing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Bearings'),
  sourcing = 'purchased',
  purchase_cost = 19.8,
  customer_price = 21.78,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Aluminum-Tin Conrod Bearing'));

-- Aluminum-Tin Main Bearing
update catalogue_items set
  name = 'Aluminum-Tin Main Bearing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Bearings'),
  sourcing = 'purchased',
  purchase_cost = 22.8,
  customer_price = 25.08,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Aluminum-Tin Main Bearing'));

-- Bi-Metal Race Conrod Bearing
update catalogue_items set
  name = 'Bi-Metal Race Conrod Bearing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Bearings'),
  sourcing = 'purchased',
  purchase_cost = 43.2,
  customer_price = 47.52,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Bi-Metal Race Conrod Bearing'));

-- Bi-Metal Race Main Bearing
update catalogue_items set
  name = 'Bi-Metal Race Main Bearing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Bearings'),
  sourcing = 'purchased',
  purchase_cost = 49.2,
  customer_price = 54.12,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Bi-Metal Race Main Bearing'));

-- Tri-Metal Conrod Bearing
update catalogue_items set
  name = 'Tri-Metal Conrod Bearing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Bearings'),
  sourcing = 'purchased',
  purchase_cost = 11.4,
  customer_price = 12.54,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Tri-Metal Conrod Bearing'));

-- Tri-Metal Main Bearing
update catalogue_items set
  name = 'Tri-Metal Main Bearing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Bearings'),
  sourcing = 'purchased',
  purchase_cost = 14.4,
  customer_price = 15.84,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Tri-Metal Main Bearing'));

-- Billet Aluminum Flat 2 Engine Block
update catalogue_items set
  name = 'Billet Aluminum Flat 2 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1116.0,
  customer_price = 1227.6,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Aluminum Flat 2 Engine Block'));

-- Billet Aluminum Flat 4 Engine Block
update catalogue_items set
  name = 'Billet Aluminum Flat 4 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1591.0,
  customer_price = 1750.1,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Aluminum Flat 4 Engine Block'));

-- Billet Aluminum Flat 6 Engine Block
update catalogue_items set
  name = 'Billet Aluminum Flat 6 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 2090.0,
  customer_price = 2299.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Aluminum Flat 6 Engine Block'));

-- Billet Aluminum Flat 8 Engine Block
update catalogue_items set
  name = 'Billet Aluminum Flat 8 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 2588.5,
  customer_price = 2847.35,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Aluminum Flat 8 Engine Block'));

-- Billet Aluminum Inline 4 Engine Block
update catalogue_items set
  name = 'Billet Aluminum Inline 4 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1377.5,
  customer_price = 1515.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Aluminum Inline 4 Engine Block'));

-- Billet Aluminum Inline 5 Engine Block
update catalogue_items set
  name = 'Billet Aluminum Inline 5 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1615.0,
  customer_price = 1776.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Aluminum Inline 5 Engine Block'));

-- Billet Aluminum Inline 6 Engine Block
update catalogue_items set
  name = 'Billet Aluminum Inline 6 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1805.0,
  customer_price = 1985.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Aluminum Inline 6 Engine Block'));

-- Billet Aluminum Inline 8 Engine Block
update catalogue_items set
  name = 'Billet Aluminum Inline 8 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 2232.5,
  customer_price = 2455.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Aluminum Inline 8 Engine Block'));

-- Billet Aluminum L4 Engine Block
update catalogue_items set
  name = 'Billet Aluminum L4 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1377.5,
  customer_price = 1515.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Aluminum L4 Engine Block'));

-- Billet Aluminum Single Piston Engine Block
update catalogue_items set
  name = 'Billet Aluminum Single Piston Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 760.0,
  customer_price = 836.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Aluminum Single Piston Engine Block'));

-- Billet Aluminum V-Twin Engine Block
update catalogue_items set
  name = 'Billet Aluminum V-Twin Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1068.5,
  customer_price = 1175.35,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Aluminum V-Twin Engine Block'));

-- Billet Aluminum V10 Engine Block
update catalogue_items set
  name = 'Billet Aluminum V10 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 2945.0,
  customer_price = 3239.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Aluminum VIO Engine Block'));

-- Billet Aluminum V12 Engine Block
update catalogue_items set
  name = 'Billet Aluminum V12 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 3420.0,
  customer_price = 3762.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Aluminum V12 Engine Block'));

-- Billet Aluminum V16 Engine Block
update catalogue_items set
  name = 'Billet Aluminum V16 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 4346.0,
  customer_price = 4780.6,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Aluminum V16 Engine Block'));

-- Billet Aluminum V4 Engine Block
update catalogue_items set
  name = 'Billet Aluminum V4 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1520.0,
  customer_price = 1672.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Aluminum V4 Engine Block'));

-- Billet Aluminum V6 Engine Block
update catalogue_items set
  name = 'Billet Aluminum V6 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1995.0,
  customer_price = 2194.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Aluminum V6 Engine Block'));

-- Billet Aluminum V8 Engine Block
update catalogue_items set
  name = 'Billet Aluminum V8 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 2470.0,
  customer_price = 2717.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Aluminum V8 Engine Block'));

-- Billet Aluminum W12 Engine Block
update catalogue_items set
  name = 'Billet Aluminum W12 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 4180.0,
  customer_price = 4598.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Afuminum W12 Engine Block'));

-- Billet Aluminum W16 Engine Block
update catalogue_items set
  name = 'Billet Aluminum W16 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 5320.0,
  customer_price = 5852.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Aluminum W16 Engine Block'));

-- Billet Aluminum W18 Engine Block
update catalogue_items set
  name = 'Billet Aluminum W18 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 5937.5,
  customer_price = 6531.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Aluminum W18 Engine Block'));

-- Billet Aluminum W6 Engine Block
update catalogue_items set
  name = 'Billet Aluminum W6 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 2446.0,
  customer_price = 2690.6,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Aluminum W6 Engine Block'));

-- Billet Aluminum W8 Engine Block
update catalogue_items set
  name = 'Billet Aluminum W8 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 3040.0,
  customer_price = 3344.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Aluminum W8 Engine Block'));

-- Billet Steel Flat 2 Engine Block
update catalogue_items set
  name = 'Billet Steel Flat 2 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 617.5,
  customer_price = 679.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Steel Flat 2 Engine Block'));

-- Billet Steel Flat 4 Engine Block
update catalogue_items set
  name = 'Billet Steel Flat 4 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 878.5,
  customer_price = 966.35,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Steel Flat 4 Engine Block'));

-- Billet Steel Flat 6 Engine Block
update catalogue_items set
  name = 'Billet Steel Flat 6 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1163.5,
  customer_price = 1279.85,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Steel Flat 6 Engine'));

-- Billet Steel Flat 8 Engine Block
update catalogue_items set
  name = 'Billet Steel Flat 8 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1425.0,
  customer_price = 1567.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Steel Flat 8 Engine'));

-- Billet Steel Inline 3 Engine Block
update catalogue_items set
  name = 'Billet Steel Inline 3 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 665.0,
  customer_price = 731.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Steel Inline 3 Engine Block'));

-- Billet Steel Inline 4 Engine Block
update catalogue_items set
  name = 'Billet Steel Inline 4 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 760.0,
  customer_price = 836.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Steel Inline 4 Engine Block'));

-- Billet Steel Inline 5 Engine Block
update catalogue_items set
  name = 'Billet Steel Inline 5 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 902.5,
  customer_price = 992.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Steel Inline 5 Engine Block'));

-- Billet Steel Inline 6 Engine Block
update catalogue_items set
  name = 'Billet Steel Inline 6 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 997.5,
  customer_price = 1097.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Steel Inline 6 Engine Block'));

-- Billet Steel Inline 8 Engine Block
update catalogue_items set
  name = 'Billet Steel Inline 8 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1235.0,
  customer_price = 1358.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Steel Inline 8 Engine Block'));

-- Billet Steel L4 Engine Block
update catalogue_items set
  name = 'Billet Steel L4 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 760.0,
  customer_price = 836.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Steel L4 Engine Block'));

-- Billet Steel Single Piston Engine Block
update catalogue_items set
  name = 'Billet Steel Single Piston Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 418.0,
  customer_price = 459.8,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Steel Single Piston Engine Block'));

-- Billet Steel V-Twin Engine Block
update catalogue_items set
  name = 'Billet Steel V-Twin Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 593.5,
  customer_price = 652.85,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Steel V-Twin Engine Block'));

-- Billet Steel V10 Engine Block
update catalogue_items set
  name = 'Billet Steel V10 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1638.5,
  customer_price = 1802.35,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Steel VIO Engine Block'));

-- Billet Steel V16 Engine Block
update catalogue_items set
  name = 'Billet Steel V16 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 2422.5,
  customer_price = 2664.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Steel V16 Engine Block'));

-- Billet Steel V4 Engine Block
update catalogue_items set
  name = 'Billet Steel V4 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 855.0,
  customer_price = 940.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Steel V4 Engine Block'));

-- Billet Steel V6 Engine Block
update catalogue_items set
  name = 'Billet Steel V6 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1116.0,
  customer_price = 1227.6,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Steel V6 Engine Block'));

-- Billet Steel V8 Engine Block
update catalogue_items set
  name = 'Billet Steel V8 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1377.5,
  customer_price = 1515.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Steel V8 Engine Block'));

-- Billet Steel W16 Engine Block
update catalogue_items set
  name = 'Billet Steel W16 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 2968.5,
  customer_price = 3265.35,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Steel W16 Engine Block'));

-- Billet Steel W18 Engine Block
update catalogue_items set
  name = 'Billet Steel W18 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 3277.5,
  customer_price = 3605.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Steel W18 Engine Block'));

-- Billet Steel W6 Engine Block
update catalogue_items set
  name = 'Billet Steel W6 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1353.5,
  customer_price = 1488.85,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Steel W6 Engine Block'));

-- Billet Steel W8 Engine Block
update catalogue_items set
  name = 'Billet Steel W8 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1686.0,
  customer_price = 1854.6,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Steel W8 Engine Block'));

-- Cast Aluminum Flat 2 Engine Block
update catalogue_items set
  name = 'Cast Aluminum Flat 2 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 418.8,
  customer_price = 460.68,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Aluminum Flat 2 Engine Block'));

-- Cast Aluminum Flat 4 Engine Block
update catalogue_items set
  name = 'Cast Aluminum Flat 4 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 610.8,
  customer_price = 671.88,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Aluminum Flat 4 Engine Block'));

-- Cast Aluminum Flat 6 Engine Block
update catalogue_items set
  name = 'Cast Aluminum Flat 6 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 785.4,
  customer_price = 863.94,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Aluminum Flat 6 Engine Block'));

-- Cast Aluminum Flat 8 Engine Block
update catalogue_items set
  name = 'Cast Aluminum Flat 8 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 989.4,
  customer_price = 1088.34,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Aluminum Flat 8 Engine Block'));

-- Cast Aluminum Inline 4 Engine Block
update catalogue_items set
  name = 'Cast Aluminum Inline 4 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 529.2,
  customer_price = 582.12,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Aluminum Inline 4 Engine Block'));

-- Cast Aluminum Inline 5 Engine Block
update catalogue_items set
  name = 'Cast Aluminum Inline 5 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 610.8,
  customer_price = 671.88,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Aluminum Inline 5 Engine Block'));

-- Cast Aluminum Inline 6 Engine Block
update catalogue_items set
  name = 'Cast Aluminum Inline 6 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 698.4,
  customer_price = 768.24,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Aluminum Inline 6 Engine Block'));

-- Cast Aluminum Inline 8 Engine Block
update catalogue_items set
  name = 'Cast Aluminum Inline 8 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 843.6,
  customer_price = 927.96,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Aluminum Inline 8 Engine Block'));

-- Cast Aluminum L4 Engine Block
update catalogue_items set
  name = 'Cast Aluminum L4 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 529.2,
  customer_price = 582.12,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Aluminum L4 Engine Block'));

-- Cast Aluminum Single Piston Engine Block
update catalogue_items set
  name = 'Cast Aluminum Single Piston Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 285.0,
  customer_price = 313.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Aluminum Single Piston Engine Block'));

-- Cast Aluminum V-Twin Engine Block
update catalogue_items set
  name = 'Cast Aluminum V-Twin Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 401.4,
  customer_price = 441.54,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Aluminum V-Twin Engine Block'));

-- Cast Aluminum V10 Engine Block
update catalogue_items set
  name = 'Cast Aluminum V10 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1105.8,
  customer_price = 1216.38,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Afuminum VIO Engine Block'));

-- Cast Aluminum V12 Engine Block
update catalogue_items set
  name = 'Cast Aluminum V12 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1309.2,
  customer_price = 1440.12,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Aluminum V12 Engine Block'));

-- Cast Aluminum V16 Engine Block
update catalogue_items set
  name = 'Cast Aluminum V16 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1658.4,
  customer_price = 1824.24,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Afuminum V16 Engine Block'));

-- Cast Aluminum V4 Engine Block
update catalogue_items set
  name = 'Cast Aluminum V4 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 582.0,
  customer_price = 640.2,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Aluminum V4 Engine Block'));

-- Cast Aluminum V6 Engine Block
update catalogue_items set
  name = 'Cast Aluminum V6 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 756.6,
  customer_price = 832.26,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Aluminum V6 Engine Block'));

-- Cast Aluminum V8 Engine Block
update catalogue_items set
  name = 'Cast Aluminum V8 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 931.2,
  customer_price = 1024.32,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Aluminum V8 Engine Block'));

-- Cast Aluminum W12 Engine Block
update catalogue_items set
  name = 'Cast Aluminum W12 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1600.2,
  customer_price = 1760.22,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Afuminum W12 Engine Block'));

-- Cast Aluminum W16 Engine Block
update catalogue_items set
  name = 'Cast Aluminum W16 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 2037.0,
  customer_price = 2240.7,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Afuminum W16 Engine Block'));

-- Cast Aluminum W18 Engine Block
update catalogue_items set
  name = 'Cast Aluminum W18 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 2240.4,
  customer_price = 2464.44,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Aluminum W18 Engine Block'));

-- Cast Aluminum W6 Engine Block
update catalogue_items set
  name = 'Cast Aluminum W6 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 931.2,
  customer_price = 1024.32,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Afuminum W6 Engine Block'));

-- Cast Aluminum W8 Engine Block
update catalogue_items set
  name = 'Cast Aluminum W8 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1164.0,
  customer_price = 1280.4,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Aluminum W8 Engine Block'));

-- Cast Iron Flat 2 Engine Block
update catalogue_items set
  name = 'Cast Iron Flat 2 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 302.4,
  customer_price = 332.64,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron Flat 2 Engine Block'));

-- Cast Iron Flat 4 Engine Block
update catalogue_items set
  name = 'Cast Iron Flat 4 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 436.2,
  customer_price = 479.82,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron Flat 4 Engine Block'));

-- Cast Iron Flat 6 Engine Block
update catalogue_items set
  name = 'Cast Iron Flat 6 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 570.0,
  customer_price = 627.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron Flat 6 Engine Block'));

-- Cast Iron Flat 8 Engine Block
update catalogue_items set
  name = 'Cast Iron Flat 8 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 698.4,
  customer_price = 768.24,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron Flat 8 Engine'));

-- Cast Iron Inline 3 Engine Block
update catalogue_items set
  name = 'Cast Iron Inline 3 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 319.8,
  customer_price = 351.78,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron Inline 3 Engine Block'));

-- Cast Iron Inline 4 Engine Block
update catalogue_items set
  name = 'Cast Iron Inline 4 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 378.0,
  customer_price = 415.8,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron Inline 4 Engine Block'));

-- Cast Iron Inline 5 Engine Block
update catalogue_items set
  name = 'Cast Iron Inline 5 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 436.2,
  customer_price = 479.82,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron Inline 5 Engine Block'));

-- Cast Iron Inline 6 Engine Block
update catalogue_items set
  name = 'Cast Iron Inline 6 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 494.4,
  customer_price = 543.84,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron Inline 6 Engine Block'));

-- Cast Iron Inline 8 Engine Block
update catalogue_items set
  name = 'Cast Iron Inline 8 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 610.8,
  customer_price = 671.88,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron Inline 8 Engine'));

-- Cast Iron L4 Engine Block
update catalogue_items set
  name = 'Cast Iron L4 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 378.0,
  customer_price = 415.8,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron L4 Engine Block'));

-- Cast Iron Single Piston Engine Block
update catalogue_items set
  name = 'Cast Iron Single Piston Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 203.4,
  customer_price = 223.74,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron Single Piston Engine Block'));

-- Cast Iron V-Twin Engine Block
update catalogue_items set
  name = 'Cast Iron V-Twin Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 291.0,
  customer_price = 320.1,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron V-Twin Engine Block'));

-- Cast Iron V10 Engine Block
update catalogue_items set
  name = 'Cast Iron V10 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 814.8,
  customer_price = 896.28,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron VIO Engine Block'));

-- Cast Iron V12 Engine Block
update catalogue_items set
  name = 'Cast Iron V12 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 931.2,
  customer_price = 1024.32,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron V12 Engine Block'));

-- Cast Iron V16 Engine Block
update catalogue_items set
  name = 'Cast Iron V16 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1192.8,
  customer_price = 1312.08,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron V16 Engine Block'));

-- Cast Iron V4 Engine Block
update catalogue_items set
  name = 'Cast Iron V4 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 418.8,
  customer_price = 460.68,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron V4 Engine Block'));

-- Cast Iron V6 Engine Block
update catalogue_items set
  name = 'Cast Iron V6 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 546.6,
  customer_price = 601.26,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron V6 Engine Block'));

-- Cast Iron V8 Engine Block
update catalogue_items set
  name = 'Cast Iron V8 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 669.0,
  customer_price = 735.9,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron V8 Engine Block'));

-- Cast Iron W12 Engine Block
update catalogue_items set
  name = 'Cast Iron W12 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1134.6,
  customer_price = 1248.06,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron W12 Engine Block'));

-- Cast Iron W16 Engine Block
update catalogue_items set
  name = 'Cast Iron W16 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1455.0,
  customer_price = 1600.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron W16 Engine Block'));

-- Cast Iron W18 Engine Block
update catalogue_items set
  name = 'Cast Iron W18 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1600.2,
  customer_price = 1760.22,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron W18 Engine Block'));

-- Cast Iron W6 Engine Block
update catalogue_items set
  name = 'Cast Iron W6 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 669.0,
  customer_price = 735.9,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron W6 Engine Block'));

-- Cast Iron W8 Engine Block
update catalogue_items set
  name = 'Cast Iron W8 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 814.8,
  customer_price = 896.28,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron W8 Engine Block'));

-- Compacted Graphite Iron Flat 2 Engine Block
update catalogue_items set
  name = 'Compacted Graphite Iron Flat 2 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 432.0,
  customer_price = 475.2,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Compacted Graphite Iron Flat 2 Engine Block'));

-- Compacted Graphite Iron Flat 4 Engine Block
update catalogue_items set
  name = 'Compacted Graphite Iron Flat 4 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 617.5,
  customer_price = 679.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Compacted Graphite Iron Flat 4 Engine Block'));

-- Compacted Graphite Iron Flat 6 Engine Block
update catalogue_items set
  name = 'Compacted Graphite Iron Flat 6 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 807.5,
  customer_price = 888.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Compacted Graphite Iron Flat 6 Engine Block'));

-- Compacted Graphite Iron Flat 8 Engine Block
update catalogue_items set
  name = 'Compacted Graphite Iron Flat 8 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 997.5,
  customer_price = 1097.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Compacted Graphite Iron Flat 8 Engine Block'));

-- Compacted Graphite Iron Inline 4 Engine Block
update catalogue_items set
  name = 'Compacted Graphite Iron Inline 4 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 546.0,
  customer_price = 600.6,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Compacted Graphite Iron Inline 4 Engine Block'));

-- Compacted Graphite Iron Inline 5 Engine Block
update catalogue_items set
  name = 'Compacted Graphite Iron Inline 5 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 617.5,
  customer_price = 679.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Compacted Graphite Iron Inline 5 Engine Block'));

-- Compacted Graphite Iron Inline 6 Engine Block
update catalogue_items set
  name = 'Compacted Graphite Iron Inline 6 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 712.5,
  customer_price = 783.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Compacted Graphite Iron Inline 6 Engine Block'));

-- Compacted Graphite Iron Inline 8 Engine Block
update catalogue_items set
  name = 'Compacted Graphite Iron Inline 8 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 878.5,
  customer_price = 966.35,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Compacted Graphite Iron Inline 8 Engine Block'));

-- Compacted Graphite Iron L4 Engine Block
update catalogue_items set
  name = 'Compacted Graphite Iron L4 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 546.0,
  customer_price = 600.6,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Compacted Graphite Iron L4 Engine Block'));

-- Compacted Graphite Iron Single Piston Engine Block
update catalogue_items set
  name = 'Compacted Graphite Iron Single Piston Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 289.5,
  customer_price = 318.45,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Compacted Graphite Iron Single Piston Engine Block'));

-- Compacted Graphite Iron V-Twin Engine Block
update catalogue_items set
  name = 'Compacted Graphite Iron V-Twin Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 413.0,
  customer_price = 454.3,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Compacted Graphite Iron V-Twin Engine Block'));

-- Compacted Graphite Iron V10 Engine Block
update catalogue_items set
  name = 'Compacted Graphite Iron V10 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1140.0,
  customer_price = 1254.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Compacted Graphite Iron VIO Engine Block'));

-- Compacted Graphite Iron V12 Engine Block
update catalogue_items set
  name = 'Compacted Graphite Iron V12 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1330.0,
  customer_price = 1463.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Compacted Graphite Iron V12 Engine Block'));

-- Compacted Graphite Iron V16 Engine Block
update catalogue_items set
  name = 'Compacted Graphite Iron V16 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1686.0,
  customer_price = 1854.6,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Compacted Graphite Iron V16 Engine Block'));

-- Compacted Graphite Iron V4 Engine Block
update catalogue_items set
  name = 'Compacted Graphite Iron V4 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 593.5,
  customer_price = 652.85,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Compacted Graphite Iron V4 Engine Block'));

-- Compacted Graphite Iron V6 Engine Block
update catalogue_items set
  name = 'Compacted Graphite Iron V6 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 783.5,
  customer_price = 861.85,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Compacted Graphite Iron V6 Engine Block'));

-- Compacted Graphite Iron V8 Engine Block
update catalogue_items set
  name = 'Compacted Graphite Iron V8 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 950.0,
  customer_price = 1045.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Compacted Graphite Iron V8 Engine Block'));

-- Compacted Graphite Iron W12 Engine Block
update catalogue_items set
  name = 'Compacted Graphite Iron W12 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1638.5,
  customer_price = 1802.35,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Compacted Graphite Iron W12 Engine Block'));

-- Compacted Graphite Iron W16 Engine Block
update catalogue_items set
  name = 'Compacted Graphite Iron W16 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 2066.0,
  customer_price = 2272.6,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Compacted Graphite Iron W16 Engine Block'));

-- Compacted Graphite Iron W18 Engine Block
update catalogue_items set
  name = 'Compacted Graphite Iron W18 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 2303.5,
  customer_price = 2533.85,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Compacted Graphite Iron W18 Engine Block'));

-- Compacted Graphite Iron W6 Engine Block
update catalogue_items set
  name = 'Compacted Graphite Iron W6 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 950.0,
  customer_price = 1045.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Compacted Graphite Iron W6 Engine Block'));

-- Compacted Graphite Iron W8 Engine Block
update catalogue_items set
  name = 'Compacted Graphite Iron W8 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1187.5,
  customer_price = 1306.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Compacted Graphite Iron W8 Engine Block'));

-- Magnesium Alloy Flat 2 Engine Block
update catalogue_items set
  name = 'Magnesium Alloy Flat 2 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1235.0,
  customer_price = 1358.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Magnesium Alloy Flat 2 Engine Block'));

-- Magnesium Alloy Flat 4 Engine Block
update catalogue_items set
  name = 'Magnesium Alloy Flat 4 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1781.0,
  customer_price = 1959.1,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Magnesium Alloy Flat 4 Engine Block'));

-- Magnesium Alloy Flat 6 Engine Block
update catalogue_items set
  name = 'Magnesium Alloy Flat 6 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 2327.5,
  customer_price = 2560.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Magnesium Alloy Flat 6 Engine Block'));

-- Magnesium Alloy Flat 8 Engine Block
update catalogue_items set
  name = 'Magnesium Alloy Flat 8 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 2873.5,
  customer_price = 3160.85,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Magnesium Alloy Flat 8 Engine Block'));

-- Magnesium Alloy Inline 3 Engine Block
update catalogue_items set
  name = 'Magnesium Alloy Inline 3 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1306.0,
  customer_price = 1436.6,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Magnesium Alloy Inline 3 Engine Block'));

-- Magnesium Alloy Inline 4 Engine Block
update catalogue_items set
  name = 'Magnesium Alloy Inline 4 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1543.5,
  customer_price = 1697.85,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Magnesium Alloy Inline 4 Engine Block'));

-- Magnesium Alloy Inline 5 Engine Block
update catalogue_items set
  name = 'Magnesium Alloy Inline 5 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1781.0,
  customer_price = 1959.1,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Magnesium Alloy Inline 5 Engine Block'));

-- Magnesium Alloy Inline 6 Engine Block
update catalogue_items set
  name = 'Magnesium Alloy Inline 6 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 2018.5,
  customer_price = 2220.35,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Magnesium Alloy Inline 6 Engine Block'));

-- Magnesium Alloy Inline 8 Engine Block
update catalogue_items set
  name = 'Magnesium Alloy Inline 8 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 2493.5,
  customer_price = 2742.85,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Magnesium Alloy Inline 8 Engine Block'));

-- Magnesium Alloy L4 Engine Block
update catalogue_items set
  name = 'Magnesium Alloy L4 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1543.5,
  customer_price = 1697.85,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Magnesium Alloy L4 Engine Block'));

-- Magnesium Alloy Single Piston Engine Block
update catalogue_items set
  name = 'Magnesium Alloy Single Piston Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 831.0,
  customer_price = 914.1,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Magnesium Alloy Single Piston Engine Block'));

-- Magnesium Alloy V-Twin Engine Block
update catalogue_items set
  name = 'Magnesium Alloy V-Twin Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1187.5,
  customer_price = 1306.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Magnesium Alloy V-Twin Engine Block'));

-- Magnesium Alloy V10 Engine Block
update catalogue_items set
  name = 'Magnesium Alloy V10 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 3277.5,
  customer_price = 3605.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Magnesium Alloy VIO Engine Block'));

-- Magnesium Alloy V12 Engine Block
update catalogue_items set
  name = 'Magnesium Alloy V12 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 3800.0,
  customer_price = 4180.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Magnesium Alloy V12 Engine Block'));

-- Magnesium Alloy V16 Engine Block
update catalogue_items set
  name = 'Magnesium Alloy V16 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 4845.0,
  customer_price = 5329.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Magnesium Alloy V16 Engine Block'));

-- Magnesium Alloy V4 Engine Block
update catalogue_items set
  name = 'Magnesium Alloy V4 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 1710.0,
  customer_price = 1881.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Magnesium Alloy V4 Engine Block'));

-- Magnesium Alloy V6 Engine Block
update catalogue_items set
  name = 'Magnesium Alloy V6 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 2232.5,
  customer_price = 2455.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Magnesium Alloy V6 Engine Block'));

-- Magnesium Alloy V8 Engine Block
update catalogue_items set
  name = 'Magnesium Alloy V8 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 2755.0,
  customer_price = 3030.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Magnesium Alloy V8 Engine Block'));

-- Magnesium Alloy W12 Engine Block
update catalogue_items set
  name = 'Magnesium Alloy W12 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 4655.0,
  customer_price = 5120.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Magnesium Alloy W12 Engine Block'));

-- Magnesium Alloy W16 Engine Block
update catalogue_items set
  name = 'Magnesium Alloy W16 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 5937.5,
  customer_price = 6531.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Magnesium Alloy W16 Engine Block'));

-- Magnesium Alloy W18 Engine Block
update catalogue_items set
  name = 'Magnesium Alloy W18 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 6555.0,
  customer_price = 7210.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Magnesium Alloy W18 Engine Block'));

-- Magnesium Alloy W6 Engine Block
update catalogue_items set
  name = 'Magnesium Alloy W6 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 2731.0,
  customer_price = 3004.1,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Magnesium Alloy W6 Engine Block'));

-- Magnesium Alloy W8 Engine Block
update catalogue_items set
  name = 'Magnesium Alloy W8 Engine Block',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine Blocks'),
  sourcing = 'purchased',
  purchase_cost = 3372.5,
  customer_price = 3709.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Magnesium Alloy W8 Engine Block'));

-- Anti-Lag System Kit
update catalogue_items set
  name = 'Anti-Lag System Kit',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Forced Induction & Nitrous'),
  sourcing = 'purchased',
  purchase_cost = 1662.5,
  customer_price = 1828.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Anti-Lag System Kit'));

-- Boost Controller
update catalogue_items set
  name = 'Boost Controller',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Forced Induction & Nitrous'),
  sourcing = 'purchased',
  purchase_cost = 451.0,
  customer_price = 496.1,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Boost Controller'));

-- Large Centrifugal Supercharger
update catalogue_items set
  name = 'Large Centrifugal Supercharger',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Forced Induction & Nitrous'),
  sourcing = 'purchased',
  purchase_cost = 2565.0,
  customer_price = 2821.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Large Centrifugal Supercharger'));

-- Large Positive Displacement Supercharger
update catalogue_items set
  name = 'Large Positive Displacement Supercharger',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Forced Induction & Nitrous'),
  sourcing = 'purchased',
  purchase_cost = 3230.0,
  customer_price = 3553.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Large Positive Displacement Supercharger'));

-- Medium Centrifugal Supercharger
update catalogue_items set
  name = 'Medium Centrifugal Supercharger',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Forced Induction & Nitrous'),
  sourcing = 'purchased',
  purchase_cost = 1710.0,
  customer_price = 1881.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Medium Centrifugal Supercharger'));

-- Medium Positive Displacement Supercharger
update catalogue_items set
  name = 'Medium Positive Displacement Supercharger',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Forced Induction & Nitrous'),
  sourcing = 'purchased',
  purchase_cost = 2137.5,
  customer_price = 2351.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Medium Positive Displacement Supercharger'));

-- Nitrous Bottle (Refill)
update catalogue_items set
  name = 'Nitrous Bottle (Refill)',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Forced Induction & Nitrous'),
  sourcing = 'purchased',
  purchase_cost = 308.5,
  customer_price = 339.35,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Nitrous Bottle (Refill)'));

-- Nitrous Kit - 100 Shot
update catalogue_items set
  name = 'Nitrous Kit — 100 Shot',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Forced Induction & Nitrous'),
  sourcing = 'purchased',
  purchase_cost = 1781.0,
  customer_price = 1959.1,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Nitrous Kit — 100 Shot'));

-- Nitrous Kit - 200 Shot
update catalogue_items set
  name = 'Nitrous Kit — 200 Shot',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Forced Induction & Nitrous'),
  sourcing = 'purchased',
  purchase_cost = 2612.5,
  customer_price = 2873.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Nitrous Kit — 200 Shot'));

-- Nitrous Kit - 300 Shot
update catalogue_items set
  name = 'Nitrous Kit — 300 Shot',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Forced Induction & Nitrous'),
  sourcing = 'purchased',
  purchase_cost = 3800.0,
  customer_price = 4180.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Nitrous Kit — 300 Shot'));

-- Nitrous Kit - 50 Shot
update catalogue_items set
  name = 'Nitrous Kit — 50 Shot',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Forced Induction & Nitrous'),
  sourcing = 'purchased',
  purchase_cost = 1187.5,
  customer_price = 1306.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Nitrous Kit — 50 Shot'));

-- Race Intercooler
update catalogue_items set
  name = 'Race Intercooler',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Forced Induction & Nitrous'),
  sourcing = 'purchased',
  purchase_cost = 1330.0,
  customer_price = 1463.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Race Intercooler'));

-- Small Centrifugal Supercharger
update catalogue_items set
  name = 'Small Centrifugal Supercharger',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Forced Induction & Nitrous'),
  sourcing = 'purchased',
  purchase_cost = 1045.0,
  customer_price = 1149.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Small Centrifugal Supercharger'));

-- Small Positive Displacement Supercharger
update catalogue_items set
  name = 'Small Positive Displacement Supercharger',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Forced Induction & Nitrous'),
  sourcing = 'purchased',
  purchase_cost = 1330.0,
  customer_price = 1463.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Small Positive Displacement Supercharger'));

-- Stock Intercooler
update catalogue_items set
  name = 'Stock Intercooler',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Forced Induction & Nitrous'),
  sourcing = 'purchased',
  purchase_cost = 285.0,
  customer_price = 313.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Stock Intercooler'));

-- Street Intercooler
update catalogue_items set
  name = 'Street Intercooler',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Forced Induction & Nitrous'),
  sourcing = 'purchased',
  purchase_cost = 665.0,
  customer_price = 731.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Street Intercooler'));

-- Turbocharger - Large Compressor / Large Turbine
update catalogue_items set
  name = 'Turbocharger — Large Compressor / Large Turbine',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Forced Induction & Nitrous'),
  sourcing = 'purchased',
  purchase_cost = 2232.5,
  customer_price = 2455.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Turbocharger — Large Compressor / Large Turbine'));

-- Turbocharger - Large Compressor / Medium Turbine
update catalogue_items set
  name = 'Turbocharger — Large Compressor / Medium Turbine',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Forced Induction & Nitrous'),
  sourcing = 'purchased',
  purchase_cost = 2066.0,
  customer_price = 2272.6,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Turbocharger — Large Compressor / Medium Turbine'));

-- Turbocharger - Large Compressor / Small Turbine
update catalogue_items set
  name = 'Turbocharger — Large Compressor / Small Turbine',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Forced Induction & Nitrous'),
  sourcing = 'purchased',
  purchase_cost = 1900.0,
  customer_price = 2090.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Turbocharger — Large Compressor / Small Turbine'));

-- Turbocharger - Medium Compressor / Large Turbine
update catalogue_items set
  name = 'Turbocharger — Medium Compressor / Large Turbine',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Forced Induction & Nitrous'),
  sourcing = 'purchased',
  purchase_cost = 1567.5,
  customer_price = 1724.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Turbocharger — Medium Compressor / Large Turbine'));

-- Turbocharger - Medium Compressor / Medium Turbine
update catalogue_items set
  name = 'Turbocharger — Medium Compressor / Medium Turbine',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Forced Induction & Nitrous'),
  sourcing = 'purchased',
  purchase_cost = 1401.0,
  customer_price = 1541.1,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Turbocharger — Medium Compressor / Medium Turbine'));

-- Turbocharger - Medium Compressor / Small Turbine
update catalogue_items set
  name = 'Turbocharger — Medium Compressor / Small Turbine',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Forced Induction & Nitrous'),
  sourcing = 'purchased',
  purchase_cost = 1235.0,
  customer_price = 1358.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Turbocharger — Medium Compressor / Small Turbine'));

-- Turbocharger - Small Compressor / Large Turbine
update catalogue_items set
  name = 'Turbocharger — Small Compressor / Large Turbine',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Forced Induction & Nitrous'),
  sourcing = 'purchased',
  purchase_cost = 1045.0,
  customer_price = 1149.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Turbocharger — Small Compressor / Large Turbine'));

-- Turbocharger - Small Compressor / Medium Turbine
update catalogue_items set
  name = 'Turbocharger — Small Compressor / Medium Turbine',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Forced Induction & Nitrous'),
  sourcing = 'purchased',
  purchase_cost = 878.5,
  customer_price = 966.35,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Turbocharger — Small Compressor / Medium Turbine'));

-- Turbocharger - Small Compressor / Small Turbine
update catalogue_items set
  name = 'Turbocharger — Small Compressor / Small Turbine',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Forced Induction & Nitrous'),
  sourcing = 'purchased',
  purchase_cost = 712.5,
  customer_price = 783.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Turbocharger — Small Compressor / Small Turbine'));

-- Window Part
update catalogue_items set
  name = 'Window Part',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Glass & Tint'),
  sourcing = 'purchased',
  purchase_cost = 52.2,
  customer_price = 57.42,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Window Part'));

-- Window Tint Kit
update catalogue_items set
  name = 'Window Tint Kit',
  categories = '{"Customisation"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Glass & Tint'),
  sourcing = 'purchased',
  purchase_cost = 65.5,
  customer_price = 72.05,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Window Tint Kit'));

-- Custom Vehicle Horn
update catalogue_items set
  name = 'Custom Vehicle Horn',
  categories = '{"Customisation"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Interior & Audio'),
  sourcing = 'purchased',
  purchase_cost = 11.5,
  customer_price = 12.65,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Custom Vehicle Horn'));

-- Internal Cosmetics
update catalogue_items set
  name = 'Internal Cosmetics',
  categories = '{"Customisation"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Interior & Audio'),
  sourcing = 'purchased',
  purchase_cost = 23.5,
  customer_price = 25.85,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Internal Cosmetics'));

-- Seat Cosmetics
update catalogue_items set
  name = 'Seat Cosmetics',
  categories = '{"Customisation"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Interior & Audio'),
  sourcing = 'purchased',
  purchase_cost = 104.5,
  customer_price = 114.95,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Seat Cosmetics'));

-- Subwoofer
update catalogue_items set
  name = 'Subwoofer',
  categories = '{"Customisation"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Interior & Audio'),
  sourcing = 'purchased',
  purchase_cost = 213.5,
  customer_price = 234.85,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Subwoofer'));

-- Taillight Assembly
update catalogue_items set
  name = 'Taillight Assembly',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Lights'),
  sourcing = 'purchased',
  purchase_cost = 81.0,
  customer_price = 89.1,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Taillight Assembly'));

-- Underglow LEDS
update catalogue_items set
  name = 'Underglow LEDS',
  categories = '{"Customisation"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Lights'),
  sourcing = 'purchased',
  purchase_cost = 118.5,
  customer_price = 130.35,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Underglow LEDS'));

-- Xenon Headlights
update catalogue_items set
  name = 'Xenon Headlights',
  categories = '{"Customisation"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Lights'),
  sourcing = 'purchased',
  purchase_cost = 138.0,
  customer_price = 151.8,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Xenon Headlights'));

-- Customized Plates
update catalogue_items set
  name = 'Customized Plates',
  categories = '{"Customisation"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Paint & Livery'),
  sourcing = 'purchased',
  purchase_cost = 46.0,
  customer_price = 50.6,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Customized Plates'));

-- Livery Roll
update catalogue_items set
  name = 'Livery Roll',
  categories = '{"Customisation"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Paint & Livery'),
  sourcing = 'purchased',
  purchase_cost = 35.5,
  customer_price = 39.05,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Livery Roll'));

-- Vehicle Spray Can
update catalogue_items set
  name = 'Vehicle Spray Can',
  categories = '{"Customisation"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Paint & Livery'),
  sourcing = 'purchased',
  purchase_cost = 33.5,
  customer_price = 36.85,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Vehicle Spray Can'));

-- Cast Iron (Standard) Ring Pack
update catalogue_items set
  name = 'Cast Iron (Standard) Ring Pack',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Piston Rings'),
  sourcing = 'purchased',
  purchase_cost = 14.4,
  customer_price = 15.84,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron tStandard) Ring Pack'));

-- Moly-Coated Race Ring Pack
update catalogue_items set
  name = 'Moly-Coated Race Ring Pack',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Piston Rings'),
  sourcing = 'purchased',
  purchase_cost = 93.0,
  customer_price = 102.3,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Moly-Coated Race Ring Pack'));

-- Steel Performance Ring Pack
update catalogue_items set
  name = 'Steel Performance Ring Pack',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Piston Rings'),
  sourcing = 'purchased',
  purchase_cost = 28.8,
  customer_price = 31.68,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Steel Performance Ring Pack'));

-- Dished Billet Aluminum Piston
update catalogue_items set
  name = 'Dished Billet Aluminum Piston',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Pistons'),
  sourcing = 'purchased',
  purchase_cost = 209.0,
  customer_price = 229.9,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Dished Billet Aluminum Piston'));

-- Dished Billet Steel Piston
update catalogue_items set
  name = 'Dished Billet Steel Piston',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Pistons'),
  sourcing = 'purchased',
  purchase_cost = 171.0,
  customer_price = 188.1,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Dished Billet Steel Piston'));

-- Dished Cast Aluminum Piston
update catalogue_items set
  name = 'Dished Cast Aluminum Piston',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Pistons'),
  sourcing = 'purchased',
  purchase_cost = 69.6,
  customer_price = 76.56,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Dished Cast Aluminum Piston'));

-- Dished Cast Iron Piston
update catalogue_items set
  name = 'Dished Cast Iron Piston',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Pistons'),
  sourcing = 'purchased',
  purchase_cost = 43.2,
  customer_price = 47.52,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Dished Cast Iron Piston'));

-- Dished Cast Steel Piston
update catalogue_items set
  name = 'Dished Cast Steel Piston',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Pistons'),
  sourcing = 'purchased',
  purchase_cost = 58.2,
  customer_price = 64.02,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Dished Cast Steel Piston'));

-- Dished Forged Aluminum Piston
update catalogue_items set
  name = 'Dished Forged Aluminum Piston',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Pistons'),
  sourcing = 'purchased',
  purchase_cost = 128.0,
  customer_price = 140.8,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Dished Forged Aluminum Piston'));

-- Dished Forged Steel Piston
update catalogue_items set
  name = 'Dished Forged Steel Piston',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Pistons'),
  sourcing = 'purchased',
  purchase_cost = 90.0,
  customer_price = 99.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('DishetForged Steel Piston'));

-- Dished Powder Metal Piston
update catalogue_items set
  name = 'Dished Powder Metal Piston',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Pistons'),
  sourcing = 'purchased',
  purchase_cost = 76.0,
  customer_price = 83.6,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Dishebowder Metal Piston'));

-- Dished Titanium Piston
update catalogue_items set
  name = 'Dished Titanium Piston',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Pistons'),
  sourcing = 'purchased',
  purchase_cost = 399.0,
  customer_price = 438.9,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Dished Titanium Piston'));

-- Domed Billet Aluminum Piston
update catalogue_items set
  name = 'Domed Billet Aluminum Piston',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Pistons'),
  sourcing = 'purchased',
  purchase_cost = 218.5,
  customer_price = 240.35,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Domed Billet Aluminum Piston'));

-- Domed Billet Steel Piston
update catalogue_items set
  name = 'Domed Billet Steel Piston',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Pistons'),
  sourcing = 'purchased',
  purchase_cost = 175.5,
  customer_price = 193.05,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Domed Billet Steel Piston'));

-- Domed Cast Aluminum Piston
update catalogue_items set
  name = 'Domed Cast Aluminum Piston',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Pistons'),
  sourcing = 'purchased',
  purchase_cost = 69.6,
  customer_price = 76.56,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Domed'' Cast Aluminum Piston'));

-- Domed Cast Iron Piston
update catalogue_items set
  name = 'Domed Cast Iron Piston',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Pistons'),
  sourcing = 'purchased',
  purchase_cost = 43.2,
  customer_price = 47.52,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Domed Cast Iron Piston'));

-- Domed Cast Steel Piston
update catalogue_items set
  name = 'Domed Cast Steel Piston',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Pistons'),
  sourcing = 'purchased',
  purchase_cost = 58.2,
  customer_price = 64.02,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Domed Cast Steel Piston'));

-- Domed Forged Aluminum Piston
update catalogue_items set
  name = 'Domed Forged Aluminum Piston',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Pistons'),
  sourcing = 'purchased',
  purchase_cost = 137.5,
  customer_price = 151.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Domed Forged Aluminum Piston'));

-- Domed Forged Steel Piston
update catalogue_items set
  name = 'Domed Forged Steel Piston',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Pistons'),
  sourcing = 'purchased',
  purchase_cost = 95.0,
  customer_price = 104.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('DomeåForged Steel Piston'));

-- Domed Powder Metal Piston
update catalogue_items set
  name = 'Domed Powder Metal Piston',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Pistons'),
  sourcing = 'purchased',
  purchase_cost = 76.0,
  customer_price = 83.6,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Domed Powder Metal Piston'));

-- Domed Titanium Piston
update catalogue_items set
  name = 'Domed Titanium Piston',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Pistons'),
  sourcing = 'purchased',
  purchase_cost = 418.0,
  customer_price = 459.8,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Domed Titanium Piston'));

-- Flat Top Billet Aluminum Piston
update catalogue_items set
  name = 'Flat Top Billet Aluminum Piston',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Pistons'),
  sourcing = 'purchased',
  purchase_cost = 199.5,
  customer_price = 219.45,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Flat Top Billet Aluminum Piston'));

-- Flat Top Billet Steel Piston
update catalogue_items set
  name = 'Flat Top Billet Steel Piston',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Pistons'),
  sourcing = 'purchased',
  purchase_cost = 161.5,
  customer_price = 177.65,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Flat Top Billet Steel Piston'));

-- Flat Top Cast Aluminum Piston
update catalogue_items set
  name = 'Flat Top Cast Aluminum Piston',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Pistons'),
  sourcing = 'purchased',
  purchase_cost = 63.6,
  customer_price = 69.96,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Flat Top Cast Aluminum Piston'));

-- Flat Top Cast Iron Piston
update catalogue_items set
  name = 'Flat Top Cast Iron Piston',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Pistons'),
  sourcing = 'purchased',
  purchase_cost = 40.2,
  customer_price = 44.22,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Flat Top Cast Iron Piston'));

-- Flat Top Cast Steel Piston
update catalogue_items set
  name = 'Flat Top Cast Steel Piston',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Pistons'),
  sourcing = 'purchased',
  purchase_cost = 55.2,
  customer_price = 60.72,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Flat Top Cast Steel Piston'));

-- Flat Top Forged Aluminum Piston
update catalogue_items set
  name = 'Flat Top Forged Aluminum Piston',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Pistons'),
  sourcing = 'purchased',
  purchase_cost = 123.5,
  customer_price = 135.85,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Flat Top Forged Aluminum Piston'));

-- Flat Top Forged Steel Piston
update catalogue_items set
  name = 'Flat Top Forged Steel Piston',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Pistons'),
  sourcing = 'purchased',
  purchase_cost = 85.5,
  customer_price = 94.05,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Flat Top Forged Steel Piston'));

-- Flat Top Powder Metal Piston
update catalogue_items set
  name = 'Flat Top Powder Metal Piston',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Pistons'),
  sourcing = 'purchased',
  purchase_cost = 71.0,
  customer_price = 78.1,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Flat Top Powder Metal Piston'));

-- Flat Top Titanium Piston
update catalogue_items set
  name = 'Flat Top Titanium Piston',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Pistons'),
  sourcing = 'purchased',
  purchase_cost = 380.0,
  customer_price = 418.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Flat Top Titanium Piston'));

-- Billet Aluminum Four Rotor Rotor Housing
update catalogue_items set
  name = 'Billet Aluminum Four Rotor Rotor Housing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Rotor Housings'),
  sourcing = 'purchased',
  purchase_cost = 4940.0,
  customer_price = 5434.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Aluminum Four Rotor Rotor Housing'));

-- Billet Aluminum Single Rotor Rotor Housing
update catalogue_items set
  name = 'Billet Aluminum Single Rotor Rotor Housing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Rotor Housings'),
  sourcing = 'purchased',
  purchase_cost = 2042.5,
  customer_price = 2246.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Aluminum Single Rotor Rotor Housing'));

-- Billet Aluminum Three Rotor Rotor Housing
update catalogue_items set
  name = 'Billet Aluminum Three Rotor Rotor Housing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Rotor Housings'),
  sourcing = 'purchased',
  purchase_cost = 3942.5,
  customer_price = 4336.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Aluminum Three Rotor Rotor Housing'));

-- Billet Aluminum Twin Rotor Rotor Housing
update catalogue_items set
  name = 'Billet Aluminum Twin Rotor Rotor Housing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Rotor Housings'),
  sourcing = 'purchased',
  purchase_cost = 2992.5,
  customer_price = 3291.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Afuminum Twin Rotor Rotor Housing'));

-- Billet Steel Four Rotor Rotor Housing
update catalogue_items set
  name = 'Billet Steel Four Rotor Rotor Housing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Rotor Housings'),
  sourcing = 'purchased',
  purchase_cost = 2731.0,
  customer_price = 3004.1,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Steel Four Rotor Rotor Housing'));

-- Billet Steel Single Rotor Rotor Housing
update catalogue_items set
  name = 'Billet Steel Single Rotor Rotor Housing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Rotor Housings'),
  sourcing = 'purchased',
  purchase_cost = 1140.0,
  customer_price = 1254.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Steel Single Rotor Rotor Housing'));

-- Billet Steel Three Rotor Rotor Housing
update catalogue_items set
  name = 'Billet Steel Three Rotor Rotor Housing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Rotor Housings'),
  sourcing = 'purchased',
  purchase_cost = 2185.0,
  customer_price = 2403.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Steel Three Rotor Rotor Housing'));

-- Billet Steel Twin Rotor Rotor Housing
update catalogue_items set
  name = 'Billet Steel Twin Rotor Rotor Housing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Rotor Housings'),
  sourcing = 'purchased',
  purchase_cost = 1662.5,
  customer_price = 1828.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Billet Steel Twin Rotor Rotor Housing'));

-- Cast Aluminum Four Rotor Rotor Housing
update catalogue_items set
  name = 'Cast Aluminum Four Rotor Rotor Housing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Rotor Housings'),
  sourcing = 'purchased',
  purchase_cost = 1862.4,
  customer_price = 2048.64,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Aluminum Four Rotor Rotor Housing'));

-- Cast Aluminum Single Rotor Rotor Housing
update catalogue_items set
  name = 'Cast Aluminum Single Rotor Rotor Housing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Rotor Housings'),
  sourcing = 'purchased',
  purchase_cost = 785.4,
  customer_price = 863.94,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Aluminum Single Rotor Rotor Housing'));

-- Cast Aluminum Three Rotor Rotor Housing
update catalogue_items set
  name = 'Cast Aluminum Three Rotor Rotor Housing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Rotor Housings'),
  sourcing = 'purchased',
  purchase_cost = 1513.2,
  customer_price = 1664.52,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast uminum Three Rotor Rotor Housing'));

-- Cast Aluminum Twin Rotor Rotor Housing
update catalogue_items set
  name = 'Cast Aluminum Twin Rotor Rotor Housing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Rotor Housings'),
  sourcing = 'purchased',
  purchase_cost = 1134.6,
  customer_price = 1248.06,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast uminum Twin Rotor Rotor Housing'));

-- Cast Iron Four Rotor Rotor Housing
update catalogue_items set
  name = 'Cast Iron Four Rotor Rotor Housing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Rotor Housings'),
  sourcing = 'purchased',
  purchase_cost = 1338.6,
  customer_price = 1472.46,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron Four Rotor Rotor Housing'));

-- Cast Iron Single Rotor Rotor Housing
update catalogue_items set
  name = 'Cast Iron Single Rotor Rotor Housing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Rotor Housings'),
  sourcing = 'purchased',
  purchase_cost = 552.6,
  customer_price = 607.86,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron Single Rotor Rotor Housing'));

-- Cast Iron Three Rotor Rotor Housing
update catalogue_items set
  name = 'Cast Iron Three Rotor Rotor Housing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Rotor Housings'),
  sourcing = 'purchased',
  purchase_cost = 1076.4,
  customer_price = 1184.04,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron Three Rotor Rotor Housing'));

-- Cast Iron Twin Rotor Rotor Housing
update catalogue_items set
  name = 'Cast Iron Twin Rotor Rotor Housing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Rotor Housings'),
  sourcing = 'purchased',
  purchase_cost = 814.8,
  customer_price = 896.28,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Cast Iron Twin Rotor Rotor Housing'));

-- Compacted Graphite Iron Four Rotor Rotor Housing
update catalogue_items set
  name = 'Compacted Graphite Iron Four Rotor Rotor Housing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Rotor Housings'),
  sourcing = 'purchased',
  purchase_cost = 1900.0,
  customer_price = 2090.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Compacted Graphite Iron Four Rotor Rotor Housing'));

-- Compacted Graphite Iron Single Rotor Rotor Housing
update catalogue_items set
  name = 'Compacted Graphite Iron Single Rotor Rotor Housing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Rotor Housings'),
  sourcing = 'purchased',
  purchase_cost = 783.5,
  customer_price = 861.85,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Compacted Graphite Iron Single''Rotor Rotor Housing'));

-- Compacted Graphite Iron Three Rotor Rotor Housing
update catalogue_items set
  name = 'Compacted Graphite Iron Three Rotor Rotor Housing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Rotor Housings'),
  sourcing = 'purchased',
  purchase_cost = 1543.5,
  customer_price = 1697.85,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Compacted Graphite Iron Three Rotor Rotor Housing'));

-- Compacted Graphite Iron Twin Rotor Rotor Housing
update catalogue_items set
  name = 'Compacted Graphite Iron Twin Rotor Rotor Housing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Rotor Housings'),
  sourcing = 'purchased',
  purchase_cost = 1163.5,
  customer_price = 1279.85,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Compacted Graphite Iron Twin Rotor Rotor Housing'));

-- Magnesium Alloy Four Rotor Rotor Housing
update catalogue_items set
  name = 'Magnesium Alloy Four Rotor Rotor Housing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Rotor Housings'),
  sourcing = 'purchased',
  purchase_cost = 5462.5,
  customer_price = 6008.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Magnesium Alloy Four Rotor Rotor Housing'));

-- Magnesium Alloy Single Rotor Rotor Housing
update catalogue_items set
  name = 'Magnesium Alloy Single Rotor Rotor Housing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Rotor Housings'),
  sourcing = 'purchased',
  purchase_cost = 2256.0,
  customer_price = 2481.6,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Magnesium Alloy Single Rotor Rotor Housing'));

-- Magnesium Alloy Three Rotor Rotor Housing
update catalogue_items set
  name = 'Magnesium Alloy Three Rotor Rotor Housing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Rotor Housings'),
  sourcing = 'purchased',
  purchase_cost = 4393.5,
  customer_price = 4832.85,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Magnesium Alloy Three Rotor Rotor Housing'));

-- Magnesium Alloy Twin Rotor Rotor Housing
update catalogue_items set
  name = 'Magnesium Alloy Twin Rotor Rotor Housing',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Rotor Housings'),
  sourcing = 'purchased',
  purchase_cost = 3325.0,
  customer_price = 3657.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Magnesium Alloy Twin Rotor Rotor Housing'));

-- Alternator
update catalogue_items set
  name = 'Alternator',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine'),
  sourcing = 'purchased',
  purchase_cost = 252.5,
  customer_price = 277.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Altemator'));

-- Apex Seals
update catalogue_items set
  name = 'Apex Seals',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine'),
  sourcing = 'purchased',
  purchase_cost = 85.5,
  customer_price = 94.05,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Apex Seals'));

-- Base Tire
update catalogue_items set
  name = 'Base Tire',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Wheels & Tires'),
  sourcing = 'purchased',
  purchase_cost = 69.6,
  customer_price = 76.56,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Base Tire'));

-- Brake Fluid
update catalogue_items set
  name = 'Brake Fluid',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Brakes'),
  sourcing = 'purchased',
  purchase_cost = 15.5,
  customer_price = 17.05,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Brake Fluid'));

-- Brake Lines
update catalogue_items set
  name = 'Brake Lines',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Brakes'),
  sourcing = 'purchased',
  purchase_cost = 104.4,
  customer_price = 114.84,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Brake Lines'));

-- Bushing Kit
update catalogue_items set
  name = 'Bushing Kit',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine'),
  sourcing = 'purchased',
  purchase_cost = 104.5,
  customer_price = 114.95,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Bushing Kit'));

-- Car Battery
update catalogue_items set
  name = 'Car Battery',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine'),
  sourcing = 'purchased',
  purchase_cost = 166.0,
  customer_price = 182.6,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Car Battery'));

-- Carbon Fiber
update catalogue_items set
  name = 'Carbon Fiber',
  categories = '{"Scrap Material"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Scrap Material'),
  sourcing = 'purchased',
  purchase_cost = 38.4,
  customer_price = 42.24,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Carbon fiber'));

-- Clutch Kit
update catalogue_items set
  name = 'Clutch Kit',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine'),
  sourcing = 'purchased',
  purchase_cost = 902.5,
  customer_price = 992.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Clutch Kit'));

-- Coolant
update catalogue_items set
  name = 'Coolant',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Fluids'),
  sourcing = 'purchased',
  purchase_cost = 29.5,
  customer_price = 32.45,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Coolant'));

-- Differential Fluid
update catalogue_items set
  name = 'Differential Fluid',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Fluids'),
  sourcing = 'purchased',
  purchase_cost = 14.0,
  customer_price = 15.4,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Differential Fluid'));

-- Differential Rebuild Kit
update catalogue_items set
  name = 'Differential Rebuild Kit',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Chassis'),
  sourcing = 'purchased',
  purchase_cost = 712.5,
  customer_price = 783.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Differential Rebuild Kit'));

-- Door Assembly
update catalogue_items set
  name = 'Door Assembly',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Body & Panels'),
  sourcing = 'purchased',
  purchase_cost = 186.0,
  customer_price = 204.6,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Door Assembly'));

-- Drive Belt
update catalogue_items set
  name = 'Drive Belt',
  categories = '{"Repair/Service","Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine'),
  sourcing = 'purchased',
  purchase_cost = 86.5,
  customer_price = 95.15,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Drive Belt'));

-- Duct Tape
update catalogue_items set
  name = 'Duct Tape',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine'),
  sourcing = 'purchased',
  purchase_cost = 7.0,
  customer_price = 7.7,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = 'Scrapyard lists two prices for this item: $8.40/$14.40 -- purchase_cost above uses the autoparts price; flagged for manual review.'
where lower(trim(name)) = lower(trim('Duct Tape'));

-- Exhaust Manifold
update catalogue_items set
  name = 'Exhaust Manifold',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Exhaust'),
  sourcing = 'purchased',
  purchase_cost = 570.0,
  customer_price = 627.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Exhaust Manifold'));

-- Fuel Filter
update catalogue_items set
  name = 'Fuel Filter',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine'),
  sourcing = 'purchased',
  purchase_cost = 15.0,
  customer_price = 16.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Fuel filter'));

-- Fuel Pump
update catalogue_items set
  name = 'Fuel Pump',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine'),
  sourcing = 'purchased',
  purchase_cost = 153.5,
  customer_price = 168.85,
  usage_type = 'reusable',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Fuel Pump'));

-- Jump Starter
update catalogue_items set
  name = 'Jump Starter',
  categories = '{"Tools"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Tools & Diagnostics'),
  sourcing = 'purchased',
  purchase_cost = 133.8,
  customer_price = 147.18,
  usage_type = 'reusable',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Jump Starter'));

-- MAF Sensor
update catalogue_items set
  name = 'MAF Sensor',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine'),
  sourcing = 'purchased',
  purchase_cost = 90.0,
  customer_price = 99.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('MAF Sensor'));

-- Motor Oil (1 Qt)
update catalogue_items set
  name = 'Motor Oil (1 Qt)',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Fluids'),
  sourcing = 'purchased',
  purchase_cost = 15.5,
  customer_price = 17.05,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Motor Oil (1 Ot)'));

-- O2 Sensor
update catalogue_items set
  name = 'O2 Sensor',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine'),
  sourcing = 'purchased',
  purchase_cost = 66.5,
  customer_price = 73.15,
  usage_type = 'reusable',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('02 Sensor'));

-- Oil Filter
update catalogue_items set
  name = 'Oil Filter',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine'),
  sourcing = 'purchased',
  purchase_cost = 26.0,
  customer_price = 28.6,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Oil Filter'));

-- Oil Pump
update catalogue_items set
  name = 'Oil Pump',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine'),
  sourcing = 'purchased',
  purchase_cost = 180.5,
  customer_price = 198.55,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Oil Pump'));

-- Radiator
update catalogue_items set
  name = 'Radiator',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine'),
  sourcing = 'purchased',
  purchase_cost = 228.0,
  customer_price = 250.8,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Radiator'));

-- Starter Motor
update catalogue_items set
  name = 'Starter Motor',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine'),
  sourcing = 'purchased',
  purchase_cost = 199.5,
  customer_price = 219.45,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Starter Motor'));

-- Suspension Service Part
update catalogue_items set
  name = 'Suspension Service Part',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Chassis'),
  sourcing = 'purchased',
  purchase_cost = 190.0,
  customer_price = 209.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Suspension Service Part'));

-- Suspension Springs
update catalogue_items set
  name = 'Suspension Springs',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Chassis'),
  sourcing = 'purchased',
  purchase_cost = 213.5,
  customer_price = 234.85,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Suspension Springs'));

-- Sway Bar
update catalogue_items set
  name = 'Sway Bar',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Chassis'),
  sourcing = 'purchased',
  purchase_cost = 228.0,
  customer_price = 250.8,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Sway Bar'));

-- Thermostat
update catalogue_items set
  name = 'Thermostat',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine'),
  sourcing = 'purchased',
  purchase_cost = 45.0,
  customer_price = 49.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Thermostat'));

-- Throttle Position Sensor
update catalogue_items set
  name = 'Throttle Position Sensor',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine'),
  sourcing = 'purchased',
  purchase_cost = 57.0,
  customer_price = 62.7,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Throttle Position Sensor'));

-- Timing Belt Kit
update catalogue_items set
  name = 'Timing Belt Kit',
  categories = '{"Engine Manufacture","Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Service & Other Parts'),
  sourcing = 'purchased',
  purchase_cost = 76.0,
  customer_price = 83.6,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Timing Belt Kit'));

-- Timing Chain Kit
update catalogue_items set
  name = 'Timing Chain Kit',
  categories = '{"Engine Manufacture","Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Service & Other Parts'),
  sourcing = 'purchased',
  purchase_cost = 114.0,
  customer_price = 125.4,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Timing Chain Kit'));

-- Timing Gears
update catalogue_items set
  name = 'Timing Gears',
  categories = '{"Engine Manufacture","Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Service & Other Parts'),
  sourcing = 'purchased',
  purchase_cost = 199.5,
  customer_price = 219.45,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Timing Gears'));

-- Torque Converter
update catalogue_items set
  name = 'Torque Converter',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine'),
  sourcing = 'purchased',
  purchase_cost = 760.0,
  customer_price = 836.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Torque Converter'));

-- Transmission Rebuild Kit
update catalogue_items set
  name = 'Transmission Rebuild Kit',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine'),
  sourcing = 'purchased',
  purchase_cost = 1140.0,
  customer_price = 1254.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Transmission Rebuild Kit'));

-- Water Pump
update catalogue_items set
  name = 'Water Pump',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Engine'),
  sourcing = 'purchased',
  purchase_cost = 147.0,
  customer_price = 161.7,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Water Pump'));

-- Windshield
update catalogue_items set
  name = 'Windshield',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Body & Panels'),
  sourcing = 'purchased',
  purchase_cost = 151.2,
  customer_price = 166.32,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Windshield'));

-- Off-Road Suspension
update catalogue_items set
  name = 'Off-Road Suspension',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Suspension'),
  sourcing = 'purchased',
  purchase_cost = 427.5,
  customer_price = 470.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Off-Road Suspension'));

-- Race Suspension
update catalogue_items set
  name = 'Race Suspension',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Suspension'),
  sourcing = 'purchased',
  purchase_cost = 712.5,
  customer_price = 783.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Race Suspension'));

-- Sport Suspension
update catalogue_items set
  name = 'Sport Suspension',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Suspension'),
  sourcing = 'purchased',
  purchase_cost = 356.0,
  customer_price = 391.6,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Sport Suspension'));

-- Stock Suspension
update catalogue_items set
  name = 'Stock Suspension',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Suspension'),
  sourcing = 'purchased',
  purchase_cost = 142.5,
  customer_price = 156.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Stock Suspension'));

-- Hydraulic Flat Tappet Set
update catalogue_items set
  name = 'Hydraulic Flat Tappet Set',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Tappets'),
  sourcing = 'purchased',
  purchase_cost = 14.4,
  customer_price = 15.84,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Hydraulic Flat Tappet Set'));

-- Hydraulic Roller Tappet Set
update catalogue_items set
  name = 'Hydraulic Roller Tappet Set',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Tappets'),
  sourcing = 'purchased',
  purchase_cost = 22.8,
  customer_price = 25.08,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Hydraulic Roller Tappet'));

-- Solid Flat Tappet Set
update catalogue_items set
  name = 'Solid Flat Tappet Set',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Tappets'),
  sourcing = 'purchased',
  purchase_cost = 11.4,
  customer_price = 12.54,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Solid Flat Tappet Set'));

-- Solid Roller Tappet Set
update catalogue_items set
  name = 'Solid Roller Tappet Set',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Tappets'),
  sourcing = 'purchased',
  purchase_cost = 28.8,
  customer_price = 31.68,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Solid Roller Tappet Set'));

-- Compression Tester
update catalogue_items set
  name = 'Compression Tester',
  categories = '{"Tools"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Tools & Diagnostics'),
  sourcing = 'purchased',
  purchase_cost = 180.5,
  customer_price = 198.55,
  usage_type = 'reusable',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Compression Tester'));

-- Mechanic Clipboard
update catalogue_items set
  name = 'Mechanic Clipboard',
  categories = '{"Tools"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Tools & Diagnostics'),
  sourcing = 'purchased',
  purchase_cost = 16.5,
  customer_price = 18.15,
  usage_type = 'reusable',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Mechanic Clipboard'));

-- Mechanic Toolkit
update catalogue_items set
  name = 'Mechanic Toolkit',
  categories = '{"Tools"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Tools & Diagnostics'),
  sourcing = 'purchased',
  purchase_cost = 209.0,
  customer_price = 229.9,
  usage_type = 'reusable',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Mechanic Toolkit'));

-- OBD-II Scanner
update catalogue_items set
  name = 'OBD-II Scanner',
  categories = '{"Tools"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Tools & Diagnostics'),
  sourcing = 'purchased',
  purchase_cost = 308.5,
  customer_price = 339.35,
  usage_type = 'reusable',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('OBD-II Scanner'));

-- Tread Depth Gauge
update catalogue_items set
  name = 'Tread Depth Gauge',
  categories = '{"Tools"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Tools & Diagnostics'),
  sourcing = 'purchased',
  purchase_cost = 21.0,
  customer_price = 23.1,
  usage_type = 'reusable',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Tread Depth Gauge'));

-- Benefactor 722.6 / NAG1 Transmission (5-speed auto)
update catalogue_items set
  name = 'Benefactor 722.6 / NAG1 Transmission (5-speed auto)',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Transmission'),
  sourcing = 'purchased',
  purchase_cost = 1425.0,
  customer_price = 1567.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Benefactor 722.6 / NAG1 (5-speed auto)'));

-- Benefactor 7G-Drive Transmission (7-speed auto)
update catalogue_items set
  name = 'Benefactor 7G-Drive Transmission (7-speed auto)',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Transmission'),
  sourcing = 'purchased',
  purchase_cost = 2090.0,
  customer_price = 2299.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Benefactor 7G-Drive (7-speed auto)'));

-- Built Valve Body
update catalogue_items set
  name = 'Built Valve Body',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Transmission'),
  sourcing = 'purchased',
  purchase_cost = 1330.0,
  customer_price = 1463.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Built Valve Body'));

-- Bullworth T-5 Transmission (5-speed manual)
update catalogue_items set
  name = 'Bullworth T-5 Transmission (5-speed manual)',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Transmission'),
  sourcing = 'purchased',
  purchase_cost = 1330.0,
  customer_price = 1463.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Bullworth T-5 (5-speed manual)'));

-- Declasse 3-Speed Transmission (3-speed manual)
update catalogue_items set
  name = 'Declasse 3-Speed Transmission (3-speed manual)',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Transmission'),
  sourcing = 'purchased',
  purchase_cost = 807.5,
  customer_price = 888.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Declasse 3-Speed (3-speed manual)'));

-- Declasse 4L80-E Transmission (4-speed auto)
update catalogue_items set
  name = 'Declasse 4L80-E Transmission (4-speed auto)',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Transmission'),
  sourcing = 'purchased',
  purchase_cost = 1235.0,
  customer_price = 1358.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Declasse 4L80-E (4-speed auto)'));

-- Declasse 6L80 Transmission (6-speed auto)
update catalogue_items set
  name = 'Declasse 6L80 Transmission (6-speed auto)',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Transmission'),
  sourcing = 'purchased',
  purchase_cost = 1662.5,
  customer_price = 1828.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Declasse 6L80 (6-speed auto)'));

-- Declasse M22 Rock Crusher (4-speed manual)
update catalogue_items set
  name = 'Declasse M22 Rock Crusher (4-speed manual)',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Transmission'),
  sourcing = 'purchased',
  purchase_cost = 1140.0,
  customer_price = 1254.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Declasse M22 Rock Crusher (4-speed manual)'));

-- Declasse Powerslide Transmission (2-speed auto)
update catalogue_items set
  name = 'Declasse Powerslide Transmission (2-speed auto)',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Transmission'),
  sourcing = 'purchased',
  purchase_cost = 855.0,
  customer_price = 940.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Declasse Powerslide (2-speed auto)'));

-- Declasse TH400 Transmission (3-speed auto)
update catalogue_items set
  name = 'Declasse TH400 Transmission (3-speed auto)',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Transmission'),
  sourcing = 'purchased',
  purchase_cost = 950.0,
  customer_price = 1045.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Declasse TH400 Transmission [3-speed auto)'));

-- Pfister 7MT Transmission (7-speed manual)
update catalogue_items set
  name = 'Pfister 7MT Transmission (7-speed manual)',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Transmission'),
  sourcing = 'purchased',
  purchase_cost = 2470.0,
  customer_price = 2717.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Pfister 7MT (7-speed manual)'));

-- Pneumatic Shifter
update catalogue_items set
  name = 'Pneumatic Shifter',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Transmission'),
  sourcing = 'purchased',
  purchase_cost = 1520.0,
  customer_price = 1672.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Pneumatic Shifter'));

-- Race 10-Speed Sequential Transmission (manual)
update catalogue_items set
  name = 'Race 10-Speed Sequential Transmission (manual)',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Transmission'),
  sourcing = 'purchased',
  purchase_cost = 5225.0,
  customer_price = 5747.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Race 10-Speed Sequential (10-speed manual)'));

-- Race 8-Speed Sequential Transmission (manual)
update catalogue_items set
  name = 'Race 8-Speed Sequential Transmission (manual)',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Transmission'),
  sourcing = 'purchased',
  purchase_cost = 3800.0,
  customer_price = 4180.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Race 8-Speed Sequential (8-speed manual)'));

-- Race 9-Speed Sequential Transmission (manual)
update catalogue_items set
  name = 'Race 9-Speed Sequential Transmission (manual)',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Transmission'),
  sourcing = 'purchased',
  purchase_cost = 4512.5,
  customer_price = 4963.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Race 9-Speed Sequential (9-speed manual)'));

-- Tarmac TR-6060 Transmission (6-speed manual)
update catalogue_items set
  name = 'Tarmac TR-6060 Transmission (6-speed manual)',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Transmission'),
  sourcing = 'purchased',
  purchase_cost = 1710.0,
  customer_price = 1881.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Tarmac TR-6060 (6-speed manual)'));

-- Transmission Fluid (1 Qt)
update catalogue_items set
  name = 'Transmission Fluid (1 Qt)',
  categories = '{"Repair/Service"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Fluids'),
  sourcing = 'purchased',
  purchase_cost = 16.5,
  customer_price = 18.15,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Transmission Fluid [1 Qtl'));

-- Upgraded Clutch Packs
update catalogue_items set
  name = 'Upgraded Clutch Packs',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Transmission'),
  sourcing = 'purchased',
  purchase_cost = 522.5,
  customer_price = 574.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Upgraded Clutch Packs'));

-- Upgraded Synchronizers
update catalogue_items set
  name = 'Upgraded Synchronizers',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Transmission'),
  sourcing = 'purchased',
  purchase_cost = 427.5,
  customer_price = 470.25,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Upgraded Synchronizers'));

-- Vapid 10R80 Transmission (10-speed auto)
update catalogue_items set
  name = 'Vapid 10R80 Transmission (10-speed auto)',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Transmission'),
  sourcing = 'purchased',
  purchase_cost = 2945.0,
  customer_price = 3239.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Vapid 10R80 (10-speed auto)'));

-- Vintage 2-Speed Crash Box (2-speed manual)
update catalogue_items set
  name = 'Vintage 2-Speed Crash Box (2-speed manual)',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Transmission'),
  sourcing = 'purchased',
  purchase_cost = 712.5,
  customer_price = 783.75,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Vintage 2-Speed Crash Box (2-speed manual)'));

-- Zancudo 8HP Transmission (8-speed auto)
update catalogue_items set
  name = 'Zancudo 8HP Transmission (8-speed auto)',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Transmission'),
  sourcing = 'purchased',
  purchase_cost = 2375.0,
  customer_price = 2612.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Zancudo 8HP (8-speed auto)'));

-- Zancudo 9HP Transmission (9-speed auto)
update catalogue_items set
  name = 'Zancudo 9HP Transmission (9-speed auto)',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Transmission'),
  sourcing = 'purchased',
  purchase_cost = 2660.0,
  customer_price = 2926.0,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Zancudo 9HP (9-speed auto)'));

-- Beehive Billet Steel Valve Spring Set
update catalogue_items set
  name = 'Beehive Billet Steel Valve Spring Set',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Valve Springs'),
  sourcing = 'purchased',
  purchase_cost = 34.8,
  customer_price = 38.28,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Beehive Billet Steel Valve Spring Set'));

-- Beehive Cast Steel Valve Spring Set
update catalogue_items set
  name = 'Beehive Cast Steel Valve Spring Set',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Valve Springs'),
  sourcing = 'purchased',
  purchase_cost = 14.4,
  customer_price = 15.84,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Beehive Cast Steel Valve Spring Set'));

-- Beehive Forged Steel Valve Spring Set
update catalogue_items set
  name = 'Beehive Forged Steel Valve Spring Set',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Valve Springs'),
  sourcing = 'purchased',
  purchase_cost = 19.8,
  customer_price = 21.78,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Beehive Forged Steel Valve Spring Set'));

-- Beehive Titanium Valve Spring Set
update catalogue_items set
  name = 'Beehive Titanium Valve Spring Set',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Valve Springs'),
  sourcing = 'purchased',
  purchase_cost = 63.6,
  customer_price = 69.96,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Beehive Titanium Valve Spring Set'));

-- Conical Billet Steel Valve Spring Set
update catalogue_items set
  name = 'Conical Billet Steel Valve Spring Set',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Valve Springs'),
  sourcing = 'purchased',
  purchase_cost = 28.8,
  customer_price = 31.68,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Conical Billet Steel Valve Spring Set'));

-- Conical Cast Steel Valve Spring Set
update catalogue_items set
  name = 'Conical Cast Steel Valve Spring Set',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Valve Springs'),
  sourcing = 'purchased',
  purchase_cost = 11.4,
  customer_price = 12.54,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Conical Cast Steel Valve Spring Set'));

-- Conical Forged Steel Valve Spring Set
update catalogue_items set
  name = 'Conical Forged Steel Valve Spring Set',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Valve Springs'),
  sourcing = 'purchased',
  purchase_cost = 17.4,
  customer_price = 19.14,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('ConicafForged Steel Valve Spring Set'));

-- Conical Titanium Valve Spring Set
update catalogue_items set
  name = 'Conical Titanium Valve Spring Set',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Valve Springs'),
  sourcing = 'purchased',
  purchase_cost = 52.2,
  customer_price = 57.42,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Conica Titanium Valve Spring Set'));

-- Dual Billet Steel Valve Spring Set
update catalogue_items set
  name = 'Dual Billet Steel Valve Spring Set',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Valve Springs'),
  sourcing = 'purchased',
  purchase_cost = 43.2,
  customer_price = 47.52,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Dual Billet Steel Valve Spring Set'));

-- Dual Cast Steel Valve Spring Set
update catalogue_items set
  name = 'Dual Cast Steel Valve Spring Set',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Valve Springs'),
  sourcing = 'purchased',
  purchase_cost = 17.4,
  customer_price = 19.14,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Dual Cast Steel Valve Spring Set'));

-- Dual Forged Steel Valve Spring Set
update catalogue_items set
  name = 'Dual Forged Steel Valve Spring Set',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Valve Springs'),
  sourcing = 'purchased',
  purchase_cost = 22.8,
  customer_price = 25.08,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Dual Forged Steel Valve Spring Set'));

-- Dual Titanium Valve Spring Set
update catalogue_items set
  name = 'Dual Titanium Valve Spring Set',
  categories = '{"Engine Manufacture"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Valve Springs'),
  sourcing = 'purchased',
  purchase_cost = 81.0,
  customer_price = 89.1,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Dual Titanium Valve Spring Set'));

-- Custom Wheel Rims
update catalogue_items set
  name = 'Custom Wheel Rims',
  categories = '{"Customisation"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Wheels & Tires'),
  sourcing = 'purchased',
  purchase_cost = 59.0,
  customer_price = 64.9,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Custom Wheel Rims'));

-- Drag Tire
update catalogue_items set
  name = 'Drag Tire',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Wheels & Tires'),
  sourcing = 'purchased',
  purchase_cost = 523.8,
  customer_price = 576.18,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Drag Tire'));

-- Drift Smoke Tires
update catalogue_items set
  name = 'Drift Smoke Tires',
  categories = '{"Customisation"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Wheels & Tires'),
  sourcing = 'purchased',
  purchase_cost = 461.0,
  customer_price = 507.1,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Drift Smoke Tires'));

-- Drift Tire
update catalogue_items set
  name = 'Drift Tire',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Wheels & Tires'),
  sourcing = 'purchased',
  purchase_cost = 349.2,
  customer_price = 384.12,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Drift Tire'));

-- Off-Road Tire
update catalogue_items set
  name = 'Off-Road Tire',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Wheels & Tires'),
  sourcing = 'purchased',
  purchase_cost = 291.0,
  customer_price = 320.1,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Off-Road Tire'));

-- Slick Tires
update catalogue_items set
  name = 'Slick Tires',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Wheels & Tires'),
  sourcing = 'purchased',
  purchase_cost = 285.0,
  customer_price = 313.5,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Slick Tires'));

-- Sport Tire
update catalogue_items set
  name = 'Sport Tire',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Wheels & Tires'),
  sourcing = 'purchased',
  purchase_cost = 261.6,
  customer_price = 287.76,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Sport Tire'));

-- Stock Tire
update catalogue_items set
  name = 'Stock Tire',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Wheels & Tires'),
  sourcing = 'purchased',
  purchase_cost = 87.0,
  customer_price = 95.7,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Stock Tire'));

-- Street Tire
update catalogue_items set
  name = 'Street Tire',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Wheels & Tires'),
  sourcing = 'purchased',
  purchase_cost = 145.2,
  customer_price = 159.72,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Street Tire'));

-- Track Tire
update catalogue_items set
  name = 'Track Tire',
  categories = '{"Performance"}',
  subcategory_id = (select id from catalogue_subcategories where name = 'Wheels & Tires'),
  sourcing = 'purchased',
  purchase_cost = 465.6,
  customer_price = 512.16,
  usage_type = 'single_use',
  install_time_minutes = 1,
  stock_quantity = 0,
  reorder_threshold = 1,
  notes = null
where lower(trim(name)) = lower(trim('Track Tire'));

-- ---------------------------------------------------------------------
-- Inserts: 69 new catalogue items
-- ---------------------------------------------------------------------
insert into catalogue_items (name, categories, subcategory_id, sourcing, purchase_cost, customer_price, usage_type, install_time_minutes, stock_quantity, reorder_threshold, notes, active) values
  ('Vehicle Extras', '{"Repair/Service","Customisation"}', (select id from catalogue_subcategories where name = 'Body & Panels'), 'purchased', 470.0, 517.0, 'single_use', 1, 0, 1, null, true),
  ('Brake Pads', '{"Repair/Service"}', (select id from catalogue_subcategories where name = 'Brakes'), 'purchased', 143.0, 157.3, 'single_use', 1, 0, 1, null, true),
  ('Brake Replacement', '{"Repair/Service"}', (select id from catalogue_subcategories where name = 'Brakes'), 'purchased', 148.0, 162.8, 'single_use', 1, 0, 1, null, true),
  ('Brake Upgrade', '{"Legacy"}', (select id from catalogue_subcategories where name = 'Brakes'), 'purchased', 45.0, 49.5, 'single_use', 1, 0, 1, null, true),
  ('Battery Coolant', '{"Repair/Service"}', (select id from catalogue_subcategories where name = 'Cooling'), 'purchased', 324.5, 356.95, 'single_use', 1, 0, 1, null, true),
  ('Drive Train Pump', '{"Repair/Service"}', (select id from catalogue_subcategories where name = 'Drivetrain'), 'purchased', 124.5, 136.95, 'single_use', 1, 0, 1, null, true),
  ('Drivetrain Fluid', '{"Repair/Service"}', (select id from catalogue_subcategories where name = 'Drivetrain'), 'purchased', 12.0, 13.2, 'single_use', 1, 0, 1, null, true),
  ('EV Battery', '{"Repair/Service"}', (select id from catalogue_subcategories where name = 'EV Components'), 'purchased', 3206.0, 3526.6, 'single_use', 1, 0, 1, null, true),
  ('Spark Plugs', '{"Repair/Service","Performance"}', (select id from catalogue_subcategories where name = 'Spark Plug'), 'purchased', 21.5, 23.65, 'single_use', 1, 0, 1, null, true),
  ('Billet Aluminum Inline 3 Engine Block', '{"Engine Manufacture"}', (select id from catalogue_subcategories where name = 'Engine Blocks'), 'purchased', 1187.5, 1306.25, 'single_use', 1, 0, 1, null, true),
  ('Billet Steel V12 Engine Block', '{"Engine Manufacture"}', (select id from catalogue_subcategories where name = 'Engine Blocks'), 'purchased', 1900.0, 2090.0, 'single_use', 1, 0, 1, null, true),
  ('Billet Steel W12 Engine Block', '{"Engine Manufacture"}', (select id from catalogue_subcategories where name = 'Engine Blocks'), 'purchased', 2327.5, 2560.25, 'single_use', 1, 0, 1, null, true),
  ('Cast Aluminum Inline 3 Engine Block', '{"Engine Manufacture"}', (select id from catalogue_subcategories where name = 'Engine Blocks'), 'purchased', 447.6, 492.36, 'single_use', 1, 0, 1, null, true),
  ('Compacted Graphite Iron Inline 3 Engine Block', '{"Engine Manufacture"}', (select id from catalogue_subcategories where name = 'Engine Blocks'), 'purchased', 456.0, 501.6, 'single_use', 1, 0, 1, null, true),
  ('Nitrous Install Kit', '{"Legacy"}', (select id from catalogue_subcategories where name = 'Forced Induction & Nitrous'), 'purchased', 1781.0, 1959.1, 'single_use', 1, 0, 1, null, true),
  ('Supercharger Turbo', '{"Legacy"}', (select id from catalogue_subcategories where name = 'Forced Induction & Nitrous'), 'purchased', 712.5, 783.75, 'single_use', 1, 0, 1, null, true),
  ('glass', '{"Repair/Service"}', (select id from catalogue_subcategories where name = 'Glass & Tint'), 'purchased', 7.8, 8.58, 'single_use', 1, 0, 1, null, true),
  ('Carplay Installer Tool', '{"Customisation"}', (select id from catalogue_subcategories where name = 'Interior & Audio'), 'purchased', 593.5, 652.85, 'reusable', 1, 0, 1, null, true),
  ('Mechanic Tablet', '{"Tools"}', (select id from catalogue_subcategories where name = 'Tools & Diagnostics'), 'purchased', 226.5, 249.15, 'reusable', 1, 0, 1, null, true),
  ('Decal Remover', '{"Tools"}', (select id from catalogue_subcategories where name = 'Tools & Diagnostics'), 'purchased', 35.5, 39.05, 'single_use', 1, 0, 1, null, true),
  ('Vehicle Wax Kit', '{"Tools"}', (select id from catalogue_subcategories where name = 'Tools & Diagnostics'), 'purchased', 2.0, 2.2, 'single_use', 1, 0, 1, null, true),
  ('Aluminium', '{"Scrap Material"}', (select id from catalogue_subcategories where name = 'Scrap Material'), 'purchased', 3.0, 3.3, 'single_use', 1, 0, 1, null, true),
  ('Aluminium Powder', '{"Scrap Material"}', (select id from catalogue_subcategories where name = 'Scrap Material'), 'purchased', 3.0, 3.3, 'single_use', 1, 0, 1, null, true),
  ('Brass', '{"Scrap Material"}', (select id from catalogue_subcategories where name = 'Scrap Material'), 'purchased', 4.2, 4.62, 'single_use', 1, 0, 1, null, true),
  ('Electric Motor', '{"Legacy"}', (select id from catalogue_subcategories where name = 'EV Components'), 'purchased', 6412.5, 7053.75, 'single_use', 1, 0, 1, null, true),
  ('Electric Scrap', '{"Scrap Material"}', (select id from catalogue_subcategories where name = 'Scrap Material'), 'purchased', 3.0, 3.3, 'single_use', 1, 0, 1, null, true),
  ('Empty container', '{"Scrap Material"}', (select id from catalogue_subcategories where name = 'Scrap Material'), 'purchased', 5.4, 5.94, 'single_use', 1, 0, 1, null, true),
  ('Engine Oil', '{"Legacy"}', (select id from catalogue_subcategories where name = 'Service & Other Parts'), 'purchased', 15.5, 17.05, 'single_use', 1, 0, 1, null, true),
  ('Engine Swap 1', '{"Legacy"}', (select id from catalogue_subcategories where name = 'Service & Other Parts'), 'purchased', 4194.5, 4613.95, 'single_use', 1, 0, 1, null, true),
  ('Fuel Siphon', '{"Tools"}', (select id from catalogue_subcategories where name = 'Tools & Diagnostics'), 'purchased', 90.0, 99.0, 'single_use', 1, 0, 1, null, true),
  ('High Voltage Wiring', '{"Scrap Material"}', (select id from catalogue_subcategories where name = 'Scrap Material'), 'purchased', 104.0, 114.4, 'single_use', 1, 0, 1, null, true),
  ('Iron Powder', '{"Scrap Material"}', (select id from catalogue_subcategories where name = 'Scrap Material'), 'purchased', 3.0, 3.3, 'reusable', 1, 0, 1, null, true),
  ('NOS Colour Injector', '{"Legacy"}', (select id from catalogue_subcategories where name = 'Service & Other Parts'), 'purchased', 97.0, 106.7, 'reusable', 1, 0, 1, null, true),
  ('NOS Purge Canister', '{"Legacy"}', (select id from catalogue_subcategories where name = 'Service & Other Parts'), 'purchased', 313.5, 344.85, 'reusable', 1, 0, 1, null, true),
  ('Nos Restrictor Valve', '{"Legacy"}', (select id from catalogue_subcategories where name = 'Service & Other Parts'), 'purchased', 70.5, 77.55, 'reusable', 1, 0, 1, null, true),
  ('Plastic', '{"Scrap Material"}', (select id from catalogue_subcategories where name = 'Scrap Material'), 'purchased', 3.0, 3.3, 'single_use', 1, 0, 1, null, true),
  ('RI: windows cleaner', '{"Legacy"}', (select id from catalogue_subcategories where name = 'Service & Other Parts'), 'purchased', 17.0, 18.7, 'single_use', 1, 0, 1, null, true),
  ('Raw Copper', '{"Scrap Material"}', (select id from catalogue_subcategories where name = 'Scrap Material'), 'purchased', 5.4, 5.94, 'single_use', 1, 0, 1, null, true),
  ('Raw Iron', '{"Scrap Material"}', (select id from catalogue_subcategories where name = 'Scrap Material'), 'purchased', 53.4, 58.74, 'single_use', 1, 0, 1, null, true),
  ('Raw Steel', '{"Scrap Material"}', (select id from catalogue_subcategories where name = 'Scrap Material'), 'purchased', 10.8, 11.88, 'single_use', 1, 0, 1, null, true),
  ('Repair Kit', '{"Legacy"}', (select id from catalogue_subcategories where name = 'Service & Other Parts'), 'purchased', 200.5, 220.55, 'single_use', 1, 0, 1, null, true),
  ('Roll Cage', '{"Legacy","Customisation"}', (select id from catalogue_subcategories where name = 'Service & Other Parts'), 'purchased', 177.5, 195.25, 'single_use', 1, 0, 1, null, true),
  ('Rusty Shovel', '{"Tools"}', (select id from catalogue_subcategories where name = 'Misc'), 'purchased', 19.0, 20.9, 'reusable', 1, 0, 1, null, true),
  ('Scrap Metal', '{"Scrap Material"}', (select id from catalogue_subcategories where name = 'Scrap Material'), 'purchased', 4.8, 5.28, 'single_use', 1, 0, 1, null, true),
  ('Signal Booster', '{"Tools"}', (select id from catalogue_subcategories where name = 'Misc'), 'purchased', 4275.0, 4702.5, 'reusable', 1, 0, 1, null, true),
  ('Spray', '{"Tools"}', (select id from catalogue_subcategories where name = 'Misc'), 'purchased', 11.5, 12.65, 'single_use', 1, 0, 1, null, true),
  ('Spray Remover', '{"Tools"}', (select id from catalogue_subcategories where name = 'Misc'), 'purchased', 5.5, 6.05, 'single_use', 1, 0, 1, null, true),
  ('Synthetic Acid', '{"Scrap Material"}', (select id from catalogue_subcategories where name = 'Scrap Material'), 'purchased', 49.2, 54.12, 'single_use', 1, 0, 1, null, true),
  ('Tow Rope', '{"Tools"}', (select id from catalogue_subcategories where name = 'Misc'), 'purchased', 28.8, 31.68, 'reusable', 1, 0, 1, null, true),
  ('Vehicle Winch', '{"Tools"}', (select id from catalogue_subcategories where name = 'Misc'), 'purchased', 190.0, 209.0, 'reusable', 1, 0, 1, null, true),
  ('Vehicle alarm level 1', '{"Customisation"}', (select id from catalogue_subcategories where name = 'Service & Other Parts'), 'purchased', 593.5, 652.85, 'single_use', 1, 0, 1, null, true),
  ('Vehicle alarm level 2', '{"Customisation"}', (select id from catalogue_subcategories where name = 'Service & Other Parts'), 'purchased', 3800.0, 4180.0, 'single_use', 1, 0, 1, null, true),
  ('Vehicle alarm level 3', '{"Customisation"}', (select id from catalogue_subcategories where name = 'Service & Other Parts'), 'purchased', 7125.0, 7837.5, 'single_use', 1, 0, 1, null, true),
  ('Vehicle alarm level 4', '{"Customisation"}', (select id from catalogue_subcategories where name = 'Service & Other Parts'), 'purchased', 9500.0, 10450.0, 'single_use', 1, 0, 1, null, true),
  ('boltcutter', '{"Tools"}', (select id from catalogue_subcategories where name = 'Misc'), 'purchased', 37.0, 40.7, 'reusable', 1, 0, 1, null, true),
  ('hammer', '{"Tools"}', (select id from catalogue_subcategories where name = 'Misc'), 'purchased', 8.5, 9.35, 'single_use', 1, 0, 1, null, true),
  ('lithium', '{"Scrap Material"}', (select id from catalogue_subcategories where name = 'Scrap Material'), 'purchased', 558.6, 614.46, 'single_use', 1, 0, 1, null, true),
  ('rubber', '{"Scrap Material"}', (select id from catalogue_subcategories where name = 'Scrap Material'), 'purchased', 6.6, 7.26, 'single_use', 1, 0, 1, null, true),
  ('scissors', '{"Tools"}', (select id from catalogue_subcategories where name = 'Misc'), 'purchased', 5.5, 6.05, 'single_use', 1, 0, 1, null, true),
  ('trowel', '{"Tools"}', (select id from catalogue_subcategories where name = 'Misc'), 'purchased', 6.5, 7.15, 'single_use', 1, 0, 1, null, true),
  ('Angle Grinder', '{"Tools"}', (select id from catalogue_subcategories where name = 'Misc'), 'purchased', 90.0, 99.0, 'single_use', 1, 0, 1, null, true),
  ('Electronic Circuit Tester', '{"Tools"}', (select id from catalogue_subcategories where name = 'Tools & Diagnostics'), 'purchased', 37.0, 40.7, 'reusable', 1, 0, 1, null, true),
  ('Flashlight', '{"Tools"}', (select id from catalogue_subcategories where name = 'Misc'), 'purchased', 23.5, 25.85, 'reusable', 1, 0, 1, null, true),
  ('Mechanic Bench', '{"Tools"}', (select id from catalogue_subcategories where name = 'Tools & Diagnostics'), 'purchased', 6838.2, 7522.02, 'reusable', 1, 0, 1, null, true),
  ('Mechanic Toolbox', '{"Tools"}', (select id from catalogue_subcategories where name = 'Tools & Diagnostics'), 'purchased', 208.0, 228.8, 'reusable', 1, 0, 1, null, true),
  ('Tool Box', '{"Tools"}', (select id from catalogue_subcategories where name = 'Misc'), 'purchased', 209.5, 230.45, 'single_use', 1, 0, 1, null, true),
  ('Toolkit', '{"Tools"}', (select id from catalogue_subcategories where name = 'Misc'), 'purchased', 20.5, 22.55, 'single_use', 1, 0, 1, null, true),
  ('Clutch', '{"Performance"}', (select id from catalogue_subcategories where name = 'Transmission'), 'purchased', 901.5, 991.65, 'single_use', 1, 0, 1, null, true),
  ('Manual Gearbox', '{"Performance"}', (select id from catalogue_subcategories where name = 'Transmission'), 'purchased', 712.5, 783.75, 'single_use', 1, 0, 1, null, true);