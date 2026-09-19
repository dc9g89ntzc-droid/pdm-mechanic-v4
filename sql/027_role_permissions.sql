-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Replaces the hardcoded MANAGEMENT_ROLES split (foreman/manager/boss vs
-- everyone else) with a configurable per-role, per-area permission matrix,
-- editable from the Staff page. Seeded to reproduce today's exact behavior
-- (foreman/manager/boss = true everywhere, apprentice/mechanic/
-- master_mechanic = false everywhere) so nothing changes until someone
-- edits the matrix.
create table if not exists role_permissions (
  role text not null,
  area text not null, -- 'catalogue' | 'purchasing' | 'reports' | 'staff' | 'payroll' | 'accounts'
  allowed boolean not null default false,
  primary key (role, area)
);

insert into role_permissions (role, area, allowed)
select r.role, a.area, r.role in ('foreman', 'manager', 'boss')
from unnest(array['apprentice','mechanic','master_mechanic','foreman','manager','boss']) as r(role)
cross join unnest(array['catalogue','purchasing','reports','staff','payroll','accounts']) as a(area)
on conflict (role, area) do nothing;

-- has_area_permission() reads current_mechanic_role() (sql/025) and looks
-- it up here live on every call -- nothing is baked into the JWT, so
-- flipping a permission in the matrix takes effect immediately, no
-- re-login required. Defaults to false (not an error) for no claim/unknown
-- role/unknown area, so access is denied by default rather than open.
create or replace function has_area_permission(p_area text)
returns boolean
language sql
stable
as $$
  select coalesce(
    (select allowed from role_permissions where role = current_mechanic_role() and area = p_area),
    false
  );
$$;

grant execute on function has_area_permission(text) to anon, authenticated;

alter table role_permissions enable row level security;
create policy "authenticated select role_permissions" on role_permissions for select to authenticated using (true);
create policy "authenticated update role_permissions" on role_permissions for update to authenticated
  using (has_area_permission('staff')) with check (has_area_permission('staff'));
grant select, update on role_permissions to authenticated;

-- ---------------------------------------------------------------------
-- Swap every is_management_mechanic() reference (sql/025) for the specific
-- area it actually gates. Named policies need drop-then-recreate (no
-- `create or replace policy` in Postgres); the 4 staff RPCs are plain
-- create-or-replace since their signatures aren't changing.
-- ---------------------------------------------------------------------

drop policy "authenticated write catalogue_subcategories" on catalogue_subcategories;
create policy "authenticated write catalogue_subcategories" on catalogue_subcategories for insert to authenticated with check (has_area_permission('catalogue'));

drop policy "authenticated update catalogue_subcategories" on catalogue_subcategories;
create policy "authenticated update catalogue_subcategories" on catalogue_subcategories for update to authenticated using (has_area_permission('catalogue')) with check (has_area_permission('catalogue'));

drop policy "authenticated delete catalogue_subcategories" on catalogue_subcategories;
create policy "authenticated delete catalogue_subcategories" on catalogue_subcategories for delete to authenticated using (has_area_permission('catalogue'));

drop policy "authenticated insert catalogue_items" on catalogue_items;
create policy "authenticated insert catalogue_items" on catalogue_items for insert to authenticated with check (has_area_permission('catalogue'));

drop policy "authenticated update catalogue_items" on catalogue_items;
create policy "authenticated update catalogue_items" on catalogue_items for update to authenticated using (has_area_permission('catalogue')) with check (has_area_permission('catalogue'));

drop policy "authenticated insert catalogue_item_ingredients" on catalogue_item_ingredients;
create policy "authenticated insert catalogue_item_ingredients" on catalogue_item_ingredients for insert to authenticated with check (has_area_permission('catalogue'));

drop policy "authenticated update catalogue_item_ingredients" on catalogue_item_ingredients;
create policy "authenticated update catalogue_item_ingredients" on catalogue_item_ingredients for update to authenticated using (has_area_permission('catalogue')) with check (has_area_permission('catalogue'));

drop policy "authenticated delete catalogue_item_ingredients" on catalogue_item_ingredients;
create policy "authenticated delete catalogue_item_ingredients" on catalogue_item_ingredients for delete to authenticated using (has_area_permission('catalogue'));

-- purchased_in can come from either catalogue.html or purchasing.html, so
-- either area's permission is enough for it; used_on_job stays open to any
-- authenticated mechanic (job-items.html), unchanged from sql/025.
drop policy "authenticated insert inventory_transactions" on inventory_transactions;
create policy "authenticated insert inventory_transactions" on inventory_transactions for insert to authenticated
  with check (transaction_type = 'used_on_job' or has_area_permission('catalogue') or has_area_permission('purchasing'));

drop policy "authenticated select shift_log" on shift_log;
create policy "authenticated select shift_log" on shift_log for select to authenticated
  using (has_area_permission('payroll') or mechanic_id = current_mechanic_id());

drop policy "authenticated insert shift_log" on shift_log;
create policy "authenticated insert shift_log" on shift_log for insert to authenticated
  with check (has_area_permission('payroll') or mechanic_id = current_mechanic_id());

drop policy "authenticated update shift_log" on shift_log;
create policy "authenticated update shift_log" on shift_log for update to authenticated
  using (has_area_permission('payroll') or mechanic_id = current_mechanic_id())
  with check (has_area_permission('payroll') or mechanic_id = current_mechanic_id());

drop policy "authenticated select payroll_ledger" on payroll_ledger;
create policy "authenticated select payroll_ledger" on payroll_ledger for select to authenticated
  using (has_area_permission('payroll') or mechanic_id = current_mechanic_id());

drop policy "authenticated update payroll_ledger" on payroll_ledger;
create policy "authenticated update payroll_ledger" on payroll_ledger for update to authenticated
  using (has_area_permission('payroll'));

create or replace function mechanic_create_staff(
  p_employee_name text, p_password text, p_role text,
  p_citizen_id text default null, p_phone_number text default null,
  p_iban text default null, p_discord_id text default null
)
returns table (id uuid, employee_name text, role text, active boolean)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not has_area_permission('staff') then
    raise exception 'Access restricted to your role' using errcode = '42501';
  end if;

  return query
  insert into mechanic_employees (employee_name, password_hash, role, active, citizen_id, phone_number, iban, discord_id)
  values (p_employee_name, crypt(p_password, gen_salt('bf')), p_role, true, p_citizen_id, p_phone_number, p_iban, p_discord_id)
  returning mechanic_employees.id, mechanic_employees.employee_name, mechanic_employees.role, mechanic_employees.active;
end;
$$;

create or replace function mechanic_update_staff(
  p_id uuid, p_role text, p_active boolean,
  p_citizen_id text default null, p_phone_number text default null,
  p_iban text default null, p_discord_id text default null
)
returns table (id uuid, employee_name text, role text, active boolean)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not has_area_permission('staff') then
    raise exception 'Access restricted to your role' using errcode = '42501';
  end if;

  return query
  update mechanic_employees
  set role = p_role, active = p_active, citizen_id = p_citizen_id,
      phone_number = p_phone_number, iban = p_iban, discord_id = p_discord_id
  where mechanic_employees.id = p_id
  returning mechanic_employees.id, mechanic_employees.employee_name, mechanic_employees.role, mechanic_employees.active;
end;
$$;

create or replace function mechanic_reset_password(p_id uuid, p_new_password text)
returns table (id uuid, employee_name text)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not has_area_permission('staff') then
    raise exception 'Access restricted to your role' using errcode = '42501';
  end if;

  return query
  update mechanic_employees
  set password_hash = crypt(p_new_password, gen_salt('bf'))
  where mechanic_employees.id = p_id
  returning mechanic_employees.id, mechanic_employees.employee_name;
end;
$$;

create or replace function mechanic_list_staff_full()
returns table (
  id uuid, employee_name text, role text, active boolean,
  citizen_id text, phone_number text, iban text, discord_id text, created_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not has_area_permission('staff') then
    raise exception 'Access restricted to your role' using errcode = '42501';
  end if;

  return query
  select e.id, e.employee_name, e.role, e.active, e.citizen_id, e.phone_number, e.iban, e.discord_id, e.created_at
  from mechanic_employees e
  order by e.employee_name;
end;
$$;

drop function is_management_mechanic();
