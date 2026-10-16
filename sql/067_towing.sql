-- Towing: new business arm (dispatch -> roadside work -> tow to shop).
-- Tow is a leg type on the existing jobs/job_legs system (sql/031), not a
-- standalone table -- a job created at dispatch can later grow a repair
-- leg once the vehicle is actually at the shop, same job record throughout.

alter type job_type add value if not exists 'tow';

-- Leg-specific payload for a tow leg: which hex was picked, the computed
-- fee, and the free-text dispatch stage (dispatched/en_route/at_scene/
-- towing/delivered). Kept as jsonb rather than new columns or job_status
-- enum values, mirroring job_legs.engine_spec's precedent (sql/060) for
-- leg-type-specific data that doesn't belong on every leg.
alter table job_legs add column if not exists tow_pickup jsonb;

-- The one service a tow always bills: its labour_fee is set per-pickup
-- (computed from the hex map in towing.html) at attach time via the
-- existing addServiceToJob() snapshot mechanism, same as every other
-- service -- the null here is just the unused catalogue default.
insert into service_subcategories (name)
values ('Towing')
on conflict (name) do nothing;

insert into services (name, job_type_category, subcategory_id, labour_fee, notes)
select
  'Tow to Shop', 'tow', sc.id, null,
  'Fee is computed per-pickup from the hex map in towing.html and set at attach time -- this row''s labour_fee is just the catalogue default (unused).'
from service_subcategories sc
where sc.name = 'Towing'
  and not exists (select 1 from services s where s.name = 'Tow to Shop');

-- Tow Driver: a new role outside the mechanic skill ladder, same shape as
-- Stocker (sql/045) -- no admin-area access, narrow page of their own
-- (towing.html isn't gated by role_permissions at all, same as the
-- Workshop board itself).
insert into role_permissions (role, area, allowed)
select 'tow_driver', a.area, false
from unnest(array['catalogue','services','purchasing','reports','logs','staff','payroll','accounts']) as a(area)
on conflict (role, area) do nothing;
