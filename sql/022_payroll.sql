-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Payroll: shift clock (for the $10k/IRL-hour on-duty base pay) and a
-- ledger of what's owed/paid, fed by both shift time and the 10% labour
-- commission on billed jobs.

create table if not exists shift_log (
  id uuid primary key default gen_random_uuid(),
  mechanic_id uuid not null references mechanic_employees(id),
  clock_in timestamptz not null default now(),
  clock_out timestamptz,
  clock_out_reason text, -- 'manual' | 'idle_timeout' | 'safety_net'
  created_at timestamptz not null default now()
);

create index if not exists shift_log_mechanic_idx on shift_log (mechanic_id);
create index if not exists shift_log_open_idx on shift_log (mechanic_id) where clock_out is null;

alter table shift_log enable row level security;
create policy "anon select shift_log" on shift_log for select to anon using (true);
create policy "anon insert shift_log" on shift_log for insert to anon with check (true);
create policy "anon update shift_log" on shift_log for update to anon using (true) with check (true);
grant select, insert, update on shift_log to anon, authenticated;

-- Append-only in spirit -- entries are never edited except the paid/paid_at
-- flag when a foreman settles up, same as flipping a job's status rather
-- than rewriting history. A mistaken entry gets a correcting one, not a
-- deletion (no delete policy).
create table if not exists payroll_ledger (
  id uuid primary key default gen_random_uuid(),
  mechanic_id uuid not null references mechanic_employees(id),
  entry_type text not null, -- 'shift_pay' | 'commission'
  amount numeric(12,2) not null,
  reference_id uuid, -- shift_log.id for shift_pay, jobs.id for commission
  notes text,
  paid boolean not null default false,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists payroll_ledger_mechanic_idx on payroll_ledger (mechanic_id);
create index if not exists payroll_ledger_unpaid_idx on payroll_ledger (mechanic_id) where not paid;

alter table payroll_ledger enable row level security;
create policy "anon select payroll_ledger" on payroll_ledger for select to anon using (true);
create policy "anon insert payroll_ledger" on payroll_ledger for insert to anon with check (true);
create policy "anon update payroll_ledger" on payroll_ledger for update to anon using (true) with check (true);
grant select, insert, update on payroll_ledger to anon, authenticated;
