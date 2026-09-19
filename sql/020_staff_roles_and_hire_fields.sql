-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Real staff roles (apprentice / mechanic / master_mechanic / foreman /
-- manager / boss) and the hire information the shop actually needs.

alter table mechanic_employees add column if not exists citizen_id text;
alter table mechanic_employees add column if not exists phone_number text;
alter table mechanic_employees add column if not exists iban text;
alter table mechanic_employees add column if not exists discord_id text;

-- Full staff listing (everything except password_hash) for the Staff
-- management page. Same zero-anon-policy reasoning as the login RPC --
-- citizen_id/iban/discord_id are more sensitive than employee_name/role,
-- so they don't belong in the general-purpose staff_directory view that
-- every page's mechanic-assignment dropdowns already read from.
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
  return query
  select e.id, e.employee_name, e.role, e.active, e.citizen_id, e.phone_number, e.iban, e.discord_id, e.created_at
  from mechanic_employees e
  order by e.employee_name;
end;
$$;

revoke all on function mechanic_list_staff_full() from public;
grant execute on function mechanic_list_staff_full() to anon, authenticated;

-- Recreate create/update RPCs with the new hire fields. Signature changed
-- (more params), so drop the old versions first rather than leaving a
-- stale overload behind.
drop function if exists mechanic_create_staff(text, text, text);

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
  return query
  insert into mechanic_employees (employee_name, password_hash, role, active, citizen_id, phone_number, iban, discord_id)
  values (p_employee_name, crypt(p_password, gen_salt('bf')), p_role, true, p_citizen_id, p_phone_number, p_iban, p_discord_id)
  returning mechanic_employees.id, mechanic_employees.employee_name, mechanic_employees.role, mechanic_employees.active;
end;
$$;

revoke all on function mechanic_create_staff(text, text, text, text, text, text, text) from public;
grant execute on function mechanic_create_staff(text, text, text, text, text, text, text) to anon, authenticated;

drop function if exists mechanic_update_staff(uuid, text, boolean);

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
  return query
  update mechanic_employees
  set role = p_role, active = p_active, citizen_id = p_citizen_id,
      phone_number = p_phone_number, iban = p_iban, discord_id = p_discord_id
  where mechanic_employees.id = p_id
  returning mechanic_employees.id, mechanic_employees.employee_name, mechanic_employees.role, mechanic_employees.active;
end;
$$;

revoke all on function mechanic_update_staff(uuid, text, boolean, text, text, text, text) from public;
grant execute on function mechanic_update_staff(uuid, text, boolean, text, text, text, text) to anon, authenticated;
