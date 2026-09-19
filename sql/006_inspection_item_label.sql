-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- The mechanical checklist now records a specific item within a category
-- (e.g. category "Engine Bay", item "Oil Level") rather than just the
-- category, so the finding needs a separate item label field.

alter table inspection_findings add column if not exists item_label text;
