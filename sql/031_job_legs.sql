-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Splits the single flat job_status pipeline into one pipeline PER selected
-- work type on a job (repair / customisation / performance), run one leg at
-- a time in that fixed order -- matches how Joanna's real workflow moves a
-- ticket through the shop: a repair fully finishes before customisation
-- starts, customisation fully finishes before performance starts, and only
-- once every selected leg is done does the job fall into one shared Billing
-- stage. The old flat jobs.status/job_status enum can't express "this job
-- is mid-way through its second of three legs", so job_legs is the new
-- source of truth for per-type progress; jobs.status is left in place
-- (same precedent as job_type in 004_job_types_flexible.sql) rather than
-- dropped, it just stops being what new code writes to.

create table if not exists job_legs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id),
  job_type job_type not null,
  status job_status not null, -- reuses the existing enum from 016; ready_to_bill just goes unused at leg level
  approved_at timestamptz,
  work_started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, job_type)
);

create index if not exists job_legs_job_idx on job_legs (job_id);
create index if not exists job_legs_type_status_idx on job_legs (job_type, status);

drop trigger if exists job_legs_set_updated_at on job_legs;
create trigger job_legs_set_updated_at
  before update on job_legs
  for each row
  execute function set_updated_at();

-- job_items: which leg a picked item belongs to. Nullable so existing rows
-- (added before this shipped) don't need a backfill guess at exactly which
-- leg they were for -- they just won't show up in a leg-scoped list, same
-- "don't silently guess" convention used elsewhere in this project. Every
-- new insert going forward sets it.
alter table job_items add column if not exists job_type job_type;
create index if not exists job_items_job_type_idx on job_items (job_id, job_type);

-- jobs: coarse job-level stage Billing and the history/reports pages
-- actually need now. Deliberately a NEW column/enum rather than repurposing
-- the granular `status` column, so nothing about the existing enum has to
-- be rebuilt.
create type job_stage as enum ('in_progress', 'ready_to_bill', 'completed', 'cancelled');
alter table jobs add column if not exists stage job_stage not null default 'in_progress';

update jobs set stage = 'completed' where status = 'completed' and stage = 'in_progress';
update jobs set stage = 'cancelled' where status = 'cancelled' and stage = 'in_progress';
update jobs set stage = 'ready_to_bill' where status = 'ready_to_bill' and stage = 'in_progress';

-- Backfill job_legs for jobs that already exist and aren't finished/cancelled
-- yet -- one leg per selected type, best-effort status mapping from the old
-- flat status. Ambiguous cases (e.g. a customisation-only job that was
-- mid-flight under the old single pipeline) land at quote_preparation
-- rather than guessing further along than they might really be -- easy for
-- a mechanic to correct on the new board, safer than silently marking
-- something approved/in-progress that wasn't.
do $$
declare
  j record;
  t job_type;
  leg_status job_status;
begin
  -- Only 6 of the 9 job_status values can actually reach this loop -- the
  -- stage filter above already peeled off completed/cancelled/ready_to_bill
  -- jobs before this runs. awaiting_customer_approval/ready_to_begin were
  -- real historical statuses (002_workshop_checkin.sql) but no longer exist
  -- in the enum at all (016/017 rebuilt it without them), so there's
  -- nothing to map them from -- omitted rather than referencing values
  -- Postgres would reject outright.
  for j in select id, job_types, status from jobs where stage = 'in_progress' loop
    foreach t in array j.job_types loop
      if t = 'repair' then
        leg_status := case
          when j.status in ('awaiting_inspection', 'inspection_in_progress') then j.status
          when j.status in ('approved', 'waiting_for_parts') then 'approved'::job_status
          when j.status = 'work_in_progress' then 'work_in_progress'::job_status
          else 'quote_preparation'::job_status
        end;
      else
        leg_status := case
          when j.status in ('approved', 'waiting_for_parts') then 'approved'::job_status
          when j.status = 'work_in_progress' then 'work_in_progress'::job_status
          else 'quote_preparation'::job_status
        end;
      end if;

      insert into job_legs (job_id, job_type, status)
      values (j.id, t, leg_status)
      on conflict (job_id, job_type) do nothing;
    end loop;
  end loop;
end $$;

-- Same trust model as jobs/job_items/inspections (025_real_auth_claims_and_policies.sql):
-- open to any authenticated mechanic, no per-role restriction -- every
-- mechanic needs to move tickets through the board. No delete policy, ever,
-- matching jobs itself -- a leg is cancelled via status, never deleted.
alter table job_legs enable row level security;
drop policy if exists "authenticated select job_legs" on job_legs;
drop policy if exists "authenticated insert job_legs" on job_legs;
drop policy if exists "authenticated update job_legs" on job_legs;
create policy "authenticated select job_legs" on job_legs for select to authenticated using (true);
create policy "authenticated insert job_legs" on job_legs for insert to authenticated with check (true);
create policy "authenticated update job_legs" on job_legs for update to authenticated using (true) with check (true);
grant select, insert, update on job_legs to authenticated;
