-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Mirrors quote_document_url/quote_generated_at (014) for the receipt
-- generated at billing time.
alter table jobs add column if not exists receipt_document_url text;
alter table jobs add column if not exists receipt_generated_at timestamptz;
