-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
--
-- Shared purchase carts (Joanna, 2026-10-07). The Purchasing page's cart used
-- to live only in one browser tab; now each purchase run is a saved cart that
-- everyone can see on the Active Purchases board, like the Workshop board.
--
--   * one source per cart: Autoparts Store, Scrapyard, or Private Citizen
--   * one active cart per employee -- "add to cart" always means *your* cart
--   * anyone with Purchasing access can view any cart; only the assigned
--     employee can edit it; a manager/boss can reassign it to someone else
--   * completing a cart logs the purchase (stock, prices, Logs) exactly as
--     before, with the cart's id as the purchase batch id
--
-- Additive: two new tables + one RPC. Run BEFORE deploying the matching
-- purchasing.html, which reads and writes these tables.

begin;

create table if not exists purchase_carts (
  id uuid primary key default gen_random_uuid(),
  cart_number bigint generated always as identity,
  source_type text not null
    check (source_type in ('autoparts_store', 'scrapyard', 'private_citizen')),
  location text not null default 'shop'
    check (location in ('shop', 'autoparts')),            -- where bought stock goes (sql/058)
  notes text,
  status text not null default 'active'
    check (status in ('active', 'completed', 'cancelled')),
  assigned_to uuid not null references mechanic_employees(id),
  created_by uuid references mechanic_employees(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  closed_by uuid references mechanic_employees(id)
);

-- One active cart per person.
create unique index if not exists purchase_carts_one_active_per_person
  on purchase_carts (assigned_to) where status = 'active';
create index if not exists purchase_carts_status_idx on purchase_carts (status, updated_at desc);

create table if not exists purchase_cart_lines (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references purchase_carts(id) on delete cascade,
  catalogue_item_id uuid not null references catalogue_items(id),
  quantity integer not null check (quantity > 0),
  unit_cost numeric(12,2),                                 -- price being paid; null until known
  added_by uuid references mechanic_employees(id),
  created_at timestamptz not null default now(),
  unique (cart_id, catalogue_item_id)
);

create index if not exists purchase_cart_lines_cart_idx on purchase_cart_lines (cart_id);

-- Any line change bumps the cart's updated_at, so the board can show
-- "last touched" without every caller remembering to.
create or replace function touch_purchase_cart()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update purchase_carts set updated_at = now() where id = coalesce(new.cart_id, old.cart_id);
  return null;
end;
$$;

drop trigger if exists purchase_cart_lines_touch on purchase_cart_lines;
create trigger purchase_cart_lines_touch
  after insert or update or delete on purchase_cart_lines
  for each row execute function touch_purchase_cart();

-- ---- Access ----
alter table purchase_carts enable row level security;
alter table purchase_cart_lines enable row level security;

-- Viewing: anyone with Purchasing access.
create policy "purchasing select purchase_carts" on purchase_carts for select to authenticated
  using (has_area_permission('purchasing'));
create policy "purchasing select purchase_cart_lines" on purchase_cart_lines for select to authenticated
  using (has_area_permission('purchasing'));

-- Starting a cart: only for yourself.
create policy "own insert purchase_carts" on purchase_carts for insert to authenticated
  with check (has_area_permission('purchasing') and assigned_to = current_mechanic_id()
              and created_by = current_mechanic_id() and status = 'active');

-- Editing a cart (notes, put-into, complete/cancel): only the assignee, only
-- while active, and they can't hand it to someone else themselves -- that's
-- the manager-only RPC below.
create policy "own update purchase_carts" on purchase_carts for update to authenticated
  using (assigned_to = current_mechanic_id() and status = 'active')
  with check (assigned_to = current_mechanic_id());

-- Lines: only on your own active cart.
create policy "own insert purchase_cart_lines" on purchase_cart_lines for insert to authenticated
  with check (exists (select 1 from purchase_carts c
                      where c.id = cart_id and c.assigned_to = current_mechanic_id() and c.status = 'active'));
create policy "own update purchase_cart_lines" on purchase_cart_lines for update to authenticated
  using (exists (select 1 from purchase_carts c
                 where c.id = cart_id and c.assigned_to = current_mechanic_id() and c.status = 'active'));
create policy "own delete purchase_cart_lines" on purchase_cart_lines for delete to authenticated
  using (exists (select 1 from purchase_carts c
                 where c.id = cart_id and c.assigned_to = current_mechanic_id() and c.status = 'active'));

grant select, insert, update on purchase_carts to authenticated;
grant select, insert, update, delete on purchase_cart_lines to authenticated;

-- ---- Reassign (manager / boss only) ----
-- Matches MANAGEMENT_ROLES in js/workshop.js.
create or replace function purchase_cart_reassign(p_cart_id uuid, p_new_assignee uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cart purchase_carts;
begin
  if current_mechanic_role() not in ('manager', 'boss') then
    raise exception 'Only a manager can reassign a purchase cart.' using errcode = '42501';
  end if;

  select * into v_cart from purchase_carts where id = p_cart_id;
  if v_cart.id is null or v_cart.status <> 'active' then
    raise exception 'That cart is not active any more.';
  end if;
  if v_cart.assigned_to = p_new_assignee then
    return;
  end if;
  if not exists (select 1 from mechanic_employees where id = p_new_assignee and active = true) then
    raise exception 'That employee is not active.';
  end if;
  if exists (select 1 from purchase_carts where assigned_to = p_new_assignee and status = 'active') then
    raise exception 'That employee already has an active cart -- they need to complete or cancel it first.';
  end if;

  update purchase_carts set assigned_to = p_new_assignee, updated_at = now() where id = p_cart_id;
end;
$$;

revoke execute on function purchase_cart_reassign(uuid, uuid) from public, anon;
grant execute on function purchase_cart_reassign(uuid, uuid) to authenticated;

commit;
