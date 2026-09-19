-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Phase B of the real-auth migration -- the actual cutover. Run this ONLY
-- after 025 has been run, the client code (js/auth.js, js/supabaseClient.js,
-- netlify/functions/mechanic-login.js) is deployed, and you've confirmed at
-- least one fresh login picks up a signed token (check localStorage for a
-- `pdm_mechanic_token` key after logging in).
--
-- This drops the old blanket `anon` policies added back when the app had no
-- concept of a signed-in user, so the raw public anon key alone (e.g. hand-
-- crafted REST calls, no login) can no longer read or write real data --
-- only a request carrying a valid signed token can. The 025 `authenticated`
-- policies are what keeps the app itself working after this runs.
--
-- EVERY MECHANIC CURRENTLY LOGGED IN HAS A STORED SESSION FROM BEFORE THIS
-- SHIPPED, WITH NO TOKEN -- they'll see failures (blank boards, failed
-- saves) until they log out and back in once. Give the team a heads up
-- before running this, ideally in a quiet moment.

drop policy "anon select customers" on customers;
drop policy "anon insert customers" on customers;
drop policy "anon update customers" on customers;

drop policy "anon select owned_vehicles" on owned_vehicles;
drop policy "anon insert owned_vehicles" on owned_vehicles;
drop policy "anon update owned_vehicles" on owned_vehicles;

drop policy "anon select jobs" on jobs;
drop policy "anon insert jobs" on jobs;
drop policy "anon update jobs" on jobs;

drop policy "anon select inspections" on inspections;
drop policy "anon insert inspections" on inspections;
drop policy "anon update inspections" on inspections;

drop policy "anon select inspection_findings" on inspection_findings;
drop policy "anon insert inspection_findings" on inspection_findings;
drop policy "anon update inspection_findings" on inspection_findings;
drop policy "anon delete inspection_findings" on inspection_findings;

drop policy "anon select catalogue_subcategories" on catalogue_subcategories;
drop policy "anon insert catalogue_subcategories" on catalogue_subcategories;
drop policy "anon update catalogue_subcategories" on catalogue_subcategories;
drop policy "anon delete catalogue_subcategories" on catalogue_subcategories;

drop policy "anon select catalogue_items" on catalogue_items;
drop policy "anon insert catalogue_items" on catalogue_items;
drop policy "anon update catalogue_items" on catalogue_items;

drop policy "anon select catalogue_item_ingredients" on catalogue_item_ingredients;
drop policy "anon insert catalogue_item_ingredients" on catalogue_item_ingredients;
drop policy "anon update catalogue_item_ingredients" on catalogue_item_ingredients;
drop policy "anon delete catalogue_item_ingredients" on catalogue_item_ingredients;

drop policy "anon select inventory_transactions" on inventory_transactions;
drop policy "anon insert inventory_transactions" on inventory_transactions;

drop policy "anon select job_items" on job_items;
drop policy "anon insert job_items" on job_items;
drop policy "anon update job_items" on job_items;
drop policy "anon delete job_items" on job_items;

drop policy "anon select activity_log" on activity_log;
drop policy "anon insert activity_log" on activity_log;

drop policy "anon select shift_log" on shift_log;
drop policy "anon insert shift_log" on shift_log;
drop policy "anon update shift_log" on shift_log;

drop policy "anon select payroll_ledger" on payroll_ledger;
drop policy "anon insert payroll_ledger" on payroll_ledger;
drop policy "anon update payroll_ledger" on payroll_ledger;

-- mechanic-item-icons Storage bucket is intentionally left as-is (anon
-- select, 011_storage_icons_read_policy.sql) -- just part icons, not worth
-- gating behind a session.
