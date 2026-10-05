-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Purely additive: new nullable/defaulted columns only, nothing existing is
-- rewritten. Run BEFORE deploying the matching frontend (quick-job.html,
-- the Logs rework and purchasing.html's batch_id), which writes these
-- columns and would fail against a database without them.

-- Quick Jobs: rapid-turnover work billed straight away, no inspection/quote/
-- legs. Stored as ordinary jobs + job_items so stock, Accounts, and
-- customer/vehicle history all pick them up with no special-casing.
alter table jobs add column if not exists is_quick_job boolean not null default false;

-- Discounts (Quick Jobs only, for now). discount_amount is the money taken
-- off, snapshotted at billing like labour_fee -- so the real amount charged
-- is quoted_total + labour_fee - discount_amount.
--   staff: 10% off every item's customer price, labour waived (labour_fee 0)
--   ems:   10% off the final bill (parts + labour)
alter table jobs add column if not exists discount_type text
  check (discount_type in ('staff', 'ems'));
alter table jobs add column if not exists discount_amount numeric(12,2);

-- Purchasing checkout logs one inventory transaction per item; batch_id ties
-- a single checkout's rows together so Logs can show it as one purchase.
-- Rows from before this column existed stay null and are grouped
-- heuristically on the Logs page instead.
alter table inventory_transactions add column if not exists batch_id uuid;
create index if not exists inventory_transactions_batch_idx
  on inventory_transactions (batch_id) where batch_id is not null;
