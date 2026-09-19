-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Lets the shop buy any catalogue item -- even ones with no craft recipe or
-- configured purchase_cost yet -- and record what was actually paid and
-- where it came from. Purchases feed back into catalogue_items.purchase_cost
-- (see recordPurchase in js/catalogue.js) so real cost data accumulates from
-- actual transactions instead of requiring every item to be pre-priced.
-- No new RLS/grants needed -- inventory_transactions already has them
-- (003_grants.sql), and column grants aren't separate in Postgres.
alter table inventory_transactions add column if not exists unit_cost numeric(12,2);
alter table inventory_transactions add column if not exists source_type text
  check (source_type in ('autoparts_store', 'private_citizen'));
