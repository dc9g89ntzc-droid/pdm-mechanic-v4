-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
--
-- Optional RP tests on the repair inspection (Joanna, 2026-10-08): the
-- in-game Tread Depth Gauge and Compression Tester readings, typed in by
-- the mechanic and shown on the quote and the bill.
--
--   tread_depth  { "wheels": 4, "readings": [9.5, 9.5, 9.5, 10.2] }   (32nds of an inch, null = not read yet)
--   compression  { "cylinders": 8, "readings": [176, 174, ...] }       (PSI)
--
-- Null column = test not recorded. Pass/fail is worked out in the browser
-- (js/inspection.js) so the thresholds can change without a migration.
-- The existing inspections RLS policies and grants cover the new columns.
--
-- Additive only. Run BEFORE deploying the matching frontend.

alter table inspections add column if not exists tread_depth jsonb;
alter table inspections add column if not exists compression jsonb;
