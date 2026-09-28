-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Shopping list: parts flagged for restock from job materials (or added by
-- hand), conglomerated across however many different jobs asked for them,
-- checked off as they're bought, then converted into real stock in one go.
--
-- One row per catalogue item (not per job/request) -- adding the same item
-- again just increases its quantity (js/shoppingList.js's addToShoppingList
-- does the upsert), which is the actual "conglomerate across orders" ask.
-- bought is a whole-row flag, not per-unit -- ticking it off means "I've
-- bought all of this line's quantity," matching how the UI strikes through
-- the whole row.
create table if not exists shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  catalogue_item_id uuid not null references catalogue_items(id) unique,
  quantity numeric(12,2) not null default 1,
  bought boolean not null default false,
  bought_at timestamptz,
  bought_by uuid references mechanic_employees(id),
  added_by uuid references mechanic_employees(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists shopping_list_items_set_updated_at on shopping_list_items;
create trigger shopping_list_items_set_updated_at
  before update on shopping_list_items
  for each row
  execute function set_updated_at();

-- Same trust model as job_items/job_services: any authenticated mechanic
-- can add, check off, or remove -- this is working stock, not a
-- permission-gated config table.
alter table shopping_list_items enable row level security;
create policy "authenticated select shopping_list_items" on shopping_list_items for select to authenticated using (true);
create policy "authenticated insert shopping_list_items" on shopping_list_items for insert to authenticated with check (true);
create policy "authenticated update shopping_list_items" on shopping_list_items for update to authenticated using (true) with check (true);
create policy "authenticated delete shopping_list_items" on shopping_list_items for delete to authenticated using (true);
grant select, insert, update, delete on shopping_list_items to authenticated;

-- Real gap found while building this: inventory_transactions.source_type
-- (024) only ever allowed 'autoparts_store'/'private_citizen' -- there was
-- no valid value for a Scrapyard purchase at all, needed now that
-- "converting bought shopping-list items to stock" has to log a real
-- source per item.
alter table inventory_transactions drop constraint if exists inventory_transactions_source_type_check;
alter table inventory_transactions add constraint inventory_transactions_source_type_check
  check (source_type in ('autoparts_store', 'private_citizen', 'scrapyard'));
