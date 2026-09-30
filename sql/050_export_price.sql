-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
--
-- A fourth price figure per catalogue item, stored for reference only --
-- not currently used in any calculation anywhere in the app (unlike
-- purchase_cost/shop_price/customer_price, which all feed something).
-- Joanna wants it on hand in case it's needed later.
--
-- No grant/RLS changes needed -- sql/003_grants.sql's table-level grant and
-- sql/025's "using (true)" update policy on catalogue_items already cover
-- any column added to the table, this one included.

alter table catalogue_items add column if not exists export_price numeric(12,2);
