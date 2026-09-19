-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Stores the generated quote image's Fivemanage URL on the job so it
-- doesn't need regenerating every time someone opens the quote page.
alter table jobs add column if not exists quote_document_url text;
alter table jobs add column if not exists quote_generated_at timestamptz;
