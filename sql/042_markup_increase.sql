-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Joanna felt overall pricing was running a bit cheap. Rather than a one-off
-- bump to the stored customer_price values, this scales the sliding-scale
-- markup rates themselves (sql/035) by roughly 11-13% per band -- keeps the
-- catalogue.html "Suggest" button (js/catalogue.js's suggestedCustomerPrice,
-- updated alongside this) consistent with newly-priced items going forward,
-- not just a snapshot of today's prices.
--
--   <$25:        x2.00 -> x2.25
--   $25-100:     x1.75 -> x1.95
--   $100-500:    x1.50 -> x1.70
--   $500-2000:   x1.35 -> x1.50
--   $2000-10000: x1.25 -> x1.40
--   >=$10000:    x1.15 -> x1.30
--
-- Same scope as sql/035: only items with a real purchase_cost recompute --
-- crafted-only items (no purchase_cost) keep whatever customer_price is
-- already set. job_items.unit_price is a permanent snapshot (013/023), so
-- this only affects items added to a job *after* it runs, same as 035.

update catalogue_items set customer_price =
  case
    when purchase_cost < 25    then round(purchase_cost * 2.25, 2)
    when purchase_cost < 100   then round(purchase_cost * 1.95, 2)
    when purchase_cost < 500   then round(purchase_cost * 1.70, 2)
    when purchase_cost < 2000  then round(purchase_cost * 1.50, 2)
    when purchase_cost < 10000 then round(purchase_cost * 1.40, 2)
    else                            round(purchase_cost * 1.30, 2)
  end
where purchase_cost is not null;
