-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Fixes "permission denied for table customers / owned_vehicles" seen after
-- 002_workshop_checkin.sql. RLS policies only apply once the role already
-- has the underlying table grant -- CREATE POLICY alone doesn't grant
-- SELECT/INSERT/UPDATE, and this project's anon/authenticated roles don't
-- carry the usual Supabase default privileges on these tables (consistent
-- with customers/vehicles already having RLS enabled with zero policies
-- before we touched them).

grant select, insert, update on customers to anon, authenticated;
grant select, insert, update on owned_vehicles to anon, authenticated;
grant select, insert, update on jobs to anon, authenticated;
