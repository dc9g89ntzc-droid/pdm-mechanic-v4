-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- The Services configurator: named jobs the shop offers (Turbo Install, Oil
-- Change, ...), each built from a list of real catalogue_items materials --
-- structurally a parallel to catalogue_items/catalogue_subcategories/
-- catalogue_item_ingredients (008), not a repurposing of them. That's a
-- deliberate choice, not just tidiness: job_items.catalogue_item_id is a
-- hard, non-null FK straight to catalogue_items(id) (013), so a "service"
-- can never be added directly as a job_item -- attaching one to a job later
-- will mean expanding its materials onto job_items, which only works if
-- services live in their own table pointing AT catalogue_items, not inside
-- it.
--
-- job_type_category reuses the existing job_type enum (the job board's own
-- vocabulary) so services and the board can never drift out of sync on
-- category spelling. labour_fee is nullable -- "null = To confirm, never
-- show as 0" is the convention every other unset price in this app already
-- follows. It's a flat per-service charge Joanna may use to eventually
-- replace the blanket 10% labour fee (LABOUR_FEE_RATE in js/workshop.js) --
-- that swap isn't happening yet, this just adds the field.

create table if not exists service_subcategories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  job_type_category job_type not null,
  subcategory_id uuid references service_subcategories(id),
  labour_fee numeric(12,2),
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists services_job_type_category_idx on services (job_type_category);
create index if not exists services_subcategory_idx on services (subcategory_id);

drop trigger if exists services_set_updated_at on services;
create trigger services_set_updated_at
  before update on services
  for each row
  execute function set_updated_at();

-- Materials list: what a service actually uses, pointing at real
-- catalogue_items rows (not free text) -- same "materials used per service"
-- shape as catalogue_item_ingredients, so a future cost rollup is possible
-- the same way ingredient costs already are.
create table if not exists service_materials (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  catalogue_item_id uuid not null references catalogue_items(id),
  quantity numeric(12,2) not null default 1,
  unique (service_id, catalogue_item_id)
);

create index if not exists service_materials_service_idx on service_materials (service_id);

-- New permission area, seeded the same way 027 seeded the original six
-- (foreman/manager/boss = true, everyone else = false) so nothing changes
-- until someone edits the matrix on the Staff page.
insert into role_permissions (role, area, allowed)
select r.role, 'services', r.role in ('foreman', 'manager', 'boss')
from unnest(array['apprentice','mechanic','master_mechanic','foreman','manager','boss']) as r(role)
on conflict (role, area) do nothing;

-- Same trust model as the rest of the app: reads open to any authenticated
-- mechanic, writes gated by has_area_permission('services') (sql/025/027).
alter table service_subcategories enable row level security;
create policy "authenticated select service_subcategories" on service_subcategories for select to authenticated using (true);
create policy "authenticated insert service_subcategories" on service_subcategories for insert to authenticated with check (has_area_permission('services'));
create policy "authenticated update service_subcategories" on service_subcategories for update to authenticated using (has_area_permission('services')) with check (has_area_permission('services'));
create policy "authenticated delete service_subcategories" on service_subcategories for delete to authenticated using (has_area_permission('services'));
grant select, insert, update, delete on service_subcategories to authenticated;

alter table services enable row level security;
create policy "authenticated select services" on services for select to authenticated using (true);
create policy "authenticated insert services" on services for insert to authenticated with check (has_area_permission('services'));
create policy "authenticated update services" on services for update to authenticated using (has_area_permission('services')) with check (has_area_permission('services'));
-- No delete policy -- retire via the active flag, same reasoning as
-- catalogue_items (a service may already be referenced elsewhere later).
grant select, insert, update on services to authenticated;

alter table service_materials enable row level security;
create policy "authenticated select service_materials" on service_materials for select to authenticated using (true);
create policy "authenticated insert service_materials" on service_materials for insert to authenticated with check (has_area_permission('services'));
create policy "authenticated update service_materials" on service_materials for update to authenticated using (has_area_permission('services')) with check (has_area_permission('services'));
create policy "authenticated delete service_materials" on service_materials for delete to authenticated using (has_area_permission('services'));
grant select, insert, update, delete on service_materials to authenticated;
