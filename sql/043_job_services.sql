-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Attaches a Service (sql/029) to a job -- the "eventual replacement for
-- the blanket labour rate" that column comment always flagged, now
-- actually wired up. Attaching a service snapshots its labour_fee (same
-- permanent-snapshot convention as job_items.unit_price -- a later edit to
-- services.labour_fee must never retroactively change an already-attached
-- job) and expands its materials onto job_items via the existing
-- addJobItem() path, so stock/inventory_transactions stay the single
-- source of truth exactly like adding items by hand.
--
-- job_type is stored separately from the service's own job_type_category
-- (even though they'll always match in practice) so this table has the
-- same shape/filtering as job_items -- one job can have several legs, and
-- a service attaches to whichever leg is currently open.
create table if not exists job_services (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id),
  service_id uuid not null references services(id),
  job_type job_type not null,
  labour_fee numeric(12,2),
  added_by uuid references mechanic_employees(id),
  created_at timestamptz not null default now()
);

create index if not exists job_services_job_idx on job_services (job_id);

-- Same trust model as job_items: any authenticated mechanic can attach or
-- remove a service on a job they're working (not gated by
-- has_area_permission('services'), which only governs editing the Services
-- catalogue itself).
alter table job_services enable row level security;
create policy "authenticated select job_services" on job_services for select to authenticated using (true);
create policy "authenticated insert job_services" on job_services for insert to authenticated with check (true);
create policy "authenticated delete job_services" on job_services for delete to authenticated using (true);
grant select, insert, delete on job_services to authenticated;
