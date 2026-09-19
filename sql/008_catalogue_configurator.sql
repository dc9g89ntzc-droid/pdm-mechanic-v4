-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- The Items Configurator: a management-level tool for defining every part
-- the shop uses -- how it's sourced, what it costs, what it's built from,
-- and how much of it is on hand. This is the "configurable" catalogue that
-- was deliberately parked during the check-in/inspection slices; recipe
-- costs and stock levels are meant to be edited here as crafting/purchasing
-- realities change, not hardcoded into the app.
--
-- Feeds two things going forward: the customisation/performance tile
-- browser (category -> subcategory -> item), and foreman-facing reporting
-- on which services are most used and how often items need crafting
-- (via inventory_transactions, an append-only usage ledger).

-- Top-level category reuses job_type so catalogue browsing and job-board
-- filtering stay in the same vocabulary (repair, customisation,
-- performance, engine_building).

create table if not exists catalogue_subcategories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create type catalogue_sourcing as enum ('crafted', 'purchased', 'both');
create type catalogue_usage as enum ('single_use', 'reusable');

create table if not exists catalogue_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category job_type not null,
  subcategory_id uuid references catalogue_subcategories(id),
  end_uses text[] not null default '{}', -- free tags, e.g. {"forced induction","cosmetic"}

  sourcing catalogue_sourcing not null default 'purchased',
  craft_time_minutes integer, -- null if never crafted
  craft_cost numeric(12,2),   -- null if never crafted (see catalogue_item_ingredients for a derivable version)
  purchase_cost numeric(12,2), -- null if never purchased
  customer_price numeric(12,2), -- what's quoted to the customer; independent of internal cost

  install_time_minutes integer,
  usage_type catalogue_usage not null default 'single_use',
  required_tool text, -- bench/rig needed to craft this, if any

  stock_quantity integer not null default 0,
  reorder_threshold integer,

  active boolean not null default true, -- retire via flag, not delete, so history stays intact
  image_url text,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists catalogue_items_category_idx on catalogue_items (category);
create index if not exists catalogue_items_subcategory_idx on catalogue_items (subcategory_id);

drop trigger if exists catalogue_items_set_updated_at on catalogue_items;
create trigger catalogue_items_set_updated_at
  before update on catalogue_items
  for each row
  execute function set_updated_at();

-- Bill of materials: what a crafted item is made from. Ingredients point at
-- other catalogue_items rows (not free text) so a craft cost can be derived
-- from real ingredient prices instead of typed in twice and left to drift.
create table if not exists catalogue_item_ingredients (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references catalogue_items(id) on delete cascade,
  ingredient_item_id uuid not null references catalogue_items(id),
  quantity numeric(12,2) not null default 1,
  check (item_id <> ingredient_item_id),
  unique (item_id, ingredient_item_id)
);

create index if not exists catalogue_item_ingredients_item_idx on catalogue_item_ingredients (item_id);

-- Append-only inventory ledger. stock_quantity on catalogue_items is a
-- running balance kept in sync by the trigger below -- never edited
-- directly, only ever moved by inserting a transaction (including manual
-- corrections, via 'adjustment'). This ledger is also the data source for
-- "which services are most popular" / "how often does X need crafting"
-- reporting, so it's worth recording performed_by and job_id even though
-- neither is required to keep the balance correct.
create type inventory_transaction_type as enum ('crafted_in', 'purchased_in', 'used_on_job', 'adjustment');

create table if not exists inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references catalogue_items(id),
  transaction_type inventory_transaction_type not null,
  quantity integer not null, -- signed: positive = stock in, negative = stock out
  job_id uuid references jobs(id),
  performed_by uuid references mechanic_employees(id),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists inventory_transactions_item_idx on inventory_transactions (item_id);
create index if not exists inventory_transactions_job_idx on inventory_transactions (job_id);

create or replace function apply_inventory_transaction()
returns trigger
language plpgsql
as $$
begin
  update catalogue_items
  set stock_quantity = stock_quantity + new.quantity
  where id = new.item_id;
  return new;
end;
$$;

drop trigger if exists inventory_transactions_apply on inventory_transactions;
create trigger inventory_transactions_apply
  after insert on inventory_transactions
  for each row
  execute function apply_inventory_transaction();

-- Same trust model as the rest of the app: anon key used directly from the
-- browser, RLS + explicit grants are the boundary.
alter table catalogue_subcategories enable row level security;
create policy "anon select catalogue_subcategories" on catalogue_subcategories for select to anon using (true);
create policy "anon insert catalogue_subcategories" on catalogue_subcategories for insert to anon with check (true);
create policy "anon update catalogue_subcategories" on catalogue_subcategories for update to anon using (true) with check (true);
create policy "anon delete catalogue_subcategories" on catalogue_subcategories for delete to anon using (true);
grant select, insert, update, delete on catalogue_subcategories to anon, authenticated;

alter table catalogue_items enable row level security;
create policy "anon select catalogue_items" on catalogue_items for select to anon using (true);
create policy "anon insert catalogue_items" on catalogue_items for insert to anon with check (true);
create policy "anon update catalogue_items" on catalogue_items for update to anon using (true) with check (true);
-- No delete policy -- retire items via the active flag since quotes/jobs/
-- recipes may already reference them.
grant select, insert, update on catalogue_items to anon, authenticated;

alter table catalogue_item_ingredients enable row level security;
create policy "anon select catalogue_item_ingredients" on catalogue_item_ingredients for select to anon using (true);
create policy "anon insert catalogue_item_ingredients" on catalogue_item_ingredients for insert to anon with check (true);
create policy "anon update catalogue_item_ingredients" on catalogue_item_ingredients for update to anon using (true) with check (true);
create policy "anon delete catalogue_item_ingredients" on catalogue_item_ingredients for delete to anon using (true);
grant select, insert, update, delete on catalogue_item_ingredients to anon, authenticated;

alter table inventory_transactions enable row level security;
create policy "anon select inventory_transactions" on inventory_transactions for select to anon using (true);
create policy "anon insert inventory_transactions" on inventory_transactions for insert to anon with check (true);
-- No update/delete -- it's a ledger; mistakes get corrected with a new
-- 'adjustment' row, not by rewriting history.
grant select, insert on inventory_transactions to anon, authenticated;
