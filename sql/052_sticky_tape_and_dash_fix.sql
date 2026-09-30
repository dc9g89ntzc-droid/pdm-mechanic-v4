-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
--
-- Two follow-ups from sql/051's diagnostic query:
--
-- 1. The 13 "Nitrous Kit .../Turbocharger ..." rows didn't match because
--    the live catalogue name actually uses a plain hyphen ("Nitrous Kit -
--    100 Shot"), not an em-dash -- the opposite of what sql/051's comment
--    assumed (that assumption was based on sql/034's own insert using an
--    em-dash for the same family of names, which -- per this result --
--    apparently never actually matched anything there either, and just
--    silently inserted zero service_materials rows for those two
--    services). Re-running with plain hyphens this time, still with the
--    same dash-normalization guard so it's harmless if this is wrong too.
--
-- 2. "Sticky Tape" is a genuinely new item, not yet in the catalogue --
--    Joanna confirmed. Added here with the shop/export price from the
--    screenshot; purchase_cost (import price) is left null until she
--    supplies it, same "To confirm until set" convention as everywhere
--    else. Mirrors 'Duct Tape' (sql/010) for category/subcategory/usage,
--    the closest existing item shape.

update catalogue_items ci set
  shop_price = v.shop_price,
  export_price = v.export_price
from (values
  ('Nitrous Kit - 100 Shot', 3937.00, 1602.00),
  ('Nitrous Kit - 200 Shot', 5775.00, 2350.00),
  ('Nitrous Kit - 300 Shot', 8400.00, 3420.00),
  ('Nitrous Kit - 50 Shot', 2625.00, 1068.00),
  ('Turbocharger - Large Compressor / Large Turbine', 4935.00, 2008.00),
  ('Turbocharger - Large Compressor / Medium Turbine', 4567.00, 1859.00),
  ('Turbocharger - Large Compressor / Small Turbine', 4200.00, 1710.00),
  ('Turbocharger - Medium Compressor / Large Turbine', 3465.00, 1410.00),
  ('Turbocharger - Medium Compressor / Medium Turbine', 3097.00, 1260.00),
  ('Turbocharger - Medium Compressor / Small Turbine', 2730.00, 1111.00),
  ('Turbocharger - Small Compressor / Large Turbine', 2310.00, 940.00),
  ('Turbocharger - Small Compressor / Medium Turbine', 1942.00, 790.00),
  ('Turbocharger - Small Compressor / Small Turbine', 1575.00, 640.00)
) as v(name, shop_price, export_price)
where replace(replace(lower(ci.name), chr(8211), '-'), chr(8212), '-')
    = replace(replace(lower(v.name), chr(8211), '-'), chr(8212), '-');

insert into catalogue_items (
  name, categories, subcategory_id, sourcing, usage_type,
  install_time_minutes, stock_quantity, reorder_threshold,
  shop_price, export_price, available_autoparts, available_scrapyard, active
)
select
  'Sticky Tape', '{"Repair/Service"}',
  (select id from catalogue_subcategories where name = 'Service & Other Parts'),
  'purchased', 'single_use', 1, 0, 5,
  15.00, 6.00, true, false, true
where not exists (select 1 from catalogue_items where lower(name) = 'sticky tape');

-- Re-run sql/051's diagnostic block (the "with input(name) as (values ...)"
-- query at its end) afterward if you want to confirm these 13 now match.
