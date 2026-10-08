-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
--
-- Engine Building: built engines wait for the customer, and can go into
-- storage if they change their mind (Joanna, 2026-10-08).
--
-- 1. job_status 'ready_for_installation': the Engine Building leg now runs
--    ... -> work_in_progress (building) -> ready_for_installation (built,
--    waiting for the customer) -> completed (installed) -> Billing. The
--    customer pays on installation, as before.
-- 2. stored_engines: a built engine the customer didn't take. The shop
--    keeps it to resell. Storing takes the engine's parts off the job (no
--    stock movement -- they're inside the engine), cancels the Engine
--    Building leg and, if nothing else is left on the job, cancels the job
--    (unbilled). A stored engine can later be fitted to another job's
--    Engine Building leg (parts go onto that job at today's prices, again
--    without touching stock), or stripped for parts (parts back into shop
--    stock).
--
-- Additive only. Run BEFORE deploying the matching frontend.

-- Enum values can't be added inside a transaction block that then uses
-- them, so this goes first, on its own.
alter type job_status add value if not exists 'ready_for_installation' after 'work_in_progress';

begin;

create table if not exists stored_engines (
  id uuid primary key default gen_random_uuid(),
  engine_number serial,
  engine_spec jsonb,
  -- [{ catalogue_item_id, name, quantity, unit_price, unit_cost }]
  parts jsonb not null default '[]'::jsonb,
  parts_value numeric(12,2) not null default 0,
  status text not null default 'in_storage' check (status in ('in_storage', 'fitted', 'stripped')),
  source_job_id uuid references jobs(id),
  stored_at timestamptz not null default now(),
  stored_by uuid references mechanic_employees(id),
  fitted_job_id uuid references jobs(id),
  fitted_at timestamptz,
  fitted_by uuid references mechanic_employees(id),
  stripped_at timestamptz,
  stripped_by uuid references mechanic_employees(id),
  notes text
);

create index if not exists stored_engines_status_idx on stored_engines (status, stored_at desc);

-- Read by anyone signed in; every change goes through the functions below.
alter table stored_engines enable row level security;
drop policy if exists "authenticated select stored_engines" on stored_engines;
create policy "authenticated select stored_engines" on stored_engines for select to authenticated using (true);
grant select on stored_engines to authenticated;

-- Puts the job's Engine Building parts into storage.
--   p_cancel_leg = true  (the customer changed their mind): the leg must be
--     ready_for_installation; it's cancelled and the job moves on (to
--     Billing if other finished work remains, otherwise cancelled).
--   p_cancel_leg = false (the builder is swapping a stored engine back out
--     for a different build): the leg is untouched.
-- An engine that came out of storage for this job goes back as the same
-- stored engine (same number), with whatever parts it has now.
create or replace function store_job_engine(p_job_id uuid, p_cancel_leg boolean default true, p_notes text default null)
returns stored_engines
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := current_mechanic_id();
  v_leg job_legs;
  v_parts jsonb;
  v_value numeric(12,2);
  v_prev_id uuid;
  v_engine stored_engines;
begin
  if v_me is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;

  select * into v_leg from job_legs where job_id = p_job_id and job_type = 'engine_building' for update;
  if v_leg.id is null then
    raise exception 'This job has no Engine Building work.';
  end if;
  if p_cancel_leg and v_leg.status::text <> 'ready_for_installation' then
    raise exception 'Only a finished engine (Ready for installation) can go into storage.';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'catalogue_item_id', ji.catalogue_item_id, 'name', ci.name, 'quantity', ji.quantity,
           'unit_price', ji.unit_price, 'unit_cost', ji.unit_cost) order by ci.name), '[]'::jsonb),
         coalesce(sum(coalesce(ji.unit_price, 0) * ji.quantity), 0)
    into v_parts, v_value
    from job_items ji join catalogue_items ci on ci.id = ji.catalogue_item_id
   where ji.job_id = p_job_id and ji.job_type = 'engine_building';
  if jsonb_array_length(v_parts) = 0 then
    raise exception 'There are no engine parts on this job to store.';
  end if;

  v_prev_id := nullif(v_leg.engine_spec ->> 'stored_engine_id', '')::uuid;
  if v_prev_id is not null and exists (select 1 from stored_engines where id = v_prev_id and fitted_job_id = p_job_id and status = 'fitted') then
    update stored_engines
       set status = 'in_storage', parts = v_parts, parts_value = v_value,
           engine_spec = v_leg.engine_spec - 'stored_engine_id',
           stored_at = now(), stored_by = v_me, source_job_id = p_job_id,
           fitted_job_id = null, fitted_at = null, fitted_by = null,
           notes = coalesce(p_notes, notes)
     where id = v_prev_id
    returning * into v_engine;
  else
    insert into stored_engines (engine_spec, parts, parts_value, source_job_id, stored_by, notes)
    values (v_leg.engine_spec - 'stored_engine_id', v_parts, v_value, p_job_id, v_me, p_notes)
    returning * into v_engine;
  end if;

  -- The parts now live in the stored engine: off the job, stock untouched.
  delete from job_items where job_id = p_job_id and job_type = 'engine_building';
  update job_legs set engine_spec = engine_spec - 'stored_engine_id' where id = v_leg.id;

  if p_cancel_leg then
    update job_legs set status = 'cancelled', cancelled_at = now() where id = v_leg.id;
    if not exists (select 1 from job_legs where job_id = p_job_id and status not in ('completed', 'cancelled')) then
      update jobs
         set stage = (case when exists (select 1 from job_legs where job_id = p_job_id and status = 'completed')
                           then 'ready_to_bill' else 'cancelled' end)::job_stage
       where id = p_job_id;
    end if;
  end if;

  return v_engine;
end;
$$;

-- Fits a stored engine to a job that's still quoting its Engine Building
-- leg and has no engine parts on it yet. Parts go on at today's catalogue
-- prices (the stored cost is kept), with no stock movement.
create or replace function fit_stored_engine(p_engine_id uuid, p_job_id uuid)
returns stored_engines
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := current_mechanic_id();
  v_leg job_legs;
  v_engine stored_engines;
begin
  if v_me is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;

  select * into v_engine from stored_engines where id = p_engine_id for update;
  if v_engine.id is null or v_engine.status <> 'in_storage' then
    raise exception 'That engine is no longer in storage.';
  end if;

  select * into v_leg from job_legs where job_id = p_job_id and job_type = 'engine_building' for update;
  if v_leg.id is null then
    raise exception 'This job has no Engine Building work.';
  end if;
  if v_leg.status::text <> 'quote_preparation' then
    raise exception 'A stored engine can only be fitted while the engine is still being quoted.';
  end if;
  if exists (select 1 from job_items where job_id = p_job_id and job_type = 'engine_building') then
    raise exception 'Take the engine parts already on this job off first.';
  end if;

  insert into job_items (job_id, catalogue_item_id, quantity, unit_price, unit_cost, sourcing_choice, job_type, added_by)
  select p_job_id, ci.id, (p ->> 'quantity')::numeric, coalesce(ci.customer_price, (p ->> 'unit_price')::numeric),
         (p ->> 'unit_cost')::numeric, null, 'engine_building', v_me
    from jsonb_array_elements(v_engine.parts) p
    join catalogue_items ci on ci.id = (p ->> 'catalogue_item_id')::uuid;

  update job_legs
     set engine_spec = coalesce(v_engine.engine_spec, '{}'::jsonb) || jsonb_build_object('stored_engine_id', v_engine.id)
   where id = v_leg.id;

  update stored_engines
     set status = 'fitted', fitted_job_id = p_job_id, fitted_at = now(), fitted_by = v_me
   where id = p_engine_id
  returning * into v_engine;
  return v_engine;
end;
$$;

-- Strips a stored engine: every part goes back into shop stock.
create or replace function strip_stored_engine(p_engine_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := current_mechanic_id();
  v_engine stored_engines;
begin
  if v_me is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;

  select * into v_engine from stored_engines where id = p_engine_id for update;
  if v_engine.id is null or v_engine.status <> 'in_storage' then
    raise exception 'That engine is no longer in storage.';
  end if;

  insert into inventory_transactions (item_id, transaction_type, quantity, location, performed_by, notes)
  select (p ->> 'catalogue_item_id')::uuid, 'used_on_job', round((p ->> 'quantity')::numeric)::integer, 'shop', v_me,
         'Stripped stored engine #' || v_engine.engine_number
    from jsonb_array_elements(v_engine.parts) p
   where exists (select 1 from catalogue_items ci where ci.id = (p ->> 'catalogue_item_id')::uuid);

  update stored_engines set status = 'stripped', stripped_at = now(), stripped_by = v_me where id = p_engine_id;
end;
$$;

revoke execute on function store_job_engine(uuid, boolean, text) from public, anon;
revoke execute on function fit_stored_engine(uuid, uuid) from public, anon;
revoke execute on function strip_stored_engine(uuid) from public, anon;
grant execute on function store_job_engine(uuid, boolean, text) to authenticated;
grant execute on function fit_stored_engine(uuid, uuid) to authenticated;
grant execute on function strip_stored_engine(uuid) to authenticated;

commit;
