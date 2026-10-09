-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
--
-- Several purchase carts per person (Joanna, 2026-10-09): e.g. one at the
-- autoparts store and one at the scrapyard on the go at once. The shopping
-- list's "-> Cart" now lets the buyer pick which of their carts (or a new
-- one), defaulting to the one they last used for that store.
--
-- Drops sql/059's one-active-cart-per-person rule, and the matching check
-- in the reassign function. Everything else about carts is unchanged.
--
-- Run BEFORE deploying the matching purchasing.html.

begin;

drop index if exists purchase_carts_one_active_per_person;
create index if not exists purchase_carts_assignee_active_idx
  on purchase_carts (assigned_to, updated_at desc) where status = 'active';

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

  update purchase_carts set assigned_to = p_new_assignee, updated_at = now() where id = p_cart_id;
end;
$$;

commit;
