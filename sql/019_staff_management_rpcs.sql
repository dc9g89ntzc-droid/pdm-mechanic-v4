-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Staff management: create/update employees and reset passwords via RPCs,
-- same pattern as mechanic_verify_login (001) -- mechanic_employees has
-- zero anon policies on purpose (it holds password_hash), so this has to
-- go through security-definer functions rather than direct table access.
-- Same UI-level-only trust model as the rest of the app: these RPCs are
-- reachable by the shared anon key like everything else, gated by role
-- checks in the client, not by the database (there's no per-user session
-- for Postgres to check against without migrating to real Supabase Auth).

create or replace function mechanic_create_staff(p_employee_name text, p_password text, p_role text)
returns table (id uuid, employee_name text, role text, active boolean)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  insert into mechanic_employees (employee_name, password_hash, role, active)
  values (p_employee_name, crypt(p_password, gen_salt('bf')), p_role, true)
  returning mechanic_employees.id, mechanic_employees.employee_name, mechanic_employees.role, mechanic_employees.active;
end;
$$;

revoke all on function mechanic_create_staff(text, text, text) from public;
grant execute on function mechanic_create_staff(text, text, text) to anon, authenticated;

create or replace function mechanic_update_staff(p_id uuid, p_role text, p_active boolean)
returns table (id uuid, employee_name text, role text, active boolean)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  update mechanic_employees
  set role = p_role, active = p_active
  where mechanic_employees.id = p_id
  returning mechanic_employees.id, mechanic_employees.employee_name, mechanic_employees.role, mechanic_employees.active;
end;
$$;

revoke all on function mechanic_update_staff(uuid, text, boolean) from public;
grant execute on function mechanic_update_staff(uuid, text, boolean) to anon, authenticated;

create or replace function mechanic_reset_password(p_id uuid, p_new_password text)
returns table (id uuid, employee_name text)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  update mechanic_employees
  set password_hash = crypt(p_new_password, gen_salt('bf'))
  where mechanic_employees.id = p_id
  returning mechanic_employees.id, mechanic_employees.employee_name;
end;
$$;

revoke all on function mechanic_reset_password(uuid, text) from public;
grant execute on function mechanic_reset_password(uuid, text) to anon, authenticated;
