-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Drops ready_to_collect (keeping ready_to_bill) -- billing now directly
-- completes the job via the receipt flow, so a separate "waiting for
-- customer to pick up" stage doesn't fit. No live jobs are in this status
-- as of writing, but remap defensively in case that's changed by the time
-- this runs.
update jobs set status = 'ready_to_bill' where status = 'ready_to_collect';

create type job_status_new as enum (
  'awaiting_inspection',
  'inspection_in_progress',
  'quote_preparation',
  'approved',
  'work_in_progress',
  'ready_to_bill',
  'completed',
  'cancelled'
);

alter table jobs alter column status drop default;
alter table jobs alter column status type job_status_new using status::text::job_status_new;
alter table jobs alter column status set default 'awaiting_inspection';

drop type job_status;
alter type job_status_new rename to job_status;
