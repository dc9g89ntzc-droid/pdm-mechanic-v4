-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- General activity log for actions that aren't already covered by
-- inventory_transactions (job status changes, catalogue edits/deletions,
-- quote/receipt generation) -- so mistakes can be traced back to who did
-- what and when, and anything unaccounted for has a paper trail. Append-
-- only like the inventory ledger: a mistake gets logged as a new entry,
-- never edited or deleted out of the history.
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references mechanic_employees(id),
  action text not null,       -- e.g. 'job_status_changed', 'catalogue_item_created'
  entity_type text not null,  -- 'job', 'catalogue_item', 'catalogue_subcategory', ...
  entity_id uuid,
  summary text not null,      -- human-readable one-liner shown in the log viewer
  detail jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_created_idx on activity_log (created_at desc);
create index if not exists activity_log_entity_idx on activity_log (entity_type, entity_id);

alter table activity_log enable row level security;
create policy "anon select activity_log" on activity_log for select to anon using (true);
create policy "anon insert activity_log" on activity_log for insert to anon with check (true);
-- No update/delete policy -- append-only, on purpose.
grant select, insert on activity_log to anon, authenticated;
