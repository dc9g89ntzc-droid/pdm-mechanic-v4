-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Adds the Inspections slice: one inspection per job (findings captured
-- from the diagram + the 12 mechanical categories), feeding into
-- status transitions awaiting_inspection -> inspection_in_progress ->
-- quote_preparation. No parts linkage yet -- that waits for the
-- services/parts catalogue slice; recommended_service is free text
-- ("To confirm" in the UI when blank) until then.

create table if not exists inspections (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  performed_by uuid references mechanic_employees(id),
  mileage_at_inspection integer,
  overall_notes text,
  created_at timestamptz not null default now()
);

create index if not exists inspections_job_idx on inspections (job_id);

create type inspection_finding_type as enum ('body_area', 'mechanical');

create table if not exists inspection_findings (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references inspections(id),
  finding_type inspection_finding_type not null,
  area text not null, -- body diagram zone key, or mechanical category name
  severity text, -- body_area only: minor / moderate / severe / replacement_required
  condition text, -- mechanical only
  fault text, -- mechanical only
  urgency text, -- mechanical only: monitor / soon / immediate
  pass_status text, -- mechanical only: pass / advisory / fail
  recommended_service text, -- free text placeholder until the services catalogue exists
  customer_explanation text,
  internal_note text,
  photo_reference text,
  created_at timestamptz not null default now()
);

create index if not exists inspection_findings_inspection_idx on inspection_findings (inspection_id);

-- Same trust model as the rest of the app: anon key used directly from the
-- browser, RLS + explicit grants are the boundary (learned from the
-- customers/owned_vehicles miss -- policies alone aren't enough without
-- the base table grant).
alter table inspections enable row level security;
create policy "anon select inspections" on inspections for select to anon using (true);
create policy "anon insert inspections" on inspections for insert to anon with check (true);
create policy "anon update inspections" on inspections for update to anon using (true) with check (true);
grant select, insert, update on inspections to anon, authenticated;

alter table inspection_findings enable row level security;
create policy "anon select inspection_findings" on inspection_findings for select to anon using (true);
create policy "anon insert inspection_findings" on inspection_findings for insert to anon with check (true);
create policy "anon update inspection_findings" on inspection_findings for update to anon using (true) with check (true);
-- Findings are draft work-in-progress until the inspection is completed
-- (the completed inspection + resulting quote/job trail is the audit-worthy
-- record) -- unlike jobs/customers/vehicles, a delete policy here just
-- lets a mechanic correct a mis-tagged zone, not erase history.
create policy "anon delete inspection_findings" on inspection_findings for delete to anon using (true);
grant select, insert, update, delete on inspection_findings to anon, authenticated;
