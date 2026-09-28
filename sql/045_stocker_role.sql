-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- New "stocker" role (js/workshop.js's STAFF_ROLES) for delivery staff --
-- paid a flat $2,500 per delivery run (js/workshop.js's recordDelivery),
-- not the hourly shift-clock wage the mechanic hierarchy uses. Seeded with
-- access to Purchasing only (where the Shopping List they deliver against
-- lives) -- same "reproduce today's intended behaviour, then adjustable
-- from the Staff page matrix" pattern as every other role_permissions seed
-- (027/029/032).
insert into role_permissions (role, area, allowed)
select 'stocker', a.area, a.area = 'purchasing'
from unnest(array['catalogue','services','purchasing','reports','logs','staff','payroll','accounts']) as a(area)
on conflict (role, area) do nothing;
