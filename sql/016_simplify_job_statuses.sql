-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Drops awaiting_customer_approval, waiting_for_parts, and ready_to_begin
-- from the job status pipeline -- the real flow for this shop is quote ->
-- customer says yes -> do the work -> bill, and those three stages never
-- get used in practice. Postgres has no ALTER TYPE ... DROP VALUE, so this
-- rebuilds the enum: remap any rows currently sitting in a removed status
-- to the nearest remaining one, swap the column to a new type with only
-- the 9 remaining values, then drop the old type.
update jobs set status = 'quote_preparation' where status = 'awaiting_customer_approval';
update jobs set status = 'approved' where status in ('waiting_for_parts', 'ready_to_begin');

create type job_status_new as enum (
  'awaiting_inspection',
  'inspection_in_progress',
  'quote_preparation',
  'approved',
  'work_in_progress',
  'ready_to_bill',
  'ready_to_collect',
  'completed',
  'cancelled'
);

alter table jobs alter column status drop default;
alter table jobs alter column status type job_status_new using status::text::job_status_new;
alter table jobs alter column status set default 'awaiting_inspection';

drop type job_status;
alter type job_status_new rename to job_status;
