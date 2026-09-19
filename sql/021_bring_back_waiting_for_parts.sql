-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Re-adds waiting_for_parts (dropped in 016 for the fast-path simplification,
-- but long jobs like engine builds genuinely need a way to show they're
-- stuck). Positioned between approved and work_in_progress, same place it
-- held before. Unlike removing a value (016/017's drop-and-rebuild dance),
-- adding one is a simple metadata operation -- Postgres supports inserting
-- at a specific position directly.
alter type job_status add value if not exists 'waiting_for_parts' before 'work_in_progress';
