-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- job_items: what a mechanic has actually picked onto a job from the
-- catalogue tile browser (category -> subcategory -> item). unit_price is
-- a snapshot of catalogue_items.customer_price at the moment it was added,
-- so a later catalogue price change doesn't silently rewrite a quote the
-- customer already saw. jobs.quoted_total is kept in sync automatically by
-- the trigger below -- never set it directly once items exist.
create table if not exists job_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id),
  catalogue_item_id uuid not null references catalogue_items(id),
  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2),
  sourcing_choice catalogue_sourcing, -- only meaningful when the item's sourcing is 'both'
  added_by uuid references mechanic_employees(id),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists job_items_job_idx on job_items (job_id);

create or replace function recalc_job_quoted_total()
returns trigger
language plpgsql
as $$
declare
  affected_job_id uuid;
begin
  affected_job_id := coalesce(new.job_id, old.job_id);
  update jobs
  set quoted_total = (
    select sum(quantity * unit_price) from job_items
    where job_id = affected_job_id and unit_price is not null
  )
  where id = affected_job_id;
  return null;
end;
$$;

drop trigger if exists job_items_recalc_total on job_items;
create trigger job_items_recalc_total
  after insert or update or delete on job_items
  for each row
  execute function recalc_job_quoted_total();

-- Same trust model as the rest of the app: anon key used directly from the
-- browser, RLS + explicit grants are the boundary.
alter table job_items enable row level security;
create policy "anon select job_items" on job_items for select to anon using (true);
create policy "anon insert job_items" on job_items for insert to anon with check (true);
create policy "anon update job_items" on job_items for update to anon using (true) with check (true);
create policy "anon delete job_items" on job_items for delete to anon using (true);
grant select, insert, update, delete on job_items to anon, authenticated;
