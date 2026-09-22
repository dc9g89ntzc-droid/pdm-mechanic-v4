-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Safe to re-run in full -- every insert below is guarded (on conflict do
-- nothing / where not exists), unlike 030's own inserts.
--
-- Two things:
--
-- 1. Backfills service_materials. The app is reporting services (e.g.
--    "Brake Pads (install set)") with zero linked materials even though
--    030's insert lists a material for every service -- most likely 030's
--    service_materials insert either wasn't run, or was run before some
--    of the catalogue names below existed under their current spelling.
--    This re-runs that exact insert (same service/item pairs, same
--    quantities) with `on conflict (service_id, catalogue_item_id) do
--    nothing`, so it's harmless whether a given row already made it in or
--    not. Five item names are updated from 030's original text to match
--    033's corrected catalogue spelling (033 renamed the row in place, so
--    the id is the same -- only the name to join on has changed):
--    Altemator -> Alternator, 02 Sensor -> O2 Sensor, Motor Oil (1 Ot) ->
--    Motor Oil (1 Qt), Transmission Fluid [1 Qtl -> Transmission Fluid
--    (1 Qt), Declasse TH400 Transmission [3-speed auto) -> Declasse TH400
--    Transmission (3-speed auto). Fuel filter -> Fuel Filter is also
--    corrected (033 fixed the casing).
--
-- 2. Adds four services for vehicle-diagram zones that had no match at
--    all: Rear Left/Right Door (mirrors the existing Front Left/Right
--    Door -- same Door Assembly material) and Rear Left/Right Window
--    (mirrors Front Left/Right Window -- same Window Part material).
--    Front bumper/rear bumper and diagram wheel damage are still left
--    unmapped -- there's no bumper catalogue item at all, and diagram
--    wheel damage isn't the same thing as the tire-wear service, so
--    those need a decision (new catalogue item + price) rather than a
--    safe copy of an existing pattern.

insert into services (name, description, job_type_category, subcategory_id, notes)
select v.name, v.description, 'repair'::job_type,
  (select id from service_subcategories where name = v.subcat), v.notes
from (values
  ('Rear Left Door', 'Repair or replace the rear-left door', 'Body', null),
  ('Rear Right Door', 'Repair or replace the rear-right door', 'Body', null),
  ('Rear Left Window', 'Replace the rear-left window', 'Glass', null),
  ('Rear Right Window', 'Replace the rear-right window', 'Glass', null)
) as v(name, description, subcat, notes)
where not exists (select 1 from services where name = v.name);

insert into service_materials (service_id, catalogue_item_id, quantity)
select s.id, c.id, m.quantity
from (values
  ('Change Tire — Front Left', 'Base Tire', 1),
  ('Change Tire — Front Right', 'Base Tire', 1),
  ('Change Tire — Rear Left', 'Base Tire', 1),
  ('Change Tire — Rear Right', 'Base Tire', 1),
  ('Jump Start', 'Jump Starter', 1),
  ('Nitrous Refill', 'Nitrous Bottle (Refill)', 1),
  ('Duct Tape Cooling System', 'Duct Tape', 1),
  ('Duct Tape Fuel System', 'Duct Tape', 1),
  ('Duct Tape Transmission', 'Duct Tape', 1),
  ('Duct Tape Engine', 'Duct Tape', 1),
  ('Body Repair', 'Body Filler', 1),
  ('Front Left Door', 'Door Assembly', 1),
  ('Front Right Door', 'Door Assembly', 1),
  ('Rear Left Door', 'Door Assembly', 1),
  ('Rear Right Door', 'Door Assembly', 1),
  ('Hood', 'Hood', 1),
  ('Trunk', 'Trunk Lid', 1),
  ('Front Left Window', 'Window Part', 1),
  ('Front Right Window', 'Window Part', 1),
  ('Rear Left Window', 'Window Part', 1),
  ('Rear Right Window', 'Window Part', 1),
  ('Rear Window', 'Windshield', 1),
  ('Windshield', 'Windshield', 1),
  ('Brake Pads (install set)', 'Stock Brake Pads', 4),
  ('Brake Rotors (install set)', 'Brake Rotor', 4),
  ('Brake Line Replacement', 'Brake Lines', 1),
  ('Alternator Replacement', 'Alternator', 1),
  ('Battery Replacement', 'Car Battery', 1),
  ('Light Repair', 'Taillight Assembly', 2),
  ('Light Repair', 'Xenon Headlights', 2),
  ('Starter Replacement', 'Starter Motor', 1),
  ('Spark Plug Service', 'Copper Standard Spark Plug', 1),
  ('Head Gasket Replacement', 'Head Gasket Set', 1),
  ('Accessory Belt Replacement', 'Drive Belt', 1),
  ('Timing Chain Replacement', 'Timing Chain Kit', 1),
  ('Radiator Kit (install)', 'Street Radiator', 1),
  ('Radiator Replacement', 'Radiator', 1),
  ('Thermostat Replacement', 'Thermostat', 1),
  ('Water Pump Replacement', 'Water Pump', 1),
  ('Differential Re-Gear', 'Differential Re-Gear Kit', 1),
  ('Transmission (install)', 'Declasse TH400 Transmission (3-speed auto)', 1),
  ('Shifter Upgrade (install)', 'Pneumatic Shifter', 1),
  ('Center Differential Rebuild', 'Differential Rebuild Kit', 1),
  ('Front Differential Rebuild', 'Differential Rebuild Kit', 1),
  ('Rear Differential Rebuild', 'Differential Rebuild Kit', 1),
  ('Torque Converter Replacement', 'Torque Converter', 1),
  ('Transmission Rebuild', 'Transmission Rebuild Kit', 1),
  ('Fuel Pump Replacement', 'Fuel Pump', 1),
  ('Suspension Kit (install)', 'Stock Suspension', 4),
  ('Bushing Replacement', 'Bushing Kit', 1),
  ('Shock Absorber Replacement', 'Suspension Service Part', 4),
  ('Spring Replacement', 'Suspension Springs', 4),
  ('Sway Bar Replacement', 'Sway Bar', 1),
  ('Air Filter Replacement', 'Air Filter', 1),
  ('Brake Fluid Flush', 'Brake Fluid', 1),
  ('Coolant Flush', 'Coolant', 1),
  ('Differential Fluid Change', 'Differential Fluid', 1),
  ('Fuel Filter Replacement', 'Fuel Filter', 1),
  ('MAF Sensor Replacement', 'MAF Sensor', 1),
  ('O2 Sensor Replacement', 'O2 Sensor', 1),
  ('Oil Change', 'Motor Oil (1 Qt)', 1),
  ('Oil Change', 'Oil Filter', 1),
  ('Throttle Position Sensor Replacement', 'Throttle Position Sensor', 1),
  ('Transmission Fluid Change', 'Transmission Fluid (1 Qt)', 1),
  ('Tire Set (install)', 'Street Tire', 4),
  ('Turbocharger (install)', 'Turbocharger — Medium Compressor / Medium Turbine', 1),
  ('Supercharger (install)', 'Medium Centrifugal Supercharger', 1),
  ('Nitrous Kit (install)', 'Nitrous Kit — 100 Shot', 1),
  ('Intercooler (install)', 'Street Intercooler', 1),
  ('Boost Controller (install)', 'Boost Controller', 1)
) as m(service_name, item_name, quantity)
join services s on s.name = m.service_name
join catalogue_items c on c.name = m.item_name
on conflict (service_id, catalogue_item_id) do nothing;
