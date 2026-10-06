-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
--
-- Two stock locations (Joanna, 2026-10-06): the shop's own storage and the
-- autoparts store, which also holds a lot of parts. Every stock movement
-- now records which location it happened at, each part carries a count per
-- location, and catalogue_items.stock_quantity stays the combined total --
-- so every existing reader of stock_quantity keeps working unchanged.
--
--   jobs        take from shop storage first, then the autoparts store
--   purchases   go wherever the checkout says
--   transfers   move stock between the two (total unchanged)
--   existing    stock starts in the autoparts store (Joanna's choice) --
--               use Stock Check to set the real shop counts
--
-- Run BEFORE deploying the matching frontend, which writes `location`.

-- New movement type. Must be committed before anything uses it, so it sits
-- outside the transaction below (nothing in this file inserts one).
alter type inventory_transaction_type add value if not exists 'transfer';

begin;

alter table inventory_transactions
  add column if not exists location text not null default 'shop';
alter table inventory_transactions drop constraint if exists inventory_transactions_location_check;
alter table inventory_transactions add constraint inventory_transactions_location_check
  check (location in ('shop', 'autoparts'));

alter table catalogue_items add column if not exists stock_shop integer not null default 0;
alter table catalogue_items add column if not exists stock_autoparts integer not null default 0;

-- Backfill: today's stock all starts in the autoparts store, and so does the
-- history that produced it, so each location's count still equals the sum of
-- its own ledger rows.
update inventory_transactions set location = 'autoparts';
update catalogue_items set stock_autoparts = stock_quantity, stock_shop = 0;

-- Keep the total and the per-location count in step on every movement.
-- Same security definer reasoning as sql/025: this is bookkeeping that must
-- always follow a legitimately-inserted ledger row.
create or replace function apply_inventory_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update catalogue_items
  set stock_quantity = stock_quantity + new.quantity,
      stock_shop = stock_shop + case when new.location = 'shop' then new.quantity else 0 end,
      stock_autoparts = stock_autoparts + case when new.location = 'autoparts' then new.quantity else 0 end
  where id = new.item_id;
  return new;
end;
$$;

-- Voiding reverses at the same location (and keeps a transfer's pairing),
-- otherwise a voided autoparts movement would be put back in the shop.
--
-- Also fixes a latent bug in both void RPCs: sql/032 checked
-- is_management_mechanic(), which sql/027 had already dropped, so every
-- Void on the Logs page failed with "function does not exist". They now use
-- the 'logs' permission area -- the same thing that decides who sees the
-- Void buttons.
create or replace function void_inventory_transaction(p_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  orig inventory_transactions;
  r inventory_transactions;
begin
  if not has_area_permission('logs') then
    raise exception 'Access restricted to roles with Logs access' using errcode = '42501';
  end if;

  select * into orig from inventory_transactions where id = p_id;
  if orig.id is null then
    raise exception 'Transaction not found';
  end if;
  if orig.voided_at is not null then
    raise exception 'Transaction is already voided';
  end if;

  -- A transfer is two rows (out of one location, into the other) sharing a
  -- batch_id; voiding either half voids both, so the total never drifts.
  for r in
    select * from inventory_transactions t
    where t.id = orig.id
       or (orig.transaction_type = 'transfer' and orig.batch_id is not null
           and t.batch_id = orig.batch_id and t.transaction_type = 'transfer'
           and t.voided_at is null and t.reversal_of is null)
  loop
    insert into inventory_transactions (item_id, transaction_type, quantity, job_id, performed_by, notes, reversal_of, location, batch_id)
    values (r.item_id, r.transaction_type, -r.quantity, r.job_id, current_mechanic_id(),
            coalesce(p_reason, 'Reversal of voided transaction'), r.id, r.location, r.batch_id);

    update inventory_transactions
    set voided_at = now(), voided_by = current_mechanic_id(), void_reason = p_reason
    where id = r.id;
  end loop;
end;
$$;

create or replace function void_activity_log_entry(p_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_area_permission('logs') then
    raise exception 'Access restricted to roles with Logs access' using errcode = '42501';
  end if;

  update activity_log
  set voided_at = now(), voided_by = current_mechanic_id(), void_reason = p_reason
  where id = p_id and voided_at is null;

  if not found then
    raise exception 'Entry not found or already voided';
  end if;
end;
$$;

commit;
