-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Replaces the flat 10% parts markup with a sliding scale (higher % on
-- cheap parts, lower % on expensive ones -- matches how real parts
-- counters price: a flat rate would make a $5 spark plug look free to
-- handle and a $5,000 engine block look extortionate) and adds a place to
-- snapshot the new hours-based labour fee once a job is actually billed.
--
-- Pure formula over existing purchase_cost -- no per-item research needed
-- this time (unlike 033), so it's a single UPDATE, not a generated script.
-- Safe to run once: job_items.unit_price is already a permanent snapshot
-- (013/023) that never retroactively changes, so this only affects the
-- price shown for items added *after* it runs.

update catalogue_items set customer_price =
  case
    when purchase_cost < 25    then round(purchase_cost * 2.00, 2)
    when purchase_cost < 100   then round(purchase_cost * 1.75, 2)
    when purchase_cost < 500   then round(purchase_cost * 1.50, 2)
    when purchase_cost < 2000  then round(purchase_cost * 1.35, 2)
    when purchase_cost < 10000 then round(purchase_cost * 1.25, 2)
    else                            round(purchase_cost * 1.15, 2)
  end
where purchase_cost is not null;

-- Labour is now billed as real hours worked (job_legs.work_started_at ->
-- completed_at, already recorded on every leg) x a flat shop rate, not a
-- cut of parts -- the number genuinely isn't knowable until a leg is
-- actually complete, so (like job_items.unit_price) it has to be snapshot
-- once at billing time rather than recomputed live from a formula that
-- might get retuned later.
alter table jobs add column if not exists labour_fee numeric(12,2);
