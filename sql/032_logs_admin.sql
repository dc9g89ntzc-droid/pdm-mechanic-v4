-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Adds a controlled way to void a wrongly-logged entry on either ledger
-- (activity_log, inventory_transactions) without breaking the "never
-- rewrite history" principle both were built on (see the header comment on
-- 018_activity_log.sql and the no-update-policy note on
-- inventory_transactions in 008_catalogue_configurator.sql). Voiding never
-- deletes or edits the original row -- it marks it voided and, for
-- inventory entries, inserts a real reversing transaction (the same
-- mechanism a manual correction already uses today: a counteracting
-- 'adjustment' row), so stock_quantity actually moves back and the ledger
-- stays a complete, honest trail either way.
--
-- Both void columns are only ever written by the RPCs below -- no plain
-- UPDATE policy is added to either table, so "append-only" still holds for
-- everything except this one controlled, management-gated path.

alter table activity_log add column if not exists voided_at timestamptz;
alter table activity_log add column if not exists voided_by uuid references mechanic_employees(id);
alter table activity_log add column if not exists void_reason text;

alter table inventory_transactions add column if not exists voided_at timestamptz;
alter table inventory_transactions add column if not exists voided_by uuid references mechanic_employees(id);
alter table inventory_transactions add column if not exists void_reason text;
alter table inventory_transactions add column if not exists reversal_of uuid references inventory_transactions(id);

create or replace function void_inventory_transaction(p_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  orig inventory_transactions;
begin
  if not is_management_mechanic() then
    raise exception 'Access restricted to management roles' using errcode = '42501';
  end if;

  select * into orig from inventory_transactions where id = p_id;
  if orig.id is null then
    raise exception 'Transaction not found';
  end if;
  if orig.voided_at is not null then
    raise exception 'Transaction is already voided';
  end if;

  -- Fires the existing apply_inventory_transaction trigger, so
  -- stock_quantity moves back exactly like a manual adjustment already
  -- does today -- this is that same correction, just automated.
  insert into inventory_transactions (item_id, transaction_type, quantity, job_id, performed_by, notes, reversal_of)
  values (orig.item_id, orig.transaction_type, -orig.quantity, orig.job_id, current_mechanic_id(),
          coalesce(p_reason, 'Reversal of voided transaction'), orig.id);

  update inventory_transactions
  set voided_at = now(), voided_by = current_mechanic_id(), void_reason = p_reason
  where id = p_id;
end;
$$;

grant execute on function void_inventory_transaction(uuid, text) to authenticated;

create or replace function void_activity_log_entry(p_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_management_mechanic() then
    raise exception 'Access restricted to management roles' using errcode = '42501';
  end if;

  update activity_log
  set voided_at = now(), voided_by = current_mechanic_id(), void_reason = p_reason
  where id = p_id and voided_at is null;

  if not found then
    raise exception 'Entry not found or already voided';
  end if;
end;
$$;

grant execute on function void_activity_log_entry(uuid, text) to authenticated;

-- New permission area, seeded the same way 027 seeded the original six
-- (foreman/manager/boss = true, everyone else = false).
insert into role_permissions (role, area, allowed)
select r.role, 'logs', r.role in ('foreman', 'manager', 'boss')
from unnest(array['apprentice','mechanic','master_mechanic','foreman','manager','boss']) as r(role)
on conflict (role, area) do nothing;
