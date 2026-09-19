-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
--
-- Business-rule change: job type is not a decision made at check-in -- it's
-- discovered during inspection, and customers routinely add more work
-- (repair + a paint change + a turbo, all on one visit) at any point before
-- completion. Replace the single required job_type with a settable array
-- that starts empty and can be edited any time the job is open.

alter table jobs add column if not exists job_types job_type[] not null default '{}';
update jobs set job_types = array[job_type] where job_type is not null and job_types = '{}';
alter table jobs alter column job_type drop not null;
alter table jobs alter column job_type drop default;
-- job_type itself is kept (nullable, unused going forward) rather than
-- dropped, so this migration can't destroy the one sample row's data if
-- something above didn't run as expected. Safe to drop in a later cleanup
-- once the new column is confirmed working.
