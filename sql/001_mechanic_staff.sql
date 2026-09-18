-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Creates the mechanic shop's own staff table (separate from the dealership
-- employees table) and a login RPC mirroring dealership_verify_login.

create extension if not exists pgcrypto;

create table if not exists mechanic_employees (
  id uuid primary key default gen_random_uuid(),
  employee_name text not null unique,
  password_hash text not null,
  role text not null default 'mechanic',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function mechanic_verify_login(p_employee_name text, p_password text)
returns table (id uuid, employee_name text, role text)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  select e.id, e.employee_name, e.role
  from mechanic_employees e
  where e.employee_name = p_employee_name
    and e.active
    and e.password_hash = crypt(p_password, e.password_hash);
end;
$$;

revoke all on function mechanic_verify_login(text, text) from public;
grant execute on function mechanic_verify_login(text, text) to anon, authenticated;

-- Seed a test login so the vertical slice can be checked end-to-end.
-- Employee: admin / Password: changeme123 -- change or delete this row once real staff are added.
insert into mechanic_employees (employee_name, password_hash, role)
values ('admin', crypt('changeme123', gen_salt('bf')), 'manager')
on conflict (employee_name) do nothing;
