-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
--
-- Float deposits (Joanna, 2026-10-05): someone puts their own money into the
-- dealership account to cover an expensive import, and takes it back out
-- later once they've withdrawn it from the in-city account.
--
--   DEPOSIT    raises Operating Capital, owed back to the depositor
--   WITHDRAWAL lowers Operating Capital, repays (part of) that debt
--
-- Both flow through dealership_account_cash_activity, so Operating Capital,
-- the weekly opening/closing position, the dashboard's capital movement and
-- the payroll float warning all include them automatically. They are never
-- profit: realised profit (sql/056) comes from sales only and doesn't read
-- this ledger.
--
-- Who:
--   deposit  -- Owner / Manager / payroll permission (same as reconcile)
--   withdraw -- the depositor themselves, or an Owner on their behalf;
--               never more than that person still has in
--   void     -- Owner only, for entries made in error
--
-- Additive: one new table, four new functions, and the cash-ledger view
-- re-created with one extra UNION branch (existing branches reproduced
-- exactly from pg_get_viewdef, 2026-10-05; same columns and types).

begin;

create table if not exists dealership_float_movements (
  movement_id uuid primary key default gen_random_uuid(),
  movement_type text not null check (movement_type in ('DEPOSIT', 'WITHDRAWAL')),
  -- Whose money it is. A withdrawal carries the depositor it repays.
  depositor_employee_id uuid not null references employees(employee_id),
  depositor_name text not null,
  amount numeric(14,2) not null check (amount > 0),
  reason text,
  -- Who pressed the button (an Owner can withdraw on someone's behalf).
  recorded_by uuid references employees(employee_id),
  recorded_by_name text,
  movement_date timestamptz not null default now(),
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  deleted_by_name text,
  delete_reason text
);

create index if not exists dealership_float_movements_depositor_idx
  on dealership_float_movements (depositor_employee_id) where is_deleted = false;

-- Same posture as the other dealership tables: RLS on, no policies --
-- only reachable through the service key (Netlify function) and the
-- security-definer functions below.
alter table dealership_float_movements enable row level security;


-- ============================================================
-- Cash ledger: existing branches unchanged, FLOAT branch added at the end.
-- ============================================================
create or replace view dealership_account_cash_activity as
 SELECT vs.sale_id AS activity_id,
    vs.sale_date AS activity_date,
    'SALE'::text AS activity_type,
    COALESCE(vs.sale_ref, vs.legacy_order_ref) AS activity_ref,
    vs.total_price::numeric AS amount,
    vs.employee_id,
    vs.employee_name,
    vs.customer_name AS counterparty,
    vs.notes
   FROM vehicle_sales vs
  WHERE vs.is_deleted = false AND COALESCE(vs.is_request, false) = false
UNION ALL
 SELECT ve.export_id AS activity_id,
    ve.export_date AS activity_date,
    'EXPORT'::text AS activity_type,
    COALESCE(ve.export_ref, ve.legacy_export_ref) AS activity_ref,
    ve.total_value::numeric AS amount,
    ve.employee_id,
    ve.employee_name,
    ve.export_origin AS counterparty,
    ve.notes
   FROM vehicle_exports ve
  WHERE ve.is_deleted = false
UNION ALL
 SELECT vi.import_id AS activity_id,
    vi.import_date AS activity_date,
    'IMPORT'::text AS activity_type,
    COALESCE(vi.import_ref, vi.legacy_import_ref) AS activity_ref,
    '-1'::integer::numeric * vi.total_cost AS amount,
    vi.employee_id,
    vi.employee_name,
    vi.supplier AS counterparty,
    vi.notes
   FROM vehicle_imports vi
  WHERE vi.is_deleted = false
UNION ALL
 SELECT vb.buyback_id AS activity_id,
    vb.buyback_date AS activity_date,
    'BUYBACK'::text AS activity_type,
    COALESCE(vb.buyback_ref, vb.legacy_export_ref) AS activity_ref,
    '-1'::integer::numeric * vb.total_cost AS amount,
    vb.employee_id,
    vb.employee_name,
    vb.seller_name AS counterparty,
    vb.notes
   FROM vehicle_buybacks vb
  WHERE vb.is_deleted = false
UNION ALL
 SELECT a.adjustment_id AS activity_id,
    a.adjustment_date AS activity_date,
    'ADJUSTMENT'::text AS activity_type,
    'ADJ-'::text || "left"(a.adjustment_id::text, 8) AS activity_ref,
    a.amount::numeric AS amount,
    a.employee_id,
    a.employee_name,
    NULL::text AS counterparty,
    a.reason AS notes
   FROM dealership_account_adjustments a
  WHERE a.is_deleted = false
UNION ALL
 SELECT l.settlement_line_id AS activity_id,
    ps.paid_at AS activity_date,
    'PAYROLL_'::text || l.line_type AS activity_type,
    'SET-'::text || "left"(ps.settlement_id::text, 8) AS activity_ref,
    '-1'::integer::numeric * l.amount AS amount,
    l.employee_id,
    l.employee_name,
        CASE
            WHEN l.line_type = 'RAINY_DAY'::text THEN 'Rainy Day Reserve'::text
            WHEN l.line_type = 'STAKEHOLDER'::text THEN 'Stakeholder Distribution'::text
            ELSE 'Employee Payroll'::text
        END AS counterparty,
    NULL::text AS notes
   FROM payroll_settlements ps
     JOIN payroll_settlement_lines l ON l.settlement_id = ps.settlement_id
  WHERE ps.status = 'PAID'::text AND ps.paid_at IS NOT NULL
UNION ALL
 -- NEW (sql/057): float deposits in, repayments out.
 SELECT f.movement_id AS activity_id,
    f.movement_date AS activity_date,
    'FLOAT_'::text || f.movement_type AS activity_type,
    'FLT-'::text || "left"(f.movement_id::text, 8) AS activity_ref,
        CASE
            WHEN f.movement_type = 'DEPOSIT'::text THEN f.amount::numeric
            ELSE '-1'::integer::numeric * f.amount
        END AS amount,
    f.depositor_employee_id AS employee_id,
    f.depositor_name AS employee_name,
        CASE
            WHEN f.movement_type = 'DEPOSIT'::text THEN 'Float deposit'::text
            ELSE 'Float repayment'::text
        END AS counterparty,
    f.reason AS notes
   FROM dealership_float_movements f
  WHERE f.is_deleted = false;


-- ============================================================
-- Helpers
-- ============================================================
create or replace function dealership_is_owner(p_employee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from employees e
    left join dealership_users u on u.employee_id = e.employee_id
    where e.employee_id = p_employee_id
      and e.active = true
      and (upper(coalesce(e.role,'')) = 'OWNER' or upper(coalesce(u.role,'')) = 'OWNER')
  );
$$;

-- How much a depositor still has in (deposits - withdrawals, live rows only).
create or replace function dealership_float_outstanding(p_depositor_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(case when movement_type = 'DEPOSIT' then amount else -amount end), 0)
  from dealership_float_movements
  where depositor_employee_id = p_depositor_id
    and is_deleted = false;
$$;


-- ============================================================
-- Deposit
-- ============================================================
create or replace function dealership_float_deposit(
  p_employee_id uuid,
  p_employee_name text,
  p_amount numeric,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not dealership_can_manage_payroll(p_employee_id) then
    raise exception 'You do not have permission to add float deposits.';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Deposit amount must be more than 0.';
  end if;
  if nullif(btrim(p_reason), '') is null then
    raise exception 'A reason is required for a float deposit.';
  end if;

  insert into dealership_float_movements (
    movement_type, depositor_employee_id, depositor_name, amount, reason,
    recorded_by, recorded_by_name
  )
  values (
    'DEPOSIT', p_employee_id, btrim(p_employee_name), round(p_amount, 2), btrim(p_reason),
    p_employee_id, btrim(p_employee_name)
  )
  returning movement_id into v_id;

  return jsonb_build_object(
    'success', true,
    'movement_id', v_id,
    'outstanding', dealership_float_outstanding(p_employee_id),
    'operating_capital', dealership_current_operating_capital()
  );
end;
$$;


-- ============================================================
-- Withdraw (repay)
-- ============================================================
create or replace function dealership_float_withdraw(
  p_actor_employee_id uuid,
  p_actor_employee_name text,
  p_depositor_employee_id uuid,
  p_amount numeric,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_outstanding numeric;
  v_depositor_name text;
  v_id uuid;
begin
  if p_actor_employee_id is distinct from p_depositor_employee_id
     and not dealership_is_owner(p_actor_employee_id) then
    raise exception 'Only the person who made the deposit (or an Owner) can withdraw it.';
  end if;
  if not exists (select 1 from employees where employee_id = p_actor_employee_id and active = true) then
    raise exception 'Employee not found.';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Withdrawal amount must be more than 0.';
  end if;

  -- Serialise withdrawals per depositor so two at once can't both pass the
  -- outstanding check.
  perform pg_advisory_xact_lock(hashtext('dealership_float:' || p_depositor_employee_id::text));

  v_outstanding := dealership_float_outstanding(p_depositor_employee_id);
  if round(p_amount, 2) > v_outstanding then
    raise exception 'That is more than is still deposited (% outstanding).', to_char(v_outstanding, 'FM$999,999,999,990.00');
  end if;

  select depositor_name into v_depositor_name
  from dealership_float_movements
  where depositor_employee_id = p_depositor_employee_id and movement_type = 'DEPOSIT'
  order by movement_date desc
  limit 1;

  insert into dealership_float_movements (
    movement_type, depositor_employee_id, depositor_name, amount, reason,
    recorded_by, recorded_by_name
  )
  values (
    'WITHDRAWAL', p_depositor_employee_id, coalesce(v_depositor_name, ''), round(p_amount, 2),
    nullif(btrim(coalesce(p_reason, '')), ''),
    p_actor_employee_id, btrim(p_actor_employee_name)
  )
  returning movement_id into v_id;

  return jsonb_build_object(
    'success', true,
    'movement_id', v_id,
    'outstanding', dealership_float_outstanding(p_depositor_employee_id),
    'operating_capital', dealership_current_operating_capital()
  );
end;
$$;


-- ============================================================
-- Void (Owner only, for mistakes)
-- ============================================================
create or replace function dealership_float_void(
  p_employee_id uuid,
  p_employee_name text,
  p_movement_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row dealership_float_movements%rowtype;
begin
  if not dealership_is_owner(p_employee_id) then
    raise exception 'Only an Owner can void a float entry.';
  end if;
  if nullif(btrim(p_reason), '') is null then
    raise exception 'A reason is required to void a float entry.';
  end if;

  select * into v_row from dealership_float_movements where movement_id = p_movement_id;
  if v_row.movement_id is null or v_row.is_deleted then
    raise exception 'Float entry not found.';
  end if;

  perform pg_advisory_xact_lock(hashtext('dealership_float:' || v_row.depositor_employee_id::text));

  -- Voiding a deposit can't leave someone having withdrawn more than they put in.
  if v_row.movement_type = 'DEPOSIT'
     and dealership_float_outstanding(v_row.depositor_employee_id) - v_row.amount < 0 then
    raise exception 'Void the withdrawals made against this deposit first.';
  end if;

  update dealership_float_movements
  set is_deleted = true, deleted_at = now(),
      deleted_by_name = btrim(p_employee_name), delete_reason = btrim(p_reason)
  where movement_id = p_movement_id;

  return jsonb_build_object('success', true);
end;
$$;


-- ============================================================
-- Ledger for the Accounts page
-- ============================================================
create or replace function dealership_float_ledger(p_employee_id uuid)
returns table(data jsonb)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from employees e
    left join dealership_users u on u.employee_id = e.employee_id
    where e.employee_id = p_employee_id
      and e.active = true
      and (
        upper(coalesce(e.role,'')) in ('OWNER','MANAGER')
        or upper(coalesce(u.role,'')) in ('OWNER','MANAGER')
        or coalesce(e.can_view_accounts,false) = true
        or coalesce(u.can_view_accounts,false) = true
      )
  ) then
    raise exception 'You do not have permission to view Accounts.';
  end if;

  return query
  select jsonb_build_object(
    'can_deposit', dealership_can_manage_payroll(p_employee_id),
    'is_owner', dealership_is_owner(p_employee_id),

    'total_outstanding', (
      select coalesce(sum(case when movement_type = 'DEPOSIT' then amount else -amount end), 0)
      from dealership_float_movements where is_deleted = false
    ),

    -- One row per person with money still in.
    'depositors', coalesce((
      select jsonb_agg(d order by d.outstanding desc)
      from (
        select
          f.depositor_employee_id as employee_id,
          max(f.depositor_name) filter (where f.movement_type = 'DEPOSIT') as employee_name,
          sum(f.amount) filter (where f.movement_type = 'DEPOSIT') as deposited,
          coalesce(sum(f.amount) filter (where f.movement_type = 'WITHDRAWAL'), 0) as withdrawn,
          sum(case when f.movement_type = 'DEPOSIT' then f.amount else -f.amount end) as outstanding,
          max(f.movement_date) as last_movement
        from dealership_float_movements f
        where f.is_deleted = false
        group by f.depositor_employee_id
        having sum(case when f.movement_type = 'DEPOSIT' then f.amount else -f.amount end) > 0
      ) d
    ), '[]'::jsonb),

    'movements', coalesce((
      select jsonb_agg(m order by m.movement_date desc)
      from (
        select movement_id, movement_type, depositor_employee_id, depositor_name, amount,
               reason, recorded_by_name, movement_date, is_deleted, deleted_by_name, delete_reason
        from dealership_float_movements
        order by movement_date desc
        limit 50
      ) m
    ), '[]'::jsonb)
  );
end;
$$;

-- These trust the employee id they're given (the dealership-api function
-- passes the signed-in user's), so only the service key may call them --
-- never the public anon/authenticated keys the browser pages use.
revoke execute on function dealership_is_owner(uuid) from public, anon, authenticated;
revoke execute on function dealership_float_outstanding(uuid) from public, anon, authenticated;
revoke execute on function dealership_float_deposit(uuid, text, numeric, text) from public, anon, authenticated;
revoke execute on function dealership_float_withdraw(uuid, text, uuid, numeric, text) from public, anon, authenticated;
revoke execute on function dealership_float_void(uuid, text, uuid, text) from public, anon, authenticated;
revoke execute on function dealership_float_ledger(uuid) from public, anon, authenticated;
grant execute on function dealership_float_deposit(uuid, text, numeric, text) to service_role;
grant execute on function dealership_float_withdraw(uuid, text, uuid, numeric, text) to service_role;
grant execute on function dealership_float_void(uuid, text, uuid, text) to service_role;
grant execute on function dealership_float_ledger(uuid) to service_role;

commit;
