-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Safe to re-run -- guarded by the same on-conflict as 034's insert.
--
-- The "Body Repair" service (mapped to the diagram's "Body (overall
-- condition)" zone, inspection.js's BODY_ZONE_SERVICE) only had one linked
-- material (Body Filler, from 030/034). The zone's popup dropdown on
-- inspection.html shows whatever service_materials this service has, so
-- it only ever offered one option. Adds the other two real body-repair
-- consumables from the catalogue (sql/010) so the dropdown offers all
-- three: Body Filler, Body Patch, Fiberglass Sheet.

insert into service_materials (service_id, catalogue_item_id, quantity)
select s.id, c.id, m.quantity
from (values
  ('Body Repair', 'Body Patch', 1),
  ('Body Repair', 'Fiberglass Sheet', 1)
) as m(service_name, item_name, quantity)
join services s on s.name = m.service_name
join catalogue_items c on c.name = m.item_name
on conflict (service_id, catalogue_item_id) do nothing;
