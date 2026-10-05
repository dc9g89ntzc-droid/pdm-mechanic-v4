-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
--
-- Realised profit no longer counts exported vehicles (Joanna, 2026-10-05).
-- Export cash still flows into Operating Capital exactly as before -- that
-- runs off dealership_account_cash_activity, which this doesn't touch. It
-- just stops being treated as profit, so it no longer feeds the Monday
-- payroll split (rainy day / stakeholders / employee pool) or the Accounts
-- realised-profit figures.
--
-- Finalized payroll weeks are unaffected: dealership_monday_settlement_preview
-- returns their frozen settlement_snapshot, never a recalculation. The
-- current, unfinalized week recalculates on the new basis.
--
-- Three objects, each reproduced in full from the live definitions
-- (pg_get_functiondef / pg_get_viewdef, 2026-10-05) with only the marked
-- changes. Column lists and return types are unchanged, so dependents are
-- unaffected.

begin;

-- ============================================================
-- 1. dealership_financial_activity
--    CHANGE: export rows' realized_profit is always NULL. cogs and
--    profit_basis are unchanged, so linked/uncosted export reporting keeps
--    working -- the margin just isn't "realised profit" any more, so
--    nothing that sums realized_profit can pick exports back up.
-- ============================================================
create or replace view dealership_financial_activity as
 SELECT vsi.sale_item_id AS activity_id,
    'SALE'::text AS activity_type,
    vs.sale_date AS activity_date,
    vs.sale_id AS transaction_id,
    COALESCE(vs.sale_ref, vs.legacy_order_ref) AS transaction_ref,
    vs.sale_batch_id AS batch_id,
    vsi.vehicle_id,
    COALESCE(v.display_name, vsi.legacy_vehicle_name, 'Unknown vehicle'::text) AS vehicle_name,
    vsi.quantity,
    vsi.line_total::numeric AS cash_in,
    0::numeric AS cash_out,
    vsi.unit_import_cost * vsi.quantity::numeric AS cogs,
    vsi.profit::numeric AS realized_profit,
    'EXACT_SALE_COST'::text AS profit_basis,
    vs.employee_id,
    vs.employee_name,
    vs.customer_name AS counterparty,
    vs.notes
   FROM vehicle_sales vs
     JOIN vehicle_sale_items vsi ON vsi.sale_id = vs.sale_id
     LEFT JOIN vehicles v ON v.vehicle_id = vsi.vehicle_id
  WHERE vs.is_deleted = false AND vsi.is_deleted = false AND COALESCE(vs.is_request, false) = false
UNION ALL
 SELECT vii.import_item_id AS activity_id,
    'IMPORT'::text AS activity_type,
    vi.import_date AS activity_date,
    vi.import_id AS transaction_id,
    COALESCE(vi.import_ref, vi.legacy_import_ref) AS transaction_ref,
    vi.import_batch_id AS batch_id,
    vii.vehicle_id,
    COALESCE(v.display_name, vii.legacy_vehicle_name, 'Unknown vehicle'::text) AS vehicle_name,
    vii.quantity,
    0::numeric AS cash_in,
    vii.line_total::numeric AS cash_out,
    NULL::numeric AS cogs,
    NULL::numeric AS realized_profit,
    'CASH_OUT_ONLY'::text AS profit_basis,
    vi.employee_id,
    vi.employee_name,
    vi.supplier AS counterparty,
    vi.notes
   FROM vehicle_imports vi
     JOIN vehicle_import_items vii ON vii.import_id = vi.import_id
     LEFT JOIN vehicles v ON v.vehicle_id = vii.vehicle_id
  WHERE vi.is_deleted = false AND vii.is_deleted = false
UNION ALL
 SELECT vbi.buyback_item_id AS activity_id,
    'BUYBACK'::text AS activity_type,
    vb.buyback_date AS activity_date,
    vb.buyback_id AS transaction_id,
    COALESCE(vb.buyback_ref, vb.legacy_export_ref) AS transaction_ref,
    vb.buyback_batch_id AS batch_id,
    vbi.vehicle_id,
    COALESCE(v.display_name, vbi.legacy_vehicle_name, 'Unknown vehicle'::text) AS vehicle_name,
    vbi.quantity,
    0::numeric AS cash_in,
    vbi.line_total::numeric AS cash_out,
    NULL::numeric AS cogs,
    NULL::numeric AS realized_profit,
    'CASH_OUT_ONLY'::text AS profit_basis,
    vb.employee_id,
    vb.employee_name,
    vb.seller_name AS counterparty,
    vb.notes
   FROM vehicle_buybacks vb
     JOIN vehicle_buyback_items vbi ON vbi.buyback_id = vb.buyback_id
     LEFT JOIN vehicles v ON v.vehicle_id = vbi.vehicle_id
  WHERE vb.is_deleted = false AND vbi.is_deleted = false
UNION ALL
 SELECT vei.export_item_id AS activity_id,
    'EXPORT'::text AS activity_type,
    ve.export_date AS activity_date,
    ve.export_id AS transaction_id,
    COALESCE(ve.export_ref, ve.legacy_export_ref) AS transaction_ref,
    ve.export_batch_id AS batch_id,
    vei.vehicle_id,
    COALESCE(v.display_name, vei.legacy_vehicle_name, 'Unknown vehicle'::text) AS vehicle_name,
    vei.quantity,
    vei.line_total::numeric AS cash_in,
    0::numeric AS cash_out,
        CASE
            WHEN ve.linked_buyback_id IS NOT NULL AND bb.unit_buyback_cost IS NOT NULL THEN vei.quantity::numeric * bb.unit_buyback_cost
            ELSE NULL::numeric
        END AS cogs,
    -- CHANGED: exports are never realised profit (was linked-buyback margin).
    NULL::numeric AS realized_profit,
        CASE
            WHEN ve.linked_buyback_id IS NOT NULL AND bb.unit_buyback_cost IS NOT NULL THEN 'EXACT_LINKED_BUYBACK_COST'::text
            ELSE 'EXPORT_COST_UNAVAILABLE'::text
        END AS profit_basis,
    ve.employee_id,
    ve.employee_name,
    ve.export_origin AS counterparty,
    ve.notes
   FROM vehicle_exports ve
     JOIN vehicle_export_items vei ON vei.export_id = ve.export_id
     LEFT JOIN vehicles v ON v.vehicle_id = vei.vehicle_id
     LEFT JOIN LATERAL ( SELECT sum(bi.line_total) / NULLIF(sum(bi.quantity), 0)::numeric AS unit_buyback_cost
           FROM vehicle_buyback_items bi
          WHERE bi.buyback_id = ve.linked_buyback_id AND bi.is_deleted = false AND (bi.vehicle_id = vei.vehicle_id OR bi.vehicle_id IS NULL AND vei.vehicle_id IS NULL AND lower(TRIM(BOTH FROM COALESCE(bi.legacy_vehicle_name, ''::text))) = lower(TRIM(BOTH FROM COALESCE(vei.legacy_vehicle_name, ''::text))))) bb ON true
  WHERE ve.is_deleted = false AND vei.is_deleted = false;

-- ============================================================
-- 2. dealership_accounts_summary
--    CHANGES: realized_profit = sales profit only; linked_export_profit is
--    now computed as revenue - cost (the view no longer carries it as
--    profit) and is informational only; new calculation_basis.
--    exact_realized_profit / daily / top_vehicles become sales-only
--    automatically via the view change above.
-- ============================================================
CREATE OR REPLACE FUNCTION public.dealership_accounts_summary(p_start timestamp with time zone, p_end timestamp with time zone)
 RETURNS TABLE(data jsonb)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

with
period as (
  select *
  from dealership_financial_activity
  where activity_date >= p_start
    and activity_date < p_end
),

summary as (
  select
    coalesce(sum(cash_in) filter (where activity_type = 'SALE'), 0) as sales_revenue,
    coalesce(sum(cash_in) filter (where activity_type = 'EXPORT'), 0) as export_revenue,

    coalesce(sum(cash_out) filter (where activity_type = 'IMPORT'), 0) as import_spend,
    coalesce(sum(cash_out) filter (where activity_type = 'BUYBACK'), 0) as buyback_spend,

    coalesce(sum(cash_in), 0) as cash_in,
    coalesce(sum(cash_out), 0) as cash_out,
    coalesce(sum(cash_in), 0) - coalesce(sum(cash_out), 0) as net_cash_movement,

    coalesce(sum(cogs) filter (where activity_type = 'SALE'), 0) as sales_cogs,
    coalesce(sum(realized_profit) filter (where activity_type = 'SALE'), 0) as sales_profit,

    coalesce(
      sum(cash_in) filter (
        where activity_type = 'EXPORT'
          and profit_basis = 'EXACT_LINKED_BUYBACK_COST'
      ), 0
    ) as linked_export_revenue,

    coalesce(
      sum(cogs) filter (
        where activity_type = 'EXPORT'
          and profit_basis = 'EXACT_LINKED_BUYBACK_COST'
      ), 0
    ) as linked_export_cogs,

    -- CHANGED: margin on buyback-linked exports, informational only --
    -- not part of realised profit.
    coalesce(
      sum(cash_in - cogs) filter (
        where activity_type = 'EXPORT'
          and profit_basis = 'EXACT_LINKED_BUYBACK_COST'
      ), 0
    ) as linked_export_profit,

    coalesce(
      sum(cash_in) filter (
        where activity_type = 'EXPORT'
          and profit_basis = 'EXPORT_COST_UNAVAILABLE'
      ), 0
    ) as uncosted_export_revenue,

    coalesce(
      sum(realized_profit) filter (
        where realized_profit is not null
      ), 0
    ) as exact_realized_profit,

    count(distinct transaction_id) filter (where activity_type = 'SALE') as sale_transactions,
    count(distinct transaction_id) filter (where activity_type = 'IMPORT') as import_transactions,
    count(distinct transaction_id) filter (where activity_type = 'BUYBACK') as buyback_transactions,
    count(distinct transaction_id) filter (where activity_type = 'EXPORT') as export_transactions,

    coalesce(sum(quantity) filter (where activity_type = 'SALE'), 0) as units_sold,
    coalesce(sum(quantity) filter (where activity_type = 'IMPORT'), 0) as units_imported,
    coalesce(sum(quantity) filter (where activity_type = 'BUYBACK'), 0) as units_bought_back,
    coalesce(sum(quantity) filter (where activity_type = 'EXPORT'), 0) as units_exported
  from period
),

inventory as (
  select
    coalesce(sum(greatest(stock_qty,0)),0) as units,
    count(*) filter (where stock_qty > 0) as models,
    coalesce(sum(greatest(stock_qty,0) * import_cost),0) as cost_value,
    coalesce(sum(greatest(stock_qty,0) * recommended_sale_price),0) as retail_value,
    coalesce(
      sum(
        greatest(stock_qty,0) *
        (recommended_sale_price - import_cost)
      ),
      0
    ) as unrealized_margin
  from current_vehicle_stock
  where active = true
    and retired = false
),

daily as (
  select
    date_trunc('day', activity_date)::date as day,
    coalesce(sum(cash_in),0) as cash_in,
    coalesce(sum(cash_out),0) as cash_out,
    coalesce(sum(cash_in),0) - coalesce(sum(cash_out),0) as net_cash,
    coalesce(sum(realized_profit) filter (where realized_profit is not null),0) as exact_profit
  from period
  group by 1
  order by 1
),

top_vehicles as (
  select
    vehicle_id,
    vehicle_name,
    coalesce(sum(cash_in),0) as revenue,
    coalesce(sum(realized_profit) filter (where realized_profit is not null),0) as exact_profit,
    coalesce(sum(quantity) filter (where activity_type in ('SALE','EXPORT')),0) as units_out
  from period
  where activity_type in ('SALE','EXPORT')
  group by vehicle_id, vehicle_name
  order by exact_profit desc, revenue desc
  limit 10
),

top_employees as (
  select
    employee_id,
    coalesce(employee_name,'Unknown') as employee_name,
    coalesce(sum(cash_in) filter (where activity_type = 'SALE'),0) as sales_revenue,
    coalesce(sum(realized_profit) filter (where activity_type = 'SALE'),0) as sales_profit,
    count(distinct transaction_id) filter (where activity_type = 'SALE') as sales_count
  from period
  where activity_type = 'SALE'
  group by employee_id, coalesce(employee_name,'Unknown')
  order by sales_profit desc, sales_revenue desc
  limit 10
)

select jsonb_build_object(
  'period_start', p_start,
  'period_end', p_end,

  'summary', (
    select to_jsonb(s) || jsonb_build_object(
      -- CHANGED: was s.sales_profit + e.export_proceeds.
      'realized_profit', s.sales_profit,
      'export_proceeds', e.export_proceeds,
      'calculation_basis','REALIZED_SALES_ONLY',
      'calculation_explanation','Exact sale profit only. Export proceeds go to Operating Capital and are not realised profit; imports and buybacks contribute no immediate realised profit.'
    )
    from summary s
    cross join (
      select coalesce(sum(amount),0) as export_proceeds
      from dealership_account_cash_activity
      where activity_type='EXPORT' and activity_date >= p_start and activity_date < p_end
    ) e
  ),

  'inventory', (
    select to_jsonb(i)
    from inventory i
  ),

  'daily', coalesce(
    (
      select jsonb_agg(to_jsonb(d) order by d.day)
      from daily d
    ),
    '[]'::jsonb
  ),

  'top_vehicles', coalesce(
    (
      select jsonb_agg(to_jsonb(tv))
      from top_vehicles tv
    ),
    '[]'::jsonb
  ),

  'top_employees', coalesce(
    (
      select jsonb_agg(to_jsonb(te))
      from top_employees te
    ),
    '[]'::jsonb
  )
) as data;

$function$;

-- ============================================================
-- 3. dealership_monday_settlement_preview
--    CHANGES: v_realized_profit = sales profit only (was + export
--    proceeds); new calculation_basis/explanation. export_proceeds is still
--    returned for information.
-- ============================================================
CREATE OR REPLACE FUNCTION public.dealership_monday_settlement_preview(p_week_start timestamp with time zone, p_week_end timestamp with time zone)
 RETURNS TABLE(data jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_settings dealership_payroll_settings%rowtype;

  v_operating_capital numeric := 0;
  v_profit_base numeric := 0;
  v_realized_profit numeric := 0;
  v_sales_profit numeric := 0;
  v_export_proceeds numeric := 0;
  v_proposed_distribution numeric := 0;
  v_projected_capital numeric := 0;
  v_saved jsonb;
  v_rainy_amount numeric := 0;

  v_stakeholder_percent numeric := 0;
  v_stakeholder_amount numeric := 0;

  v_employee_pool numeric := 0;
  v_eligible_points numeric := 0;
  v_point_value numeric := 0;

  v_employee_rows jsonb := '[]'::jsonb;
  v_stakeholder_rows jsonb := '[]'::jsonb;

  v_existing jsonb := null;
begin
  if p_week_start is null or p_week_end is null or p_week_end <= p_week_start then
    raise exception 'Invalid settlement week.';
  end if;

  -- Finalized amounts are immutable: never reconstruct them from current activity.
  select to_jsonb(ps) into v_saved
  from payroll_settlements ps where ps.week_start = p_week_start;
  if v_saved is not null then
    v_existing := jsonb_build_object(
      'settlement_id', v_saved->'settlement_id', 'status', v_saved->'status',
      'finalized_at', v_saved->'finalized_at', 'finalized_by_name', v_saved->'finalized_by_name',
      'paid_at', v_saved->'paid_at', 'paid_by_name', v_saved->'paid_by_name'
    );
    if v_saved->'settlement_snapshot' is not null
       and v_saved->'settlement_snapshot' <> 'null'::jsonb then
      return query select (v_saved->'settlement_snapshot') ||
        jsonb_build_object('existing_settlement',v_existing,'is_snapshot',true);
      return;
    end if;
    -- Legacy records retain their original basis and amounts. No backfill.
    select coalesce(jsonb_agg(
      coalesce(l.detail,'{}'::jsonb) || jsonb_build_object(
        'employee_id',l.employee_id,'employee_name',l.employee_name,
        'payroll_eligible',true,'activity_points',l.activity_points,'employee_pay',l.amount
      ) order by l.activity_points desc nulls last,l.employee_name
    ),'[]'::jsonb) into v_employee_rows
    from payroll_settlement_lines l
    where l.settlement_id=(v_saved->>'settlement_id')::uuid and l.line_type='EMPLOYEE';

    select coalesce(jsonb_agg(
      coalesce(l.detail,'{}'::jsonb) || jsonb_build_object(
        'employee_id',l.employee_id,'employee_name',l.employee_name,
        'stakeholder_percent',l.percentage,'stakeholder_amount',l.amount
      ) order by l.percentage desc,l.employee_name
    ),'[]'::jsonb) into v_stakeholder_rows
    from payroll_settlement_lines l
    where l.settlement_id=(v_saved->>'settlement_id')::uuid and l.line_type='STAKEHOLDER';

    return query select (v_saved - 'settlement_snapshot') || jsonb_build_object(
      'calculation_basis','LEGACY_POST_FLOAT',
      'calculation_explanation','Historical settlement: original capital-above-float basis; amounts unchanged.',
      'realized_profit',null,'profit_base',v_saved->'post_float_profit',
      'settings',jsonb_build_object('operating_float',v_saved->'protected_float',
                                   'rainy_day_percent',v_saved->'rainy_day_percent'),
      'employee_rows',v_employee_rows,'stakeholder_rows',v_stakeholder_rows,
      'allocation_percent_total',(v_saved->>'rainy_day_percent')::numeric+
                                 (v_saved->>'stakeholder_percent_total')::numeric,
      'employee_percent_remainder',greatest(100-(v_saved->>'rainy_day_percent')::numeric-
                                             (v_saved->>'stakeholder_percent_total')::numeric,0),
      'existing_settlement',v_existing,'is_snapshot',true,
      'liquidity_warning',null
    );
    return;
  end if;

  select *
  into v_settings
  from dealership_payroll_settings
  where settings_id = 1;

  -- Operating Capital is the actual PDM dealership-account balance.
  -- It is driven by the cash ledger, not by current stock potential margin.
  select dealership_current_operating_capital()
  into v_operating_capital;

  if exists (
    select 1 from dealership_financial_activity
    where activity_type='SALE' and activity_date >= p_week_start and activity_date < p_week_end
      and realized_profit is null
  ) then
    raise exception 'Cannot calculate settlement: a sale is missing exact realized profit.';
  end if;

  -- Sales use exact historical cost.
  select coalesce(sum(realized_profit),0) into v_sales_profit
  from dealership_financial_activity
  where activity_type='SALE' and activity_date >= p_week_start and activity_date < p_week_end;

  -- Export cash goes to Operating Capital only; reported for information.
  select coalesce(sum(amount),0) into v_export_proceeds
  from dealership_account_cash_activity
  where activity_type='EXPORT' and activity_date >= p_week_start and activity_date < p_week_end;

  -- CHANGED: was v_sales_profit + v_export_proceeds.
  v_realized_profit := v_sales_profit;
  v_profit_base := greatest(v_realized_profit,0);

  select
    coalesce(sum(ecs.stakeholder_percent),0)
  into v_stakeholder_percent
  from employee_compensation_settings ecs
  join employees e on e.employee_id = ecs.employee_id
  where e.active = true;

  if v_settings.rainy_day_percent + v_stakeholder_percent > 100 then
    raise exception
      'Rainy Day %% plus stakeholder percentages cannot exceed 100%%. Current total: %%%.',
      round(v_settings.rainy_day_percent + v_stakeholder_percent, 2);
  end if;

  v_rainy_amount :=
    round(v_profit_base * v_settings.rainy_day_percent / 100.0, 2);

  v_stakeholder_amount :=
    round(v_profit_base * v_stakeholder_percent / 100.0, 2);

  v_employee_pool :=
    greatest(
      round(v_profit_base - v_rainy_amount - v_stakeholder_amount, 2),
      0
    );

  with activity as (
    select *
    from dealership_employee_activity_points(
      p_week_start,
      p_week_end
    )
  ),
  employee_calc as (
    select
      a.employee_id,
      a.employee_name,
      coalesce(ecs.payroll_eligible,true) as payroll_eligible,
      coalesce(ecs.stakeholder_percent,0) as stakeholder_percent,
      a.import_units,
      a.export_units,
      a.buyback_units,
      a.sale_units,
      a.activity_points
    from activity a
    left join employee_compensation_settings ecs
      on ecs.employee_id = a.employee_id
  )
  select
    coalesce(
      sum(activity_points)
      filter (where payroll_eligible = true),
      0
    )
  into v_eligible_points
  from employee_calc;

  if v_eligible_points > 0 then
    v_point_value :=
      round(v_employee_pool / v_eligible_points, 4);
  else
    v_point_value := 0;
  end if;

  with activity as (
    select *
    from dealership_employee_activity_points(
      p_week_start,
      p_week_end
    )
  ),
  employee_calc as (
    select
      a.employee_id,
      a.employee_name,
      coalesce(ecs.payroll_eligible,true) as payroll_eligible,
      coalesce(ecs.stakeholder_percent,0) as stakeholder_percent,
      a.import_units,
      a.export_units,
      a.buyback_units,
      a.sale_units,
      a.activity_points
    from activity a
    left join employee_compensation_settings ecs
      on ecs.employee_id = a.employee_id
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'employee_id', employee_id,
        'employee_name', employee_name,
        'payroll_eligible', payroll_eligible,
        'stakeholder_percent', stakeholder_percent,
        'import_units', import_units,
        'export_units', export_units,
        'buyback_units', buyback_units,
        'sale_units', sale_units,
        'activity_points', activity_points,
        'employee_pay',
          case
            when payroll_eligible
            then round(activity_points * v_point_value, 2)
            else 0
          end
      )
      order by
        case when payroll_eligible then 0 else 1 end,
        activity_points desc,
        employee_name
    ),
    '[]'::jsonb
  )
  into v_employee_rows
  from employee_calc;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'employee_id', e.employee_id,
        'employee_name', e.name,
        'stakeholder_percent', ecs.stakeholder_percent,
        'stakeholder_amount',
          round(
            v_profit_base * ecs.stakeholder_percent / 100.0,
            2
          ),
        'payroll_eligible', ecs.payroll_eligible
      )
      order by ecs.stakeholder_percent desc, e.name
    ),
    '[]'::jsonb
  )
  into v_stakeholder_rows
  from employee_compensation_settings ecs
  join employees e
    on e.employee_id = ecs.employee_id
  where e.active = true
    and ecs.stakeholder_percent > 0;

  select jsonb_build_object(
    'settlement_id', ps.settlement_id,
    'status', ps.status,
    'finalized_at', ps.finalized_at,
    'finalized_by_name', ps.finalized_by_name,
    'paid_at', ps.paid_at,
    'paid_by_name', ps.paid_by_name
  )
  into v_existing
  from payroll_settlements ps
  where ps.week_start = p_week_start;

  -- Match the actual rounded lines which finalize writes and the cash ledger pays.
  v_proposed_distribution := v_rainy_amount
    + coalesce((select sum((r->>'stakeholder_amount')::numeric)
                from jsonb_array_elements(v_stakeholder_rows) r),0)
    + coalesce((select sum((r->>'employee_pay')::numeric)
                from jsonb_array_elements(v_employee_rows) r
                where (r->>'payroll_eligible')::boolean),0);
  v_projected_capital := v_operating_capital - v_proposed_distribution;

  return query
  select jsonb_build_object(
    'week_start', p_week_start,
    'week_end', p_week_end,

    'settings', jsonb_build_object(
      'operating_float', v_settings.operating_float,
      'rainy_day_percent', v_settings.rainy_day_percent,
      'import_points', v_settings.import_points,
      'export_points', v_settings.export_points,
      'buyback_points', v_settings.buyback_points,
      'sale_points', v_settings.sale_points
    ),

    'operating_capital', round(v_operating_capital,2),
    'protected_float', round(v_settings.operating_float,2),
    -- Deprecated compatibility alias, no longer capital minus float.
    'post_float_profit', round(v_profit_base,2),
    'profit_base', round(v_profit_base,2),
    'realized_profit', round(v_realized_profit,2),
    'sales_realized_profit', round(v_sales_profit,2),
    'export_proceeds', round(v_export_proceeds,2),
    'calculation_basis', 'REALIZED_SALES_ONLY',
    'calculation_explanation', 'Exact sale profit only. Export proceeds go to Operating Capital and are not realised profit. Imports and buybacks are inventory acquisition. The operating float is a liquidity safeguard only.',
    'is_snapshot', false,
    'liquidity_as_of', now(),
    'proposed_distribution', v_proposed_distribution,
    'projected_operating_capital', v_projected_capital,
    'protected_float_shortfall', greatest(v_settings.operating_float-v_projected_capital,0),
    'liquidity_warning', v_projected_capital < v_settings.operating_float,
    'liquidity_warning_message', case when v_projected_capital < v_settings.operating_float
      then 'Settlement distribution would leave operating capital below the protected float.'
      else null end,

    'rainy_day_amount', v_rainy_amount,

    'stakeholder_percent_total', v_stakeholder_percent,
    'stakeholder_amount_total', v_stakeholder_amount,

    'employee_pool', v_employee_pool,
    'eligible_points', v_eligible_points,
    'point_value', v_point_value,

    'employee_rows', v_employee_rows,
    'stakeholder_rows', v_stakeholder_rows,

    'allocation_percent_total',
      v_settings.rainy_day_percent + v_stakeholder_percent,

    'employee_percent_remainder',
      greatest(
        100 - v_settings.rainy_day_percent - v_stakeholder_percent,
        0
      ),

    'existing_settlement', v_existing
  );
end;
$function$;

commit;
