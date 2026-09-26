-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- New Job: surface what a customer has actually bought from the dealership
-- as suggestions on the "+ New vehicle" form, for a car that was never
-- checked in and so has no owned_vehicles row yet.
--
-- Confirmed before writing this (not assumed): vehicle_sales.customer_id
-- matches the SAME shared `customers` table this app already uses (5432 of
-- 5435 sales rows matched directly -- the tiny gap is presumably a handful
-- of sales tied to since-deleted customer rows, not a different identity
-- space), and vehicle_sale_items.vehicle_id matches this app's `vehicles`
-- table 1:1 (5435/5435). Both dealership-owned tables, read-only, same
-- reasoning as sql/038's `vehicles` policy -- and same grant gotcha
-- sql/003_grants.sql hit: CREATE POLICY alone doesn't grant SELECT, so both
-- go in together this time instead of two separate migrations.
grant select on vehicle_sales, vehicle_sale_items to authenticated;

create policy "authenticated select vehicle_sales" on vehicle_sales for select to authenticated using (true);
create policy "authenticated select vehicle_sale_items" on vehicle_sale_items for select to authenticated using (true);
