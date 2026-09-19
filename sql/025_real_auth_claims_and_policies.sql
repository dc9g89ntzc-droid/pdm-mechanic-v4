-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Phase A of the real-auth migration (see the mechanic-login Netlify
-- function + js/auth.js + js/supabaseClient.js changes shipping alongside
-- this). PURELY ADDITIVE -- every existing `anon` policy stays in place, so
-- nothing changes for anyone until Phase B (026) runs. Safe to run and
-- deploy right away; the point of doing it as its own step is to let staff
-- log out/in (picking up a signed token) and to smoke-test before the
-- actual cutover.
--
-- Once a mechanic logs in via the new mechanic-login function, the browser
-- sends a JWT (role=authenticated, signed with the project's JWT secret)
-- instead of relying on the shared anon key alone. These three helpers read
-- that JWT's custom claims so policies/RPCs below don't repeat the same
-- current_setting() expression everywhere.
create or replace function current_mechanic_role()
returns text
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claims', true), '')::json ->> 'mechanic_role';
$$;

create or replace function current_mechanic_id()
returns uuid
language sql
stable
as $$
  select (nullif(current_setting('request.jwt.claims', true), '')::json ->> 'mechanic_id')::uuid;
$$;

create or replace function is_management_mechanic()
returns boolean
language sql
stable
as $$
  select current_mechanic_role() in ('foreman', 'manager', 'boss');
$$;

grant execute on function current_mechanic_role() to anon, authenticated;
grant execute on function current_mechanic_id() to anon, authenticated;
grant execute on function is_management_mechanic() to anon, authenticated;

-- ---------------------------------------------------------------------
-- apply_inventory_transaction() (008_catalogue_configurator.sql) is an
-- AFTER INSERT trigger on inventory_transactions that issues its own
-- `update catalogue_items set stock_quantity = ...` statement. That's a
-- real, separate DML statement, so once catalogue_items writes below
-- become management-only, this trigger's stock update would get silently
-- dropped by RLS for a regular mechanic's used_on_job transaction (the
-- transaction row itself is allowed; the resulting stock decrement isn't).
-- Access is already checked at the point of inserting the transaction row
-- (see the inventory_transactions policy below) -- this trigger is just the
-- bookkeeping that should always follow a legitimately-inserted row, so it
-- gets security definer like the RPCs, not a broader catalogue_items policy.
create or replace function apply_inventory_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update catalogue_items
  set stock_quantity = stock_quantity + new.quantity
  where id = new.item_id;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Staff-management RPCs: role check added at the top of each. Same
-- signatures as 019/020, so create-or-replace is enough -- no drop needed,
-- no client change required (js/workshop.js already calls these by name).
-- mechanic_employees itself stays RPC-only (zero table policies), same as
-- always -- these checks are the entire access boundary for staff writes.
-- ---------------------------------------------------------------------
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
  if not is_management_mechanic() then
    raise exception 'Access restricted to management roles' using errcode = '42501';
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
  if not is_management_mechanic() then
    raise exception 'Access restricted to management roles' using errcode = '42501';
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
  if not is_management_mechanic() then
    raise exception 'Access restricted to management roles' using errcode = '42501';
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
  if not is_management_mechanic() then
    raise exception 'Access restricted to management roles' using errcode = '42501';
  end if;

  return query
  select e.id, e.employee_name, e.role, e.active, e.citizen_id, e.phone_number, e.iban, e.discord_id, e.created_at
  from mechanic_employees e
  order by e.employee_name;
end;
$$;

-- ---------------------------------------------------------------------
-- New `authenticated`-scoped policies, added ALONGSIDE the existing `anon`
-- ones (both active until 026 drops the anon ones). Tables not listed here
-- (customers, owned_vehicles, jobs, job_items, inspections,
-- inspection_findings, activity_log) get a same-behavior authenticated
-- policy too -- open to any authenticated mechanic, no new restriction,
-- matching how they already work.
-- ---------------------------------------------------------------------

create policy "authenticated select customers" on customers for select to authenticated using (true);
create policy "authenticated insert customers" on customers for insert to authenticated with check (true);
create policy "authenticated update customers" on customers for update to authenticated using (true) with check (true);

create policy "authenticated select owned_vehicles" on owned_vehicles for select to authenticated using (true);
create policy "authenticated insert owned_vehicles" on owned_vehicles for insert to authenticated with check (true);
create policy "authenticated update owned_vehicles" on owned_vehicles for update to authenticated using (true) with check (true);

create policy "authenticated select jobs" on jobs for select to authenticated using (true);
create policy "authenticated insert jobs" on jobs for insert to authenticated with check (true);
create policy "authenticated update jobs" on jobs for update to authenticated using (true) with check (true);

create policy "authenticated select inspections" on inspections for select to authenticated using (true);
create policy "authenticated insert inspections" on inspections for insert to authenticated with check (true);
create policy "authenticated update inspections" on inspections for update to authenticated using (true) with check (true);

create policy "authenticated select inspection_findings" on inspection_findings for select to authenticated using (true);
create policy "authenticated insert inspection_findings" on inspection_findings for insert to authenticated with check (true);
create policy "authenticated update inspection_findings" on inspection_findings for update to authenticated using (true) with check (true);
create policy "authenticated delete inspection_findings" on inspection_findings for delete to authenticated using (true);

create policy "authenticated select job_items" on job_items for select to authenticated using (true);
create policy "authenticated insert job_items" on job_items for insert to authenticated with check (true);
create policy "authenticated update job_items" on job_items for update to authenticated using (true) with check (true);
create policy "authenticated delete job_items" on job_items for delete to authenticated using (true);

create policy "authenticated select activity_log" on activity_log for select to authenticated using (true);
create policy "authenticated insert activity_log" on activity_log for insert to authenticated with check (true);

-- Catalogue: reads open to any authenticated mechanic (job-item picker,
-- Purchasing); writes management-only, which is new real enforcement --
-- today any anon caller can edit prices/recipes directly via the API.
create policy "authenticated select catalogue_subcategories" on catalogue_subcategories for select to authenticated using (true);
create policy "authenticated write catalogue_subcategories" on catalogue_subcategories for insert to authenticated with check (is_management_mechanic());
create policy "authenticated update catalogue_subcategories" on catalogue_subcategories for update to authenticated using (is_management_mechanic()) with check (is_management_mechanic());
create policy "authenticated delete catalogue_subcategories" on catalogue_subcategories for delete to authenticated using (is_management_mechanic());

create policy "authenticated select catalogue_items" on catalogue_items for select to authenticated using (true);
create policy "authenticated insert catalogue_items" on catalogue_items for insert to authenticated with check (is_management_mechanic());
create policy "authenticated update catalogue_items" on catalogue_items for update to authenticated using (is_management_mechanic()) with check (is_management_mechanic());

create policy "authenticated select catalogue_item_ingredients" on catalogue_item_ingredients for select to authenticated using (true);
create policy "authenticated insert catalogue_item_ingredients" on catalogue_item_ingredients for insert to authenticated with check (is_management_mechanic());
create policy "authenticated update catalogue_item_ingredients" on catalogue_item_ingredients for update to authenticated using (is_management_mechanic()) with check (is_management_mechanic());
create policy "authenticated delete catalogue_item_ingredients" on catalogue_item_ingredients for delete to authenticated using (is_management_mechanic());

-- Inventory ledger: reads open to any authenticated mechanic; a used_on_job
-- write (job-items.html, any mechanic doing a job) is allowed regardless of
-- role, but crafted_in/purchased_in/adjustment (catalogue.html,
-- purchasing.html) require management -- this also closes a real gap:
-- catalogue.html's manual stock-ledger form currently lets any of the four
-- transaction types through from the client with no server-side check.
create policy "authenticated select inventory_transactions" on inventory_transactions for select to authenticated using (true);
create policy "authenticated insert inventory_transactions" on inventory_transactions for insert to authenticated
  with check (transaction_type = 'used_on_job' or is_management_mechanic());

-- Payroll: a mechanic can see their own shifts/pay; management sees
-- everyone's. Real improvement over today, where any anon caller can
-- already read (or even mark-paid) anyone's payroll.
create policy "authenticated select shift_log" on shift_log for select to authenticated
  using (is_management_mechanic() or mechanic_id = current_mechanic_id());
create policy "authenticated insert shift_log" on shift_log for insert to authenticated
  with check (is_management_mechanic() or mechanic_id = current_mechanic_id());
create policy "authenticated update shift_log" on shift_log for update to authenticated
  using (is_management_mechanic() or mechanic_id = current_mechanic_id())
  with check (is_management_mechanic() or mechanic_id = current_mechanic_id());

create policy "authenticated select payroll_ledger" on payroll_ledger for select to authenticated
  using (is_management_mechanic() or mechanic_id = current_mechanic_id());
-- Insert stays open (not self-only): recordCommission credits a job's
-- assigned mechanic when ANY mechanic bills it (billing isn't restricted to
-- the assignee), so the inserting session and the row's mechanic_id are
-- often different people. This is app-driven bookkeeping either way, not
-- something a mechanic benefits from forging by hand.
create policy "authenticated insert payroll_ledger" on payroll_ledger for insert to authenticated with check (true);
create policy "authenticated update payroll_ledger" on payroll_ledger for update to authenticated
  using (is_management_mechanic());
