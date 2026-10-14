-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
--
-- Ricky De Jong can't clock in or out -- the console shows "Failed to start
-- shift: JSON object requested, multiple (or no) rows returned" from
-- js/workshop.js's getOpenShift(), which uses .maybeSingle() (tolerates 0
-- rows, not more than 1). That error only fires when a mechanic has MORE
-- THAN ONE shift_log row with clock_out still null -- i.e. they're
-- "doubly clocked in". js/shift.js self-mounts and clocks in automatically
-- on every page load; nothing stopped two near-simultaneous loads (two
-- tabs/devices) from both passing the "no open shift" check before either
-- INSERT landed, each creating its own open row. Once that happens,
-- getOpenShift() throws on every subsequent page load, so clock-in AND
-- clock-out both silently fail from then on (shift.js only console.error's
-- today -- there's no on-screen error at all, which is also fixed here).

-- 1. See exactly what's stuck before touching anything.
select sl.id, sl.mechanic_id, me.employee_name, sl.clock_in, sl.clock_out
from shift_log sl
join mechanic_employees me on me.id = sl.mechanic_id
where sl.clock_out is null
order by me.employee_name, sl.clock_in;

-- 2. Close every currently-open shift (every mechanic, not just Ricky --
-- cheap to fix all of them at once while we're in here). No payroll_ledger
-- rows are written for these closures: a duplicate row's clock_in time
-- doesn't necessarily reflect real extra hours worked, so that's a call
-- for Joanna to make by hand from the select above, not something to guess
-- at automatically.
update shift_log
set clock_out = now(), clock_out_reason = 'data_fix_duplicate_open_shift'
where clock_out is null;

-- 3. Prevent this from happening again: a mechanic can only have one open
-- shift at a time. clockIn() (js/workshop.js) is updated in this commit to
-- catch the resulting unique-violation race and just re-fetch the now-
-- existing open shift instead of erroring.
create unique index if not exists shift_log_one_open_per_mechanic
  on shift_log (mechanic_id)
  where clock_out is null;
