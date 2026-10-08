-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
--
-- Engine Building becomes its own Workshop area (Joanna, 2026-10-08).
--
-- 1. labour_rates: the per-distinct-part labour charge for each work type,
--    editable on the Accounts page instead of hardcoded in js/workshop.js
--    (INSTALL_CHARGE_BY_JOB_TYPE). Seeded with today's rates, except Engine
--    Building drops from 1000 to 450 per part type (Joanna's call). Bills
--    already issued keep the labour they were charged -- jobs.labour_fee is
--    snapshotted at billing.
-- 2. job_legs.engine_spec: the engine an Engine Building leg is building
--    ({ valvetrain, configuration, style }), shown on the quote and bill.
--
-- Additive only. Run BEFORE deploying the matching frontend.

begin;

create table if not exists labour_rates (
  job_type job_type primary key,
  rate_per_part numeric(12,2) not null check (rate_per_part >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references mechanic_employees(id)
);

insert into labour_rates (job_type, rate_per_part) values
  ('repair', 100),
  ('customisation', 250),
  ('performance', 450),
  ('engine_building', 450)
on conflict (job_type) do nothing;

alter table labour_rates enable row level security;
create policy "authenticated select labour_rates" on labour_rates for select to authenticated using (true);
create policy "accounts update labour_rates" on labour_rates for update to authenticated
  using (has_area_permission('accounts')) with check (has_area_permission('accounts'));
grant select, update on labour_rates to authenticated;

alter table job_legs add column if not exists engine_spec jsonb;

commit;
