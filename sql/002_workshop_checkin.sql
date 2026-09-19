-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Adds the Workshop check-in + job board slice.
--
-- IMPORTANT: this project's `customers` and `vehicles` tables already exist
-- and belong to the dealership app (PDM Dealership 3.0). `vehicles` there is
-- the dealership's SELLABLE STOCK CATALOG (vehicle_code, msrp, import_cost,
-- suggested_buyback_price, featured_priority) -- not individual customer-
-- owned cars. There is no registration/VIN/owner/mileage on it, so the
-- mechanic shop's "a specific car with a plate that rolled into the bay"
-- concept cannot live there. We reuse `customers` (it's a genuine match --
-- one shared customer record, per the spec) and add a new `owned_vehicles`
-- table for physical vehicle instances, optionally linked back to the
-- dealership's catalog row it was sold as.
--
-- Confirmed before writing this: customers/vehicles both have RLS enabled
-- but zero policies -- the dealership app must reach them via a service-role
-- key or RPCs, never anon+RLS. So adding anon policies here is additive and
-- doesn't touch anything the dealership app depends on.

-- ---------------------------------------------------------------------
-- Security fix: mechanic_employees has no RLS today, which means the
-- public anon key can select every column -- including password_hash --
-- directly via the REST API. RLS only filters rows, not columns, so the
-- fix is: lock the table down entirely from anon/authenticated and expose
-- a safe view (no password_hash) for anything that needs to list staff
-- (e.g. the "assigned mechanic" dropdown). Login keeps working because
-- mechanic_verify_login() is security definer and reads the table as its
-- owner, bypassing RLS.
-- ---------------------------------------------------------------------
alter table mechanic_employees enable row level security;

create or replace view staff_directory as
select id, employee_name, role, active
from mechanic_employees;

grant select on staff_directory to anon, authenticated;

-- ---------------------------------------------------------------------
-- Extend the shared customers table (additive only -- nullable column,
-- doesn't touch anything the dealership app reads/writes today).
-- ---------------------------------------------------------------------
alter table customers add column if not exists phone text;

create policy "anon select customers" on customers for select to anon using (true);
create policy "anon insert customers" on customers for insert to anon with check (true);
create policy "anon update customers" on customers for update to anon using (true) with check (true);

-- ---------------------------------------------------------------------
-- Owned vehicles: individual customer-owned cars (distinct from the
-- dealership's `vehicles` sale-catalog table). catalog_vehicle_id links
-- back to the model it was sold as, when known -- nullable because not
-- every car the workshop sees came from PDM stock.
-- ---------------------------------------------------------------------
create table if not exists owned_vehicles (
  owned_vehicle_id uuid primary key default gen_random_uuid(),
  registration text not null,
  vin text,
  make text,
  model text,
  class text,
  owner_id uuid references customers(customer_id),
  catalog_vehicle_id uuid references vehicles(vehicle_id),
  mileage integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Registrations are looked up constantly at check-in; case-insensitive
-- uniqueness matches how players actually type plates.
create unique index if not exists owned_vehicles_registration_key
  on owned_vehicles (upper(registration));

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists owned_vehicles_set_updated_at on owned_vehicles;
create trigger owned_vehicles_set_updated_at
  before update on owned_vehicles
  for each row
  execute function set_updated_at();

alter table owned_vehicles enable row level security;
create policy "anon select owned_vehicles" on owned_vehicles for select to anon using (true);
create policy "anon insert owned_vehicles" on owned_vehicles for insert to anon with check (true);
create policy "anon update owned_vehicles" on owned_vehicles for update to anon using (true) with check (true);

-- ---------------------------------------------------------------------
-- Jobs (workshop job board)
-- ---------------------------------------------------------------------
create type job_type as enum ('repair', 'customisation', 'performance');

-- Matches the Workshop board columns. Every new job starts at
-- awaiting_inspection.
create type job_status as enum (
  'awaiting_inspection',
  'inspection_in_progress',
  'quote_preparation',
  'awaiting_customer_approval',
  'approved',
  'waiting_for_parts',
  'ready_to_begin',
  'work_in_progress',
  'ready_to_bill',
  'ready_to_collect',
  'completed',
  'cancelled'
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  job_number bigint generated always as identity,
  customer_id uuid not null references customers(customer_id),
  owned_vehicle_id uuid not null references owned_vehicles(owned_vehicle_id),
  job_type job_type not null default 'repair',
  status job_status not null default 'awaiting_inspection',
  assigned_staff_id uuid references mechanic_employees(id),
  short_description text,
  quoted_total numeric(10,2), -- null = "To confirm", never show as 0
  reported_issue text,
  existing_damage text,
  bay_location text,
  key_taken boolean not null default false,
  mileage_at_checkin integer,
  arrival_time timestamptz not null default now(),
  expected_completion timestamptz,
  internal_notes text,
  created_by uuid references mechanic_employees(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_status_idx on jobs (status);
create index if not exists jobs_assigned_staff_idx on jobs (assigned_staff_id);

drop trigger if exists jobs_set_updated_at on jobs;
create trigger jobs_set_updated_at
  before update on jobs
  for each row
  execute function set_updated_at();

-- Same trust model as the rest of this app: no real Supabase Auth session,
-- staff sign in via a custom RPC + localStorage token, so the anon key is
-- used directly from the browser. No delete policy, ever -- cancelled/
-- completed status is how jobs get archived, per the spec's "never
-- permanently delete" rule.
alter table jobs enable row level security;
create policy "anon select jobs" on jobs for select to anon using (true);
create policy "anon insert jobs" on jobs for insert to anon with check (true);
create policy "anon update jobs" on jobs for update to anon using (true) with check (true);

-- ---------------------------------------------------------------------
-- Sample data so the board isn't empty on first load. Safe to delete.
-- ---------------------------------------------------------------------
do $$
declare
  v_customer uuid;
  v_vehicle uuid;
  v_staff uuid;
begin
  insert into customers (customer_name, phone, notes, active)
  values ('Sample Customer', '555-0100', 'Seed record -- delete once real customers exist', true)
  returning customer_id into v_customer;

  insert into owned_vehicles (registration, make, model, class, owner_id, mileage)
  values ('SAMPLE1', 'Vapid', 'Dominator', 'Muscle', v_customer, 42000)
  returning owned_vehicle_id into v_vehicle;

  select id into v_staff from mechanic_employees where employee_name = 'admin';

  insert into jobs (
    customer_id, owned_vehicle_id, job_type, status, assigned_staff_id,
    short_description, reported_issue, bay_location, key_taken, mileage_at_checkin
  ) values (
    v_customer, v_vehicle, 'repair', 'awaiting_inspection', v_staff,
    'Customer reports grinding noise on braking', 'Grinding noise when braking',
    'Bay 1', true, 42000
  );
end $$;
