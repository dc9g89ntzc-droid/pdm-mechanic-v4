-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Fixes "403 Forbidden" on the vehicle-type search added in sql/038. Same
-- gotcha 003_grants.sql already documents: CREATE POLICY alone doesn't grant
-- SELECT -- this project's anon/authenticated roles don't carry Supabase's
-- usual default table privileges, so the read policy on `vehicles` from
-- sql/038 was never actually reachable without this.

grant select on vehicles to authenticated;
