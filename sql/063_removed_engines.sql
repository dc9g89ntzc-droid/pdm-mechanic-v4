-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk,
-- AFTER sql/062.
--
-- Original engines kept for spares (Joanna, 2026-10-08): when a new engine
-- is installed, the mechanic can record that the car's original engine was
-- kept -- its type, layout and rough condition. It's listed in Engine
-- Storage alongside the built engines until it's used for spares. A
-- stop-gap until parts crafting/dismantling is built properly, so there's
-- no parts list and no stock movement.
--
-- Additive only. Run BEFORE deploying the matching frontend.

begin;

alter table stored_engines add column if not exists kind text not null default 'built';
alter table stored_engines drop constraint if exists stored_engines_kind_check;
alter table stored_engines add constraint stored_engines_kind_check check (kind in ('built', 'removed'));

alter table stored_engines add column if not exists condition text;
alter table stored_engines drop constraint if exists stored_engines_condition_check;
alter table stored_engines add constraint stored_engines_condition_check
  check (condition is null or condition in ('good', 'worn', 'bad', 'destroyed'));

-- Records the original engine taken out of the job's vehicle.
-- p_spec: { valvetrain, configuration }.
create or replace function record_removed_engine(p_job_id uuid, p_spec jsonb, p_condition text, p_notes text default null)
returns stored_engines
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
  if not exists (select 1 from jobs where id = p_job_id) then
    raise exception 'Job not found.';
  end if;
  if coalesce(p_spec ->> 'valvetrain', '') = '' or coalesce(p_spec ->> 'configuration', '') = '' then
    raise exception 'Pick the original engine''s type and layout.';
  end if;
  if p_condition not in ('good', 'worn', 'bad', 'destroyed') then
    raise exception 'Pick the original engine''s condition.';
  end if;

  insert into stored_engines (kind, engine_spec, condition, source_job_id, stored_by, notes)
  values ('removed', jsonb_build_object('valvetrain', p_spec ->> 'valvetrain', 'configuration', p_spec ->> 'configuration'),
          p_condition, p_job_id, v_me, p_notes)
  returning * into v_engine;
  return v_engine;
end;
$$;

revoke execute on function record_removed_engine(uuid, jsonb, text, text) from public, anon;
grant execute on function record_removed_engine(uuid, jsonb, text, text) to authenticated;

-- Only built engines can be fitted to a job (redefined from sql/062 with
-- that one extra check).
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
  if v_engine.kind <> 'built' then
    raise exception 'Only a built engine can be fitted -- removed engines are kept for spares.';
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

commit;
