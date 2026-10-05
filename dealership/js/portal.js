  const state = {
    token: localStorage.getItem('pdm_session_token') || '',
    user: null,
    currentPage: 'dashboard'
  };

  window.addEventListener('load', () => {
    if (!state.token) return showLogin();

    google.script.run
      .withSuccessHandler(res => {
        state.user = res.user;
        enterPortal();
      })
      .withFailureHandler(() => {
        localStorage.removeItem('pdm_session_token');
        state.token = '';
        showLogin();
      })
      .resumeDealershipSession(state.token);
  });

  function doLogin() {
    const name = document.getElementById('loginName').value.trim();
    const password = document.getElementById('loginPassword').value;
    const err = document.getElementById('loginError');

    err.textContent = '';

    if (!name || !password) {
      err.textContent = 'Enter your employee name and password.';
      return;
    }

    setLoginBusy(true);

    google.script.run
      .withSuccessHandler(res => {
        state.token = res.token;
        state.user = res.user;
        localStorage.setItem('pdm_session_token', state.token);
        setLoginBusy(false);
        enterPortal();
      })
      .withFailureHandler(error => {
        setLoginBusy(false);
        err.textContent = cleanError(error);
      })
      .loginDealership(name, password);
  }

  function enterPortal() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');

    document.getElementById('userName').textContent = state.user.employee_name;
    document.getElementById('userRole').textContent =
      state.user.role.charAt(0) + state.user.role.slice(1).toLowerCase();

    applyNavigationPermissions();
    openPage('dashboard');
  }

  function showLogin() {
    document.getElementById('app').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
  }

  function applyNavigationPermissions() {
    const role =
      String(state.user?.role || '').toUpperCase();

    const permissions =
      state.user?.permissions || {};

    const isOwner =
      role === 'OWNER';

    const isManager =
      role === 'MANAGER';

    // Standard permission-controlled pages.
    document.querySelectorAll('[data-perm]').forEach(btn => {
      const perm =
        btn.dataset.perm;

      const allowed =
        isOwner ||
        isManager ||
        permissions[perm] === true;

      btn.classList.toggle(
        'hidden',
        !allowed
      );
    });

    // Manager + Owner pages.
    document.querySelectorAll('[data-manager="true"]').forEach(btn => {
      const allowed =
        isManager ||
        isOwner;

      btn.classList.toggle(
        'hidden',
        !allowed
      );
    });

    // Owner-only administration.
    document.querySelectorAll('[data-owner="true"]').forEach(btn => {
      btn.classList.toggle(
        'hidden',
        !isOwner
      );
    });

    // Customer records are available to:
    // - Managers
    // - Owners
    // - Staff who can sell
    // - Staff who can buy back vehicles
    document.querySelectorAll('[data-customer-access="true"]').forEach(btn => {
      const allowed =
        isManager ||
        isOwner ||
        permissions.can_sell === true ||
        permissions.can_buyback === true;

      btn.classList.toggle(
        'hidden',
        !allowed
      );
    });
  }

  function openPage(page) {
    state.currentPage = page;

    document.querySelectorAll('.nav button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === page);
    });

    const titles = {
      dashboard:'Dashboard',
      sell:'Sell Vehicle',
      import:'Import Vehicles',
      buyback:'Buy From Player',
      export:'Export Vehicles',
      stock:'Stock',
      vehicles:'Vehicle Management',
      customers:'Customers',
      accounts:'Accounts',
      payroll:'Payroll',
      logs:'Logs',
      manager:'Staff & Permissions',
      mypdm:'My PDM'
    };

    document.getElementById('topTitle').textContent = titles[page] || 'PDM';

    if (page === 'dashboard') {
      loadDashboard();
      return;
    }

    if (page === 'sell') {
      loadSellVehicle();
      return;
    }

    if (page === 'import') {
      loadImportVehicles();
      return;
    }

    if (page === 'buyback') {
      loadBuybacks();
      return;
    }

    if (page === 'export') {
      loadExports();
      return;
    }

    if (page === 'stock') {
      loadStockManagement();
      return;
    }

    if (page === 'vehicles') {
      loadVehicleManagement();
      return;
    }

    if (page === 'customers') {
      loadCustomers();
      return;
    }

    if (page === 'accounts') {
      loadAccounts();
      return;
    }

    if (page === 'payroll') {
      loadPayroll();
      return;
    }

    if (page === 'logs') {
      loadLogs();
      return;
    }

    if (page === 'manager') {
      loadManagerStaff();
      return;
    }

    if (page === 'mypdm') {
      loadMyPdm();
      return;
    }

    document.getElementById('content').innerHTML = `
      <div class="page-title">
        <h1>${escapeHtml(titles[page])}</h1>
      </div>

      <div class="placeholder">
        <h3>${escapeHtml(titles[page])}</h3>
        <p>This module is wired into the PDM portal shell and ready for us to build next.</p>
      </div>

      ${bottomBrand()}
    `;
  }

  function loadDashboard() {
    showPageLoader(true);

    google.script.run
      .withSuccessHandler(data => {
        showPageLoader(false);
        renderDashboard(data);
      })
      .withFailureHandler(handleServerError)
      .getDashboardData(state.token);
  }

  function renderDashboard(data) {
    data = data || {};

    const s = data.summary || {};
    const perms = data.permissions || {};
    const opportunities = data.stock_opportunities || [];
    const excess = data.excess_stock || [];
    const staff = data.staff_activity || [];
    const attention = data.attention || [];
    const recent = data.recent_activity || [];

    const financeCards = perms.can_finance ? `
      ${statCard(
        'Operating Capital',
        money(s.operating_capital || 0),
        money(s.capital_above_float || 0) + ' above protected float',
        '$'
      )}
      ${statCard(
        'Protected Float',
        money(s.protected_float || 1000000),
        'Monday operating floor',
        '▣'
      )}
      ${statCard(
        'Stock @ Cost',
        money(s.stock_cost_value || 0),
        number(s.total_stock || 0) + ' vehicles',
        '🚗'
      )}
      ${statCard(
        'Stock Potential Margin',
        money(s.stock_potential_margin || 0),
        'At recommended sale prices',
        '↗'
      )}
    ` : `
      ${statCard('Current Stock', number(s.total_stock || 0), 'Vehicles', '🚗')}
      ${statCard('Models In Stock', number(s.models_in_stock || 0), 'Active models', '▦')}
    `;

    const attentionHtml = attention.map(a => `
      <button class="dash-attention ${escapeHtml(a.severity || 'info')}"
              onclick="handleDashboardAttention('${jsString(a.title || '')}','${jsString(a.page || 'dashboard')}')">
        <span>${a.severity === 'danger' ? '!' : a.severity === 'warning' ? '⚠' : '●'}</span>
        <span>${escapeHtml(a.title || '')}</span>
      </button>
    `).join('') || `<div class="muted">Nothing demanding attention right now.</div>`;

    const opportunityHtml = opportunities.slice(0,6).map((r,i) => {
      const qty = Number(r.suggested_qty || 0);
      return `
        <div class="stock-intel-row stock-intel-clickable"
             role="button"
             tabindex="0"
             title="Open this vehicle in Stock"
             onclick="openDashboardStockSuggestion('${jsString(r.vehicle_id)}')"
             onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openDashboardStockSuggestion('${jsString(r.vehicle_id)}')}">
          <div class="stock-intel-rank">${i + 1}</div>
          <div class="stock-intel-main">
            <div class="stock-intel-name">${escapeHtml(r.display_name || '')}</div>
            <div class="activity-meta">
              Stock ${number(r.stock_qty || 0)}
              · ${number(r.sales30 || 0)} sold / 30d
              · ${number(r.sales90 || 0)} / 90d
              · Score ${number(r.demand_score || 0)}
            </div>
            <div class="activity-meta">
              ${qty} unit${qty === 1 ? '' : 's'} requires ${money(r.capital_required || 0)}
              · potential margin ${money(r.potential_margin || 0)}
            </div>
          </div>
          <div class="stock-intel-action import">
            IMPORT ${number(qty)}
          </div>
        </div>
      `;
    }).join('') || `<div class="muted">No urgent stock opportunities identified.</div>`;

    const excessHtml = excess.slice(0,6).map((r,i) => {
      const qty = Number(r.suggested_export_qty || 0);
      return `
        <div class="stock-intel-row stock-intel-clickable"
             role="button"
             tabindex="0"
             title="Open this vehicle in Stock"
             onclick="openDashboardStockSuggestion('${jsString(r.vehicle_id)}')"
             onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openDashboardStockSuggestion('${jsString(r.vehicle_id)}')}">
          <div class="stock-intel-rank">${i + 1}</div>
          <div class="stock-intel-main">
            <div class="stock-intel-name">${escapeHtml(r.display_name || '')}</div>
            <div class="activity-meta">
              Stock ${number(r.stock_qty || 0)}
              · ${number(r.sales90 || 0)} sold / 90d
              ${r.last_sale ? '· last sale ' + formatRelative(r.last_sale) : '· no recent sale'}
            </div>
            <div class="activity-meta">
              Up to ${money(r.capital_releasable || 0)} of stock cost could be released
            </div>
          </div>
          <div class="stock-intel-action export">
            EXPORT ${number(qty)}
          </div>
        </div>
      `;
    }).join('') || `<div class="muted">No obvious excess-stock candidates. Lovely.</div>`;

    const staffHtml = staff.slice(0,6).map((r,i) => `
      <div class="dash-staff-row">
        <div>
          <strong>${i + 1}. ${escapeHtml(r.employee_name || '')}</strong>
          <div class="activity-meta">
            ${number(r.imports || 0)} imports ·
            ${number(r.exports || 0)} exports ·
            ${number(r.buybacks || 0)} buybacks ·
            ${number(r.sales || 0)} sales
          </div>
        </div>
        <div class="dash-points">${number(r.activity_points || 0)} pts</div>
      </div>
    `).join('') || `<div class="muted">No staff activity yet this week.</div>`;

    const activityHtml = recent.map(r => {
      const type = String(r.activity_type || '').toLowerCase();
      return `
        <div class="activity-row">
          <div class="activity-left">
            <div class="activity-badge ${type}">
              ${escapeHtml(r.activity_type || '')}
            </div>
            <div class="activity-main">
              <div class="activity-title">
                ${escapeHtml(r.vehicle_name || r.reference || '')}
              </div>
              <div class="activity-meta">
                ${escapeHtml(activitySubtitle(r))}
              </div>
            </div>
          </div>
          <div class="activity-right">
            <div class="activity-meta">${formatRelative(r.activity_date)}</div>
            ${perms.can_finance
              ? `<div class="amount ${type}">${money(Math.abs(Number(r.amount || 0)))}</div>`
              : ''}
          </div>
        </div>
      `;
    }).join('') || `<div class="muted">No activity yet.</div>`;

    const weekStart = data.week_start ? new Date(data.week_start) : null;
    const weekEnd = data.week_end ? new Date(data.week_end) : null;
    const weekLabel = weekStart && weekEnd
      ? `${weekStart.toLocaleDateString('en-GB')} 12:00 UTC – ${weekEnd.toLocaleDateString('en-GB')} 12:00 UTC`
      : 'Current financial week';

    const importCapital = opportunities.reduce(
      (n,r) => n + Number(r.capital_required || 0), 0
    );
    const releaseCapital = excess.reduce(
      (n,r) => n + Number(r.capital_releasable || 0), 0
    );

    document.getElementById('content').innerHTML = `
      <div class="dash-hero-head">
        <div>
          <div class="section-title">PDM Command Centre</div>
          <div class="muted">${escapeHtml(weekLabel)}</div>
        </div>
        <button class="add-row-btn" onclick="loadDashboard()">REFRESH</button>
      </div>

      <div class="cards">
        ${financeCards}
      </div>

      ${perms.can_finance ? `
        <div class="cards">
          ${statCard('Sales This Week', money(s.week_sales_revenue || 0), 'Customer sales', '🏷')}
          ${statCard('Export Revenue', money(s.week_export_revenue || 0), 'Stock released', '↗')}
          ${statCard('Import Spend', money(s.week_import_spend || 0), 'Stock acquired', '↓')}
          ${statCard('Buyback Spend', money(s.week_buyback_spend || 0), 'Player acquisitions', '↙')}
          ${statCard('Realised Profit', money(s.week_realized_profit || 0), 'Completed sales', '$')}
          ${statCard('Capital Movement', money(s.week_capital_movement || 0), 'Net cash movement', '⇄')}
        </div>
      ` : ''}

      <div class="card">
        <div class="section-title">Needs Attention</div>
        <div class="dash-attention-wrap">${attentionHtml}</div>
      </div>

      <div class="grid-2">
        <div class="card" id="dashboardStockOpportunities">
          <div class="dash-card-head">
            <div>
              <div class="section-title">🔥 Stock Opportunities</div>
              <div class="muted">
                What PDM should consider putting into stock next.
              </div>
            </div>
            ${perms.can_finance ? `
              <div class="dash-mini-total">
                ${money(importCapital)} suggested capital
              </div>
            ` : ''}
          </div>
          ${opportunityHtml}
        </div>

        <div class="card" id="dashboardExcessStock">
          <div class="dash-card-head">
            <div>
              <div class="section-title">🧊 Slow / Excess Stock</div>
              <div class="muted">
                Vehicles potentially tying up useful operating capital.
              </div>
            </div>
            ${perms.can_finance ? `
              <div class="dash-mini-total">
                ${money(releaseCapital)} potentially releasable
              </div>
            ` : ''}
          </div>
          ${excessHtml}
        </div>
      </div>

      ${perms.can_finance && releaseCapital > 0 && importCapital > 0 ? `
        <div class="card dash-opportunity-cost">
          <div>
            <div class="section-title">Capital Reallocation Opportunity</div>
            <div class="muted">
              Exporting the suggested slow stock could release up to
              <strong>${money(releaseCapital)}</strong>.
              The current top stock recommendations require
              <strong>${money(importCapital)}</strong>.
            </div>
          </div>
          <div class="dash-reallocation">
            ${money(Math.min(releaseCapital, importCapital))}
            <span>could be redirected into higher-demand stock</span>
          </div>
        </div>
      ` : ''}

      <div class="grid-2">
        <div class="card">
          <div class="section-title">Staff Activity · This Week</div>
          <div class="muted" style="margin-bottom:12px">
            Import/export = 1 point · buyback/sale entry = 0.5 point
          </div>
          ${staffHtml}
        </div>

        <div class="card">
          <div class="section-title">Recent Dealership Activity</div>
          ${activityHtml}
        </div>
      </div>

      <div class="card quick-wrap">
        <div class="section-title">Quick Actions</div>
        <div class="quick-actions">
          ${quick('SELL VEHICLE','sell','can_sell','sell')}
          ${quick('IMPORT VEHICLES','import','can_import','import')}
          ${quick('BUY FROM PLAYER','buyback','can_buyback','buyback')}
          ${quick('EXPORT VEHICLES','export','can_export','export')}
        </div>
      </div>

      ${bottomBrand()}
    `;
  }


  function openDashboardStockSuggestion(vehicleId) {
    vehicleId = String(vehicleId || '').trim();
    if (!vehicleId) return;

    // Stock recommendations need to be visible even when current stock is zero.
    stockState.status = 'ALL';
    stockState.category = 'ALL';
    stockState.search = '';
    stockState.pendingVehicleId = vehicleId;

    openPage('stock');
  }


  function handleDashboardAttention(title, page) {
    const text = String(title || '').toLowerCase();
    page = String(page || 'dashboard');

    // Negative stock is actionable in the Stock page.
    if (text.includes('negative stock')) {
      stockState.status = 'NEGATIVE';
      stockState.category = 'ALL';
      stockState.search = '';
      stockState.pendingVehicleId = null;
      openPage('stock');
      return;
    }

    // These two notices describe sections already visible on the Dashboard.
    // Scroll to them instead of pointlessly reloading the Dashboard.
    if (text.includes('high-demand stock opportunities')) {
      const el = document.getElementById('dashboardStockOpportunities');
      if (el) {
        el.scrollIntoView({ behavior:'smooth', block:'start' });
        el.classList.add('dash-attention-flash');
        setTimeout(() => el.classList.remove('dash-attention-flash'), 1100);
      }
      return;
    }

    if (text.includes('slow/excess stock')) {
      const el = document.getElementById('dashboardExcessStock');
      if (el) {
        el.scrollIntoView({ behavior:'smooth', block:'start' });
        el.classList.add('dash-attention-flash');
        setTimeout(() => el.classList.remove('dash-attention-flash'), 1100);
      }
      return;
    }

    // Finance warnings should land in Accounts.
    if (text.includes('operating capital') || page === 'accounts') {
      openPage('accounts');
      return;
    }

    // Safe fallback for any future attention type.
    if (page && page !== 'dashboard') {
      openPage(page);
      return;
    }
  }


  function activitySubtitle(r) {
    const type = String(r.activity_type || '').toUpperCase();
    const employee = r.employee_name || '';

    if (type === 'SALE') {
      return (r.party_name ? 'Sold to ' + r.party_name : 'Vehicle sale') +
             (employee ? ' · ' + employee : '');
    }
    if (type === 'BUYBACK') {
      return (r.party_name ? 'Purchased from ' + r.party_name : 'Player buyback') +
             (employee ? ' · ' + employee : '');
    }
    if (type === 'IMPORT') {
      return 'Imported into dealership' + (employee ? ' · ' + employee : '');
    }
    if (type === 'EXPORT') {
      return 'Exported from dealership' + (employee ? ' · ' + employee : '');
    }

    return employee;
  }

  function statCard(label, value, sub, icon) {
    return `
      <div class="card stat-card">
        <div class="stat-copy">
          <div class="card-label">${label}</div>
          <div class="card-value">${value}</div>
          <div class="card-sub">${sub}</div>
        </div>
        <div class="stat-icon">${icon}</div>
      </div>
    `;
  }

  function metric(label, value) {
    return `
      <div class="metric-row">
        <span>${label}</span>
        <strong>${value}</strong>
      </div>
    `;
  }

  function quick(label, page, perm, cls) {
    const allowed =
      state.user.role === 'OWNER' ||
      state.user.role === 'MANAGER' ||
      state.user.permissions[perm];

    if (!allowed) {
      return `<button class="${cls} disabled-action" disabled>${label}</button>`;
    }

    return `<button class="${cls}" onclick="openPage('${page}')">${label}</button>`;
  }

  function bottomBrand() {
    return `
      <div class="bottom-brand">
        <div class="stripe"></div>
        <div class="brand-text">
          PDM 8230 LLC &nbsp;|&nbsp;
          <span>Premium Deluxe Motorsport</span>
        </div>
        <div class="stripe"></div>
      </div>
    `;
  }


  // ============================================================
  // MY PDM V1
  // ============================================================

  const myPdmState = {
    data: null
  };


  function toggleUserMenu(event) {
    if (event) {
      event.stopPropagation();
    }

    const menu =
      document.getElementById('userMenu');

    if (!menu) return;

    const opening =
      menu.classList.contains('hidden');

    menu.classList.toggle(
      'hidden',
      !opening
    );

    const trigger =
      document.querySelector('.user-block');

    if (trigger) {
      trigger.setAttribute(
        'aria-expanded',
        opening ? 'true' : 'false'
      );
    }
  }


  function closeUserMenu() {
    const menu =
      document.getElementById('userMenu');

    if (menu) {
      menu.classList.add('hidden');
    }

    const trigger =
      document.querySelector('.user-block');

    if (trigger) {
      trigger.setAttribute(
        'aria-expanded',
        'false'
      );
    }
  }


  document.addEventListener('click', event => {
    const menu =
      document.getElementById('userMenu');

    const trigger =
      document.querySelector('.user-block');

    if (
      menu &&
      trigger &&
      !menu.classList.contains('hidden') &&
      !menu.contains(event.target) &&
      !trigger.contains(event.target)
    ) {
      closeUserMenu();
    }
  });


  function openMyPdm() {
    closeUserMenu();
    openPage('mypdm');
  }


  function loadMyPdm() {
    showPageLoader(true);

    google.script.run
      .withSuccessHandler(data => {
        showPageLoader(false);

        myPdmState.data =
          data || {};

        renderMyPdm();
      })
      .withFailureHandler(handleServerError)
      .getMyPdmData(state.token);
  }


  function renderMyPdm() {
    const data =
      myPdmState.data || {};

    const profile =
      data.profile || {};

    const pay =
      data.pay || {};

    const activity =
      data.activity || {};

    const permissions =
      data.permissions || {};

    const history =
      Array.isArray(data.history)
        ? data.history
        : [];

    const start =
      data.week_start
        ? new Date(data.week_start)
        : null;

    const end =
      data.week_end
        ? new Date(data.week_end)
        : null;

    const weekLabel =
      start && end
        ? start.toLocaleDateString('en-GB') +
          ' 12:00 UTC – ' +
          end.toLocaleDateString('en-GB') +
          ' 12:00 UTC'
        : 'Current financial week';

    const status =
      String(
        data.payroll_status || 'ESTIMATED'
      ).toUpperCase();

    const employeePay =
      Number(
        pay.estimated_employee_pay || 0
      );

    const stakeholderPay =
      Number(
        pay.estimated_stakeholder_pay || 0
      );

    const combined =
      Number(
        pay.estimated_total || 0
      );

    const hasStake =
      Number(
        pay.stakeholder_percent || 0
      ) > 0;

    const last =
      pay.last_completed || null;

    document.getElementById('content').innerHTML = `
      <div class="mypdm-hero">
        <div>
          <div class="page-title" style="margin-bottom:5px">
            <h1>My PDM</h1>
          </div>

          <div class="muted">
            ${escapeHtml(profile.employee_name || '')}
            ${profile.employee_code
              ? ' · ' + escapeHtml(profile.employee_code)
              : ''}
            · ${escapeHtml(weekLabel)}
          </div>
        </div>

        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <span class="mypdm-status ${status.toLowerCase()}">
            ${escapeHtml(status)}
          </span>

          <button class="add-row-btn"
                  onclick="loadMyPdm()">
            REFRESH
          </button>
        </div>
      </div>

      <div class="mypdm-pay-grid">
        <div class="mypdm-metric mypdm-estimate">
          <span>Estimated This Week</span>
          <strong>${money(combined)}</strong>
          <small>
            ${status === 'ESTIMATED'
              ? 'Live estimate until the week closes'
              : 'Based on the current settlement state'}
          </small>
        </div>

        <div class="mypdm-metric">
          <span>Employee Pay</span>
          <strong>
            ${pay.payroll_eligible === true
              ? money(employeePay)
              : 'Not Eligible'}
          </strong>
          <small>
            Configured base ${money(pay.configured_base_pay || 0)}
            ${pay.payroll_eligible === true
              ? ' · est. activity component ' +
                money(pay.estimated_activity_component || 0)
              : ''}
          </small>
        </div>

        ${hasStake ? `
          <div class="mypdm-metric">
            <span>Stakeholder Distribution</span>
            <strong>${money(stakeholderPay)}</strong>
            <small>
              ${percent(pay.stakeholder_percent || 0)}
              stakeholder share
            </small>
          </div>
        ` : ''}

        <div class="mypdm-metric">
          <span>Paid To Date</span>
          <strong>${money(pay.paid_to_date || 0)}</strong>
          <small>
            Paid employee + stakeholder settlement lines
          </small>
        </div>

        <div class="mypdm-metric">
          <span>Last Completed Pay</span>
          <strong>
            ${last
              ? money(last.total_pay || 0)
              : '—'}
          </strong>
          <small>
            ${last
              ? new Date(last.week_start).toLocaleDateString('en-GB') +
                ' · ' + escapeHtml(last.status || '')
              : 'No completed settlement yet'}
          </small>
        </div>
      </div>

      <div class="card">
        <div class="section-title">
          My Activity · This Week
        </div>

        <div class="mypdm-activity-grid">
          ${myPdmMetric(
            'Imports',
            number(activity.import_units || 0),
            '1 point / vehicle'
          )}

          ${myPdmMetric(
            'Exports',
            number(activity.export_units || 0),
            '1 point / vehicle'
          )}

          ${myPdmMetric(
            'Buybacks',
            number(activity.buyback_units || 0),
            '0.5 point / vehicle'
          )}

          ${myPdmMetric(
            'Sales',
            number(activity.sale_units || 0),
            '0.5 point / vehicle'
          )}

          ${myPdmMetric(
            'Activity Points',
            number(activity.activity_points || 0),
            percent(activity.activity_share_percent || 0) +
              ' of eligible staff points'
          )}
        </div>

        <div class="mypdm-note"
             style="margin-top:12px">
          Current employee pool:
          ${money(pay.employee_pool || 0)}
          · ${number(pay.eligible_points || 0)} eligible points
          · ${money(pay.point_value || 0)} per point.
        </div>
      </div>

      <div class="grid-2" style="margin-top:14px">
        <div class="card">
          <div class="section-title">
            My Account
          </div>

          <div class="mypdm-account-grid">
            ${myPdmMetric(
              'Employee ID',
              escapeHtml(profile.employee_code || '—'),
              ''
            )}

            ${myPdmMetric(
              'Role',
              escapeHtml(profile.role || '—'),
              ''
            )}

            ${myPdmMetric(
              'IBAN',
              escapeHtml(profile.iban_masked || 'Not set'),
              'Masked for privacy'
            )}

            ${myPdmMetric(
              'Last Login',
              profile.last_login
                ? formatLogDate(profile.last_login)
                : 'Never',
              ''
            )}

            ${myPdmMetric(
              'Payroll',
              pay.payroll_eligible === true
                ? 'Eligible'
                : 'Not Eligible',
              hasStake
                ? percent(pay.stakeholder_percent || 0) +
                  ' stakeholder'
                : 'No stakeholder share'
            )}

            <div class="mypdm-metric">
              <span>Security</span>
              <strong style="font-size:16px">
                Portal Password
              </strong>
              <small>
                Change your password using your current password.
              </small>

              <button class="add-row-btn"
                      style="margin-top:10px"
                      onclick="openMyPdmPassword()">
                CHANGE PASSWORD
              </button>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="section-title">
            My Access
          </div>

          <div class="mypdm-permissions">
            ${myPdmPermission(
              'Sell Vehicles',
              permissions.can_sell
            )}

            ${myPdmPermission(
              'Import Vehicles',
              permissions.can_import
            )}

            ${myPdmPermission(
              'Accept Buybacks',
              permissions.can_buyback
            )}

            ${myPdmPermission(
              'Export Vehicles',
              permissions.can_export
            )}

            ${myPdmPermission(
              'View Accounts',
              permissions.can_view_accounts
            )}

            ${myPdmPermission(
              'Manage Payroll',
              permissions.can_manage_payroll
            )}

            ${myPdmPermission(
              'Manage Stock',
              permissions.can_manage_stock
            )}

            ${myPdmPermission(
              'Manage Vehicles',
              permissions.can_manage_vehicles
            )}

            ${myPdmPermission(
              'Manage Staff',
              permissions.can_manage_users
            )}
          </div>

          <div class="mypdm-note"
               style="margin-top:16px">
            Access is read-only here. Managers / Owners control permissions
            from Staff Management.
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:14px">
        <div class="section-title">
          My Pay History
        </div>

        ${renderMyPdmHistory(history)}
      </div>

      ${bottomBrand()}
    `;
  }


  function myPdmMetric(label, value, sub) {
    return `
      <div class="mypdm-metric">
        <span>${escapeHtml(label)}</span>
        <strong>${value}</strong>
        ${sub
          ? `<small>${escapeHtml(sub)}</small>`
          : ''}
      </div>
    `;
  }


  function myPdmPermission(label, allowed) {
    return `
      <span class="mypdm-permission ${allowed === true ? 'on' : 'off'}">
        <span>${allowed === true ? '✓' : '✕'}</span>
        <span>${escapeHtml(label)}</span>
      </span>
    `;
  }


  function renderMyPdmHistory(rows) {
    if (!rows.length) {
      return `
        <div class="placeholder">
          <p>No personal settlement history yet.</p>
        </div>
      `;
    }

    return `
      <div class="pay-table-wrap">
        <table class="mypdm-history">
          <thead>
            <tr>
              <th>Week</th>
              <th>Employee Pay</th>
              <th>Stakeholder</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            ${rows.map(r => {
              const start =
                new Date(r.week_start);

              const end =
                new Date(r.week_end);

              const status =
                String(r.status || '')
                  .toUpperCase();

              return `
                <tr>
                  <td>
                    ${start.toLocaleDateString('en-GB')}
                    –
                    ${end.toLocaleDateString('en-GB')}
                  </td>

                  <td>${money(r.employee_pay || 0)}</td>
                  <td>
                    ${Number(r.stakeholder_pay || 0) > 0
                      ? money(r.stakeholder_pay || 0)
                      : '—'}
                  </td>

                  <td>
                    <strong>${money(r.total_pay || 0)}</strong>
                  </td>

                  <td>
                    <span class="mypdm-status ${status.toLowerCase()}">
                      ${escapeHtml(status)}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }


  function openMyPdmPassword() {
    closeUserMenu();

    document
      .getElementById('myPdmPasswordModal')
      ?.remove();

    const backdrop =
      document.createElement('div');

    backdrop.id =
      'myPdmPasswordModal';

    backdrop.className =
      'modal-backdrop';

    backdrop.innerHTML = `
      <div class="modal-card"
           onclick="event.stopPropagation()">
        <h3>Change Portal Password</h3>

        <p>
          Enter your current password, then choose a new one.
          Minimum 6 characters.
        </p>

        <div class="mypdm-password-grid">
          <input id="myPdmCurrentPassword"
                 class="sales-input"
                 type="password"
                 autocomplete="current-password"
                 placeholder="Current password">

          <input id="myPdmNewPassword"
                 class="sales-input"
                 type="password"
                 autocomplete="new-password"
                 placeholder="New password">

          <input id="myPdmConfirmPassword"
                 class="sales-input"
                 type="password"
                 autocomplete="new-password"
                 placeholder="Confirm new password">
        </div>

        <div id="myPdmPasswordError"
             class="sale-message bad"
             style="margin-top:10px">
        </div>

        <div class="modal-actions">
          <button class="modal-cancel"
                  onclick="closeMyPdmPassword()">
            CANCEL
          </button>

          <button id="myPdmPasswordSave"
                  class="add-row-btn"
                  onclick="submitMyPdmPassword()">
            CHANGE PASSWORD
          </button>
        </div>
      </div>
    `;

    backdrop.onclick =
      closeMyPdmPassword;

    document.body.appendChild(
      backdrop
    );

    setTimeout(() => {
      document
        .getElementById('myPdmCurrentPassword')
        ?.focus();
    }, 0);
  }


  function closeMyPdmPassword() {
    document
      .getElementById('myPdmPasswordModal')
      ?.remove();
  }


  function submitMyPdmPassword() {
    const current =
      document
        .getElementById('myPdmCurrentPassword')
        ?.value || '';

    const next =
      document
        .getElementById('myPdmNewPassword')
        ?.value || '';

    const confirmPassword =
      document
        .getElementById('myPdmConfirmPassword')
        ?.value || '';

    const error =
      document
        .getElementById('myPdmPasswordError');

    const button =
      document
        .getElementById('myPdmPasswordSave');

    if (error) {
      error.textContent = '';
    }

    if (!current) {
      if (error) {
        error.textContent =
          'Enter your current password.';
      }
      return;
    }

    if (next.length < 6) {
      if (error) {
        error.textContent =
          'New password must be at least 6 characters.';
      }
      return;
    }

    if (next !== confirmPassword) {
      if (error) {
        error.textContent =
          'New passwords do not match.';
      }
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = 'CHANGING…';
    }

    google.script.run
      .withSuccessHandler(() => {
        closeMyPdmPassword();

        alert(
          'Password changed successfully.'
        );
      })
      .withFailureHandler(err => {
        if (button) {
          button.disabled = false;
          button.textContent =
            'CHANGE PASSWORD';
        }

        if (error) {
          error.textContent =
            cleanError(err);
        }
      })
      .changeMyPdmPassword(
        state.token,
        current,
        next
      );
  }


  function logout() {
    closeUserMenu();
    closeMyPdmPassword();

    const token = state.token;

    localStorage.removeItem('pdm_session_token');
    state.token = '';
    state.user = null;

    showLogin();

    if (token) {
      google.script.run.logoutDealership(token);
    }
  }

  function handleServerError(error) {
    showPageLoader(false);

    const msg = cleanError(error);

    if (msg.includes('SESSION_EXPIRED')) {
      logout();
      return;
    }

    document.getElementById('content').innerHTML = `
      <div class="placeholder">
        <h3>Something went sideways</h3>
        <p>${escapeHtml(msg)}</p>
      </div>
    `;
  }

  function showPageLoader(show) {
    document
      .getElementById('pageLoader')
      .classList.toggle('hidden', !show);
  }

  function setLoginBusy(busy) {
    const btn = document.querySelector('#loginScreen .primary');
    btn.disabled = busy;
    btn.textContent = busy ? 'Logging In…' : 'Log In';
  }

  function cleanError(error) {
    return String(
      (error && error.message) ||
      error ||
      'Unknown error'
    ).replace(/^Exception:\s*/,'');
  }

  function money(value) {
    return '$' + Number(value || 0).toLocaleString('en-US', {
      maximumFractionDigits:0
    });
  }

  function number(value) {
    return Number(value || 0).toLocaleString('en-US');
  }

  function percent(value) {
    return Number(value || 0).toLocaleString('en-US', {
      maximumFractionDigits:1
    }) + '%';
  }

  function formatRelative(value) {
    if (!value) return '';

    const date = new Date(value);
    if (isNaN(date)) return '';

    const diff = Date.now() - date.getTime();
    const mins = Math.max(0, Math.floor(diff / 60000));

    if (mins < 1) return 'just now';
    if (mins < 60) return mins + ' minute' + (mins === 1 ? '' : 's') + ' ago';

    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + ' hour' + (hours === 1 ? '' : 's') + ' ago';

    const days = Math.floor(hours / 24);
    if (days < 7) return days + ' day' + (days === 1 ? '' : 's') + ' ago';

    return date.toLocaleDateString('en-GB', {
      day:'2-digit',
      month:'short'
    });
  }

  function dayPart() {
    const h = new Date().getHours();
    return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  // ---------- SELL VEHICLE ----------
  const sellState = {
    vehicles: [],
    customers: [],
    rows: [],
    nextId: 1,
    loaded: false
  };

  function loadSellVehicle() {
    showPageLoader(true);

    google.script.run
      .withSuccessHandler(data => {
        showPageLoader(false);
        sellState.vehicles = Array.isArray(data.vehicles) ? data.vehicles : [];
        sellState.customers = Array.isArray(data.customers) ? data.customers : [];
        sellState.rows = [];
        sellState.nextId = 1;
        sellState.loaded = true;
        addSaleRow(false);
        renderSellVehicle();
      })
      .withFailureHandler(handleServerError)
      .getSellVehicleData(state.token);
  }

  function renderSellVehicle() {
    document.getElementById('content').innerHTML = `
      <div class="sell-toolbar">
        <div class="sell-toolbar-copy">
          <h1>Sell Vehicles</h1>
          <p>Fast batch entry · ${escapeHtml(state.user.employee_name)} will be credited automatically.</p>
        </div>
        <button class="add-row-btn" onclick="addSaleRow()">＋ ADD ROW</button>
      </div>

      <div class="sales-table-wrap">
        <table class="sales-table">
          <colgroup>
            <col style="width:20%">
            <col style="width:27%">
            <col style="width:7%">
            <col style="width:13%">
            <col style="width:11%">
            <col style="width:11%">
            <col style="width:8%">
            <col style="width:3%">
          </colgroup>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Vehicle</th>
              <th>Stock</th>
              <th>Sale Price</th>
              <th>Import Cost</th>
              <th>Profit</th>
              <th>Margin</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="saleRows"></tbody>
        </table>
      </div>

      <div class="batch-summary">
        <div class="batch-stat"><span>Vehicles</span><strong id="batchCount">0</strong></div>
        <div class="batch-stat"><span>Revenue</span><strong id="batchRevenue">$0</strong></div>
        <div class="batch-stat"><span>Vehicle Cost</span><strong id="batchCost">$0</strong></div>
        <div class="batch-stat"><span>Gross Profit</span><strong id="batchProfit">$0</strong></div>
        <div class="batch-stat"><span>Margin</span><strong id="batchMargin">0%</strong></div>
      </div>

      <div class="batch-footer">
        <div id="saleMessage" class="sale-message muted">PDM Price is loaded from the master vehicle catalogue and can be overridden per sale.</div>
        <button id="completeSalesBtn" class="complete-sales-btn" onclick="completeSales()">COMPLETE SALES</button>
      </div>

      ${bottomBrand()}
    `;

    renderSaleRows();
  }

  function addSaleRow(render = true) {
    sellState.rows.push({
      id: sellState.nextId++,
      customer_name: '',
      vehicle_id: '',
      vehicle_name: '',
      sale_price: '',
      import_cost: 0,
      pdm_price: 0,
      msrp: 0,
      stock_qty: 0
    });
    if (render && state.currentPage === 'sell') renderSaleRows();
  }

  function removeSaleRow(id) {
    if (sellState.rows.length === 1) {
      sellState.rows[0] = {
        id: sellState.rows[0].id,
        customer_name:'', vehicle_id:'', vehicle_name:'',
        sale_price:'', import_cost:0, pdm_price:0, msrp:0, stock_qty:0
      };
    } else {
      sellState.rows = sellState.rows.filter(r => r.id !== id);
    }
    renderSaleRows();
  }

  function renderSaleRows() {
    const body = document.getElementById('saleRows');
    if (!body) return;

    body.innerHTML = sellState.rows.map(row => {
      const used = batchVehicleCount(row.vehicle_id);
      const remaining = row.vehicle_id ? Number(row.stock_qty || 0) - used : 0;
      const price = Number(row.sale_price || 0);
      const cost = Number(row.import_cost || 0);
      const profit = price - cost;
      const margin = price > 0 ? (profit / price) * 100 : 0;
      const stockBad = row.vehicle_id && remaining < 0;

      return `
        <tr class="sale-entry" data-row="${row.id}">
          <td>
            <div class="suggest-wrap">
              <input class="sales-input"
                     id="customer-${row.id}"
                     value="${escapeHtml(row.customer_name)}"
                     placeholder="Customer name"
                     autocomplete="off"
                     oninput="saleCustomerInput(${row.id}, this.value)"
                     onfocus="showCustomerSuggestions(${row.id})">
              <div id="customer-menu-${row.id}" class="suggest-menu hidden"></div>
            </div>
          </td>
          <td>
            <div class="suggest-wrap">
              <input class="sales-input ${stockBad ? 'invalid' : ''}"
                     id="vehicle-${row.id}"
                     value="${escapeHtml(row.vehicle_name)}"
                     placeholder="Search in-stock vehicles"
                     autocomplete="off"
                     oninput="saleVehicleInput(${row.id}, this.value)"
                     onfocus="showVehicleSuggestions(${row.id})">
              <div id="vehicle-menu-${row.id}" class="suggest-menu hidden"></div>
            </div>
          </td>
          <td>
            <div style="padding-top:4px">
              <span class="stock-pill ${stockBad ? 'low' : ''}">
                ${row.vehicle_id ? Math.max(remaining, 0) + ' left' : '—'}
              </span>
            </div>
          </td>
          <td>
            <div class="money-input-wrap">
              <input class="sales-input"
                     type="number"
                     min="0"
                     step="1"
                     value="${row.sale_price}"
                     oninput="setSalePrice(${row.id}, this.value)"
                     onkeydown="salePriceKeydown(event, ${row.id})">
            </div>
            <div class="sale-price-note">
              ${row.vehicle_id ? 'PDM ' + money(row.pdm_price) + ' · MSRP ' + money(row.msrp) : ''}
            </div>
          </td>
          <td><div class="row-money">${row.vehicle_id ? money(cost) : '—'}</div></td>
          <td><div class="row-money row-profit ${profit < 0 ? 'negative' : 'positive'}">${row.vehicle_id ? money(profit) : '—'}</div></td>
          <td><div class="row-money">${row.vehicle_id ? percent(margin) : '—'}</div></td>
          <td><button class="remove-row" onclick="removeSaleRow(${row.id})" title="Remove row">×</button></td>
        </tr>
      `;
    }).join('');

    updateBatchSummary();
  }

  function saleCustomerInput(id, value) {
    const row = getSaleRow(id);
    if (!row) return;
    row.customer_name = value;
    showCustomerSuggestions(id, value);
  }

  function showCustomerSuggestions(id, forcedValue) {
    const input = document.getElementById('customer-' + id);
    const menu = document.getElementById('customer-menu-' + id);
    if (!input || !menu) return;

    const q = String(forcedValue !== undefined ? forcedValue : input.value).trim().toLowerCase();
    const matches = sellState.customers
      .filter(name => !q || name.toLowerCase().includes(q))
      .slice(0, 8);

    if (!matches.length) {
      menu.classList.add('hidden');
      return;
    }

    menu.innerHTML = matches.map(name => `
      <div class="suggest-item" onmousedown="pickCustomer(${id}, '${jsString(name)}')">
        <div class="suggest-main">${escapeHtml(name)}</div>
      </div>
    `).join('');
    menu.classList.remove('hidden');
  }

  function pickCustomer(id, name) {
    const row = getSaleRow(id);
    if (!row) return;
    row.customer_name = name;
    const input = document.getElementById('customer-' + id);
    const menu = document.getElementById('customer-menu-' + id);
    if (input) input.value = name;
    if (menu) menu.classList.add('hidden');
  }

  function saleVehicleInput(id, value) {
    const row = getSaleRow(id);
    if (!row) return;

    if (value !== row.vehicle_name) {
      row.vehicle_id = '';
      row.vehicle_name = value;
      row.sale_price = '';
      row.import_cost = 0;
      row.pdm_price = 0;
      row.msrp = 0;
      row.stock_qty = 0;
    }
    showVehicleSuggestions(id, value);
  }

  function showVehicleSuggestions(id, forcedValue) {
  const input = document.getElementById('vehicle-' + id);
  const menu = document.getElementById('vehicle-menu-' + id);

  if (!input || !menu) return;

  const q = String(
    forcedValue !== undefined
      ? forcedValue
      : input.value
  )
    .trim()
    .toLowerCase();

  const matches = sellState.vehicles
    .filter(v => {
      const remaining =
        Number(v.stock_qty || 0) -
        batchVehicleCountExcluding(v.vehicle_id, id);

      if (remaining <= 0) return false;

      if (!q) return true;

      const name =
        String(v.display_name || '')
          .trim()
          .toLowerCase();

      const category =
        String(v.category || '')
          .trim()
          .toLowerCase();

      return (
        name.includes(q) ||
        category.includes(q)
      );
    })
      .sort((a, b) => {
        const aName =
          String(a.display_name || '')
            .toLowerCase();

        const bName =
          String(b.display_name || '')
            .toLowerCase();

        // Exact name match first.
        const aExact = aName === q;
        const bExact = bName === q;

        if (aExact && !bExact) return -1;
        if (bExact && !aExact) return 1;

        // Then names beginning with the search.
        const aStarts = aName.startsWith(q);
        const bStarts = bName.startsWith(q);

        if (aStarts && !bStarts) return -1;
        if (bStarts && !aStarts) return 1;

        // Finally alphabetical.
        return aName.localeCompare(bName);
      })
      .slice(0, 12);

    if (!matches.length) {
      menu.innerHTML = `
        <div class="suggest-item">
          <div class="suggest-main muted">
            No matching in-stock vehicles
          </div>
        </div>
      `;

      menu.classList.remove('hidden');
      return;
    }

    menu.innerHTML = matches
      .map(v => {
        const remaining =
          Number(v.stock_qty || 0) -
          batchVehicleCountExcluding(v.vehicle_id, id);

        return `
          <div class="suggest-item"
              onmousedown="pickVehicle(${id}, '${jsString(v.vehicle_id)}')">

            <div class="suggest-main">
              ${escapeHtml(v.display_name)}
            </div>

            <div class="suggest-sub">
              <span>
                ${escapeHtml(v.category || '')}
              </span>

              <span>
                ${remaining} in stock ·
                PDM ${money(v.pdm_price)}
              </span>
            </div>
          </div>
        `;
      })
      .join('');

    menu.classList.remove('hidden');
  }

  function pickVehicle(id, vehicleId) {
    const row = getSaleRow(id);
    const v = sellState.vehicles.find(x => String(x.vehicle_id) === String(vehicleId));
    if (!row || !v) return;

    row.vehicle_id = v.vehicle_id;
    row.vehicle_name = v.display_name;
    row.stock_qty = Number(v.stock_qty || 0);
    row.import_cost = Number(v.import_cost || 0);
    row.pdm_price = Number(v.pdm_price || 0);
    row.msrp = Number(v.msrp || 0);
    row.sale_price = Number(v.pdm_price || 0);

    renderSaleRows();

    setTimeout(() => {
      const priceInput = document.querySelector(`[data-row="${id}"] input[type="number"]`);
      if (priceInput) priceInput.select();
    }, 0);
  }

  function setSalePrice(id, value) {
    const row = getSaleRow(id);
    if (!row) return;
    row.sale_price = value;
    updateBatchSummary();

    const tr = document.querySelector(`[data-row="${id}"]`);
    if (!tr || !row.vehicle_id) return;
    const price = Number(value || 0);
    const profit = price - Number(row.import_cost || 0);
    const margin = price > 0 ? (profit / price) * 100 : 0;
    const cells = tr.querySelectorAll('.row-money');
    if (cells[1]) {
      cells[1].textContent = money(profit);
      cells[1].classList.toggle('negative', profit < 0);
      cells[1].classList.toggle('positive', profit >= 0);
    }
    if (cells[2]) cells[2].textContent = percent(margin);
  }

  function salePriceKeydown(event, id) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const idx = sellState.rows.findIndex(r => r.id === id);
    if (idx === sellState.rows.length - 1) {
      addSaleRow();
      setTimeout(() => {
        const next = sellState.rows[sellState.rows.length - 1];
        const input = document.getElementById('customer-' + next.id);
        if (input) input.focus();
      }, 0);
    }
  }

  function updateBatchSummary() {
    const valid = sellState.rows.filter(r =>
      r.customer_name.trim() && r.vehicle_id && r.sale_price !== ''
    );

    const revenue = valid.reduce((s,r) => s + Number(r.sale_price || 0), 0);
    const cost = valid.reduce((s,r) => s + Number(r.import_cost || 0), 0);
    const profit = revenue - cost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    setText('batchCount', valid.length);
    setText('batchRevenue', money(revenue));
    setText('batchCost', money(cost));
    setText('batchProfit', money(profit));
    setText('batchMargin', percent(margin));

    const btn = document.getElementById('completeSalesBtn');
    if (btn) btn.disabled = !valid.length || hasBatchStockProblem();
  }

  function hasBatchStockProblem() {
    const counts = {};
    sellState.rows.forEach(r => {
      if (!r.vehicle_id) return;
      counts[r.vehicle_id] = (counts[r.vehicle_id] || 0) + 1;
    });

    return Object.keys(counts).some(vehicleId => {
      const v = sellState.vehicles.find(x => String(x.vehicle_id) === String(vehicleId));
      return !v || counts[vehicleId] > Number(v.stock_qty || 0);
    });
  }

  function completeSales() {
    const message = document.getElementById('saleMessage');
    const btn = document.getElementById('completeSalesBtn');

    const rows = sellState.rows.filter(r =>
      r.customer_name.trim() || r.vehicle_id || r.sale_price !== ''
    );

    if (!rows.length) return;

    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].customer_name.trim()) return saleError('Row ' + (i+1) + ': enter a customer.');
      if (!rows[i].vehicle_id) return saleError('Row ' + (i+1) + ': select a vehicle from the suggestions.');
      if (rows[i].sale_price === '' || !Number.isFinite(Number(rows[i].sale_price)) || Number(rows[i].sale_price) < 0) {
        return saleError('Row ' + (i+1) + ': enter a valid sale price.');
      }
    }

    if (hasBatchStockProblem()) {
      return saleError('This batch contains more of a vehicle than is currently in stock.');
    }

    btn.disabled = true;
    btn.textContent = 'SUBMITTING…';
    if (message) {
      message.className = 'sale-message muted';
      message.textContent = 'Validating stock and writing the batch…';
    }

    google.script.run
      .withSuccessHandler(result => {
        if (message) {
          message.className = 'sale-message good';
          message.textContent =
            '✓ ' + Number(result.sales_count || rows.length) +
            ' sale' + (Number(result.sales_count || rows.length) === 1 ? '' : 's') +
            ' completed · ' + String(result.batch_id || '');
        }

        sellState.rows = [];
        sellState.nextId = 1;

        // Reload live stock so the next batch cannot use stale quantities.
        google.script.run
          .withSuccessHandler(data => {
            sellState.vehicles = Array.isArray(data.vehicles) ? data.vehicles : [];
            sellState.customers = Array.isArray(data.customers) ? data.customers : [];
            addSaleRow(false);
            renderSellVehicle();
            const msg = document.getElementById('saleMessage');
            if (msg) {
              msg.className = 'sale-message good';
              msg.textContent =
                '✓ Batch ' + String(result.batch_id || '') +
                ' completed · ' + money(result.revenue || 0) + ' revenue.';
            }
          })
          .withFailureHandler(handleServerError)
          .getSellVehicleData(state.token);
      })
      .withFailureHandler(error => {
        btn.disabled = false;
        btn.textContent = 'COMPLETE SALES';
        saleError(cleanError(error));
      })
      .submitSalesBatch(
        state.token,
        rows.map(r => ({
          customer_name: r.customer_name.trim(),
          vehicle_id: r.vehicle_id,
          sale_price: Number(r.sale_price)
        }))
      );
  }

  function saleError(text) {
    const el = document.getElementById('saleMessage');
    if (el) {
      el.className = 'sale-message bad';
      el.textContent = text;
    }
  }

  function batchVehicleCount(vehicleId) {
    if (!vehicleId) return 0;
    return sellState.rows.filter(r => String(r.vehicle_id) === String(vehicleId)).length;
  }

  function batchVehicleCountExcluding(vehicleId, rowId) {
    if (!vehicleId) return 0;
    return sellState.rows.filter(r =>
      r.id !== rowId && String(r.vehicle_id) === String(vehicleId)
    ).length;
  }

  function getSaleRow(id) {
    return sellState.rows.find(r => r.id === id);
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function jsString(value) {
    return String(value == null ? '' : value)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\r?\n/g, ' ');
  }

  document.addEventListener('mousedown', event => {
    if (!event.target.closest('.suggest-wrap')) {
      document.querySelectorAll('.suggest-menu').forEach(x => x.classList.add('hidden'));
    }
  });

  // ---------- IMPORT VEHICLES ----------
  const importState = {
    vehicles: [],
    rows: [],
    nextId: 1
  };

  function loadImportVehicles() {
    showPageLoader(true);

    google.script.run
      .withSuccessHandler(data => {
        showPageLoader(false);
        importState.vehicles = Array.isArray(data.vehicles) ? data.vehicles : [];
        importState.rows = [];
        importState.nextId = 1;
        addImportRow(false);
        renderImportVehicles();
      })
      .withFailureHandler(handleServerError)
      .getImportVehicleData(state.token);
  }

  function renderImportVehicles() {
    document.getElementById('content').innerHTML = `
      <div class="sell-toolbar">
        <div class="sell-toolbar-copy">
          <h1>Import Vehicles</h1>
          <p>Catalogue import costs are locked · ${escapeHtml(state.user.employee_name)} will be credited automatically.</p>
        </div>
        <button class="add-row-btn" onclick="addImportRow()">＋ ADD ROW</button>
      </div>

      <div class="sales-table-wrap">
        <table class="sales-table">
          <colgroup>
            <col style="width:34%">
            <col style="width:10%">
            <col style="width:14%">
            <col style="width:12%">
            <col style="width:12%">
            <col style="width:15%">
            <col style="width:3%">
          </colgroup>
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Qty</th>
              <th>Import Cost Each</th>
              <th>Stock Before</th>
              <th>Stock After</th>
              <th>Line Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="importRows"></tbody>
        </table>
      </div>

      <div class="batch-summary">
        <div class="batch-stat"><span>Import Lines</span><strong id="importLineCount">0</strong></div>
        <div class="batch-stat"><span>Vehicles</span><strong id="importVehicleCount">0</strong></div>
        <div class="batch-stat"><span>Total Import Cost</span><strong id="importTotalCost">$0</strong></div>
      </div>

      <div class="card" style="margin-top:18px">
        <div class="section-title">Batch Notes</div>
        <textarea id="importBatchNotes"
                  class="sales-input"
                  style="width:100%;min-height:82px;resize:vertical"
                  placeholder="Optional note applied to every import row in this batch."></textarea>
      </div>

      <div class="batch-footer">
        <div id="importMessage" class="sale-message muted">
          Import cost comes directly from the master vehicle catalogue.
        </div>
        <button id="completeImportsBtn"
                class="complete-sales-btn"
                onclick="completeImports()">
          COMPLETE IMPORT
        </button>
      </div>

      ${bottomBrand()}
    `;

    renderImportRows();
  }

  function addImportRow(render = true) {
    importState.rows.push({
      id: importState.nextId++,
      vehicle_id: '',
      vehicle_name: '',
      quantity: 1,
      import_cost: 0,
      stock_qty: 0,
      category: '',
      sales_30: 0,
      sales_90: 0,
      last_sale: null,
      target_stock: 0,
      suggested_import_qty: 0,
      recommendation_reason: ''
    });

    if (render && state.currentPage === 'import') {
      renderImportRows();
    }
  }

  function removeImportRow(id) {
    if (importState.rows.length === 1) {
      importState.rows[0] = {
        id: importState.rows[0].id,
        vehicle_id: '',
        vehicle_name: '',
        quantity: 1,
        import_cost: 0,
        stock_qty: 0,
        category: '',
        sales_30: 0,
        sales_90: 0,
        last_sale: null,
        target_stock: 0,
        suggested_import_qty: 0,
        recommendation_reason: ''
      };
    } else {
      importState.rows = importState.rows.filter(r => r.id !== id);
    }

    renderImportRows();
  }

  function renderImportRows() {
    const body = document.getElementById('importRows');
    if (!body) return;

    body.innerHTML = importState.rows.map(row => {
      const qty = Math.max(1, parseInt(row.quantity || 1, 10));
      const cost = Number(row.import_cost || 0);
      const before = Number(row.stock_qty || 0);
      const otherAdded = importQuantityForVehicle(row.vehicle_id, row.id);
      const effectiveBefore = before + otherAdded;
      const after = effectiveBefore + (row.vehicle_id ? qty : 0);
      const lineTotal = cost * qty;

      return `
        <tr class="sale-entry" data-import-row="${row.id}">
          <td>
            <div class="suggest-wrap">
              <input class="sales-input"
                     id="import-vehicle-${row.id}"
                     value="${escapeHtml(row.vehicle_name)}"
                     placeholder="Search vehicle catalogue"
                     autocomplete="off"
                     oninput="importVehicleInput(${row.id}, this.value)"
                     onfocus="showImportVehicleSuggestions(${row.id})">
              <div id="import-vehicle-menu-${row.id}" class="suggest-menu hidden"></div>
            </div>
            <div class="sale-price-note">
              ${row.vehicle_id ? escapeHtml(row.category || '') : ''}
            </div>

            ${row.vehicle_id
              ? renderImportStockSuggestion(row, effectiveBefore)
              : ''}
          </td>

          <td>
            <input class="sales-input"
                   type="number"
                   min="1"
                   step="1"
                   value="${qty}"
                   oninput="setImportQuantity(${row.id}, this.value)"
                   onkeydown="importQuantityKeydown(event, ${row.id})">
          </td>

          <td>
            <div class="row-money">${row.vehicle_id ? money(cost) : '—'}</div>
          </td>

          <td>
            <span class="stock-pill">
              ${row.vehicle_id ? effectiveBefore : '—'}
            </span>
          </td>

          <td>
            <span class="stock-pill">
              ${row.vehicle_id ? after : '—'}
            </span>
          </td>

          <td>
            <div class="row-money">
              ${row.vehicle_id ? money(lineTotal) : '—'}
            </div>
          </td>

          <td>
            <button class="remove-row"
                    onclick="removeImportRow(${row.id})"
                    title="Remove row">×</button>
          </td>
        </tr>
      `;
    }).join('');

    updateImportSummary();
  }

  function importVehicleInput(id, value) {
    const row = getImportRow(id);
    if (!row) return;

    if (value !== row.vehicle_name) {
      row.vehicle_id = '';
      row.vehicle_name = value;
      row.import_cost = 0;
      row.stock_qty = 0;
      row.category = '';
      row.sales_30 = 0;
      row.sales_90 = 0;
      row.last_sale = null;
      row.target_stock = 0;
      row.suggested_import_qty = 0;
      row.recommendation_reason = '';
    }

    showImportVehicleSuggestions(id, value);
  }

  function showImportVehicleSuggestions(id, forcedValue) {
    const input = document.getElementById('import-vehicle-' + id);
    const menu = document.getElementById('import-vehicle-menu-' + id);
    if (!input || !menu) return;

    const q = String(
      forcedValue !== undefined ? forcedValue : input.value
    ).trim().toLowerCase();

    const matches = importState.vehicles
      .filter(v =>
        !q ||
        String(v.display_name || '').toLowerCase().includes(q) ||
        String(v.category || '').toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const aName =
          String(a.display_name || '')
            .trim()
            .toLowerCase();

        const bName =
          String(b.display_name || '')
            .trim()
            .toLowerCase();

        if (aName === q && bName !== q) return -1;
        if (bName === q && aName !== q) return 1;

        const aStarts = aName.startsWith(q);
        const bStarts = bName.startsWith(q);

        if (aStarts && !bStarts) return -1;
        if (bStarts && !aStarts) return 1;

        return aName.localeCompare(bName);
      })
      .slice(0, 12);

    if (!matches.length) {
      menu.innerHTML = `
        <div class="suggest-item">
          <div class="suggest-main muted">No matching vehicles</div>
        </div>
      `;
      menu.classList.remove('hidden');
      return;
    }

    menu.innerHTML = matches.map(v => `
      <div class="suggest-item"
           onmousedown="pickImportVehicle(${id}, '${jsString(v.vehicle_id)}')">
        <div class="suggest-main">${escapeHtml(v.display_name)}</div>
        <div class="suggest-sub">
          <span>${escapeHtml(v.category || '')}</span>
          <span>
            ${money(v.import_cost)} import ·
            ${Number(v.stock_qty || 0)} in stock ·
            ${Number(v.sales_30 || 0)} sold / 30d
          </span>
        </div>
      </div>
    `).join('');

    menu.classList.remove('hidden');
  }

  function pickImportVehicle(id, vehicleId) {
    const row = getImportRow(id);
    const vehicle = importState.vehicles.find(
      v => String(v.vehicle_id) === String(vehicleId)
    );

    if (!row || !vehicle) return;

    row.vehicle_id = vehicle.vehicle_id;
    row.vehicle_name = vehicle.display_name;
    row.category = vehicle.category || '';
    row.import_cost = Number(vehicle.import_cost || 0);
    row.stock_qty = Number(vehicle.stock_qty || 0);

    row.sales_30 = Number(vehicle.sales_30 || 0);
    row.sales_90 = Number(vehicle.sales_90 || 0);
    row.last_sale = vehicle.last_sale || null;
    row.target_stock = Number(vehicle.target_stock || 0);
    row.suggested_import_qty =
      Number(vehicle.suggested_import_qty || 0);

    row.recommendation_reason =
      String(vehicle.recommendation_reason || '');

    renderImportRows();

    setTimeout(() => {
      const tr = document.querySelector(`[data-import-row="${id}"]`);
      const qtyInput = tr ? tr.querySelector('input[type="number"]') : null;
      if (qtyInput) {
        qtyInput.focus();
        qtyInput.select();
      }
    }, 0);
  }


  function renderImportStockSuggestion(row, effectiveBefore) {
    const sales30 = Number(row.sales_30 || 0);
    const sales90 = Number(row.sales_90 || 0);
    const target = Number(row.target_stock || 0);

    let suggested =
      Math.max(
        0,
        1 + target - Math.max(0, Number(effectiveBefore || 0))
      );

    suggested = Math.min(5, suggested);

    let headline = '';

    if (suggested <= 0) {
      headline = 'No import recommended';
    } else if (suggested === 1) {
      headline = 'Import 1';
    } else {
      headline = 'Import ' + suggested;
    }

    let reason =
      String(row.recommendation_reason || '');

    if (suggested <= 0) {
      reason =
        'Existing stock can fulfil one customer request while retaining the recommended shelf stock.';
    } else if (sales30 === 0 && sales90 === 0) {
      reason =
        'No recent sales history. This is a request-only recommendation.';
    }

    const lastSale =
      row.last_sale
        ? ' · last sold ' + formatRelative(row.last_sale)
        : '';

    return `
      <div class="import-suggestion">
        <div class="import-suggestion-head">
          <div class="import-suggestion-title">
            📊 Suggested: ${escapeHtml(headline)}
          </div>

          ${suggested > 0
            ? `<button type="button"
                       class="import-suggestion-use"
                       onclick="useImportSuggestion(${row.id}, ${suggested})">
                 USE ${suggested}
               </button>`
            : ''}
        </div>

        <div class="import-suggestion-meta">
          Current stock ${number(effectiveBefore || 0)}
          · ${number(sales30)} sold / 30d
          · ${number(sales90)} / 90d
          · shelf target ${number(target)}
          ${lastSale}
        </div>

        <div class="import-suggestion-reason">
          ${escapeHtml(reason)}
        </div>
      </div>
    `;
  }


  function useImportSuggestion(id, suggestedQty) {
    const row = getImportRow(id);
    if (!row) return;

    const qty =
      Math.max(
        1,
        parseInt(suggestedQty || 1, 10)
      );

    row.quantity = qty;
    renderImportRows();

    setTimeout(() => {
      const tr =
        document.querySelector(
          `[data-import-row="${id}"]`
        );

      const input =
        tr
          ? tr.querySelector('input[type="number"]')
          : null;

      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  }


  function setImportQuantity(id, value) {
    const row = getImportRow(id);
    if (!row) return;

    const parsed = parseInt(value, 10);
    row.quantity = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    renderImportRows();
  }

  function importQuantityKeydown(event, id) {
    if (event.key !== 'Enter') return;
    event.preventDefault();

    const idx = importState.rows.findIndex(r => r.id === id);

    if (idx === importState.rows.length - 1) {
      addImportRow();

      setTimeout(() => {
        const next = importState.rows[importState.rows.length - 1];
        const input = document.getElementById('import-vehicle-' + next.id);
        if (input) input.focus();
      }, 0);
    }
  }

  function importQuantityForVehicle(vehicleId, excludingRowId) {
    if (!vehicleId) return 0;

    return importState.rows
      .filter(r =>
        r.id !== excludingRowId &&
        String(r.vehicle_id) === String(vehicleId)
      )
      .reduce((sum, r) => sum + Math.max(1, parseInt(r.quantity || 1, 10)), 0);
  }

  function updateImportSummary() {
    const valid = importState.rows.filter(r => r.vehicle_id);

    const vehicleCount = valid.reduce(
      (sum, r) => sum + Math.max(1, parseInt(r.quantity || 1, 10)),
      0
    );

    const totalCost = valid.reduce(
      (sum, r) =>
        sum +
        Number(r.import_cost || 0) *
        Math.max(1, parseInt(r.quantity || 1, 10)),
      0
    );

    setText('importLineCount', valid.length);
    setText('importVehicleCount', vehicleCount);
    setText('importTotalCost', money(totalCost));

    const btn = document.getElementById('completeImportsBtn');
    if (btn) btn.disabled = !valid.length;
  }

  function completeImports() {
    const message = document.getElementById('importMessage');
    const btn = document.getElementById('completeImportsBtn');
    const notesEl = document.getElementById('importBatchNotes');
    const notes = notesEl ? notesEl.value.trim() : '';

    const rows = importState.rows.filter(
      r => r.vehicle_id || String(r.vehicle_name || '').trim()
    );

    if (!rows.length) return;

    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].vehicle_id) {
        return importError(
          'Row ' + (i + 1) + ': select a vehicle from the suggestions.'
        );
      }

      const qty = Number(rows[i].quantity);

      if (!Number.isInteger(qty) || qty < 1) {
        return importError(
          'Row ' + (i + 1) + ': quantity must be a whole number of at least 1.'
        );
      }
    }

    btn.disabled = true;
    btn.textContent = 'IMPORTING…';

    if (message) {
      message.className = 'sale-message muted';
      message.textContent =
        'Reading catalogue costs and writing the import batch…';
    }

    google.script.run
      .withSuccessHandler(result => {
        const completedCount = Number(result.vehicle_count || 0);

        // Reload catalogue + live stock immediately.
        google.script.run
          .withSuccessHandler(data => {
            importState.vehicles =
              Array.isArray(data.vehicles) ? data.vehicles : [];
            importState.rows = [];
            importState.nextId = 1;
            addImportRow(false);
            renderImportVehicles();

            const msg = document.getElementById('importMessage');
            if (msg) {
              msg.className = 'sale-message good';
              msg.textContent =
                '✓ Batch ' + String(result.batch_id || '') +
                ' completed · ' +
                completedCount + ' vehicle' +
                (completedCount === 1 ? '' : 's') +
                ' · ' + money(result.total_cost || 0) + ' import cost.';
            }
          })
          .withFailureHandler(handleServerError)
          .getImportVehicleData(state.token);
      })
      .withFailureHandler(error => {
        btn.disabled = false;
        btn.textContent = 'COMPLETE IMPORT';
        importError(cleanError(error));
      })
      .submitImportBatch(
        state.token,
        rows.map(r => ({
          vehicle_id: r.vehicle_id,
          quantity: Number(r.quantity),
          notes: notes
        }))
      );
  }

  function importError(text) {
    const el = document.getElementById('importMessage');
    if (el) {
      el.className = 'sale-message bad';
      el.textContent = text;
    }
  }

  function getImportRow(id) {
    return importState.rows.find(r => r.id === id);
  }

// ---------- BUYBACKS V1 ----------
const buybackState = {
  vehicles: [],
  customers: [],
  rows: [],
  nextId: 1
};

function loadBuybacks() {
  showPageLoader(true);

  google.script.run
    .withSuccessHandler(data => {
      showPageLoader(false);
      buybackState.vehicles = Array.isArray(data.vehicles) ? data.vehicles : [];
      buybackState.customers = Array.isArray(data.customers) ? data.customers : [];
      buybackState.rows = [];
      buybackState.nextId = 1;
      addBuybackRow(false);
      renderBuybacks();
    })
    .withFailureHandler(handleServerError)
    .getBuybackVehicleData(state.token);
}

function renderBuybacks() {
  document.getElementById('content').innerHTML = `
    <div class="sell-toolbar">
      <div class="sell-toolbar-copy">
        <h1>Buy From Player</h1>
        <p>Live buybacks enter dealership stock automatically · ${escapeHtml(state.user.employee_name)} will be credited automatically.</p>
      </div>
      <button class="add-row-btn" onclick="addBuybackRow()">＋ ADD ROW</button>
    </div>

    <div class="card" style="margin-bottom:18px">
      <div class="section-title">Seller</div>
      <div class="suggest-wrap">
        <input id="buybackSeller"
              class="sales-input"
              style="width:100%"
              placeholder="Seller / customer name"
              autocomplete="off"
              oninput="showBuybackSellerSuggestions(this.value)"
              onfocus="showBuybackSellerSuggestions(this.value)">
        <div id="buybackSellerMenu"
            class="suggest-menu hidden">
        </div>
      </div>
    </div>

    <div class="sales-table-wrap">
      <table class="sales-table" style="min-width:1250px">
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>PDM Sale Price</th>
            <th>Import / Export</th>
            <th>Buyback Price</th>
            <th>Resale Margin</th>
            <th>Export Margin</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="buybackRows"></tbody>
      </table>
    </div>

    <div class="batch-summary">
      <div class="batch-stat"><span>Vehicles</span><strong id="buybackVehicleCount">0</strong></div>
      <div class="batch-stat"><span>Total Paid</span><strong id="buybackTotalPaid">$0</strong></div>
      <div class="batch-stat"><span>Destination</span><strong>STOCK</strong></div>
    </div>

    <div class="card" style="margin-top:18px">
      <div class="section-title">Notes</div>
      <textarea id="buybackNotes" class="sales-input"
                style="width:100%;min-height:82px;resize:vertical"
                placeholder="Optional notes for this buyback batch."></textarea>
    </div>

    <div class="batch-footer">
      <div id="buybackMessage" class="sale-message muted">
        PDM sale and import/export prices are reference values only.
      </div>
      <button id="completeBuybackBtn" class="complete-sales-btn" onclick="completeBuyback()">
        COMPLETE BUYBACK
      </button>
    </div>

    ${bottomBrand()}
  `;

  renderBuybackRows();
}

function addBuybackRow(render = true) {
  buybackState.rows.push({
    id: buybackState.nextId++,
    vehicle_id: '',
    vehicle_name: '',
    category: '',
    sale_price: 0,
    import_cost: 0,
    stock_qty: 0,
    buyback_price: ''
  });

  if (render && state.currentPage === 'buyback') renderBuybackRows();
}

function removeBuybackRow(id) {
  if (buybackState.rows.length === 1) {
    const row = buybackState.rows[0];
    buybackState.rows[0] = {
      id: row.id, vehicle_id:'', vehicle_name:'', category:'',
      sale_price:0, import_cost:0, stock_qty:0, buyback_price:''
    };
  } else {
    buybackState.rows = buybackState.rows.filter(r => r.id !== id);
  }
  renderBuybackRows();
}

function renderBuybackRows() {
  const body = document.getElementById('buybackRows');
  if (!body) return;

  body.innerHTML = buybackState.rows.map(row => {
    const price = row.buyback_price === '' ? null : Number(row.buyback_price);
    const resaleMargin = row.vehicle_id && price !== null ? Number(row.sale_price || 0) - price : null;
    const exportMargin = row.vehicle_id && price !== null ? Number(row.import_cost || 0) - price : null;

    return `
      <tr class="sale-entry" data-buyback-row="${row.id}">
        <td>
          <div class="suggest-wrap">
            <input class="sales-input" id="buyback-vehicle-${row.id}"
                   value="${escapeHtml(row.vehicle_name)}"
                   placeholder="Search vehicle catalogue" autocomplete="off"
                   oninput="buybackVehicleInput(${row.id}, this.value)"
                   onfocus="showBuybackVehicleSuggestions(${row.id})">
            <div id="buyback-vehicle-menu-${row.id}" class="suggest-menu hidden"></div>
          </div>
          <div class="sale-price-note">
            ${row.vehicle_id ? escapeHtml(row.category || '') + ' · ' + number(row.stock_qty || 0) + ' currently in stock' : ''}
          </div>
        </td>

        <td><div class="row-money">${row.vehicle_id ? money(row.sale_price) : '—'}</div></td>
        <td><div class="row-money">${row.vehicle_id ? money(row.import_cost) : '—'}</div></td>

        <td>
          <input class="sales-input" type="number" min="0" step="1"
                 value="${escapeHtml(String(row.buyback_price))}" placeholder="$0"
                 oninput="setBuybackPrice(${row.id}, this.value)"
                 onkeydown="buybackPriceKeydown(event, ${row.id})">
        </td>

        <td id="buyback-resale-margin-${row.id}">
          ${renderBuybackMargin(resaleMargin)}
        </td>

        <td id="buyback-export-margin-${row.id}">
          ${renderBuybackMargin(exportMargin)}
        </td>

        <td>
          <button class="remove-row" onclick="removeBuybackRow(${row.id})" title="Remove row">×</button>
        </td>
      </tr>
    `;
  }).join('');

  updateBuybackSummary();
}

function renderBuybackMargin(value) {
  if (value === null || !Number.isFinite(value)) return `<span class="muted">—</span>`;

  const cls = value < 0 ? 'negative' : 'positive';
  const sign = value > 0 ? '+' : '';

  return `<div class="log-profit ${cls}" style="font-weight:800">
    ${sign}${money(value)}${value < 0 ? ' ⚠' : ''}
  </div>`;
}

function buybackVehicleInput(id, value) {
  const row = getBuybackRow(id);
  if (!row) return;

  if (value !== row.vehicle_name) {
    row.vehicle_id = '';
    row.vehicle_name = value;
    row.category = '';
    row.sale_price = 0;
    row.import_cost = 0;
    row.stock_qty = 0;
  }

  showBuybackVehicleSuggestions(id, value);
}

function showBuybackVehicleSuggestions(id, forcedValue) {
  const input = document.getElementById('buyback-vehicle-' + id);
  const menu = document.getElementById('buyback-vehicle-menu-' + id);
  if (!input || !menu) return;

  const q = String(
    forcedValue !== undefined ? forcedValue : input.value
  ).trim().toLowerCase();

  const matches = buybackState.vehicles
    .filter(v =>
      !q ||
      String(v.display_name || '').toLowerCase().includes(q) ||
      String(v.category || '').toLowerCase().includes(q)
    )
    .sort((a, b) => {
      const aName =
        String(a.display_name || '')
          .trim()
          .toLowerCase();

      const bName =
        String(b.display_name || '')
          .trim()
          .toLowerCase();

      if (aName === q && bName !== q) return -1;
      if (bName === q && aName !== q) return 1;

      const aStarts = aName.startsWith(q);
      const bStarts = bName.startsWith(q);

      if (aStarts && !bStarts) return -1;
      if (bStarts && !aStarts) return 1;

      return aName.localeCompare(bName);
    })
    .slice(0, 12);

  if (!matches.length) {
    menu.innerHTML = `
      <div class="suggest-item">
        <div class="suggest-main muted">No matching vehicles</div>
      </div>
    `;
    menu.classList.remove('hidden');
    return;
  }

  menu.innerHTML = matches.map(v => `
    <div class="suggest-item"
         onmousedown="pickBuybackVehicle(${id}, '${jsString(v.vehicle_id)}')">
      <div class="suggest-main">${escapeHtml(v.display_name)}</div>
      <div class="suggest-sub">
        <span>${escapeHtml(v.category || '')}</span>
        <span>
          Sale ${money(v.sale_price)} ·
          Export ${money(v.import_cost)} ·
          ${number(v.stock_qty || 0)} in stock
        </span>
      </div>
    </div>
  `).join('');

  menu.classList.remove('hidden');
}

function pickBuybackVehicle(id, vehicleId) {
  const row = getBuybackRow(id);
  const vehicle = buybackState.vehicles.find(v => String(v.vehicle_id) === String(vehicleId));
  if (!row || !vehicle) return;

  row.vehicle_id = vehicle.vehicle_id;
  row.vehicle_name = vehicle.display_name;
  row.category = vehicle.category || '';
  row.sale_price = Number(vehicle.sale_price || 0);
  row.import_cost = Number(vehicle.import_cost || 0);
  row.stock_qty = Number(vehicle.stock_qty || 0);

  renderBuybackRows();

  setTimeout(() => {
    const tr = document.querySelector(`[data-buyback-row="${id}"]`);
    const priceInput = tr ? tr.querySelector('input[type="number"]') : null;
    if (priceInput) { priceInput.focus(); priceInput.select(); }
  }, 0);
}

function showBuybackSellerSuggestions(value) {
  const menu = document.getElementById('buybackSellerMenu');
  if (!menu) return;

  const q = String(value || '')
    .trim()
    .toLowerCase();

  const matches = buybackState.customers
    .filter(c =>
      !q ||
      String(c.customer_name || '')
        .toLowerCase()
        .includes(q)
    )
    .slice(0, 12);

  if (!matches.length) {
    menu.classList.add('hidden');
    return;
  }

  menu.innerHTML = matches.map(c => `
    <div class="suggest-item"
         onmousedown="pickBuybackSeller('${jsString(c.customer_name)}')">
      <div class="suggest-main">
        ${escapeHtml(c.customer_name)}
      </div>
    </div>
  `).join('');

  menu.classList.remove('hidden');
}


function pickBuybackSeller(name) {
  const input = document.getElementById('buybackSeller');
  const menu = document.getElementById('buybackSellerMenu');

  if (input) {
    input.value = name;
  }

  if (menu) {
    menu.classList.add('hidden');
  }
}

function setBuybackPrice(id, value) {
  const row = getBuybackRow(id);
  if (!row) return;

  row.buyback_price = value;

  const price =
    value === '' ? null : Number(value);

  const resaleMargin =
    row.vehicle_id && price !== null && Number.isFinite(price)
      ? Number(row.sale_price || 0) - price
      : null;

  const exportMargin =
    row.vehicle_id && price !== null && Number.isFinite(price)
      ? Number(row.import_cost || 0) - price
      : null;

  const resaleEl =
    document.getElementById('buyback-resale-margin-' + id);

  const exportEl =
    document.getElementById('buyback-export-margin-' + id);

  if (resaleEl) {
    resaleEl.innerHTML = renderBuybackMargin(resaleMargin);
  }

  if (exportEl) {
    exportEl.innerHTML = renderBuybackMargin(exportMargin);
  }

  updateBuybackSummary();
}

function buybackPriceKeydown(event, id) {
  if (event.key !== 'Enter') return;
  event.preventDefault();

  const idx = buybackState.rows.findIndex(r => r.id === id);
  if (idx === buybackState.rows.length - 1) {
    const seller = document.getElementById('buybackSeller')?.value || '';
    const notes = document.getElementById('buybackNotes')?.value || '';

    addBuybackRow();

    if (document.getElementById('buybackSeller')) document.getElementById('buybackSeller').value = seller;
    if (document.getElementById('buybackNotes')) document.getElementById('buybackNotes').value = notes;

    setTimeout(() => {
      const next = buybackState.rows[buybackState.rows.length - 1];
      document.getElementById('buyback-vehicle-' + next.id)?.focus();
    }, 0);
  }
}

function updateBuybackSummary() {
  const valid = buybackState.rows.filter(r => r.vehicle_id);

  const totalPaid = valid.reduce((sum, row) => {
    const value = Number(row.buyback_price);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  setText('buybackVehicleCount', valid.length);
  setText('buybackTotalPaid', money(totalPaid));

  const btn = document.getElementById('completeBuybackBtn');
  if (btn) btn.disabled = !valid.length;
}

function completeBuyback() {
  const seller = document.getElementById('buybackSeller')?.value.trim() || '';
  const notes = document.getElementById('buybackNotes')?.value.trim() || '';
  const message = document.getElementById('buybackMessage');
  const btn = document.getElementById('completeBuybackBtn');

  if (!seller) return buybackError('Enter the seller name.');

  const rows = buybackState.rows.filter(r => r.vehicle_id || String(r.vehicle_name || '').trim());
  if (!rows.length) return buybackError('Add at least one vehicle.');

  for (let i = 0; i < rows.length; i++) {
    if (!rows[i].vehicle_id) return buybackError('Row ' + (i + 1) + ': select a vehicle from the suggestions.');

    const price = Number(rows[i].buyback_price);
    if (!Number.isFinite(price) || price < 0) {
      return buybackError('Row ' + (i + 1) + ': enter a valid buyback price.');
    }
  }

  btn.disabled = true;
  btn.textContent = 'BUYING…';

  if (message) {
    message.className = 'sale-message muted';
    message.textContent = 'Writing buyback batch and adding vehicles to stock…';
  }

  google.script.run
    .withSuccessHandler(result => {
      google.script.run
        .withSuccessHandler(data => {
          buybackState.vehicles = Array.isArray(data.vehicles) ? data.vehicles : [];
          buybackState.rows = [];
          buybackState.nextId = 1;
          addBuybackRow(false);
          renderBuybacks();

          const msg = document.getElementById('buybackMessage');
          if (msg) {
            msg.className = 'sale-message good';
            msg.textContent =
              '✓ Batch ' + String(result.batch_id || '') + ' completed · ' +
              number(result.vehicle_count || 0) + ' vehicle' +
              (Number(result.vehicle_count || 0) === 1 ? '' : 's') +
              ' · ' + money(result.total_cost || 0) +
              ' paid to ' + String(result.seller_name || seller) + '.';
          }
        })
        .withFailureHandler(handleServerError)
        .getBuybackVehicleData(state.token);
    })
    .withFailureHandler(error => {
      btn.disabled = false;
      btn.textContent = 'COMPLETE BUYBACK';
      buybackError(cleanError(error));
    })
    .submitBuybackBatch(state.token, {
      seller_name: seller,
      notes: notes,
      rows: rows.map(r => ({
        vehicle_id: r.vehicle_id,
        buyback_price: Number(r.buyback_price)
      }))
    });
}

function buybackError(text) {
  const el = document.getElementById('buybackMessage');
  if (el) {
    el.className = 'sale-message bad';
    el.textContent = text;
  }
}

function getBuybackRow(id) {
  return buybackState.rows.find(r => r.id === id);
}

// ---------- EXPORTS V1 ----------
const exportState = {
  vehicles: [],
  rows: [],
  nextId: 1
};

function loadExports() {
  showPageLoader(true);

  google.script.run
    .withSuccessHandler(data => {
      showPageLoader(false);
      exportState.vehicles = Array.isArray(data.vehicles) ? data.vehicles : [];
      exportState.rows = [];
      exportState.nextId = 1;
      addExportRow(false);
      renderExports();
    })
    .withFailureHandler(handleServerError)
    .getExportVehicleData(state.token);
}

function renderExports() {
  document.getElementById('content').innerHTML = `
    <div class="sell-toolbar">
      <div class="sell-toolbar-copy">
        <h1>Export Vehicles</h1>
        <p>
          Stock exports only · Export value is locked to the server catalogue ·
          ${escapeHtml(state.user.employee_name)} will be credited automatically.
        </p>
      </div>

      <button class="add-row-btn" onclick="addExportRow()">＋ ADD ROW</button>
    </div>

    <div class="sales-table-wrap">
      <table class="sales-table" style="min-width:1100px">
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Qty</th>
            <th>Export Value Each</th>
            <th>PDM Sale Price</th>
            <th>Stock Before</th>
            <th>Stock After</th>
            <th>Line Total</th>
            <th></th>
          </tr>
        </thead>

        <tbody id="exportRows"></tbody>
      </table>
    </div>

    <div class="batch-summary">
      <div class="batch-stat">
        <span>Export Lines</span>
        <strong id="exportLineCount">0</strong>
      </div>

      <div class="batch-stat">
        <span>Vehicles</span>
        <strong id="exportVehicleCount">0</strong>
      </div>

      <div class="batch-stat">
        <span>Total Export Value</span>
        <strong id="exportTotalValue">$0</strong>
      </div>

      <div class="batch-stat">
        <span>Origin</span>
        <strong>STOCK</strong>
      </div>
    </div>

    <div class="card" style="margin-top:18px">
      <div class="section-title">Notes</div>
      <textarea id="exportNotes"
                class="sales-input"
                style="width:100%;min-height:82px;resize:vertical"
                placeholder="Optional notes for this export batch."></textarea>
    </div>

    <div class="batch-footer">
      <div id="exportMessage" class="sale-message muted">
        Only models currently in dealership stock are available.
      </div>

      <button id="completeExportsBtn"
              class="complete-sales-btn"
              onclick="completeExports()">
        COMPLETE EXPORT
      </button>
    </div>

    ${bottomBrand()}
  `;

  renderExportRows();
}

function addExportRow(render = true) {
  exportState.rows.push({
    id: exportState.nextId++,
    vehicle_id: '',
    vehicle_name: '',
    category: '',
    export_value: 0,
    sale_price: 0,
    stock_qty: 0,
    quantity: 1
  });

  if (render && state.currentPage === 'export') {
    renderExportRows();
  }
}

function removeExportRow(id) {
  if (exportState.rows.length === 1) {
    const row = exportState.rows[0];

    exportState.rows[0] = {
      id: row.id,
      vehicle_id: '',
      vehicle_name: '',
      category: '',
      export_value: 0,
      sale_price: 0,
      stock_qty: 0,
      quantity: 1
    };
  } else {
    exportState.rows = exportState.rows.filter(r => r.id !== id);
  }

  renderExportRows();
}

function renderExportRows() {
  const body = document.getElementById('exportRows');
  if (!body) return;

  body.innerHTML = exportState.rows.map(row => {
    const qty = Math.max(1, parseInt(row.quantity || 1, 10));

    const alreadyAllocated = exportQuantityForVehicle(
      row.vehicle_id,
      row.id
    );

    const effectiveBefore =
      Math.max(0, Number(row.stock_qty || 0) - alreadyAllocated);

    const after =
      row.vehicle_id ? effectiveBefore - qty : 0;

    const overStock =
      row.vehicle_id && after < 0;

    const lineTotal =
      Number(row.export_value || 0) * qty;

    return `
      <tr class="sale-entry" data-export-row="${row.id}">
        <td>
          <div class="suggest-wrap">
            <input class="sales-input"
                   id="export-vehicle-${row.id}"
                   value="${escapeHtml(row.vehicle_name)}"
                   placeholder="Search vehicles currently in stock"
                   autocomplete="off"
                   oninput="exportVehicleInput(${row.id}, this.value)"
                   onfocus="showExportVehicleSuggestions(${row.id})">

            <div id="export-vehicle-menu-${row.id}"
                 class="suggest-menu hidden"></div>
          </div>

          <div class="sale-price-note">
            ${row.vehicle_id ? escapeHtml(row.category || '') : ''}
          </div>
        </td>

        <td>
          <input class="sales-input"
                 type="number"
                 min="1"
                 step="1"
                 value="${qty}"
                 oninput="setExportQuantity(${row.id}, this.value)"
                 onkeydown="exportQuantityKeydown(event, ${row.id})">
        </td>

        <td>
          <div class="row-money">
            ${row.vehicle_id ? money(row.export_value) : '—'}
          </div>
        </td>

        <td>
          <div class="row-money">
            ${row.vehicle_id ? money(row.sale_price) : '—'}
          </div>
        </td>

        <td>
          <span class="stock-pill">
            ${row.vehicle_id ? effectiveBefore : '—'}
          </span>
        </td>

        <td>
          ${row.vehicle_id
            ? `<span class="${overStock ? 'deleted-chip' : 'stock-pill'}">
                 ${after}
               </span>`
            : `<span class="muted">—</span>`}
        </td>

        <td>
          <div class="row-money">
            ${row.vehicle_id ? money(lineTotal) : '—'}
          </div>
        </td>

        <td>
          <button class="remove-row"
                  onclick="removeExportRow(${row.id})"
                  title="Remove row">×</button>
        </td>
      </tr>
    `;
  }).join('');

  updateExportSummary();
}

function exportVehicleInput(id, value) {
  const row = getExportRow(id);
  if (!row) return;

  if (value !== row.vehicle_name) {
    row.vehicle_id = '';
    row.vehicle_name = value;
    row.category = '';
    row.export_value = 0;
    row.sale_price = 0;
    row.stock_qty = 0;
  }

  showExportVehicleSuggestions(id, value);
}

function showExportVehicleSuggestions(id, forcedValue) {
  const input = document.getElementById('export-vehicle-' + id);
  const menu = document.getElementById('export-vehicle-menu-' + id);

  if (!input || !menu) return;

  const q = String(
    forcedValue !== undefined ? forcedValue : input.value
  ).trim().toLowerCase();

  const matches = exportState.vehicles
    .filter(v =>
      !q ||
      String(v.display_name || '').toLowerCase().includes(q) ||
      String(v.category || '').toLowerCase().includes(q)
    )
    .slice(0, 12);

  if (!matches.length) {
    menu.innerHTML = `
      <div class="suggest-item">
        <div class="suggest-main muted">No matching in-stock vehicles</div>
      </div>
    `;
    menu.classList.remove('hidden');
    return;
  }

  menu.innerHTML = matches.map(v => `
    <div class="suggest-item"
         onmousedown="pickExportVehicle(${id}, '${jsString(v.vehicle_id)}')">

      <div class="suggest-main">
        ${escapeHtml(v.display_name)}
      </div>

      <div class="suggest-sub">
        <span>${escapeHtml(v.category || '')}</span>
        <span>
          ${number(v.stock_qty || 0)} in stock ·
          Export ${money(v.export_value)} ·
          PDM ${money(v.sale_price)}
        </span>
      </div>
    </div>
  `).join('');

  menu.classList.remove('hidden');
}

function pickExportVehicle(id, vehicleId) {
  const row = getExportRow(id);

  const vehicle = exportState.vehicles.find(
    v => String(v.vehicle_id) === String(vehicleId)
  );

  if (!row || !vehicle) return;

  row.vehicle_id = vehicle.vehicle_id;
  row.vehicle_name = vehicle.display_name;
  row.category = vehicle.category || '';
  row.export_value = Number(vehicle.export_value || 0);
  row.sale_price = Number(vehicle.sale_price || 0);
  row.stock_qty = Number(vehicle.stock_qty || 0);

  renderExportRows();

  setTimeout(() => {
    const tr = document.querySelector(`[data-export-row="${id}"]`);
    const qtyInput = tr ? tr.querySelector('input[type="number"]') : null;

    if (qtyInput) {
      qtyInput.focus();
      qtyInput.select();
    }
  }, 0);
}

function setExportQuantity(id, value) {
  const row = getExportRow(id);
  if (!row) return;

  const parsed = parseInt(value, 10);
  row.quantity =
    Number.isFinite(parsed) && parsed > 0 ? parsed : 1;

  renderExportRows();
}

function exportQuantityKeydown(event, id) {
  if (event.key !== 'Enter') return;

  event.preventDefault();

  const idx =
    exportState.rows.findIndex(r => r.id === id);

  if (idx === exportState.rows.length - 1) {
    const notes =
      document.getElementById('exportNotes')?.value || '';

    addExportRow();

    const notesEl =
      document.getElementById('exportNotes');

    if (notesEl) notesEl.value = notes;

    setTimeout(() => {
      const next =
        exportState.rows[exportState.rows.length - 1];

      document
        .getElementById('export-vehicle-' + next.id)
        ?.focus();
    }, 0);
  }
}

function exportQuantityForVehicle(vehicleId, excludingRowId) {
  if (!vehicleId) return 0;

  return exportState.rows
    .filter(r =>
      r.id !== excludingRowId &&
      String(r.vehicle_id) === String(vehicleId)
    )
    .reduce(
      (sum, r) =>
        sum + Math.max(1, parseInt(r.quantity || 1, 10)),
      0
    );
}

function updateExportSummary() {
  const valid =
    exportState.rows.filter(r => r.vehicle_id);

  const vehicleCount =
    valid.reduce(
      (sum, r) =>
        sum + Math.max(1, parseInt(r.quantity || 1, 10)),
      0
    );

  const totalValue =
    valid.reduce(
      (sum, r) =>
        sum +
        Number(r.export_value || 0) *
        Math.max(1, parseInt(r.quantity || 1, 10)),
      0
    );

  setText('exportLineCount', valid.length);
  setText('exportVehicleCount', vehicleCount);
  setText('exportTotalValue', money(totalValue));

  const btn =
    document.getElementById('completeExportsBtn');

  if (btn) btn.disabled = !valid.length;
}

function completeExports() {
  const notes =
    document.getElementById('exportNotes')?.value.trim() || '';

  const message =
    document.getElementById('exportMessage');

  const btn =
    document.getElementById('completeExportsBtn');

  const rows = exportState.rows.filter(
    r =>
      r.vehicle_id ||
      String(r.vehicle_name || '').trim()
  );

  if (!rows.length) {
    return exportError('Add at least one vehicle.');
  }

  const requestedByVehicle = {};

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    if (!row.vehicle_id) {
      return exportError(
        'Row ' + (i + 1) +
        ': select a vehicle from the suggestions.'
      );
    }

    const qty = Number(row.quantity);

    if (!Number.isInteger(qty) || qty < 1) {
      return exportError(
        'Row ' + (i + 1) +
        ': quantity must be a whole number of at least 1.'
      );
    }

    requestedByVehicle[row.vehicle_id] =
      Number(requestedByVehicle[row.vehicle_id] || 0) + qty;
  }

  for (const vehicleId in requestedByVehicle) {
    const vehicle =
      exportState.vehicles.find(
        v => String(v.vehicle_id) === String(vehicleId)
      );

    if (!vehicle) continue;

    if (requestedByVehicle[vehicleId] > Number(vehicle.stock_qty || 0)) {
      return exportError(
        vehicle.display_name +
        ': trying to export ' +
        requestedByVehicle[vehicleId] +
        ' but only ' +
        Number(vehicle.stock_qty || 0) +
        ' currently in stock.'
      );
    }
  }

  btn.disabled = true;
  btn.textContent = 'EXPORTING…';

  if (message) {
    message.className = 'sale-message muted';
    message.textContent =
      'Writing export batch and removing vehicles from stock…';
  }

  google.script.run
    .withSuccessHandler(result => {
      google.script.run
        .withSuccessHandler(data => {
          exportState.vehicles =
            Array.isArray(data.vehicles) ? data.vehicles : [];

          exportState.rows = [];
          exportState.nextId = 1;

          addExportRow(false);
          renderExports();

          const msg =
            document.getElementById('exportMessage');

          if (msg) {
            msg.className = 'sale-message good';
            msg.textContent =
              '✓ Batch ' +
              String(result.batch_id || '') +
              ' completed · ' +
              number(result.vehicle_count || 0) +
              ' vehicle' +
              (Number(result.vehicle_count || 0) === 1 ? '' : 's') +
              ' · ' +
              money(result.total_value || 0) +
              ' exported.';
          }
        })
        .withFailureHandler(handleServerError)
        .getExportVehicleData(state.token);
    })
    .withFailureHandler(error => {
      btn.disabled = false;
      btn.textContent = 'COMPLETE EXPORT';
      exportError(cleanError(error));
    })
    .submitExportBatch(state.token, {
      notes: notes,
      rows: rows.map(r => ({
        vehicle_id: r.vehicle_id,
        quantity: Number(r.quantity)
      }))
    });
}

function exportError(text) {
  const el =
    document.getElementById('exportMessage');

  if (el) {
    el.className = 'sale-message bad';
    el.textContent = text;
  }
}

function getExportRow(id) {
  return exportState.rows.find(r => r.id === id);
}

/* ============================================================
   STOCK V1 JAVASCRIPT
   ============================================================ */

const stockState = {
  rows: [],
  categories: [],
  summary: {},
  search: '',
  category: 'ALL',
  status: 'IN_STOCK',
  selectedVehicleId: null,
  historyRows: [],
  adjustmentsOnly: false,

  // Used by Dashboard Stock Intelligence deep-links.
  pendingVehicleId: null
};


function loadStockManagement() {
  showPageLoader(true);

  google.script.run
    .withSuccessHandler(data => {
      showPageLoader(false);

      stockState.rows =
        Array.isArray(data.stock) ? data.stock : [];

      stockState.categories =
        Array.isArray(data.categories) ? data.categories : [];

      stockState.summary =
        data.summary || {};

      renderStockManagement();

      if (stockState.pendingVehicleId) {
        const pendingId = stockState.pendingVehicleId;
        stockState.pendingVehicleId = null;

        // Allow the stock table to render first, then open the detail drawer.
        setTimeout(() => {
          openStockVehicle(pendingId);
        }, 0);
      }
    })
    .withFailureHandler(handleServerError)
    .getStockManagementData(state.token);
}


function renderStockManagement() {
  const s = stockState.summary || {};

  document.getElementById('content').innerHTML = `
    <div class="page-title">
      <div>
        <h1>Vehicle Stock</h1>
        <div class="muted" style="margin-top:5px">
          Live inventory derived from the dealership stock ledger.
        </div>
      </div>
    </div>

    <div class="cards">
      ${statCard(
        'Units In Stock',
        number(s.total_units || 0),
        'Physical vehicles',
        '🚗'
      )}

      ${statCard(
        'Models In Stock',
        number(s.models_in_stock || 0),
        'Unique models',
        '◇'
      )}

      ${statCard(
        'Stock Cost Value',
        money(s.import_value || 0),
        'Import / export value',
        '$'
      )}

      ${statCard(
        'Retail Value',
        money(s.retail_value || 0),
        'At current PDM prices',
        '↗'
      )}
    </div>

    ${Number(s.negative_models || 0) > 0
      ? `<div class="stock-warning">
           ⚠ ${number(s.negative_models)} model${Number(s.negative_models) === 1 ? '' : 's'}
           currently have negative ledger stock.
         </div>`
      : ''}

    <div class="stock-toolbar">
      <div class="stock-filter-group">

        <div class="stock-filter" style="min-width:300px">
          <label for="stockSearch">Search</label>
          <input id="stockSearch"
                 class="sales-input"
                 value="${escapeHtml(stockState.search)}"
                 placeholder="Vehicle, make, model or code…"
                 oninput="setStockSearch(this.value)">
        </div>

        <div class="stock-filter">
          <label for="stockCategory">Category</label>
          <select id="stockCategory"
                  class="sales-input"
                  onchange="setStockCategory(this.value)">
            <option value="ALL">All Categories</option>
            ${stockState.categories.map(c => `
              <option value="${escapeHtml(c)}"
                      ${stockState.category === c ? 'selected' : ''}>
                ${escapeHtml(c)}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="stock-filter">
          <label for="stockStatus">Stock</label>
          <select id="stockStatus"
                  class="sales-input"
                  onchange="setStockStatus(this.value)">
            <option value="IN_STOCK"
                    ${stockState.status === 'IN_STOCK' ? 'selected' : ''}>
              In Stock
            </option>
            <option value="ALL"
                    ${stockState.status === 'ALL' ? 'selected' : ''}>
              All Vehicles
            </option>
            <option value="ZERO"
                    ${stockState.status === 'ZERO' ? 'selected' : ''}>
              Zero Stock
            </option>
            <option value="NEGATIVE"
                    ${stockState.status === 'NEGATIVE' ? 'selected' : ''}>
              Negative Stock
            </option>
          </select>
        </div>

      </div>

      <div id="stockResultCount" class="muted"></div>
    </div>

    <div class="card" style="padding:0;overflow:hidden">
      <div class="stock-table-wrap">
        <table class="stock-table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Category</th>
              <th>Stock</th>
              <th>PDM Price</th>
              <th>Suggested Buyback</th>
              <th>Import / Export</th>
              <th>MSRP</th>
              <th>Stock Cost Value</th>
              <th>Retail Value</th>
            </tr>
          </thead>

          <tbody id="stockRows"></tbody>
        </table>
      </div>
    </div>

    ${bottomBrand()}
  `;

  renderStockRows();
}


function renderStockRows() {
  const body = document.getElementById('stockRows');
  if (!body) return;

  const rows = getFilteredStockRows();

  setText(
    'stockResultCount',
    number(rows.length) +
    ' model' +
    (rows.length === 1 ? '' : 's')
  );

  if (!rows.length) {
    body.innerHTML = `
      <tr>
        <td colspan="9"
            class="muted"
            style="text-align:center;padding:34px">
          No vehicles match these filters.
        </td>
      </tr>
    `;
    return;
  }

  body.innerHTML = rows.map(r => {
    const qty = Number(r.stock_qty || 0);

    const qtyClass =
      qty < 0
        ? 'negative'
        : qty === 0
          ? 'zero'
          : '';

    return `
      <tr onclick="openStockVehicle('${jsString(r.vehicle_id)}')">
        <td>
          <div class="stock-name">
            ${escapeHtml(r.display_name || '')}
          </div>

          <div class="stock-sub">
            ${escapeHtml(r.vehicle_code || '')}
          </div>
        </td>

        <td>${escapeHtml(r.category || '')}</td>

        <td>
          <span class="stock-qty ${qtyClass}">
            ${number(qty)}
          </span>
        </td>

        <td class="stock-value">
          ${money(r.sale_price)}
        </td>

        <td class="stock-value">
          ${money(r.suggested_buyback_price)}
        </td>

        <td>
          ${money(r.import_cost)}
        </td>

        <td>
          ${money(r.msrp)}
        </td>

        <td class="stock-value">
          ${money(Math.max(0, qty) * Number(r.import_cost || 0))}
        </td>

        <td class="stock-value">
          ${money(Math.max(0, qty) * Number(r.sale_price || 0))}
        </td>
      </tr>
    `;
  }).join('');
}


function getFilteredStockRows() {
  const q =
    String(stockState.search || '')
      .trim()
      .toLowerCase();

  return stockState.rows.filter(r => {
    if (
      stockState.category !== 'ALL' &&
      String(r.category || '') !== stockState.category
    ) {
      return false;
    }

    const qty = Number(r.stock_qty || 0);

    if (stockState.status === 'IN_STOCK' && qty <= 0) {
      return false;
    }

    if (stockState.status === 'ZERO' && qty !== 0) {
      return false;
    }

    if (stockState.status === 'NEGATIVE' && qty >= 0) {
      return false;
    }

    if (q) {
      const haystack = [
        r.display_name,
        r.vehicle_code,
        r.make,
        r.model,
        r.category
      ]
        .map(v => String(v || '').toLowerCase())
        .join(' ');

      if (!haystack.includes(q)) {
        return false;
      }
    }

    return true;
  });
}


function setStockSearch(value) {
  stockState.search = value || '';
  renderStockRows();
}


function setStockCategory(value) {
  stockState.category = value || 'ALL';
  renderStockRows();
}


function setStockStatus(value) {
  stockState.status = value || 'IN_STOCK';
  renderStockRows();
}


function openStockVehicle(vehicleId) {
  const vehicle =
    stockState.rows.find(
      r => String(r.vehicle_id) === String(vehicleId)
    );

  if (!vehicle) return;

  stockState.selectedVehicleId = vehicle.vehicle_id;
  stockState.historyRows = [];
  stockState.adjustmentsOnly = false;

  const canAdjust = !!(
    state.user && (
      String(state.user.role || '').toUpperCase() === 'OWNER' ||
      String(state.user.role || '').toUpperCase() === 'MANAGER' ||
      (
        state.user.permissions &&
        state.user.permissions.can_manage_stock === true
      )
    )
  );

  const existing =
    document.getElementById('stockVehicleDrawer');

  if (existing) existing.remove();

  const backdrop = document.createElement('div');
  backdrop.id = 'stockVehicleDrawer';
  backdrop.className = 'stock-drawer-backdrop';

  backdrop.innerHTML = `
    <div class="stock-drawer">
      <div class="stock-drawer-head">
        <div>
          <h2>${escapeHtml(vehicle.display_name || '')}</h2>
          <div class="muted" style="margin-top:5px">
            ${escapeHtml(vehicle.category || '')}
            ${vehicle.vehicle_code
              ? ' · ' + escapeHtml(vehicle.vehicle_code)
              : ''}
          </div>
        </div>

        <button class="stock-close"
                onclick="closeStockVehicle()"
                aria-label="Close">×</button>
      </div>

      <div class="stock-detail-grid">
        ${stockDetailMetric(
          'Current Stock',
          number(vehicle.stock_qty || 0)
        )}

        ${stockDetailMetric(
          'PDM Sale Price',
          money(vehicle.sale_price)
        )}

        ${stockDetailMetric(
          'Suggested Buyback',
          money(vehicle.suggested_buyback_price)
        )}

        ${stockDetailMetric(
          'Import / Export',
          money(vehicle.import_cost)
        )}

        ${stockDetailMetric(
          'MSRP',
          money(vehicle.msrp)
        )}

        ${stockDetailMetric(
          'Stock Cost Value',
          money(
            Math.max(0, Number(vehicle.stock_qty || 0)) *
            Number(vehicle.import_cost || 0)
          )
        )}

        ${stockDetailMetric(
          'Retail Stock Value',
          money(
            Math.max(0, Number(vehicle.stock_qty || 0)) *
            Number(vehicle.sale_price || 0)
          )
        )}
      </div>

      ${canAdjust ? `
        <div class="stock-adjust-box">
          <div class="stock-adjust-title">
            Physical Stock Reconciliation
          </div>

          <div class="muted" style="margin:5px 0 14px">
            Enter the number of vehicles physically present.
            The ledger adjustment is calculated automatically.
          </div>

          <div class="stock-adjust-grid">
            <div>
              <label class="sales-label">Ledger Stock</label>
              <input class="sales-input"
                     value="${number(vehicle.stock_qty || 0)}"
                     disabled>
            </div>

            <div>
              <label class="sales-label"
                     for="stockPhysicalCount">
                Actual Physical Stock
              </label>

              <input id="stockPhysicalCount"
                     class="sales-input"
                     type="number"
                     min="0"
                     step="1"
                     inputmode="numeric"
                     placeholder="Enter physical count"
                     oninput="previewStockAdjustment()">
            </div>
          </div>

          <div id="stockAdjustmentPreview"
               class="stock-adjust-preview muted">
            Enter the physical count to calculate the adjustment.
          </div>

          <div style="margin-top:12px">
            <label class="sales-label"
                   for="stockAdjustmentReason">
              Reason
            </label>

            <textarea id="stockAdjustmentReason"
                      class="sales-input"
                      style="width:100%;min-height:78px;resize:vertical"
                      placeholder="e.g. Stocktake discrepancy…"></textarea>
          </div>

          <div id="stockAdjustmentError"
               class="sale-message bad"></div>

          <div class="stock-adjust-actions">
            <button class="add-row-btn"
                    onclick="prepareStockAdjustment()">
              APPLY ADJUSTMENT
            </button>
          </div>

          <div class="stock-sub" style="margin-top:9px">
            This creates a permanent ADJUSTMENT movement.
            Existing transactions are not edited.
          </div>
        </div>
      ` : ''}

      <div class="section-title">Stock History</div>

      <label class="stock-adjustments-toggle">
        <input type="checkbox"
               id="stockAdjustmentsOnly"
               onchange="toggleStockAdjustmentsOnly(this.checked)">
        Adjustments only
      </label>

      <div id="stockHistoryBody" class="muted">
        Loading movement history…
      </div>
    </div>
  `;

  backdrop.addEventListener('click', event => {
    if (event.target === backdrop) {
      closeStockVehicle();
    }
  });

  document.body.appendChild(backdrop);

  google.script.run
    .withSuccessHandler(rows => {
      stockState.historyRows =
        Array.isArray(rows) ? rows : [];

      renderStockHistory(
        vehicle,
        getVisibleStockHistory()
      );
    })
    .withFailureHandler(error => {
      const el =
        document.getElementById('stockHistoryBody');

      if (el) {
        el.innerHTML =
          `<div class="sale-message bad">
             ${escapeHtml(cleanError(error))}
           </div>`;
      }
    })
    .getVehicleStockHistory(
      state.token,
      vehicle.vehicle_id
    );
}


function stockDetailMetric(label, value) {
  return `
    <div class="stock-detail-metric">
      <span>${escapeHtml(label)}</span>
      <strong>${value}</strong>
    </div>
  `;
}


function previewStockAdjustment() {
  const vehicle =
    stockState.rows.find(
      r => String(r.vehicle_id) ===
           String(stockState.selectedVehicleId)
    );

  const input =
    document.getElementById('stockPhysicalCount');

  const preview =
    document.getElementById('stockAdjustmentPreview');

  if (!vehicle || !input || !preview) return;

  if (input.value === '') {
    preview.textContent =
      'Enter the physical count to calculate the adjustment.';
    return;
  }

  const newStock = Number(input.value);
  const oldStock = Number(vehicle.stock_qty || 0);

  if (!Number.isInteger(newStock) || newStock < 0) {
    preview.textContent =
      'Enter a whole number of 0 or more.';
    return;
  }

  const diff = newStock - oldStock;

  if (diff === 0) {
    preview.innerHTML =
      '<strong>No adjustment required.</strong> Physical stock already matches the ledger.';
    return;
  }

  preview.innerHTML = `
    Ledger <strong>${number(oldStock)}</strong>
    &nbsp;→&nbsp;
    Physical <strong>${number(newStock)}</strong>
    &nbsp;·&nbsp;
    Adjustment
    <strong class="${diff > 0 ? 'positive' : 'negative'}">
      ${diff > 0 ? '+' : ''}${number(diff)}
    </strong>
  `;
}


function prepareStockAdjustment() {
  const vehicle =
    stockState.rows.find(
      r => String(r.vehicle_id) ===
           String(stockState.selectedVehicleId)
    );

  const countInput =
    document.getElementById('stockPhysicalCount');

  const reasonInput =
    document.getElementById('stockAdjustmentReason');

  const err =
    document.getElementById('stockAdjustmentError');

  if (!vehicle || !countInput || !reasonInput) return;

  if (err) err.textContent = '';

  if (countInput.value === '') {
    if (err) {
      err.textContent =
        'Enter the actual physical stock count.';
    }
    return;
  }

  const newStock = Number(countInput.value);
  const oldStock = Number(vehicle.stock_qty || 0);
  const diff = newStock - oldStock;
  const reason = reasonInput.value.trim();

  if (!Number.isInteger(newStock) || newStock < 0) {
    if (err) {
      err.textContent =
        'Physical stock must be a whole number of 0 or more.';
    }
    return;
  }

  if (diff === 0) {
    if (err) {
      err.textContent =
        'No adjustment is required.';
    }
    return;
  }

  if (!reason) {
    if (err) {
      err.textContent =
        'Please enter a reason for this adjustment.';
    }
    return;
  }

  const sign = diff > 0 ? '+' : '';

  if (!confirm(
    `${vehicle.display_name}

Current ledger stock: ${oldStock}
New physical stock: ${newStock}
Adjustment: ${sign}${diff}

Reason: ${reason}

Create this permanent stock adjustment?`
  )) {
    return;
  }

  showPageLoader(true);

  google.script.run
    .withSuccessHandler(() => {
      showPageLoader(false);

      closeStockVehicle();

      google.script.run
        .withSuccessHandler(data => {
          stockState.rows =
            Array.isArray(data.stock) ? data.stock : [];

          stockState.categories =
            Array.isArray(data.categories)
              ? data.categories
              : [];

          stockState.summary =
            data.summary || {};

          renderStockManagement();
          openStockVehicle(vehicle.vehicle_id);
        })
        .withFailureHandler(handleServerError)
        .getStockManagementData(state.token);
    })
    .withFailureHandler(error => {
      showPageLoader(false);

      if (err) {
        err.textContent = cleanError(error);
      }
    })
    .adjustVehicleStock(
      state.token,
      vehicle.vehicle_id,
      newStock,
      reason
    );
}


function getVisibleStockHistory() {
  const rows =
    Array.isArray(stockState.historyRows)
      ? stockState.historyRows
      : [];

  if (!stockState.adjustmentsOnly) {
    return rows;
  }

  return rows.filter(
    r =>
      String(r.movement_type || '').toUpperCase() ===
      'ADJUSTMENT'
  );
}


function toggleStockAdjustmentsOnly(value) {
  stockState.adjustmentsOnly =
    value === true;

  const vehicle =
    stockState.rows.find(
      r => String(r.vehicle_id) ===
           String(stockState.selectedVehicleId)
    );

  if (!vehicle) return;

  renderStockHistory(
    vehicle,
    getVisibleStockHistory()
  );
}


function renderStockHistory(vehicle, rows) {
  const el =
    document.getElementById('stockHistoryBody');

  if (!el) return;

  if (!rows.length) {
    el.innerHTML =
      `<div class="muted" style="padding:18px 0">
         No stock movements found for this vehicle.
       </div>`;
    return;
  }

  el.innerHTML = `
    <div style="overflow-x:auto">
      <table class="stock-history">
        <thead>
          <tr>
            <th>Date</th>
            <th>Movement</th>
            <th>Qty</th>
            <th>Employee</th>
            <th>Reason</th>
          </tr>
        </thead>

        <tbody>
          ${rows.map(r => {
            const qty =
              Number(r.quantity_change || 0);

            return `
              <tr>
                <td>
                  ${formatLogDate(r.movement_date)}
                </td>

                <td>
                  ${escapeHtml(
                    prettyStockMovementType(r.movement_type)
                  )}
                </td>

                <td>
                  <span class="stock-movement ${qty >= 0 ? 'positive' : 'negative'}">
                    ${qty > 0 ? '+' : ''}${number(qty)}
                  </span>
                </td>

                <td>
                  ${escapeHtml(r.employee_name || '—')}
                </td>

                <td>
                  <div>${escapeHtml(r.reason || '')}</div>

                  ${r.notes
                    ? `<div class="stock-sub">
                         ${escapeHtml(r.notes)}
                       </div>`
                    : ''}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}


function prettyStockMovementType(value) {
  return String(value || '')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}


function closeStockVehicle() {
  document
    .getElementById('stockVehicleDrawer')
    ?.remove();

  stockState.selectedVehicleId = null;
  stockState.historyRows = [];
  stockState.adjustmentsOnly = false;
}


// ---------- LOGS V1.2 ----------
const logsState = {
  tab: 'sales',
  rows: [],
  search: '',
  showDeleted: false,
  pendingDeleteId: null
};

function loadLogs() {
  showPageLoader(true);

  const runner = google.script.run
    .withSuccessHandler(rows => {
      showPageLoader(false);
      logsState.rows = Array.isArray(rows) ? rows : [];
      renderLogs();
    })
    .withFailureHandler(handleServerError);

  const options = {
    search: logsState.search,
    show_deleted: logsState.showDeleted
  };

  if (logsState.tab === 'imports') {
    runner.getImportsLog(state.token, options);
  } else if (logsState.tab === 'buybacks') {
    runner.getBuybacksLog(state.token, options);
  } else if (logsState.tab === 'exports') {
    runner.getExportsLog(state.token, options);
  } else {
    runner.getSalesLog(state.token, options);
  }
}

function switchLogsTab(tab) {
  if (!['sales','imports','buybacks','exports'].includes(tab)) return;

  logsState.tab = tab;
  logsState.search = '';
  logsState.rows = [];
  loadLogs();
}

function renderLogs() {
  const isSales = logsState.tab === 'sales';
  const isImports = logsState.tab === 'imports';
  const isBuybacks = logsState.tab === 'buybacks';
  const isExports = logsState.tab === 'exports';

  let placeholder = 'Search dealership logs…';

  if (isSales) {
    placeholder = 'Search vehicle, customer, employee, sale ref or batch…';
  } else if (isImports) {
    placeholder = 'Search vehicle, employee, import ref or batch…';
  } else if (isBuybacks) {
    placeholder = 'Search vehicle, seller, employee, destination, buyback ref or batch…';
  } else if (isExports) {
    placeholder = 'Search vehicle, employee, origin, export ref or batch…';
  }

  document.getElementById('content').innerHTML = `
    <div class="page-title">
      <div>
        <h1>Dealership Logs</h1>
        <div class="muted" style="margin-top:5px">
          Transaction history with stock-safe delete and restore.
        </div>
      </div>
    </div>

    <div class="logs-tabs">
      <button class="logs-tab ${isSales ? 'active' : ''}"
              onclick="switchLogsTab('sales')">Sales</button>

      <button class="logs-tab ${isImports ? 'active' : ''}"
              onclick="switchLogsTab('imports')">Imports</button>

      <button class="logs-tab ${isBuybacks ? 'active' : ''}"
              onclick="switchLogsTab('buybacks')">Buybacks</button>

      <button class="logs-tab ${isExports ? 'active' : ''}"
              onclick="switchLogsTab('exports')">Exports</button>
    </div>

    <div class="logs-controls">
      <input id="logsSearch"
             class="logs-search"
             value="${escapeHtml(logsState.search)}"
             placeholder="${placeholder}"
             onkeydown="if(event.key==='Enter') applyLogsFilter()">

      <button class="add-row-btn" onclick="applyLogsFilter()">SEARCH</button>

      <label class="logs-toggle">
        <input id="showDeletedLogs"
               type="checkbox"
               ${logsState.showDeleted ? 'checked' : ''}
               onchange="toggleDeletedLogs(this.checked)">
        Show deleted
      </label>
    </div>

    <div class="logs-table-wrap">
      ${isSales
        ? renderSalesLogTable()
        : isImports
          ? renderImportsLogTable()
          : isBuybacks
            ? renderBuybacksLogTable()
            : renderExportsLogTable()}
    </div>

    ${bottomBrand()}
  `;
}

function renderSalesLogTable() {
  return `
    <table class="logs-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Vehicle</th>
          <th>Customer</th>
          <th>Employee</th>
          <th>Sale</th>
          <th>Cost</th>
          <th>Profit</th>
          <th>Batch / Ref</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${renderSalesLogRows()}</tbody>
    </table>
  `;
}

function renderImportsLogTable() {
  return `
    <table class="logs-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Vehicle</th>
          <th>Qty</th>
          <th>Employee</th>
          <th>Unit Cost</th>
          <th>Total Cost</th>
          <th>Batch / Ref</th>
          <th>Notes</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${renderImportLogRows()}</tbody>
    </table>
  `;
}

function renderBuybacksLogTable() {
  return `
    <table class="logs-table" style="min-width:1450px">
      <thead>
        <tr>
          <th>Date</th>
          <th>Vehicle</th>
          <th>Seller</th>
          <th>Employee</th>
          <th>Buyback</th>
          <th>PDM Sale</th>
          <th>Import / Export</th>
          <th>Destination</th>
          <th>Batch / Ref</th>
          <th>Status</th>
          <th class="logs-action-col">Actions</th>
        </tr>
      </thead>
      <tbody>${renderBuybackLogRows()}</tbody>
    </table>
  `;
}


function renderBuybackLogRows() {
  if (!logsState.rows.length) {
    return `<tr><td colspan="11" class="muted" style="text-align:center;padding:34px">
      No matching buybacks.
    </td></tr>`;
  }

  return logsState.rows.map(r => {
    const deleted = r.is_deleted === true;
    const destination = String(r.destination || '')
      .trim()
      .toUpperCase();
    const isStock = destination === 'STOCK';

    return `
      <tr class="${deleted ? 'deleted-row' : ''}">
        <td>
          <div>${formatLogDate(r.buyback_date)}</div>
          <div class="log-sub">${escapeHtml(r.buyback_ref || '')}</div>
        </td>

        <td>
          <div class="log-vehicle">
            ${escapeHtml(r.vehicle_name || 'Unknown vehicle')}
          </div>
        </td>

        <td>${escapeHtml(r.seller_name || '')}</td>
        <td>${escapeHtml(r.employee_name || '')}</td>
        <td>${money(r.unit_buyback_price)}</td>
        <td>${money(r.pdm_sale_price)}</td>
        <td>${money(r.import_export_value)}</td>

        <td>
          <span class="${isStock ? 'muted' : 'deleted-chip'}">
            ${escapeHtml(destination || '')}
          </span>
        </td>

        <td>
          <div class="log-batch">
            ${escapeHtml(r.buyback_batch_id || 'Legacy')}
          </div>
        </td>

        <td>
          ${deleted
            ? `<span class="deleted-chip">DELETED</span>
               <div class="log-sub">
                 ${escapeHtml(r.deleted_by_name || r.deleted_by || '')}
               </div>
               <div class="log-sub">
                 ${escapeHtml(r.delete_reason || '')}
               </div>`
            : `<span class="muted">Active</span>`}
        </td>

        <td>
          ${!isStock
            ? `<span class="log-sub" title="Direct-export buybacks will be managed when Exports V1 is built.">
                 EXPORT-LINKED
               </span>`
            : deleted
              ? `<button class="log-action log-restore"
                         onclick="restoreBuyback('${jsString(r.buyback_id)}')">
                   RESTORE
                 </button>`
              : `<button class="log-action log-delete"
                         onclick="openDeleteBuyback(
                           '${jsString(r.buyback_id)}',
                           '${jsString(r.vehicle_name || '')}',
                           '${jsString(r.seller_name || '')}'
                         )">
                   DELETE
                 </button>`}
        </td>
      </tr>
    `;
  }).join('');
}

function renderSalesLogRows() {
  if (!logsState.rows.length) {
    return `<tr><td colspan="10" class="muted" style="text-align:center;padding:34px">No matching sales.</td></tr>`;
  }

  return logsState.rows.map(r => {
    const deleted = r.is_deleted === true;
    const profit = Number(r.profit || 0);

    return `
      <tr class="${deleted ? 'deleted-row' : ''}">
        <td>
          <div>${formatLogDate(r.sale_date)}</div>
          <div class="log-sub">${escapeHtml(r.sale_ref || '')}</div>
        </td>
        <td><div class="log-vehicle">${escapeHtml(r.vehicle_name || 'Unknown vehicle')}</div></td>
        <td>${escapeHtml(r.customer_name || '')}</td>
        <td>${escapeHtml(r.employee_name || '')}</td>
        <td>${money(r.total_price)}</td>
        <td>${money(r.unit_import_cost)}</td>
        <td class="log-profit ${profit < 0 ? 'negative' : 'positive'}">${money(profit)}</td>
        <td><div class="log-batch">${escapeHtml(r.sale_batch_id || 'Legacy')}</div></td>
        <td>
          ${deleted
            ? `<span class="deleted-chip">DELETED</span>
               <div class="log-sub">${escapeHtml(r.deleted_by_name || r.deleted_by || '')}</div>
               <div class="log-sub">${escapeHtml(r.delete_reason || '')}</div>`
            : `<span class="muted">Active</span>`}
        </td>
        <td>
          ${deleted
            ? `<button class="log-action log-restore" onclick="restoreSale('${jsString(r.sale_id)}')">RESTORE</button>`
            : `<button class="log-action log-delete"
                       onclick="openDeleteTransaction('sale','${jsString(r.sale_id)}','${jsString(r.vehicle_name || '')}','${jsString(r.customer_name || '')}',${Number(1)})">
                 DELETE
               </button>`}
        </td>
      </tr>
    `;
  }).join('');
}

function renderImportLogRows() {
  if (!logsState.rows.length) {
    return `<tr><td colspan="10" class="muted" style="text-align:center;padding:34px">No matching imports.</td></tr>`;
  }

  return logsState.rows.map(r => {
    const deleted = r.is_deleted === true;
    const qty = Number(r.quantity || 0);

    return `
      <tr class="${deleted ? 'deleted-row' : ''}">
        <td>
          <div>${formatLogDate(r.import_date)}</div>
          <div class="log-sub">${escapeHtml(r.import_ref || '')}</div>
        </td>

        <td>
          <div class="log-vehicle">${escapeHtml(r.vehicle_name || 'Unknown vehicle')}</div>
        </td>

        <td>${number(qty)}</td>
        <td>${escapeHtml(r.employee_name || '')}</td>
        <td>${money(r.unit_cost)}</td>
        <td>${money(r.total_cost)}</td>

        <td>
          <div class="log-batch">${escapeHtml(r.import_batch_id || 'Legacy')}</div>
        </td>

        <td>
          <div class="log-sub">${escapeHtml(r.notes || '')}</div>
        </td>

        <td>
          ${deleted
            ? `<span class="deleted-chip">DELETED</span>
               <div class="log-sub">${escapeHtml(r.deleted_by_name || '')}</div>
               <div class="log-sub">${escapeHtml(r.delete_reason || '')}</div>`
            : `<span class="muted">Active</span>`}
        </td>

        <td>
          ${deleted
            ? `<button class="log-action log-restore"
                       onclick="restoreImport('${jsString(r.import_id)}')">
                 RESTORE
               </button>`
            : `<button class="log-action log-delete"
                       onclick="openDeleteTransaction(
                         'import',
                         '${jsString(r.import_id)}',
                         '${jsString(r.vehicle_name || '')}',
                         '',
                         ${qty}
                       )">
                 DELETE
               </button>`}
        </td>
      </tr>
    `;
  }).join('');
}

function renderExportsLogTable() {
  return `
    <table class="logs-table" style="min-width:1350px">
      <thead>
        <tr>
          <th>Date</th>
          <th>Vehicle</th>
          <th>Qty</th>
          <th>Employee</th>
          <th>Export Value</th>
          <th>PDM Sale</th>
          <th>Total Value</th>
          <th>Origin</th>
          <th>Batch / Ref</th>
          <th>Status</th>
          <th class="logs-action-col">Actions</th>
        </tr>
      </thead>
      <tbody>${renderExportLogRows()}</tbody>
    </table>
  `;
}


function renderExportLogRows() {
  if (!logsState.rows.length) {
    return `<tr>
      <td colspan="11" class="muted" style="text-align:center;padding:34px">
        No matching exports.
      </td>
    </tr>`;
  }

  return logsState.rows.map(r => {
    const deleted = r.is_deleted === true;
    const origin = String(r.export_origin || '').trim().toUpperCase();
    const isStock = origin === 'STOCK';

    return `
      <tr class="${deleted ? 'deleted-row' : ''}">
        <td>
          <div>${formatLogDate(r.export_date)}</div>
          <div class="log-sub">${escapeHtml(r.export_ref || '')}</div>
        </td>

        <td>
          <div class="log-vehicle">
            ${escapeHtml(r.vehicle_name || 'Unknown vehicle')}
          </div>
        </td>

        <td>${number(r.quantity || 0)}</td>
        <td>${escapeHtml(r.employee_name || '')}</td>
        <td>${money(r.unit_export_price)}</td>
        <td>${money(r.pdm_sale_price)}</td>
        <td>${money(r.total_value)}</td>

        <td>
          <span class="${isStock ? 'muted' : 'deleted-chip'}">
            ${escapeHtml(origin || '')}
          </span>
        </td>

        <td>
          <div class="log-batch">
            ${escapeHtml(r.export_batch_id || 'Legacy')}
          </div>
        </td>

        <td>
          ${deleted
            ? `<span class="deleted-chip">DELETED</span>
               <div class="log-sub">
                 ${escapeHtml(r.deleted_by_name || r.deleted_by || '')}
               </div>
               <div class="log-sub">
                 ${escapeHtml(r.delete_reason || '')}
               </div>`
            : `<span class="muted">Active</span>`}
        </td>

        <td>
          ${!isStock
            ? `<span class="log-sub" title="Linked direct-buyback exports will be managed through the linked workflow.">
                 BUYBACK-LINKED
               </span>`
            : deleted
              ? `<button class="log-action log-restore"
                         onclick="restoreExport('${jsString(r.export_id)}')">
                   RESTORE
                 </button>`
              : `<button class="log-action log-delete"
                         onclick="openDeleteExport(
                           '${jsString(r.export_id)}',
                           '${jsString(r.vehicle_name || '')}',
                           ${Number(r.quantity || 0)}
                         )">
                   DELETE
                 </button>`}
        </td>
      </tr>
    `;
  }).join('');
}

function openDeleteExport(exportId, vehicle, quantity) {
  logsState.pendingDeleteId = exportId;

  const qty = Number(quantity || 1);

  const modal = document.createElement('div');
  modal.id = 'deleteExportModal';
  modal.className = 'modal-backdrop';

  modal.innerHTML = `
    <div class="modal-card">
      <h3>Delete Export?</h3>

      <p>
        <strong>${escapeHtml(vehicle)}</strong><br>
        Quantity: ${number(qty)}<br><br>
        This soft delete will return ${number(qty)}
        vehicle${qty === 1 ? '' : 's'} to dealership stock.
        The transaction will remain visible under <strong>Show deleted</strong>.
      </p>

      <textarea id="deleteExportReason"
                placeholder="Reason for deleting this export…"></textarea>

      <div id="deleteExportError" class="sale-message bad"></div>

      <div class="modal-actions">
        <button class="modal-cancel" onclick="closeDeleteExport()">CANCEL</button>

        <button id="confirmDeleteExportBtn"
                class="log-action log-delete"
                onclick="confirmDeleteExport()">
          DELETE EXPORT
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  setTimeout(() => {
    document.getElementById('deleteExportReason')?.focus();
  }, 0);
}


function closeDeleteExport() {
  document.getElementById('deleteExportModal')?.remove();
  logsState.pendingDeleteId = null;
}


function confirmDeleteExport() {
  const reason =
    document.getElementById('deleteExportReason')?.value.trim() || '';

  const err =
    document.getElementById('deleteExportError');

  const btn =
    document.getElementById('confirmDeleteExportBtn');

  if (!reason) {
    if (err) err.textContent = 'Please enter a reason.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'DELETING…';

  google.script.run
    .withSuccessHandler(() => {
      closeDeleteExport();
      loadLogs();
    })
    .withFailureHandler(error => {
      btn.disabled = false;
      btn.textContent = 'DELETE EXPORT';

      if (err) {
        err.textContent = cleanError(error);
      }
    })
    .deleteExportFromLog(
      state.token,
      logsState.pendingDeleteId,
      reason
    );
}


function restoreExport(exportId) {
  if (!confirm(
    'Restore this export? The vehicle quantity will be removed from dealership stock again.'
  )) return;

  showPageLoader(true);

  google.script.run
    .withSuccessHandler(() => {
      showPageLoader(false);
      loadLogs();
    })
    .withFailureHandler(handleServerError)
    .restoreExportFromLog(state.token, exportId);
}

function openDeleteBuyback(buybackId, vehicle, seller) {
  logsState.pendingDeleteId = buybackId;

  const modal = document.createElement('div');
  modal.id = 'deleteBuybackModal';
  modal.className = 'modal-backdrop';

  modal.innerHTML = `
    <div class="modal-card">
      <h3>Delete Buyback?</h3>

      <p>
        <strong>${escapeHtml(vehicle)}</strong><br>
        ${seller ? 'Purchased from ' + escapeHtml(seller) + '<br><br>' : ''}
        This soft delete will remove the bought vehicle from dealership stock.
        The transaction will remain visible under <strong>Show deleted</strong>.
      </p>

      <textarea id="deleteBuybackReason"
                placeholder="Reason for deleting this buyback…"></textarea>

      <div id="deleteBuybackError" class="sale-message bad"></div>

      <div class="modal-actions">
        <button class="modal-cancel" onclick="closeDeleteBuyback()">CANCEL</button>

        <button id="confirmDeleteBuybackBtn"
                class="log-action log-delete"
                onclick="confirmDeleteBuyback()">
          DELETE BUYBACK
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  setTimeout(() => {
    document.getElementById('deleteBuybackReason')?.focus();
  }, 0);
}


function closeDeleteBuyback() {
  document.getElementById('deleteBuybackModal')?.remove();
  logsState.pendingDeleteId = null;
}


function confirmDeleteBuyback() {
  const reason =
    document.getElementById('deleteBuybackReason')?.value.trim() || '';

  const err = document.getElementById('deleteBuybackError');
  const btn = document.getElementById('confirmDeleteBuybackBtn');

  if (!reason) {
    if (err) err.textContent = 'Please enter a reason.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'DELETING…';

  google.script.run
    .withSuccessHandler(() => {
      closeDeleteBuyback();
      loadLogs();
    })
    .withFailureHandler(error => {
      btn.disabled = false;
      btn.textContent = 'DELETE BUYBACK';

      if (err) {
        err.textContent = cleanError(error);
      }
    })
    .deleteBuybackFromLog(
      state.token,
      logsState.pendingDeleteId,
      reason
    );
}


function restoreBuyback(buybackId) {
  if (!confirm(
    'Restore this buyback? The vehicle will be added back into dealership stock.'
  )) return;

  showPageLoader(true);

  google.script.run
    .withSuccessHandler(() => {
      showPageLoader(false);
      loadLogs();
    })
    .withFailureHandler(handleServerError)
    .restoreBuybackFromLog(state.token, buybackId);
}

function applyLogsFilter() {
  const input = document.getElementById('logsSearch');
  logsState.search = input ? input.value.trim() : '';
  loadLogs();
}

function toggleDeletedLogs(value) {
  logsState.showDeleted = value === true;
  loadLogs();
}

function openDeleteTransaction(type, id, vehicle, customer, quantity) {
  logsState.pendingDeleteId = id;

  const isImport = type === 'import';
  const qty = Number(quantity || 1);

  const modal = document.createElement('div');
  modal.id = 'deleteTransactionModal';
  modal.className = 'modal-backdrop';

  modal.innerHTML = `
    <div class="modal-card">
      <h3>Delete ${isImport ? 'Import' : 'Sale'}?</h3>

      <p>
        <strong>${escapeHtml(vehicle)}</strong><br>
        ${isImport
          ? `Quantity: ${number(qty)}<br><br>
             This soft delete will remove ${number(qty)} vehicle${qty === 1 ? '' : 's'} from stock.`
          : `${customer ? 'Sold to ' + escapeHtml(customer) + '<br><br>' : ''}
             This soft delete will return the vehicle to stock.`}
        <br><br>
        The transaction itself remains available under <strong>Show deleted</strong>.
      </p>

      <textarea id="deleteTransactionReason"
                placeholder="Reason for deleting this ${isImport ? 'import' : 'sale'}…"></textarea>

      <div id="deleteTransactionError" class="sale-message bad"></div>

      <div class="modal-actions">
        <button class="modal-cancel" onclick="closeDeleteTransaction()">CANCEL</button>
        <button id="confirmDeleteTransactionBtn"
                class="log-action log-delete"
                onclick="confirmDeleteTransaction('${type}')">
          DELETE ${isImport ? 'IMPORT' : 'SALE'}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  setTimeout(() => document.getElementById('deleteTransactionReason')?.focus(), 0);
}

function closeDeleteTransaction() {
  document.getElementById('deleteTransactionModal')?.remove();
  logsState.pendingDeleteId = null;
}

function confirmDeleteTransaction(type) {
  const reason =
    document.getElementById('deleteTransactionReason')?.value.trim() || '';

  const err = document.getElementById('deleteTransactionError');
  const btn = document.getElementById('confirmDeleteTransactionBtn');

  if (!reason) {
    if (err) err.textContent = 'Please enter a reason.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'DELETING…';

  const runner = google.script.run
    .withSuccessHandler(() => {
      closeDeleteTransaction();
      loadLogs();
    })
    .withFailureHandler(error => {
      btn.disabled = false;
      btn.textContent = 'DELETE';
      if (err) err.textContent = cleanError(error);
    });

  if (type === 'import') {
    runner.deleteImportFromLog(
      state.token,
      logsState.pendingDeleteId,
      reason
    );
  } else {
    runner.deleteSaleFromLog(
      state.token,
      logsState.pendingDeleteId,
      reason
    );
  }
}

function restoreSale(saleId) {
  if (!confirm('Restore this sale? The vehicle will be removed from stock again.')) return;

  showPageLoader(true);

  google.script.run
    .withSuccessHandler(() => {
      showPageLoader(false);
      loadLogs();
    })
    .withFailureHandler(handleServerError)
    .restoreSaleFromLog(state.token, saleId);
}

function restoreImport(importId) {
  if (!confirm('Restore this import? Its vehicle quantity will be added back into stock.')) return;

  showPageLoader(true);

  google.script.run
    .withSuccessHandler(() => {
      showPageLoader(false);
      loadLogs();
    })
    .withFailureHandler(handleServerError)
    .restoreImportFromLog(state.token, importId);
}

function formatLogDate(value) {
  if (!value) return '';

  const d = new Date(value);
  if (isNaN(d)) return '';

  return d.toLocaleString('en-GB', {
    day:'2-digit',
    month:'short',
    year:'numeric',
    hour:'2-digit',
    minute:'2-digit'
  });
}


// ============================================================
// VEHICLE MANAGEMENT V1
// ============================================================

const vehicleManagerState = {
  rows: [],
  categories: [],
  summary: {},
  intelligenceSummary: {},
  search: '',
  category: 'ALL',
  filter: 'ALL',
  selectedVehicleId: null
};


function loadVehicleManagement() {
  showPageLoader(true);

  google.script.run
    .withSuccessHandler(data => {
      vehicleManagerState.rows =
        Array.isArray(data.vehicles) ? data.vehicles : [];

      vehicleManagerState.categories =
        Array.isArray(data.categories) ? data.categories : [];

      vehicleManagerState.summary =
        data.summary || {};

      google.script.run
        .withSuccessHandler(intel => {
          showPageLoader(false);

          const intelRows =
            Array.isArray(intel?.vehicles) ? intel.vehicles : [];

          const intelById = {};
          intelRows.forEach(row => {
            if (row?.vehicle_id) {
              intelById[String(row.vehicle_id)] = row;
            }
          });

          vehicleManagerState.rows =
            vehicleManagerState.rows.map(v => ({
              ...v,
              ...(intelById[String(v.vehicle_id)] || {})
            }));

          vehicleManagerState.intelligenceSummary =
            intel?.summary || {};

          renderVehicleManagement();
        })
        .withFailureHandler(error => {
          showPageLoader(false);
          console.warn('Catalogue intelligence unavailable:', cleanError(error));
          vehicleManagerState.intelligenceSummary = {};
          renderVehicleManagement();
        })
        .getVehicleCatalogueIntelligence(state.token);
    })
    .withFailureHandler(handleServerError)
    .getVehicleManagementData(state.token);
}


function renderVehicleManagement() {
  const s = vehicleManagerState.summary || {};
  const i = vehicleManagerState.intelligenceSummary || {};

  document.getElementById('content').innerHTML = `
    <div class="page-title">
      <div>
        <h1>Vehicle Management</h1>
        <div class="muted" style="margin-top:5px">
          Manage the canonical catalogue, pricing and live catalogue intelligence.
        </div>
      </div>
      <button class="add-row-btn" onclick="openAddVehicle()">+ ADD NEW VEHICLE</button>
    </div>

    <div class="cards">
      <div class="card stat-card vm-health-card" onclick="setVehicleManagerFilter('ACTIVE')">
        <div class="stat-copy"><div class="card-label">Active Catalogue</div><div class="card-value">${number(s.active_vehicles || 0)}</div><div class="card-sub">${number(s.retired_vehicles || 0)} retired</div></div><div class="stat-icon">▤</div>
      </div>

      <div class="card stat-card vm-health-card good" onclick="setVehicleManagerFilter('MISSING_PHOTO')">
        <div class="stat-copy"><div class="card-label">Photo Coverage</div><div class="card-value">${number(i.photo_coverage_percent || 0)}%</div><div class="card-sub">${number(i.missing_photo || 0)} missing</div></div><div class="stat-icon">▣</div>
      </div>

      <div class="card stat-card vm-health-card" onclick="setVehicleManagerFilter('IN_STOCK')">
        <div class="stat-copy"><div class="card-label">In Stock</div><div class="card-value">${number(i.in_stock || 0)}</div><div class="card-sub">${number(i.low_stock || 0)} with one left</div></div><div class="stat-icon">▦</div>
      </div>

      <div class="card stat-card vm-health-card" onclick="setVehicleManagerFilter('NEW_ARRIVAL')">
        <div class="stat-copy"><div class="card-label">New Arrivals</div><div class="card-value">${number(i.new_arrivals || 0)}</div><div class="card-sub">First imported in the last 7 days</div></div><div class="stat-icon">✦</div>
      </div>

      <div class="card stat-card vm-health-card hot" onclick="setVehicleManagerFilter('POPULAR')">
        <div class="stat-copy"><div class="card-label">Popular This Month</div><div class="card-value">${number(i.popular || 0)}</div><div class="card-sub">3+ units sold this month</div></div><div class="stat-icon">↑</div>
      </div>

      <div class="card stat-card vm-health-card warn" onclick="setVehicleManagerFilter('SLOW_MOVER')">
        <div class="stat-copy"><div class="card-label">Slow Movers</div><div class="card-value">${number(i.slow_movers || 0)}</div><div class="card-sub">In stock with no sale for 45+ days</div></div><div class="stat-icon">◷</div>
      </div>

      <div class="card stat-card vm-health-card" onclick="setVehicleManagerFilter('PDM_PICK')">
        <div class="stat-copy"><div class="card-label">PDM Picks</div><div class="card-value">${number(i.pdm_picks || 0)}</div><div class="card-sub">Manual Spotlight selections</div></div><div class="stat-icon">★</div>
      </div>

      <div class="card stat-card vm-health-card ${Number(i.retired_with_stock || 0) > 0 ? 'warn' : 'good'}" onclick="setVehicleManagerFilter('RETIRED_WITH_STOCK')">
        <div class="stat-copy"><div class="card-label">Retired With Stock</div><div class="card-value">${number(i.retired_with_stock || 0)}</div><div class="card-sub">Should normally be zero</div></div><div class="stat-icon">!</div>
      </div>
    </div>

    <div class="vm-toolbar">
      <div class="vm-filters">
        <div class="vm-filter search">
          <label>Search</label>
          <input id="vmSearch" class="sales-input" value="${escapeHtml(vehicleManagerState.search)}" placeholder="Vehicle, make, model or code…" oninput="setVehicleManagerSearch(this.value)">
        </div>

        <div class="vm-filter">
          <label>Category</label>
          <select class="sales-input" onchange="setVehicleManagerCategory(this.value)">
            <option value="ALL">All Categories</option>
            ${vehicleManagerState.categories.map(c => `<option value="${escapeHtml(c)}" ${vehicleManagerState.category === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}
          </select>
        </div>

        <div class="vm-filter">
          <label>Smart View</label>
          <select class="sales-input" onchange="setVehicleManagerFilter(this.value)">
            ${vehicleManagerFilterOptions()}
          </select>
        </div>
      </div>
      <div id="vmCount" class="muted"></div>
    </div>

    <div class="vm-table-wrap">
      <table class="vm-table">
        <thead>
          <tr>
            <th>Photo</th><th>Vehicle</th><th>Category</th><th>Stock</th><th>Signals</th>
            <th>Import / Export</th><th>PDM Price</th><th>Suggested Buyback</th>
            <th>Recent Activity</th><th>Status</th>
          </tr>
        </thead>
        <tbody id="vmRows"></tbody>
      </table>
    </div>

    ${bottomBrand()}
  `;

  renderVehicleManagerRows();
}


function vehicleManagerFilterOptions() {
  const f = vehicleManagerState.filter;

  const options = [
    ['ALL','All Vehicles'], ['ACTIVE','Active'], ['IN_STOCK','In Stock'],
    ['OUT_OF_STOCK','Out of Stock'], ['NEW_ARRIVAL','New Arrivals'],
    ['POPULAR','Popular This Month'], ['SLOW_MOVER','Slow Movers'],
    ['BACK_IN_STOCK','Back In Stock'], ['LOW_STOCK','Low Stock'],
    ['PDM_PICK','PDM Picks'], ['MISSING_PHOTO','Missing Photos'],
    ['RETIRED_WITH_STOCK','Retired With Stock'], ['RETIRED','Retired'],
    ['MISSING_SALE','Missing Sale Price'], ['MISSING_BUYBACK','Missing Buyback'],
    ['PRICING_WARNING','Pricing Warnings']
  ];

  return options.map(([value,label]) =>
    `<option value="${value}" ${f === value ? 'selected' : ''}>${label}</option>`
  ).join('');
}


function renderVehicleManagerRows() {
  const body = document.getElementById('vmRows');
  if (!body) return;

  const rows = getFilteredVehicleManagerRows();

  setText('vmCount', number(rows.length) + ' vehicle' + (rows.length === 1 ? '' : 's'));

  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="10" class="muted" style="text-align:center;padding:34px">No vehicles match these filters.</td></tr>`;
    return;
  }

  body.innerHTML = rows.map(v => {
    const status =
      v.retired
        ? '<span class="vm-status retired">RETIRED</span>'
        : v.active
          ? '<span class="vm-status">ACTIVE</span>'
          : '<span class="vm-status inactive">INACTIVE</span>';

    return `
      <tr onclick="openVehicleEditor('${jsString(v.vehicle_id)}')">
        <td>${vehicleManagerPhotoThumbHtml(v)}</td>
        <td><div class="vm-name">${escapeHtml(v.display_name || '')}</div><div class="vm-code">${escapeHtml(v.vehicle_code || '')}</div></td>
        <td>${escapeHtml(v.category || '')}</td>
        <td>${number(v.stock_qty || 0)}</td>
        <td>${vehicleIntelligenceSignalsHtml(v)}</td>
        <td>${money(v.import_cost)}</td>
        <td>${money(v.sale_price)}</td>
        <td>${money(v.suggested_buyback_price)}</td>
        <td>
          <div>${number(v.units_sold_month || 0)} sold this month</div>
          <div class="vm-intel-meta">${v.last_sale_at ? 'Last sale ' + escapeHtml(relativeIntelDate(v.last_sale_at)) : 'No recorded sale'}</div>
        </td>
        <td>${status}</td>
      </tr>
    `;
  }).join('');
}


function prepareVehiclePhotoCaptureLinks(vehicleId) {
  const primary = document.getElementById('vmCapturePrimary');
  const alt = document.getElementById('vmCaptureAlt');
  const note = document.getElementById('vmPhotoCaptureNote');
  if (!primary || !alt) return;

  [primary, alt].forEach(link => {
    link.classList.add('disabled');
    link.removeAttribute('href');
    link.target = '_blank';
    link.rel = 'noopener';
  });

  if (note) note.textContent = 'Preparing secure photography launchers…';

  google.script.run
    .withSuccessHandler(result => {
      if (!result) return;

      if (result.primary_launcher_url) {
        primary.href = result.primary_launcher_url;
        primary.classList.remove('disabled');
      }

      if (result.alt_launcher_url) {
        alt.href = result.alt_launcher_url;
        alt.classList.remove('disabled');
      }

      if (note) {
        note.textContent =
          'Photography ready. The photo button opens a tiny standalone launcher, ' +
          'then hands the capture to the local PDM Photo Studio.';
      }
    })
    .withFailureHandler(error => {
      const message =
        'Could not prepare photo capture: ' + cleanError(error);

      console.error('PDM PHOTO CAPTURE LINK ERROR:', error);
      if (note) note.textContent = message;

      primary.classList.add('disabled');
      alt.classList.add('disabled');
    })
    .createVehiclePhotoCaptureLinks(state.token, vehicleId);
}

const PDM_VEHICLE_IMAGE_BASE =
  'https://ucvsnxexmvxpccyatmmk.supabase.co/storage/v1/object/public/vehicle-images/';


function vehicleManagerStorageSafePhotoKey(photoKey) {
  return String(photoKey || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x00-\x7F]/g, '');
}


function vehicleManagerPhotoUrl(photoKey, isAlt) {
  const key =
    vehicleManagerStorageSafePhotoKey(photoKey);

  if (!key) return '';

  return PDM_VEHICLE_IMAGE_BASE +
    encodeURIComponent(key) +
    (isAlt ? '_alt.webp' : '.webp') +
    '?pdm_preview=' + Date.now();
}


function vehicleManagerPhotoThumbHtml(v) {
  const key = String(v.photo_key || '').trim();

  if (!key) {
    return `
      <div class="vm-photo-thumb missing">
        NO PHOTO
      </div>
    `;
  }

  const url = vehicleManagerPhotoUrl(key, false);

  return `
    <div class="vm-photo-thumb">
      <img
        src="${escapeHtml(url)}"
        alt="${escapeHtml(v.display_name || 'Vehicle')}"
        loading="lazy"
        onclick="event.stopPropagation();openVehicleEditor('${jsString(v.vehicle_id)}')"
        onerror="
          this.parentElement.classList.add('missing');
          this.parentElement.textContent='PHOTO FILE MISSING';
        ">
    </div>
  `;
}


function vehicleManagerDrawerPhotoHtml(vehicle) {
  const key = String(vehicle.photo_key || '').trim();

  if (!key) {
    return `
      <div class="vm-photo-panel">
        <div class="vm-photo-stage">
          <div class="vm-photo-empty">
            No vehicle photo is mapped yet.
          </div>
        </div>
      </div>
    `;
  }

  const primary =
    vehicleManagerPhotoUrl(key, false);

  const alt =
    vehicleManagerPhotoUrl(key, true);

  return `
    <div class="vm-photo-panel"
         id="vmDrawerPhotoPanel"
         data-photo-index="0"
         data-alt-ready="0">

      <div class="vm-photo-stage">
        <img
          id="vmDrawerPhotoPrimary"
          src="${escapeHtml(primary)}"
          alt="${escapeHtml(vehicle.display_name || 'Vehicle')}"
          onerror="
            this.style.display='none';
            const empty=document.createElement('div');
            empty.className='vm-photo-empty';
            empty.textContent='Mapped photo file could not be loaded.';
            this.parentElement.appendChild(empty);
          ">

        <img
          id="vmDrawerPhotoAlt"
          src="${escapeHtml(alt)}"
          alt="${escapeHtml(vehicle.display_name || 'Vehicle')} alternate"
          style="display:none"
          onload="vehicleManagerAltPhotoLoaded()"
          onerror="this.remove()">

        <div class="vm-photo-nav"
             id="vmDrawerPhotoNav"
             style="display:none">
          <button type="button"
                  class="vm-photo-arrow"
                  onclick="vehicleManagerChangeDrawerPhoto(-1)">‹</button>
          <button type="button"
                  class="vm-photo-arrow"
                  onclick="vehicleManagerChangeDrawerPhoto(1)">›</button>
        </div>
      </div>

      <div class="vm-photo-footer">
        <div class="vm-photo-key">
          Photo key: ${escapeHtml(key)}
        </div>

        <div class="vm-photo-dots"
             id="vmDrawerPhotoDots"
             style="display:none">
          <button type="button"
                  class="vm-photo-dot active"
                  onclick="vehicleManagerSetDrawerPhoto(0)"
                  aria-label="Primary photo"></button>
          <button type="button"
                  class="vm-photo-dot"
                  onclick="vehicleManagerSetDrawerPhoto(1)"
                  aria-label="Alternate photo"></button>
        </div>
      </div>
    </div>
  `;
}


function vehicleManagerAltPhotoLoaded() {
  const panel =
    document.getElementById('vmDrawerPhotoPanel');

  if (!panel) return;

  panel.dataset.altReady = '1';

  const nav =
    document.getElementById('vmDrawerPhotoNav');

  const dots =
    document.getElementById('vmDrawerPhotoDots');

  if (nav) nav.style.display = '';
  if (dots) dots.style.display = '';
}


function vehicleManagerChangeDrawerPhoto() {
  const panel =
    document.getElementById('vmDrawerPhotoPanel');

  if (!panel || panel.dataset.altReady !== '1') {
    return;
  }

  const current =
    Number(panel.dataset.photoIndex || 0);

  vehicleManagerSetDrawerPhoto(
    current === 0 ? 1 : 0
  );
}


function vehicleManagerSetDrawerPhoto(index) {
  const panel =
    document.getElementById('vmDrawerPhotoPanel');

  if (!panel) return;

  if (
    Number(index) === 1 &&
    panel.dataset.altReady !== '1'
  ) {
    return;
  }

  const primary =
    document.getElementById('vmDrawerPhotoPrimary');

  const alt =
    document.getElementById('vmDrawerPhotoAlt');

  const next =
    Number(index) === 1 ? 1 : 0;

  panel.dataset.photoIndex = String(next);

  if (primary) {
    primary.style.display =
      next === 0 ? 'block' : 'none';
  }

  if (alt) {
    alt.style.display =
      next === 1 ? 'block' : 'none';
  }

  document
    .querySelectorAll('#vmDrawerPhotoDots .vm-photo-dot')
    .forEach((dot, dotIndex) => {
      dot.classList.toggle(
        'active',
        dotIndex === next
      );
    });
}


function vehicleIntelligenceSignalsHtml(v) {
  const signals = [];
  if (v.is_pdm_pick) signals.push('<span class="vm-signal pick">★ PDM PICK</span>');
  if (v.is_new_arrival) signals.push('<span class="vm-signal new">✦ NEW</span>');
  if (v.is_popular) signals.push('<span class="vm-signal popular">↑ POPULAR</span>');
  if (v.is_slow_mover) signals.push('<span class="vm-signal slow">◷ SLOW</span>');
  if (v.is_back_in_stock) signals.push('<span class="vm-signal back">↻ BACK IN STOCK</span>');
  if (v.is_low_stock) signals.push('<span class="vm-signal low">1 LEFT</span>');
  if (v.has_photo === false) signals.push('<span class="vm-signal photo">NO PHOTO</span>');
  return signals.length ? `<div class="vm-signal-wrap">${signals.join('')}</div>` : '<span class="muted">—</span>';
}


function relativeIntelDate(value) {
  const d = new Date(value);
  if (isNaN(d)) return '';
  const days = Math.floor(Math.max(0, Date.now() - d.getTime()) / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return d.toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'});
}


function getFilteredVehicleManagerRows() {
  const q =
    String(vehicleManagerState.search || '')
      .trim()
      .toLowerCase();

  return vehicleManagerState.rows.filter(v => {
    if (
      vehicleManagerState.category !== 'ALL' &&
      String(v.category || '') !== vehicleManagerState.category
    ) {
      return false;
    }

    const f = vehicleManagerState.filter;

    if (f === 'ACTIVE' && !(v.active && !v.retired)) {
      return false;
    }

    if (f === 'RETIRED' && !v.retired) {
      return false;
    }

    if (f === 'IN_STOCK' && !(v.active && !v.retired && Number(v.stock_qty || 0) > 0)) return false;
    if (f === 'OUT_OF_STOCK' && !(v.active && !v.retired && Number(v.stock_qty || 0) <= 0)) return false;
    if (f === 'NEW_ARRIVAL' && v.is_new_arrival !== true) return false;
    if (f === 'POPULAR' && v.is_popular !== true) return false;
    if (f === 'SLOW_MOVER' && v.is_slow_mover !== true) return false;
    if (f === 'BACK_IN_STOCK' && v.is_back_in_stock !== true) return false;
    if (f === 'LOW_STOCK' && v.is_low_stock !== true) return false;
    if (f === 'PDM_PICK' && v.is_pdm_pick !== true) return false;
    if (f === 'MISSING_PHOTO' && v.has_photo !== false) return false;
    if (f === 'RETIRED_WITH_STOCK' && !(v.retired === true && Number(v.stock_qty || 0) > 0)) return false;

    if (
      f === 'MISSING_SALE' &&
      !(v.active && !v.retired && Number(v.sale_price || 0) <= 0)
    ) {
      return false;
    }

    if (
      f === 'MISSING_BUYBACK' &&
      !(v.active && !v.retired &&
        Number(v.suggested_buyback_price || 0) <= 0)
    ) {
      return false;
    }

    if (f === 'PRICING_WARNING') {
      const belowImport =
        v.active &&
        !v.retired &&
        Number(v.sale_price || 0) > 0 &&
        Number(v.import_cost || 0) > 0 &&
        Number(v.sale_price || 0) < Number(v.import_cost || 0);

      const buybackAboveSale =
        v.active &&
        !v.retired &&
        Number(v.sale_price || 0) > 0 &&
        Number(v.suggested_buyback_price || 0) >
          Number(v.sale_price || 0);

      if (!belowImport && !buybackAboveSale) {
        return false;
      }
    }

    if (q) {
      const haystack = [
        v.display_name,
        v.vehicle_code,
        v.make,
        v.model,
        v.category
      ].map(x => String(x || '').toLowerCase()).join(' ');

      if (!haystack.includes(q)) {
        return false;
      }
    }

    return true;
  });
}


function setVehicleManagerSearch(value) {
  vehicleManagerState.search = value || '';
  renderVehicleManagerRows();
}


function setVehicleManagerCategory(value) {
  vehicleManagerState.category = value || 'ALL';
  renderVehicleManagerRows();
}


function setVehicleManagerFilter(value) {
  vehicleManagerState.filter = value || 'ALL';
  renderVehicleManagement();
}


function vehiclePublicBuybackRange(value) {
  const n = Number(value || 0);

  if (n <= 0) return null;

  return {
    min: Math.round((n * 0.95) / 500) * 500,
    max: Math.round((n * 1.05) / 500) * 500
  };
}


function openVehicleEditor(vehicleId) {
  const vehicle =
    vehicleManagerState.rows.find(
      v => String(v.vehicle_id) === String(vehicleId)
    );

  if (!vehicle) return;

  vehicleManagerState.selectedVehicleId = vehicle.vehicle_id;

  openVehicleManagerDrawer(
    'edit',
    vehicle
  );
}


function openAddVehicle() {
  vehicleManagerState.selectedVehicleId = null;

  openVehicleManagerDrawer(
    'add',
    {
      vehicle_id: '',
      vehicle_code: 'Generated automatically',
      display_name: '',
      make: '',
      model: '',
      category: '',
      import_cost: 0,
      msrp: 0,
      sale_price: 0,
      suggested_buyback_price: 0,
      active: true,
      retired: false,
      stock_qty: 0
    }
  );
}


function openVehicleManagerDrawer(mode, vehicle) {
  document.getElementById('vehicleManagerDrawer')?.remove();

  const isAdd = mode === 'add';

  const backdrop = document.createElement('div');
  backdrop.id = 'vehicleManagerDrawer';
  backdrop.className = 'vm-drawer-backdrop';

  backdrop.innerHTML = `
    <div class="vm-drawer">
      <div class="vm-drawer-head">
        <div>
          <h2>
            ${isAdd ? 'Add New Vehicle' : escapeHtml(vehicle.display_name || '')}
          </h2>

          <div class="muted" style="margin-top:5px">
            ${isAdd
              ? 'A new canonical catalogue entry'
              : escapeHtml(vehicle.vehicle_code || '')}
          </div>
        </div>

        <button class="stock-close"
                onclick="closeVehicleManagerDrawer()"
                aria-label="Close">×</button>
      </div>

      ${!isAdd ? vehicleManagerDrawerPhotoHtml(vehicle) : ''}

      ${!isAdd ? `
        <div class="vm-photo-capture-actions">
          <a id="vmCapturePrimary"
             class="vm-photo-capture-btn primary disabled"
             href="#">
            📷 PHOTOGRAPH VEHICLE
          </a>

          <a id="vmCaptureAlt"
             class="vm-photo-capture-btn alt disabled"
             href="#">
            📷 CAPTURE ALT PHOTO
          </a>

          <button type="button"
                  class="vm-photo-capture-btn"
                  onclick="loadVehicleManagement();closeVehicleManagerDrawer();">
            ↻ REFRESH PHOTOS
          </button>

          <div id="vmPhotoCaptureNote"
               class="vm-photo-capture-note">
            Preparing secure upload links…
          </div>
        </div>
      ` : ''}

      <div class="vm-form-grid">
        <div class="vm-field full">
          <label>Display Name</label>
          <input id="vmEditDisplayName"
                 class="sales-input"
                 value="${escapeHtml(vehicle.display_name || '')}">
        </div>

        <div class="vm-field">
          <label>Make</label>
          <input id="vmEditMake"
                 class="sales-input"
                 value="${escapeHtml(vehicle.make || '')}">
        </div>

        <div class="vm-field">
          <label>Model</label>
          <input id="vmEditModel"
                 class="sales-input"
                 value="${escapeHtml(vehicle.model || '')}">
        </div>

        <div class="vm-field full">
          <label>Category</label>
          <input id="vmEditCategory"
                 class="sales-input"
                 list="vmCategoryList"
                 value="${escapeHtml(vehicle.category || '')}">
          <datalist id="vmCategoryList">
            ${vehicleManagerState.categories.map(c =>
              `<option value="${escapeHtml(c)}"></option>`
            ).join('')}
          </datalist>
        </div>

        <div class="vm-field">
          <label>Import / Export Value</label>
          <input id="vmEditImportCost"
                 class="sales-input"
                 type="number"
                 min="0"
                 step="1"
                 value="${Number(vehicle.import_cost || 0)}">
        </div>

        <div class="vm-field">
          <label>MSRP</label>
          <input id="vmEditMsrp"
                 class="sales-input"
                 type="number"
                 min="0"
                 step="1"
                 value="${Number(vehicle.msrp || 0)}">
        </div>

        <div class="vm-field">
          <label>PDM Sale Price</label>
          <input id="vmEditSalePrice"
                 class="sales-input"
                 type="number"
                 min="0"
                 step="1"
                 value="${Number(vehicle.sale_price || 0)}">
        </div>

        <div class="vm-field">
          <label>Suggested Buyback</label>
          <input id="vmEditBuyback"
                 class="sales-input"
                 type="number"
                 min="0"
                 step="1"
                 value="${Number(vehicle.suggested_buyback_price || 0)}"
                 oninput="refreshVehiclePublicPreview()">
        </div>
      </div>

      <div id="vmPublicPreview"
           class="vm-preview">
        ${vehiclePublicPreviewHtml(vehicle.suggested_buyback_price)}
      </div>

      <div class="vm-checkboxes">
        <label>
          <input id="vmEditActive"
                 type="checkbox"
                 ${vehicle.active ? 'checked' : ''}
                 onchange="vehicleStatusCheckboxChanged('active')">
          Active
        </label>

        <label>
          <input id="vmEditRetired"
                 type="checkbox"
                 ${vehicle.retired ? 'checked' : ''}
                 onchange="vehicleStatusCheckboxChanged('retired')">
          Retired
        </label>

        ${!isAdd
          ? `<span class="muted">Current stock: ${number(vehicle.stock_qty || 0)}</span>`
          : ''}
      </div>

      <div class="vm-field full">
        <label>Reason</label>
        <textarea id="vmEditReason"
                  class="sales-input"
                  style="width:100%;min-height:90px;resize:vertical"
                  placeholder="${isAdd
                    ? 'Why is this vehicle being added?'
                    : 'Reason for this catalogue / pricing change…'}"></textarea>
      </div>

      <div id="vmEditError"
           class="sale-message bad"></div>

      <div class="vm-actions">
        <button class="modal-cancel"
                onclick="closeVehicleManagerDrawer()">
          CANCEL
        </button>

        <button id="vmSaveButton"
                class="add-row-btn"
                onclick="${isAdd
                  ? 'submitNewVehicle()'
                  : `submitVehicleUpdate('${jsString(vehicle.vehicle_id)}')`}">
          ${isAdd ? 'ADD VEHICLE' : 'SAVE CHANGES'}
        </button>
      </div>

      ${!isAdd ? `
        <div class="vm-history">
          <div class="section-title">Change History</div>
          <div id="vmHistoryBody" class="muted">
            Loading change history…
          </div>
        </div>
      ` : ''}
    </div>
  `;

  backdrop.addEventListener('click', event => {
    if (event.target === backdrop) {
      closeVehicleManagerDrawer();
    }
  });

  document.body.appendChild(backdrop);

  if (!isAdd) {
    // Prepare the one-time local photo-capture protocol links only after
    // the Vehicle Management drawer and its buttons exist in the DOM.
    prepareVehiclePhotoCaptureLinks(
      vehicle.vehicle_id
    );

    google.script.run
      .withSuccessHandler(rows => {
        renderVehicleChangeHistory(
          Array.isArray(rows) ? rows : []
        );
      })
      .withFailureHandler(error => {
        const el = document.getElementById('vmHistoryBody');
        if (el) {
          el.innerHTML =
            `<div class="sale-message bad">${escapeHtml(cleanError(error))}</div>`;
        }
      })
      .getVehicleCatalogueChanges(
        state.token,
        vehicle.vehicle_id
      );
  }
}


function vehicleStatusCheckboxChanged(which) {
  const active = document.getElementById('vmEditActive');
  const retired = document.getElementById('vmEditRetired');

  if (!active || !retired) return;

  if (which === 'retired' && retired.checked) {
    active.checked = false;
  }

  if (which === 'active' && active.checked) {
    retired.checked = false;
  }
}


function refreshVehiclePublicPreview() {
  const input = document.getElementById('vmEditBuyback');
  const box = document.getElementById('vmPublicPreview');

  if (!input || !box) return;

  box.innerHTML =
    vehiclePublicPreviewHtml(
      Number(input.value || 0)
    );
}


function vehiclePublicPreviewHtml(value) {
  const range = vehiclePublicBuybackRange(value);

  if (!range) {
    return `
      <span>Customer Portal Preview</span>
      <strong>No public buyback guidance</strong>
    `;
  }

  return `
    <span>Customer Portal Preview</span>
    <strong>${money(range.min)} – ${money(range.max)}</strong>
    <div class="muted" style="margin-top:5px;font-size:11px">
      Indicative public range generated from the internal suggested buyback.
    </div>
  `;
}


function collectVehicleManagerPayload(isAdd) {
  const displayName =
    document.getElementById('vmEditDisplayName')?.value.trim() || '';

  const make =
    document.getElementById('vmEditMake')?.value.trim() || '';

  const model =
    document.getElementById('vmEditModel')?.value.trim() || '';

  const category =
    document.getElementById('vmEditCategory')?.value.trim() || '';

  const importCost =
    Number(document.getElementById('vmEditImportCost')?.value || 0);

  const msrp =
    Number(document.getElementById('vmEditMsrp')?.value || 0);

  const salePrice =
    Number(document.getElementById('vmEditSalePrice')?.value || 0);

  const buyback =
    Number(document.getElementById('vmEditBuyback')?.value || 0);

  const active =
    document.getElementById('vmEditActive')?.checked === true;

  const retired =
    document.getElementById('vmEditRetired')?.checked === true;

  const reason =
    document.getElementById('vmEditReason')?.value.trim() || '';

  if (!displayName) {
    throw new Error('Display name is required.');
  }

  if (!category) {
    throw new Error('Category is required.');
  }

  if (!reason) {
    throw new Error('Please enter a reason.');
  }

  const moneyFields = [
    ['Import / Export value', importCost],
    ['MSRP', msrp],
    ['PDM sale price', salePrice],
    ['Suggested buyback', buyback]
  ];

  for (const [label, value] of moneyFields) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(label + ' must be 0 or more.');
    }
  }

  return {
    display_name: displayName,
    make,
    model,
    category,
    import_cost: importCost,
    msrp,
    sale_price: salePrice,
    suggested_buyback_price: buyback,
    active,
    retired,
    reason
  };
}


function submitNewVehicle() {
  const err = document.getElementById('vmEditError');
  const btn = document.getElementById('vmSaveButton');

  try {
    if (err) err.textContent = '';

    const payload =
      collectVehicleManagerPayload(true);

    const range =
      vehiclePublicBuybackRange(
        payload.suggested_buyback_price
      );

    const confirmText =
      `Add new vehicle?

${payload.display_name}
Category: ${payload.category}
Import / Export: ${money(payload.import_cost)}
MSRP: ${money(payload.msrp)}
PDM Sale: ${money(payload.sale_price)}
Suggested Buyback: ${money(payload.suggested_buyback_price)}
Public Buyback: ${range ? money(range.min) + ' – ' + money(range.max) : 'No guidance'}

Reason: ${payload.reason}`;

    if (!confirm(confirmText)) return;

    btn.disabled = true;
    btn.textContent = 'ADDING…';

    google.script.run
      .withSuccessHandler(result => {
        closeVehicleManagerDrawer();

        const duplicateCount =
          Number(result && result.duplicate_name_count_before_create || 0);

        loadVehicleManagement();

        if (duplicateCount > 0) {
          alert(
            'Vehicle added as ' +
            (result.vehicle_code || '') +
            '.\n\nNote: ' +
            duplicateCount +
            ' vehicle(s) with the same display name already existed.'
          );
        }
      })
      .withFailureHandler(error => {
        btn.disabled = false;
        btn.textContent = 'ADD VEHICLE';

        if (err) {
          err.textContent = cleanError(error);
        }
      })
      .addDealershipVehicle(
        state.token,
        payload
      );

  } catch (error) {
    if (err) {
      err.textContent = cleanError(error);
    }
  }
}


function submitVehicleUpdate(vehicleId) {
  const err = document.getElementById('vmEditError');
  const btn = document.getElementById('vmSaveButton');

  try {
    if (err) err.textContent = '';

    const payload =
      collectVehicleManagerPayload(false);

    const original =
      vehicleManagerState.rows.find(
        v => String(v.vehicle_id) === String(vehicleId)
      );

    const range =
      vehiclePublicBuybackRange(
        payload.suggested_buyback_price
      );

    const importChanged =
      original &&
      Number(original.import_cost || 0) !== Number(payload.import_cost || 0);

    const importWarning = importChanged
      ? `

⚠ IMPORT / EXPORT VALUE CHANGE
${money(original.import_cost)} → ${money(payload.import_cost)}

This updates the canonical current vehicle cost and current stock valuation.
Historical imports, sales, buybacks and exports are not rewritten.`
      : '';

    const confirmText =
      `Save vehicle changes?

${payload.display_name}
${original ? 'Code: ' + original.vehicle_code + '\n' : ''}
Import / Export: ${money(payload.import_cost)}
PDM Sale: ${money(payload.sale_price)}
Suggested Buyback: ${money(payload.suggested_buyback_price)}
Public Buyback: ${range ? money(range.min) + ' – ' + money(range.max) : 'No guidance'}
Status: ${payload.retired ? 'RETIRED' : payload.active ? 'ACTIVE' : 'INACTIVE'}

Reason: ${payload.reason}${importWarning}`;

    if (!confirm(confirmText)) return;

    btn.disabled = true;
    btn.textContent = 'SAVING…';

    google.script.run
      .withSuccessHandler(() => {
        closeVehicleManagerDrawer();
        loadVehicleManagement();
      })
      .withFailureHandler(error => {
        btn.disabled = false;
        btn.textContent = 'SAVE CHANGES';

        if (err) {
          err.textContent = cleanError(error);
        }
      })
      .updateDealershipVehicle(
        state.token,
        vehicleId,
        payload
      );

  } catch (error) {
    if (err) {
      err.textContent = cleanError(error);
    }
  }
}


function renderVehicleChangeHistory(rows) {
  const el = document.getElementById('vmHistoryBody');
  if (!el) return;

  if (!rows.length) {
    el.innerHTML = `
      <div class="muted" style="padding:12px 0">
        No catalogue changes recorded yet.
      </div>
    `;
    return;
  }

  el.innerHTML = rows.map(r => {
    const oldV = r.old_values || {};
    const newV = r.new_values || {};

    const changes = [];

    if (r.action_type === 'CREATE') {
      changes.push('Vehicle created');
    } else {
      vehicleChangeLine_(
        changes,
        'Name',
        oldV.display_name,
        newV.display_name
      );

      vehicleChangeLine_(
        changes,
        'Category',
        oldV.category,
        newV.category
      );

      vehicleChangeMoneyLine_(
        changes,
        'Import / Export',
        oldV.import_cost,
        newV.import_cost
      );

      vehicleChangeMoneyLine_(
        changes,
        'MSRP',
        oldV.msrp,
        newV.msrp
      );

      vehicleChangeMoneyLine_(
        changes,
        'PDM Sale',
        oldV.recommended_sale_price,
        newV.recommended_sale_price
      );

      vehicleChangeMoneyLine_(
        changes,
        'Suggested Buyback',
        oldV.suggested_buyback_price,
        newV.suggested_buyback_price
      );

      vehicleChangeLine_(
        changes,
        'Active',
        oldV.active,
        newV.active
      );

      vehicleChangeLine_(
        changes,
        'Retired',
        oldV.retired,
        newV.retired
      );
    }

    return `
      <div class="vm-history-row">
        <div>
          <strong>${escapeHtml(r.action_type || '')}</strong>
          ${changes.length
            ? ' · ' + escapeHtml(changes.join(' · '))
            : ''}
        </div>

        <div style="margin-top:5px">
          ${escapeHtml(r.reason || '')}
        </div>

        <div class="vm-history-meta">
          ${escapeHtml(r.employee_name || '')}
          · ${formatLogDate(r.created_at)}
        </div>
      </div>
    `;
  }).join('');
}


function vehicleChangeLine_(changes, label, oldValue, newValue) {
  const a = String(oldValue ?? '');
  const b = String(newValue ?? '');

  if (a !== b) {
    changes.push(
      label + ': ' + a + ' → ' + b
    );
  }
}


function vehicleChangeMoneyLine_(changes, label, oldValue, newValue) {
  const a = Number(oldValue || 0);
  const b = Number(newValue || 0);

  if (a !== b) {
    changes.push(
      label + ': ' + money(a) + ' → ' + money(b)
    );
  }
}


function closeVehicleManagerDrawer() {
  document.getElementById('vehicleManagerDrawer')?.remove();
  vehicleManagerState.selectedVehicleId = null;
}


// ============================================================
// ACCOUNTS V1
// ============================================================

const accountsState = {
  range: 'THIS_WEEK',
  start: '',
  end: '',
  data: null
};


function loadAccounts() {
  setAccountsRangeDefaults();

  document.getElementById('content').innerHTML = `
    <div class="page-title">
      <div>
        <h1>Accounts</h1>
        <div class="muted" style="margin-top:5px">
          Realised performance, cash movement and current inventory position.
        </div>
      </div>
    </div>

    <div class="acct-toolbar">
      <div class="acct-range-controls">
        <div class="acct-field">
          <label>Period</label>
          <select id="accountsRange"
                  class="sales-input"
                  onchange="changeAccountsRange(this.value)">
            <option value="TODAY">Today</option>
            <option value="THIS_WEEK" selected>This Week</option>
            <option value="LAST_WEEK">Last Week</option>
            <option value="LAST_7">Last 7 Days</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>

        <div id="accountsCustomStartWrap"
             class="acct-field hidden">
          <label>From</label>
          <input id="accountsCustomStart"
                 class="sales-input"
                 type="date">
        </div>

        <div id="accountsCustomEndWrap"
             class="acct-field hidden">
          <label>To</label>
          <input id="accountsCustomEnd"
                 class="sales-input"
                 type="date">
        </div>

        <button id="accountsApplyCustom"
                class="add-row-btn hidden"
                onclick="applyCustomAccountsRange()">
          APPLY
        </button>
      </div>

      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <button id="accountsPrevWeek"
                class="add-row-btn"
                onclick="shiftAccountsWeek(-1)">
          ‹ PREVIOUS WEEK
        </button>

        <button id="accountsCurrentWeek"
                class="add-row-btn"
                onclick="goAccountsCurrentWeek()">
          THIS WEEK
        </button>

        <button id="accountsNextWeek"
                class="add-row-btn"
                onclick="shiftAccountsWeek(1)">
          NEXT WEEK ›
        </button>

        <div id="accountsPeriodLabel" class="muted"></div>
      </div>
    </div>

    <div id="accountsBody">
      <div class="placeholder">
        <h3>Loading Accounts…</h3>
      </div>
    </div>
  `;

  fetchAccounts();
}


function setAccountsRangeDefaults() {
  if (!accountsState.range) {
    accountsState.range = 'THIS_WEEK';
  }

  calculateAccountsRange(accountsState.range);
}


function changeAccountsRange(value) {
  accountsState.range = value || 'THIS_WEEK';

  const custom =
    accountsState.range === 'CUSTOM';

  document
    .getElementById('accountsCustomStartWrap')
    ?.classList.toggle('hidden', !custom);

  document
    .getElementById('accountsCustomEndWrap')
    ?.classList.toggle('hidden', !custom);

  document
    .getElementById('accountsApplyCustom')
    ?.classList.toggle('hidden', !custom);

  if (custom) {
    populateAccountsCustomInputs();
    updateAccountsWeekNav();
    return;
  }

  calculateAccountsRange(accountsState.range);
  fetchAccounts();
}


function pdmFinancialWeekFor(dateValue) {
  const d = dateValue ? new Date(dateValue) : new Date();

  // Canonical PDM financial week:
  // Monday 12:00 UTC -> following Monday 12:00 UTC.
  const candidate = new Date(Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    12, 0, 0, 0
  ));

  const day = candidate.getUTCDay();
  const diffToMonday =
    day === 0 ? -6 : 1 - day;

  candidate.setUTCDate(
    candidate.getUTCDate() + diffToMonday
  );

  // Before Monday noon belongs to the week that began the previous Monday.
  if (d < candidate) {
    candidate.setUTCDate(candidate.getUTCDate() - 7);
  }

  const end = new Date(candidate);
  end.setUTCDate(end.getUTCDate() + 7);

  return {
    start: candidate,
    end
  };
}


function calculateAccountsRange(range) {
  const now = new Date();

  let start;
  let end = new Date(now);

  if (range === 'TODAY') {
    start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    end = new Date(start);
    end.setDate(end.getDate() + 1);

  } else if (range === 'LAST_7') {
    start = new Date(now);
    start.setDate(start.getDate() - 7);

  } else if (range === 'THIS_MONTH') {
    start = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    end = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1
    );

  } else {
    const week = pdmFinancialWeekFor(now);

    start = new Date(week.start);
    end = new Date(week.end);

    if (range === 'LAST_WEEK') {
      start.setUTCDate(start.getUTCDate() - 7);
      end.setUTCDate(end.getUTCDate() - 7);
    }
  }

  accountsState.start = start.toISOString();
  accountsState.end = end.toISOString();

  updateAccountsWeekNav();
}


function shiftAccountsWeek(direction) {
  const start = new Date(accountsState.start);
  const end = new Date(accountsState.end);

  start.setUTCDate(start.getUTCDate() + (7 * direction));
  end.setUTCDate(end.getUTCDate() + (7 * direction));

  accountsState.range = 'WEEK';
  accountsState.start = start.toISOString();
  accountsState.end = end.toISOString();

  const select = document.getElementById('accountsRange');
  if (select) select.value = 'THIS_WEEK';

  updateAccountsWeekNav();
  fetchAccounts();
}


function goAccountsCurrentWeek() {
  accountsState.range = 'THIS_WEEK';

  const select = document.getElementById('accountsRange');
  if (select) select.value = 'THIS_WEEK';

  calculateAccountsRange('THIS_WEEK');
  fetchAccounts();
}


function updateAccountsWeekNav() {
  const weekly =
    ['THIS_WEEK','LAST_WEEK','WEEK'].includes(accountsState.range);

  ['accountsPrevWeek','accountsCurrentWeek','accountsNextWeek']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('hidden', !weekly);
    });

  if (!weekly) return;

  const current = pdmFinancialWeekFor(new Date());
  const selectedStart = new Date(accountsState.start);

  const next =
    document.getElementById('accountsNextWeek');

  if (next) {
    next.disabled =
      selectedStart.getTime() >= current.start.getTime();
  }
}

function populateAccountsCustomInputs() {
  const start = new Date(accountsState.start);
  const end = new Date(accountsState.end);

  const startInput =
    document.getElementById('accountsCustomStart');

  const endInput =
    document.getElementById('accountsCustomEnd');

  if (startInput) {
    startInput.value =
      localDateInputValue(start);
  }

  if (endInput) {
    const inclusiveEnd = new Date(end);
    inclusiveEnd.setDate(inclusiveEnd.getDate() - 1);

    endInput.value =
      localDateInputValue(inclusiveEnd);
  }
}


function localDateInputValue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');

  return `${y}-${m}-${d}`;
}


function applyCustomAccountsRange() {
  const startValue =
    document.getElementById('accountsCustomStart')?.value || '';

  const endValue =
    document.getElementById('accountsCustomEnd')?.value || '';

  if (!startValue || !endValue) {
    alert('Choose both From and To dates.');
    return;
  }

  const start =
    new Date(startValue + 'T00:00:00');

  const endInclusive =
    new Date(endValue + 'T00:00:00');

  const end =
    new Date(endInclusive);

  end.setDate(end.getDate() + 1);

  if (end <= start) {
    alert('The To date must be on or after the From date.');
    return;
  }

  accountsState.start = start.toISOString();
  accountsState.end = end.toISOString();

  fetchAccounts();
}


function fetchAccounts() {
  showPageLoader(true);

  google.script.run
    .withSuccessHandler(data => {
      showPageLoader(false);
      accountsState.data = data || {};
      renderAccounts();
    })
    .withFailureHandler(handleServerError)
    .getAccountsData(
      state.token,
      accountsState.start,
      accountsState.end
    );
}


function renderAccounts() {
  const data = accountsState.data || {};
  const s = data.summary || {};
  const inv = data.inventory || {};

  const start = new Date(data.period_start || accountsState.start);
  const end = new Date(data.period_end || accountsState.end);

  const weekly =
    ['THIS_WEEK','LAST_WEEK','WEEK'].includes(accountsState.range);

  const label = weekly
    ? `${start.toLocaleDateString('en-GB')} 12:00 UTC – ` +
      `${end.toLocaleDateString('en-GB')} 12:00 UTC`
    : `${start.toLocaleDateString('en-GB')} – ` +
      `${new Date(end.getTime() - 1).toLocaleDateString('en-GB')}`;

  setText('accountsPeriodLabel', label);

  const netCash =
    Number(s.net_cash_movement || 0);

  // Realised profit is sale profit only (sql/056). Export cash goes to
  // Operating Capital and is shown here for information.
  const realizedProfit = Number(s.realized_profit ?? s.sales_profit ?? 0);
  const exportProceeds = Number(s.export_proceeds ?? s.export_revenue ?? 0);

  const uncostedExport =
    Number(s.uncosted_export_revenue || 0);

  document.getElementById('accountsBody').innerHTML = `
    <div class="acct-section">
      <div class="acct-section-head">
        <div>
          <h2>Realised Performance</h2>
          <div class="acct-note">
            Exact historical sale profit only. Export proceeds go to Operating Capital,
            not realised profit. Imports and buybacks acquire inventory and contribute no immediate profit.
          </div>
        </div>
      </div>

      <div class="acct-grid">
        ${accountsMetric(
          'Sales Revenue',
          money(s.sales_revenue || 0),
          number(s.units_sold || 0) + ' units sold'
        )}

        ${accountsMetric(
          'Sales COGS',
          money(s.sales_cogs || 0),
          'Historical cost attached to sold vehicles'
        )}

        ${accountsMetric(
          'Sales Gross Profit',
          money(s.sales_profit || 0),
          number(s.sale_transactions || 0) + ' sale transactions',
          Number(s.sales_profit || 0)
        )}

        ${accountsMetric(
          'Export Proceeds',
          money(exportProceeds),
          'Goes to Operating Capital, not realised profit',
          exportProceeds
        )}

        ${accountsMetric(
          'Realised Profit',
          money(realizedProfit),
          'Exact sale profit only',
          realizedProfit
        )}

        ${accountsMetric(
          'Uncosted Export Revenue',
          money(uncostedExport),
          'Exports with no stored acquisition cost'
        )}
      </div>

      ${uncostedExport > 0 ? `
        <div class="acct-warning">
          <strong>Export costing note:</strong>
          ${money(uncostedExport)} of export revenue in this period came from
          stock exports without a stored historical acquisition cost.
          Like all export proceeds, it goes to Operating Capital and is not part of realised profit.
        </div>
      ` : ''}
    </div>

    <div class="acct-section">
      ${renderWeeklyCapitalPosition(data.period_operating_capital)}

      <div class="acct-section-head">
        <div>
          <h2>Cash Movement</h2>
          <div class="acct-note">
            Operating Capital is the live PDM dealership-account balance.
            Period cash movement remains the selected date-range activity.
          </div>
        </div>

        ${['OWNER','MANAGER'].includes(String(state.user.role || '').toUpperCase()) ||
          state.user.permissions.can_manage_payroll === true
            ? `<button class="add-row-btn"
                       onclick="openOperatingCapitalReconcile()">
                 RECONCILE BALANCE
               </button>`
            : ''}
      </div>

      <div class="acct-grid">
        ${accountsMetric(
          'Operating Capital',
          money(
            data.operating_capital &&
            data.operating_capital.current_balance || 0
          ),
          'Live PDM dealership-account balance'
        )}

        ${accountsMetric(
          'Cash In',
          money(s.cash_in || 0),
          money(s.sales_revenue || 0) + ' sales · ' +
          money(s.export_revenue || 0) + ' exports'
        )}

        ${accountsMetric(
          'Cash Out',
          money(s.cash_out || 0),
          money(s.import_spend || 0) + ' imports · ' +
          money(s.buyback_spend || 0) + ' buybacks'
        )}

        ${accountsMetric(
          'Net Cash Movement',
          money(netCash),
          'Cash in minus cash out',
          netCash
        )}

        ${accountsMetric(
          'Import Spend',
          money(s.import_spend || 0),
          number(s.units_imported || 0) + ' units imported'
        )}

        ${accountsMetric(
          'Buyback Spend',
          money(s.buyback_spend || 0),
          number(s.units_bought_back || 0) + ' units bought back'
        )}

        ${accountsMetric(
          'Export Revenue',
          money(s.export_revenue || 0),
          number(s.units_exported || 0) + ' units exported'
        )}
      </div>

      ${data.operating_capital && data.operating_capital.opening_at ? `
        <div class="acct-note" style="margin-top:10px">
          Ledger baseline:
          ${money(data.operating_capital.opening_balance || 0)}
          at ${formatLogDate(data.operating_capital.opening_at)}
          · Net movement since baseline
          ${money(data.operating_capital.net_movement_since_baseline || 0)}
        </div>
      ` : ''}
    </div>

    <div class="acct-section">
      <div class="acct-section-head">
        <div>
          <h2>Current Inventory Position</h2>
          <div class="acct-note">
            Live snapshot using today's canonical Import / Export and PDM prices.
          </div>
        </div>
      </div>

      <div class="acct-grid">
        ${accountsMetric(
          'Units In Stock',
          number(inv.units || 0),
          number(inv.models || 0) + ' models'
        )}

        ${accountsMetric(
          'Stock Cost Value',
          money(inv.cost_value || 0),
          'At current canonical Import / Export value'
        )}

        ${accountsMetric(
          'Retail Stock Value',
          money(inv.retail_value || 0),
          'At current PDM prices'
        )}

        ${accountsMetric(
          'Stock Potential Margin',
          money(inv.unrealized_margin || 0),
          'Current retail stock value minus current canonical stock cost value',
          Number(inv.unrealized_margin || 0)
        )}
      </div>
    </div>

    <div class="acct-section">
      <div class="acct-section-head">
        <div><h2>Daily Movement</h2><div class="acct-note">Cost-based profit below includes only transactions with known costs; it is not the settlement profit total.</div></div>
      </div>

      ${renderAccountsDaily(data.daily || [])}
    </div>

    <div class="acct-section acct-two-col">
      <div>
        <div class="acct-section-head">
          <div><h2>Top Vehicles</h2><div class="acct-note">Ranked by cost-based profit, not the settlement accounting rule.</div></div>
        </div>

        ${renderAccountsTopVehicles(data.top_vehicles || [])}
      </div>

      <div>
        <div class="acct-section-head">
          <h2>Salespeople</h2>
        </div>

        ${renderAccountsEmployees(data.top_employees || [])}
      </div>
    </div>

    <div class="acct-section">
      <div class="acct-section-head">
        <div>
          <h2>Recent Financial Activity</h2>
          <div class="acct-note">
            Most recent 300 transaction lines in the selected period.
          </div>
        </div>
      </div>

      ${renderAccountsActivity(data.recent_activity || [])}
    </div>

    ${bottomBrand()}
  `;
}


function accountsMetric(label, value, sub, signedValue) {
  let valueClass = '';

  if (signedValue !== undefined && signedValue !== null) {
    const n = Number(signedValue || 0);

    if (n > 0) valueClass = 'acct-positive';
    if (n < 0) valueClass = 'acct-negative';
  }

  return `
    <div class="acct-metric">
      <span>${escapeHtml(label)}</span>
      <strong class="${valueClass}">${value}</strong>
      <small>${escapeHtml(sub || '')}</small>
    </div>
  `;
}



function renderWeeklyCapitalPosition(capital) {
  capital = capital || {};

  const weekly =
    ['THIS_WEEK','LAST_WEEK','WEEK'].includes(accountsState.range);

  if (!weekly) return '';

  const openingAvailable =
    capital.opening_available === true;

  const opening =
    openingAvailable
      ? money(capital.opening_balance || 0)
      : 'Unavailable';

  const closing =
    capital.closing_balance === null ||
    capital.closing_balance === undefined
      ? 'Unavailable'
      : money(capital.closing_balance || 0);

  const movement =
    capital.period_capital_movement === null ||
    capital.period_capital_movement === undefined
      ? 'Unavailable'
      : money(capital.period_capital_movement || 0);

  const note = openingAvailable
    ? (capital.is_in_progress
        ? 'Closing balance is live as of now because this week is still in progress.'
        : 'Opening and closing balances from the PDM cash ledger.')
    : `Opening balance cannot be reconstructed before the ledger baseline${
        capital.baseline_at
          ? ' (' + formatLogDate(capital.baseline_at) + ')'
          : ''
      }.`;

  return `
    <div class="acct-card">
      <div class="acct-section-head">
        <div>
          <h2>Weekly Capital Position</h2>
          <div class="acct-note">${escapeHtml(note)}</div>
        </div>
      </div>

      <div class="acct-metric-grid">
        ${accountsMetric(
          'Opening Operating Capital',
          opening,
          'Balance at Monday 12:00 UTC'
        )}

        ${accountsMetric(
          capital.is_in_progress
            ? 'Operating Capital Now'
            : 'Closing Operating Capital',
          closing,
          capital.is_in_progress
            ? 'Live dealership-account balance'
            : 'Balance at following Monday 12:00 UTC'
        )}

        ${accountsMetric(
          'Net Capital Movement',
          movement,
          'Closing minus opening balance'
        )}
      </div>
    </div>
  `;
}


function renderAccountsDaily(rows) {
  if (!rows.length) {
    return `
      <div class="placeholder">
        <p>No financial activity in this period.</p>
      </div>
    `;
  }

  return `
    <div class="acct-table-wrap">
      <table class="acct-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Cash In</th>
            <th>Cash Out</th>
            <th>Net Cash</th>
            <th>Cost-Based Profit</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => {
            const net = Number(r.net_cash || 0);
            const profit = Number(r.exact_profit || 0);

            return `
              <tr>
                <td>${formatAccountsDay(r.day)}</td>
                <td>${money(r.cash_in)}</td>
                <td>${money(r.cash_out)}</td>
                <td class="${net >= 0 ? 'acct-positive' : 'acct-negative'}">
                  ${money(net)}
                </td>
                <td class="${profit >= 0 ? 'acct-positive' : 'acct-negative'}">
                  ${money(profit)}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}


function renderAccountsTopVehicles(rows) {
  if (!rows.length) {
    return `<div class="placeholder"><p>No realised vehicle activity.</p></div>`;
  }

  return `
    <div class="acct-table-wrap">
      <table class="acct-table" style="min-width:650px">
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Units Out</th>
            <th>Revenue</th>
            <th>Cost-Based Profit</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td>${escapeHtml(r.vehicle_name || '')}</td>
              <td>${number(r.units_out || 0)}</td>
              <td>${money(r.revenue || 0)}</td>
              <td>${money(r.exact_profit || 0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}


function renderAccountsEmployees(rows) {
  if (!rows.length) {
    return `<div class="placeholder"><p>No sales in this period.</p></div>`;
  }

  return `
    <div class="acct-table-wrap">
      <table class="acct-table" style="min-width:600px">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Sales</th>
            <th>Revenue</th>
            <th>Profit</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td>${escapeHtml(r.employee_name || 'Unknown')}</td>
              <td>${number(r.sales_count || 0)}</td>
              <td>${money(r.sales_revenue || 0)}</td>
              <td>${money(r.sales_profit || 0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}


function renderAccountsActivity(rows) {
  if (!rows.length) {
    return `<div class="placeholder"><p>No financial activity in this period.</p></div>`;
  }

  return `
    <div class="acct-table-wrap">
      <table class="acct-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Vehicle</th>
            <th>Counterparty</th>
            <th>Employee</th>
            <th>Cash In</th>
            <th>Cash Out</th>
            <th>Realised Profit</th>
            <th>Ref</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => {
            const type =
              String(r.activity_type || '').toLowerCase();

            // Exports are Operating Capital only -- no realised profit.
            const profit = type === 'export'
              ? 0
              : type === 'sale'
                ? (r.realized_profit == null ? null : Number(r.realized_profit))
                : 0;

            return `
              <tr>
                <td>${formatLogDate(r.activity_date)}</td>

                <td>
                  <span class="acct-type ${type}">
                    ${escapeHtml(r.activity_type || '')}
                  </span>
                </td>

                <td>
                  ${escapeHtml(r.vehicle_name || '')}
                  ${Number(r.quantity || 0) !== 1
                    ? `<div class="muted">Qty ${number(r.quantity || 0)}</div>`
                    : ''}
                </td>

                <td>${escapeHtml(r.counterparty || '')}</td>
                <td>${escapeHtml(r.employee_name || '')}</td>

                <td>
                  ${Number(r.cash_in || 0) > 0
                    ? money(r.cash_in)
                    : '—'}
                </td>

                <td>
                  ${Number(r.cash_out || 0) > 0
                    ? money(r.cash_out)
                    : '—'}
                </td>

                <td>
                  ${profit === null
                    ? `<span class="muted">Sale profit unavailable</span>`
                    : `<span class="${profit >= 0 ? 'acct-positive' : 'acct-negative'}">
                         ${money(profit)}
                       </span>`}
                </td>

                <td>
                  <div>${escapeHtml(r.transaction_ref || '')}</div>
                  ${type === 'export'
                    ? `<div class="muted" style="font-size:10px">Operating Capital only</div>`
                    : (type === 'import' || type === 'buyback')
                      ? `<div class="muted" style="font-size:10px">Inventory acquisition</div>`
                      : ''}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}


function formatAccountsDay(value) {
  if (!value) return '';

  const d = new Date(value + 'T00:00:00');

  if (isNaN(d)) return String(value);

  return d.toLocaleDateString('en-GB', {
    weekday:'short',
    day:'2-digit',
    month:'short'
  });
}


// ============================================================
// MANAGER V1 - STAFF & STAKEHOLDERS
// ============================================================

const managerState = {
  employees: [],
  allocation: {},
  search: ''
};


function loadManagerStaff() {
  showPageLoader(true);

  google.script.run
    .withSuccessHandler(data => {
      showPageLoader(false);

      managerState.employees =
        Array.isArray(data.employees)
          ? data.employees
          : [];

      managerState.allocation =
        data.allocation || {};

      renderManagerStaff();
    })
    .withFailureHandler(handleServerError)
    .getManagerStaffData(state.token);
}


function renderManagerStaff() {
  const a = managerState.allocation || {};

  document.getElementById('content').innerHTML = `
    <div class="page-title">
      <div>
        <h1>Staff & Permissions</h1>
        <div class="muted" style="margin-top:5px">
          Owner administration for staff, portal access, permissions and stakeholder configuration.
        </div>
      </div>

      <button class="add-row-btn"
              onclick="openAddEmployee()">
        + ADD EMPLOYEE
      </button>
    </div>

    <div class="mgr-allocation">
      <div class="mgr-allocation-card">
        <span>Rainy Day</span>
        <strong>${percent(a.rainy_day_percent || 0)}</strong>
      </div>

      <div class="mgr-allocation-card">
        <span>Stakeholders</span>
        <strong>${percent(a.stakeholder_percent_total || 0)}</strong>
      </div>

      <div class="mgr-allocation-card">
        <span>Fixed Allocation</span>
        <strong>${percent(a.fixed_allocation_percent || 0)}</strong>
      </div>

      <div class="mgr-allocation-card">
        <span>Employee Pool</span>
        <strong>${percent(a.employee_pool_percent || 0)}</strong>
      </div>
    </div>

    ${Number(a.fixed_allocation_percent || 0) > 100 ? `
      <div class="pay-warning">
        Rainy Day + stakeholder allocations exceed 100%.
        Payroll cannot be finalised until this is corrected.
      </div>
    ` : ''}

    <div class="mgr-toolbar">
      <input class="sales-input mgr-search"
             placeholder="Search employee, code, Discord or role…"
             value="${escapeHtml(managerState.search)}"
             oninput="setManagerSearch(this.value)">

      <div id="managerCount" class="muted"></div>
    </div>

    <div class="mgr-table-wrap">
      <table class="mgr-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Role</th>
            <th>Portal</th>
            <th>Permissions</th>
            <th>Employee Pool</th>
            <th>Stakeholder</th>
            <th>Last Login</th>
          </tr>
        </thead>

        <tbody id="managerRows"></tbody>
      </table>
    </div>

    ${bottomBrand()}
  `;

  renderManagerRows();
}


function renderManagerRows() {
  const body =
    document.getElementById('managerRows');

  if (!body) return;

  const q =
    String(managerState.search || '')
      .trim()
      .toLowerCase();

  const rows =
    managerState.employees.filter(e => {
      if (!q) return true;

      return [
        e.employee_name,
        e.employee_code,
        e.discord,
        e.role
      ].some(v =>
        String(v || '').toLowerCase().includes(q)
      );
    });

  setText(
    'managerCount',
    number(rows.length) +
      ' employee' +
      (rows.length === 1 ? '' : 's')
  );

  if (!rows.length) {
    body.innerHTML = `
      <tr>
        <td colspan="7"
            class="muted"
            style="text-align:center;padding:34px">
          No employees match this search.
        </td>
      </tr>
    `;
    return;
  }

  body.innerHTML =
    rows.map(e => `
      <tr onclick="openEmployeeEditor('${jsString(e.employee_id)}')">
        <td>
          <div class="mgr-name">
            ${escapeHtml(e.employee_name || '')}
          </div>

          <div class="mgr-sub">
            ${escapeHtml(e.employee_code || '')}
            ${e.discord
              ? ' · ' + escapeHtml(e.discord)
              : ''}
          </div>
        </td>

        <td>${escapeHtml(e.role || '')}</td>

        <td>
          ${e.active && e.portal_enabled
            ? '<span class="mgr-status">ACTIVE</span>'
            : '<span class="mgr-status inactive">DISABLED</span>'}
        </td>

        <td>
          <div class="mgr-perms">
            ${managerPermissionChips(e)}
          </div>
        </td>

        <td>
          ${e.payroll_eligible === true ? 'Yes' : 'No'}
        </td>

        <td>
          ${Number(e.stakeholder_percent || 0) > 0
            ? percent(e.stakeholder_percent)
            : '—'}
        </td>

        <td>
          ${e.last_login
            ? formatLogDate(e.last_login)
            : '<span class="muted">Never</span>'}
        </td>
      </tr>
    `).join('');
}


function managerPermissionChips(e) {
  const labels = [
    ['can_sell','Sell'],
    ['can_import','Import'],
    ['can_buyback','Buyback'],
    ['can_export','Export'],
    ['can_view_accounts','Accounts'],
    ['can_manage_payroll','Payroll'],
    ['can_manage_stock','Stock'],
    ['can_manage_vehicles','Vehicles'],
    ['can_manage_users','Users']
  ];

  const active =
    labels.filter(([key]) => e[key] === true);

  if (!active.length) {
    return '<span class="muted">None</span>';
  }

  return active.map(([,label]) =>
    `<span class="mgr-perm">${escapeHtml(label)}</span>`
  ).join('');
}


function setManagerSearch(value) {
  managerState.search = value || '';
  renderManagerRows();
}


function openAddEmployee() {
  openManagerEmployeeDrawer(
    'add',
    {
      employee_id: '',
      employee_code: 'Generated automatically',
      employee_name: '',
      discord: '',
      role: 'Salesperson',

      can_sell: true,
      can_import: false,
      can_buyback: false,
      can_export: false,
      can_view_accounts: false,
      can_manage_payroll: false,
      can_manage_stock: false,
      can_manage_users: false,
      can_manage_vehicles: false,

      active: true,
      portal_enabled: true,

      iban_code: '',
      base_pay: 0,

      payroll_eligible: true,
      stakeholder_percent: 0
    }
  );
}


function openEmployeeEditor(employeeId) {
  const employee =
    managerState.employees.find(
      e => String(e.employee_id) === String(employeeId)
    );

  if (!employee) return;

  openManagerEmployeeDrawer(
    'edit',
    employee
  );
}


function openManagerEmployeeDrawer(mode, employee) {
  document.getElementById('managerEmployeeDrawer')?.remove();

  const isAdd = mode === 'add';

  const backdrop =
    document.createElement('div');

  backdrop.id = 'managerEmployeeDrawer';
  backdrop.className = 'mgr-drawer-backdrop';

  backdrop.innerHTML = `
    <div class="mgr-drawer">
      <div class="mgr-drawer-head">
        <div>
          <h2>
            ${isAdd
              ? 'Add Employee'
              : escapeHtml(employee.employee_name || '')}
          </h2>

          <div class="muted" style="margin-top:5px">
            ${isAdd
              ? 'Creates employee, portal account and payroll configuration together.'
              : escapeHtml(employee.employee_code || '')}
          </div>
        </div>

        <button class="stock-close"
                onclick="closeManagerEmployeeDrawer()">
          ×
        </button>
      </div>

      <div class="mgr-form-grid">
        <div class="mgr-field full">
          <label>Employee Name</label>
          <input id="mgrName"
                 class="sales-input"
                 value="${escapeHtml(employee.employee_name || '')}">
        </div>

        <div class="mgr-field">
          <label>Discord</label>
          <input id="mgrDiscord"
                 class="sales-input"
                 value="${escapeHtml(employee.discord || '')}">
        </div>

        <div class="mgr-field">
          <label>Role</label>
          <select id="mgrRole"
                  class="sales-input">
            ${managerRoleOptions(employee.role)}
          </select>
        </div>

        <div class="mgr-field">
          <label>IBAN Code</label>
          <input id="mgrIban"
                 class="sales-input"
                 value="${escapeHtml(employee.iban_code || '')}">
        </div>

        <div class="mgr-field">
          <label>Base Pay</label>
          <input id="mgrBasePay"
                 class="sales-input"
                 type="number"
                 min="0"
                 step="1"
                 value="${Number(employee.base_pay || 0)}">
        </div>

        ${isAdd ? `
          <div class="mgr-field full">
            <label>Initial Password</label>
            <input id="mgrPassword"
                   class="sales-input"
                   type="password"
                   autocomplete="new-password"
                   placeholder="Initial portal password">
          </div>
        ` : ''}
      </div>

      <div style="margin-top:18px">
        <div class="mgr-section-label">Portal / Employment Status</div>

        <div class="mgr-check-grid">
          ${managerCheckbox(
            'mgrActive',
            'Active Employee',
            employee.active === true
          )}

          ${managerCheckbox(
            'mgrPortal',
            'Portal Enabled',
            employee.portal_enabled === true
          )}

          ${managerCheckbox(
            'mgrPayrollEligible',
            'Employee Pool Eligible',
            employee.payroll_eligible === true
          )}
        </div>
      </div>

      <div style="margin-top:18px">
        <div class="mgr-section-label">Permissions</div>

        <div class="mgr-check-grid">
          ${managerCheckbox('mgrSell','Sell Vehicles',employee.can_sell)}
          ${managerCheckbox('mgrImport','Import Vehicles',employee.can_import)}
          ${managerCheckbox('mgrBuyback','Buy From Players',employee.can_buyback)}
          ${managerCheckbox('mgrExport','Export Vehicles',employee.can_export)}
          ${managerCheckbox('mgrAccounts','View Accounts',employee.can_view_accounts)}
          ${managerCheckbox('mgrPayroll','Manage Payroll',employee.can_manage_payroll)}
          ${managerCheckbox('mgrStock','Manage Stock',employee.can_manage_stock)}
          ${managerCheckbox('mgrVehicles','Manage Vehicles',employee.can_manage_vehicles)}
          ${managerCheckbox('mgrUsers','Manage Users',employee.can_manage_users)}
        </div>
      </div>

      <div class="mgr-comp">
        <div class="mgr-section-label">Stakeholder</div>

        <div class="mgr-form-grid">
          <div class="mgr-field">
            <label>Stakeholder Share %</label>
            <input id="mgrStake"
                   class="sales-input"
                   type="number"
                   min="0"
                   max="100"
                   step="0.1"
                   value="${Number(employee.stakeholder_percent || 0)}"
                   oninput="refreshManagerAllocationPreview(${isAdd ? "null" : "'" + jsString(employee.employee_id) + "'"})">
          </div>

          <div class="mgr-field">
            <label>Allocation Preview</label>
            <div id="mgrAllocationPreview"
                 style="padding:11px 0;font-weight:850">
            </div>
          </div>
        </div>
      </div>

      ${!isAdd ? `
        <div class="mgr-insight">
          <div class="mgr-section-label">Current Week Activity</div>
          <div class="mgr-sub">
            Monday to now · projected against the current Payroll configuration.
          </div>

          <div id="mgrEmployeeInsight">
            <div class="muted" style="padding:12px 0">
              Loading activity and payroll preview…
            </div>
          </div>
        </div>

        <div class="mgr-insight">
          <div class="mgr-section-label">Staff Audit History</div>
          <div class="mgr-sub">
            Manager changes recorded from V1.1 onward.
          </div>

          <div id="mgrEmployeeAudit">
            <div class="muted" style="padding:12px 0">
              Loading audit history…
            </div>
          </div>
        </div>
      ` : ''}

      <div id="mgrError"
           class="sale-message bad"
           style="margin-top:12px"></div>

      <div class="mgr-actions">
        ${!isAdd ? `
          <button
            class="${employee.active === true ? 'mgr-danger' : 'mgr-rehire'}"
            onclick="${
              employee.active === true
                ? `fireDealershipEmployee('${jsString(employee.employee_id)}','${jsString(employee.employee_name || '')}')`
                : `rehireDealershipEmployee('${jsString(employee.employee_id)}','${jsString(employee.employee_name || '')}')`
            }">
            ${employee.active === true ? 'FIRE EMPLOYEE' : 'REHIRE EMPLOYEE'}
          </button>

          <button class="modal-cancel"
                  onclick="openResetEmployeePassword('${jsString(employee.employee_id)}','${jsString(employee.employee_name || '')}')">
            RESET PASSWORD
          </button>
        ` : ''}

        <button class="modal-cancel"
                onclick="closeManagerEmployeeDrawer()">
          CANCEL
        </button>

        <button id="mgrSaveBtn"
                class="add-row-btn"
                onclick="${isAdd
                  ? 'submitNewEmployee()'
                  : `submitEmployeeUpdate('${jsString(employee.employee_id)}')`}">
          ${isAdd ? 'ADD EMPLOYEE' : 'SAVE EMPLOYEE'}
        </button>
      </div>
    </div>
  `;

  backdrop.addEventListener('click', event => {
    if (event.target === backdrop) {
      closeManagerEmployeeDrawer();
    }
  });

  document.body.appendChild(backdrop);

  refreshManagerAllocationPreview(
    isAdd ? null : employee.employee_id
  );

  if (!isAdd) {
    loadManagerEmployeeInsight(employee.employee_id);
    loadManagerEmployeeAudit(employee.employee_id);
  }
}


function managerRoleOptions(current) {
  const roles = [
    'Salesperson',
    'Senior Salesperson',
    'Manager',
    'Owner'
  ];

  const currentText =
    String(current || '');

  if (
    currentText &&
    !roles.some(r => r.toLowerCase() === currentText.toLowerCase())
  ) {
    roles.push(currentText);
  }

  return roles.map(role => `
    <option value="${escapeHtml(role)}"
            ${role.toLowerCase() === currentText.toLowerCase()
              ? 'selected'
              : ''}>
      ${escapeHtml(role)}
    </option>
  `).join('');
}


function managerCheckbox(id, label, checked) {
  return `
    <label class="mgr-check">
      <input id="${id}"
             type="checkbox"
             ${checked === true ? 'checked' : ''}>
      ${escapeHtml(label)}
    </label>
  `;
}


function refreshManagerAllocationPreview(editingEmployeeId) {
  const box =
    document.getElementById('mgrAllocationPreview');

  if (!box) return;

  const newStake =
    Number(document.getElementById('mgrStake')?.value || 0);

  const rainy =
    Number(managerState.allocation.rainy_day_percent || 0);

  const currentStake =
    Number(managerState.allocation.stakeholder_percent_total || 0);

  let existingStake = 0;

  if (editingEmployeeId) {
    const row =
      managerState.employees.find(
        e => String(e.employee_id) === String(editingEmployeeId)
      );

    existingStake =
      Number(row && row.stakeholder_percent || 0);
  }

  const stakeTotal =
    currentStake - existingStake + newStake;

  const fixed =
    rainy + stakeTotal;

  const employeePool =
    Math.max(100 - fixed, 0);

  box.innerHTML = `
    ${percent(fixed)} fixed ·
    <span class="${fixed > 100 ? 'acct-negative' : 'acct-positive'}">
      ${percent(employeePool)} employee pool
    </span>
  `;
}


function collectManagerEmployeePayload(isAdd) {
  const name =
    document.getElementById('mgrName')?.value.trim() || '';

  const role =
    document.getElementById('mgrRole')?.value.trim() || '';

  const basePay =
    Number(document.getElementById('mgrBasePay')?.value || 0);

  const stake =
    Number(document.getElementById('mgrStake')?.value || 0);

  if (!name) throw new Error('Employee name is required.');
  if (!role) throw new Error('Role is required.');

  if (!Number.isFinite(basePay) || basePay < 0) {
    throw new Error('Base pay must be 0 or more.');
  }

  if (!Number.isFinite(stake) || stake < 0 || stake > 100) {
    throw new Error('Stakeholder percentage must be between 0 and 100.');
  }

  const payload = {
    employee_name: name,
    discord:
      document.getElementById('mgrDiscord')?.value.trim() || '',
    role,

    iban_code:
      document.getElementById('mgrIban')?.value.trim() || '',
    base_pay: basePay,

    active:
      document.getElementById('mgrActive')?.checked === true,
    portal_enabled:
      document.getElementById('mgrPortal')?.checked === true,

    payroll_eligible:
      document.getElementById('mgrPayrollEligible')?.checked === true,
    stakeholder_percent: stake,

    can_sell:
      document.getElementById('mgrSell')?.checked === true,
    can_import:
      document.getElementById('mgrImport')?.checked === true,
    can_buyback:
      document.getElementById('mgrBuyback')?.checked === true,
    can_export:
      document.getElementById('mgrExport')?.checked === true,
    can_view_accounts:
      document.getElementById('mgrAccounts')?.checked === true,
    can_manage_payroll:
      document.getElementById('mgrPayroll')?.checked === true,
    can_manage_stock:
      document.getElementById('mgrStock')?.checked === true,
    can_manage_vehicles:
      document.getElementById('mgrVehicles')?.checked === true,
    can_manage_users:
      document.getElementById('mgrUsers')?.checked === true
  };

  if (isAdd) {
    payload.password =
      document.getElementById('mgrPassword')?.value || '';

    if (!payload.password) {
      throw new Error('Initial password is required.');
    }
  }

  return payload;
}


function submitNewEmployee() {
  const err =
    document.getElementById('mgrError');

  const btn =
    document.getElementById('mgrSaveBtn');

  try {
    if (err) err.textContent = '';

    const payload =
      collectManagerEmployeePayload(true);

    if (!confirm(
      `Add employee?

${payload.employee_name}
Role: ${payload.role}
Stakeholder: ${percent(payload.stakeholder_percent)}
Employee Pool Eligible: ${payload.payroll_eligible ? 'Yes' : 'No'}

This creates both the employee record and portal login.`
    )) {
      return;
    }

    btn.disabled = true;
    btn.textContent = 'ADDING…';

    google.script.run
      .withSuccessHandler(result => {
        closeManagerEmployeeDrawer();

        alert(
          'Employee created.\n\n' +
          String(result.employee_code || '') +
          ' · ' +
          String(result.employee_name || '')
        );

        loadManagerStaff();
      })
      .withFailureHandler(error => {
        btn.disabled = false;
        btn.textContent = 'ADD EMPLOYEE';

        if (err) {
          err.textContent = cleanError(error);
        }
      })
      .createDealershipEmployee(
        state.token,
        payload
      );

  } catch (error) {
    if (err) {
      err.textContent = cleanError(error);
    }
  }
}


function submitEmployeeUpdate(employeeId) {
  const err =
    document.getElementById('mgrError');

  const btn =
    document.getElementById('mgrSaveBtn');

  try {
    if (err) err.textContent = '';

    const payload =
      collectManagerEmployeePayload(false);

    if (!confirm(
      `Save employee changes?

${payload.employee_name}
Role: ${payload.role}
Stakeholder: ${percent(payload.stakeholder_percent)}
Employee Pool Eligible: ${payload.payroll_eligible ? 'Yes' : 'No'}
Portal: ${payload.portal_enabled ? 'Enabled' : 'Disabled'}
Employment: ${payload.active ? 'Active' : 'Inactive'}`
    )) {
      return;
    }

    btn.disabled = true;
    btn.textContent = 'SAVING…';

    google.script.run
      .withSuccessHandler(() => {
        closeManagerEmployeeDrawer();
        loadManagerStaff();
      })
      .withFailureHandler(error => {
        btn.disabled = false;
        btn.textContent = 'SAVE EMPLOYEE';

        if (err) {
          err.textContent = cleanError(error);
        }
      })
      .updateDealershipEmployee(
        state.token,
        employeeId,
        payload
      );

  } catch (error) {
    if (err) {
      err.textContent = cleanError(error);
    }
  }
}


function fireDealershipEmployee(employeeId, employeeName) {
  const employee =
    managerState.employees.find(
      e => String(e.employee_id) === String(employeeId)
    );

  if (!employee) {
    alert('Employee record could not be found.');
    return;
  }

  if (!confirm(
    `Fire ${employeeName}?

This will:
• mark them as inactive
• immediately disable portal access
• remove them from the employee payroll pool
• revoke all operational permissions

Historical sales, payroll, audit and staff records will be retained.

Any stakeholder percentage will remain unchanged.`
  )) {
    return;
  }

  const payload = {
    employee_name: String(employee.employee_name || '').trim(),
    discord: String(employee.discord || '').trim(),
    role: String(employee.role || '').trim(),
    iban_code: String(employee.iban_code || '').trim(),
    base_pay: Number(employee.base_pay || 0),

    active: false,
    portal_enabled: false,
    payroll_eligible: false,

    // Ownership / stakeholder rights are deliberately preserved.
    stakeholder_percent: Number(employee.stakeholder_percent || 0),

    can_sell: false,
    can_import: false,
    can_buyback: false,
    can_export: false,
    can_view_accounts: false,
    can_manage_payroll: false,
    can_manage_stock: false,
    can_manage_vehicles: false,
    can_manage_users: false
  };

  showPageLoader(true);

  google.script.run
    .withSuccessHandler(() => {
      showPageLoader(false);
      closeManagerEmployeeDrawer();

      alert(
        employeeName +
        ' has been marked inactive and their portal access has been revoked.'
      );

      loadManagerStaff();
    })
    .withFailureHandler(error => {
      showPageLoader(false);

      const err =
        document.getElementById('mgrError');

      if (err) {
        err.textContent = cleanError(error);
      } else {
        alert(cleanError(error));
      }
    })
    .updateDealershipEmployee(
      state.token,
      employeeId,
      payload
    );
}


function rehireDealershipEmployee(employeeId, employeeName) {
  const employee =
    managerState.employees.find(
      e => String(e.employee_id) === String(employeeId)
    );

  if (!employee) {
    alert('Employee record could not be found.');
    return;
  }

  if (!confirm(
    `Rehire ${employeeName}?

This will:
• mark them as an active employee
• re-enable portal access
• return them to the employee payroll pool

Their old operational permissions will NOT be restored automatically.
You can assign the permissions you want and click SAVE EMPLOYEE afterwards.`
  )) {
    return;
  }

  const payload = {
    employee_name: String(employee.employee_name || '').trim(),
    discord: String(employee.discord || '').trim(),
    role: String(employee.role || '').trim(),
    iban_code: String(employee.iban_code || '').trim(),
    base_pay: Number(employee.base_pay || 0),

    active: true,
    portal_enabled: true,
    payroll_eligible: true,

    stakeholder_percent: Number(employee.stakeholder_percent || 0),

    // Rehire starts with no operational permissions.
    can_sell: false,
    can_import: false,
    can_buyback: false,
    can_export: false,
    can_view_accounts: false,
    can_manage_payroll: false,
    can_manage_stock: false,
    can_manage_vehicles: false,
    can_manage_users: false
  };

  showPageLoader(true);

  google.script.run
    .withSuccessHandler(() => {
      showPageLoader(false);
      closeManagerEmployeeDrawer();

      alert(
        employeeName +
        ' has been rehired. Portal access is enabled with no operational permissions.'
      );

      loadManagerStaff();
    })
    .withFailureHandler(error => {
      showPageLoader(false);

      const err =
        document.getElementById('mgrError');

      if (err) {
        err.textContent = cleanError(error);
      } else {
        alert(cleanError(error));
      }
    })
    .updateDealershipEmployee(
      state.token,
      employeeId,
      payload
    );
}


function openResetEmployeePassword(employeeId, employeeName) {
  const password =
    prompt(
      'Enter a new portal password for ' +
      employeeName +
      ':'
    );

  if (password === null) return;

  if (!password) {
    alert('Password cannot be blank.');
    return;
  }

  if (!confirm(
    'Reset the portal password for ' +
    employeeName +
    '?'
  )) {
    return;
  }

  showPageLoader(true);

  google.script.run
    .withSuccessHandler(() => {
      showPageLoader(false);
      alert('Password reset successfully.');
    })
    .withFailureHandler(handleServerError)
    .resetDealershipEmployeePassword(
      state.token,
      employeeId,
      password
    );
}


function closeManagerEmployeeDrawer() {
  document.getElementById('managerEmployeeDrawer')?.remove();
}


// ============================================================
// MANAGER V1.1 - ACTIVITY + AUDIT
// ============================================================

function managerCurrentWeekRange() {
  const now = new Date();

  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const day = start.getDay();
  const diffToMonday =
    day === 0 ? -6 : 1 - day;

  start.setDate(
    start.getDate() + diffToMonday
  );

  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}


function loadManagerEmployeeInsight(employeeId) {
  const el =
    document.getElementById('mgrEmployeeInsight');

  if (!el) return;

  const range =
    managerCurrentWeekRange();

  google.script.run
    .withSuccessHandler(data => {
      renderManagerEmployeeInsight(data || {});
    })
    .withFailureHandler(error => {
      const target =
        document.getElementById('mgrEmployeeInsight');

      if (target) {
        target.innerHTML =
          `<div class="sale-message bad" style="padding:12px 0">
             ${escapeHtml(cleanError(error))}
           </div>`;
      }
    })
    .getManagerEmployeeInsight(
      state.token,
      employeeId,
      range.start,
      range.end
    );
}


function renderManagerEmployeeInsight(data) {
  const el =
    document.getElementById('mgrEmployeeInsight');

  if (!el) return;

  const e = data.employee || {};
  const stakeholder = data.stakeholder || null;

  if (!data.employee) {
    el.innerHTML = `
      <div class="muted" style="padding:12px 0">
        No current activity row was returned for this employee.
      </div>
    `;
    return;
  }

  el.innerHTML = `
    <div class="mgr-insight-grid">
      ${managerInsightCard('Imports', number(e.import_units || 0))}
      ${managerInsightCard('Exports', number(e.export_units || 0))}
      ${managerInsightCard('Buybacks', number(e.buyback_units || 0))}
      ${managerInsightCard('Sales', number(e.sale_units || 0))}
      ${managerInsightCard('Points', number(e.activity_points || 0))}
      ${managerInsightCard(
        'Payroll Eligible',
        e.payroll_eligible === true ? 'Yes' : 'No'
      )}
    </div>

    <div class="mgr-pay-preview">
      ${managerInsightCard(
        'Projected Employee Pay',
        e.payroll_eligible === true
          ? money(e.employee_pay || 0)
          : '—'
      )}

      ${managerInsightCard(
        'Projected Stakeholder',
        stakeholder
          ? money(stakeholder.stakeholder_amount || 0)
          : '—'
      )}

      ${managerInsightCard(
        'Combined Projection',
        money(
          (e.payroll_eligible === true
            ? Number(e.employee_pay || 0)
            : 0) +
          (stakeholder
            ? Number(stakeholder.stakeholder_amount || 0)
            : 0)
        )
      )}
    </div>

    <div class="mgr-sub" style="margin-top:8px">
      Current employee pool ${money(data.employee_pool || 0)}
      · ${money(data.point_value || 0)} / point
      · live Operating Capital ${money(data.operating_capital || 0)}
    </div>
  `;
}


function managerInsightCard(label, value) {
  return `
    <div class="mgr-insight-card">
      <span>${escapeHtml(label)}</span>
      <strong>${value}</strong>
    </div>
  `;
}


function loadManagerEmployeeAudit(employeeId) {
  google.script.run
    .withSuccessHandler(rows => {
      renderManagerEmployeeAudit(
        Array.isArray(rows) ? rows : []
      );
    })
    .withFailureHandler(error => {
      const el =
        document.getElementById('mgrEmployeeAudit');

      if (el) {
        el.innerHTML =
          `<div class="sale-message bad" style="padding:12px 0">
             ${escapeHtml(cleanError(error))}
           </div>`;
      }
    })
    .getManagerEmployeeAudit(
      state.token,
      employeeId
    );
}


function renderManagerEmployeeAudit(rows) {
  const el =
    document.getElementById('mgrEmployeeAudit');

  if (!el) return;

  if (!rows.length) {
    el.innerHTML = `
      <div class="muted" style="padding:12px 0">
        No V1.1 staff changes recorded yet.
      </div>
    `;
    return;
  }

  el.innerHTML = `
    <div class="mgr-audit-list">
      ${rows.slice(0,30).map(r => {
        const summary =
          managerAuditChangeSummary(
            r.action_type,
            r.old_values || null,
            r.new_values || null
          );

        return `
          <div class="mgr-audit-row">
            <div class="mgr-audit-title">
              ${escapeHtml(managerAuditActionLabel(r.action_type))}
            </div>

            ${summary
              ? `<div class="mgr-audit-change">${escapeHtml(summary)}</div>`
              : ''}

            <div class="mgr-audit-meta">
              ${escapeHtml(r.actor_employee_name || 'Unknown')}
              · ${formatLogDate(r.created_at)}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}


function managerAuditActionLabel(action) {
  if (action === 'CREATE_EMPLOYEE') return 'Employee created';
  if (action === 'UPDATE_EMPLOYEE') return 'Employee updated';
  if (action === 'RESET_PASSWORD') return 'Password reset';
  return action || 'Staff change';
}


function managerAuditChangeSummary(action, oldV, newV) {
  if (action === 'RESET_PASSWORD') {
    return 'Portal password changed.';
  }

  if (action === 'CREATE_EMPLOYEE') {
    const bits = [];

    if (newV && newV.role) {
      bits.push('Role: ' + newV.role);
    }

    if (newV && Number(newV.stakeholder_percent || 0) > 0) {
      bits.push(
        'Stakeholder: ' +
        percent(newV.stakeholder_percent)
      );
    }

    bits.push(
      'Employee pool: ' +
      (newV && newV.payroll_eligible === true ? 'Yes' : 'No')
    );

    return bits.join(' · ');
  }

  if (!oldV || !newV) {
    return '';
  }

  const changes = [];

  managerAuditTextChange(changes, 'Name', oldV.employee_name, newV.employee_name);
  managerAuditTextChange(changes, 'Discord', oldV.discord, newV.discord);
  managerAuditTextChange(changes, 'Role', oldV.role, newV.role);

  managerAuditBoolChange(changes, 'Active', oldV.active, newV.active);
  managerAuditBoolChange(changes, 'Portal', oldV.portal_enabled, newV.portal_enabled);
  managerAuditBoolChange(changes, 'Employee Pool', oldV.payroll_eligible, newV.payroll_eligible);

  managerAuditNumberChange(
    changes,
    'Stakeholder',
    oldV.stakeholder_percent,
    newV.stakeholder_percent,
    '%'
  );

  managerAuditPermissionChange(changes, 'Sell', oldV.can_sell, newV.can_sell);
  managerAuditPermissionChange(changes, 'Import', oldV.can_import, newV.can_import);
  managerAuditPermissionChange(changes, 'Buyback', oldV.can_buyback, newV.can_buyback);
  managerAuditPermissionChange(changes, 'Export', oldV.can_export, newV.can_export);
  managerAuditPermissionChange(changes, 'Accounts', oldV.can_view_accounts, newV.can_view_accounts);
  managerAuditPermissionChange(changes, 'Payroll', oldV.can_manage_payroll, newV.can_manage_payroll);
  managerAuditPermissionChange(changes, 'Stock', oldV.can_manage_stock, newV.can_manage_stock);
  managerAuditPermissionChange(changes, 'Vehicles', oldV.can_manage_vehicles, newV.can_manage_vehicles);
  managerAuditPermissionChange(changes, 'Users', oldV.can_manage_users, newV.can_manage_users);

  return changes.length
    ? changes.join(' · ')
    : 'Record saved with no visible configuration difference.';
}


function managerAuditTextChange(changes, label, oldValue, newValue) {
  const a = String(oldValue || '');
  const b = String(newValue || '');

  if (a !== b) {
    changes.push(
      label + ': ' + (a || '—') + ' → ' + (b || '—')
    );
  }
}


function managerAuditBoolChange(changes, label, oldValue, newValue) {
  const a = oldValue === true;
  const b = newValue === true;

  if (a !== b) {
    changes.push(
      label + ': ' + (a ? 'Yes' : 'No') + ' → ' + (b ? 'Yes' : 'No')
    );
  }
}


function managerAuditNumberChange(changes, label, oldValue, newValue, suffix) {
  const a = Number(oldValue || 0);
  const b = Number(newValue || 0);

  if (a !== b) {
    changes.push(
      label + ': ' + a + (suffix || '') +
      ' → ' + b + (suffix || '')
    );
  }
}


function managerAuditPermissionChange(changes, label, oldValue, newValue) {
  const a = oldValue === true;
  const b = newValue === true;

  if (a !== b) {
    changes.push(
      label + ' permission ' +
      (b ? 'enabled' : 'disabled')
    );
  }
}

// ============================================================
// MONDAY SETTLEMENT + PAYROLL V1
// ============================================================

const payrollState = {
  weekStart: '',
  weekEnd: '',
  preview: null,
  config: null,
  history: []
};


function loadPayroll() {
  calculatePayrollWeek();

  document.getElementById('content').innerHTML = `
    <div class="page-title">
      <div>
        <h1>Monday Payroll</h1>
        <div class="muted" style="margin-top:5px">
          Weekly operating float, rainy-day reserve, stakeholder distributions
          and activity-based employee pay.
        </div>
      </div>
    </div>

    <div class="pay-toolbar">
      <div>
        <div class="pay-period" id="payrollPeriodLabel"></div>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="add-row-btn"
                onclick="shiftPayrollWeek(-1)">
          ‹ PREVIOUS WEEK
        </button>

        <button class="add-row-btn"
                onclick="goCurrentPayrollWeek()">
          CURRENT PAY WEEK
        </button>

        <button id="payrollNextWeek"
                class="add-row-btn"
                onclick="shiftPayrollWeek(1)">
          NEXT WEEK ›
        </button>

        <button class="add-row-btn"
                onclick="refreshPayrollPage()">
          REFRESH
        </button>
      </div>
    </div>

    <div id="payrollBody">
      <div class="placeholder">
        <h3>Loading Monday settlement…</h3>
      </div>
    </div>
  `;

  fetchPayrollAll();
}


function calculatePayrollWeek() {
  const current = pdmFinancialWeekFor(new Date());

  // Monday payday settles the immediately completed financial week.
  const weekEnd = new Date(current.start);
  const weekStart = new Date(current.start);

  weekStart.setUTCDate(
    weekStart.getUTCDate() - 7
  );

  payrollState.weekStart =
    weekStart.toISOString();

  payrollState.weekEnd =
    weekEnd.toISOString();

  updatePayrollWeekNav();
}


function shiftPayrollWeek(direction) {
  const start = new Date(payrollState.weekStart);
  const end = new Date(payrollState.weekEnd);

  start.setUTCDate(start.getUTCDate() + (7 * direction));
  end.setUTCDate(end.getUTCDate() + (7 * direction));

  payrollState.weekStart = start.toISOString();
  payrollState.weekEnd = end.toISOString();

  updatePayrollWeekNav();
  fetchPayrollAll();
}


function goCurrentPayrollWeek() {
  calculatePayrollWeek();
  fetchPayrollAll();
}


function updatePayrollWeekNav() {
  const current = pdmFinancialWeekFor(new Date());
  const latestPayWeekStart = new Date(current.start);
  latestPayWeekStart.setUTCDate(
    latestPayWeekStart.getUTCDate() - 7
  );

  const selectedStart =
    new Date(payrollState.weekStart);

  const next =
    document.getElementById('payrollNextWeek');

  if (next) {
    next.disabled =
      selectedStart.getTime() >= latestPayWeekStart.getTime();
  }
}

function fetchPayrollAll() {
  showPageLoader(true);

  let previewDone = false;
  let configDone = false;
  let historyDone = false;

  const finish = () => {
    if (!previewDone || !configDone || !historyDone) {
      return;
    }

    showPageLoader(false);
    renderPayroll();
  };

  google.script.run
    .withSuccessHandler(data => {
      payrollState.preview = data || {};
      previewDone = true;
      finish();
    })
    .withFailureHandler(handleServerError)
    .getPayrollPreview(
      state.token,
      payrollState.weekStart,
      payrollState.weekEnd
    );

  google.script.run
    .withSuccessHandler(data => {
      payrollState.config = data || {};
      configDone = true;
      finish();
    })
    .withFailureHandler(handleServerError)
    .getPayrollConfiguration(state.token);

  google.script.run
    .withSuccessHandler(rows => {
      payrollState.history =
        Array.isArray(rows) ? rows : [];

      historyDone = true;
      finish();
    })
    .withFailureHandler(handleServerError)
    .getPayrollHistory(state.token);
}


function refreshPayrollPage() {
  fetchPayrollAll();
}


function payrollLiquidityText(p) {
  if (p.projected_operating_capital == null || p.proposed_distribution == null) return '';
  const stamp = p.liquidity_as_of ? ' As of ' + formatLogDate(p.liquidity_as_of) + '.' : '';
  const heading = p.is_snapshot ? 'Liquidity estimate saved at finalisation.' : 'Liquidity estimate.';
  return heading + stamp + '\nProposed payments (including rainy day): ' + money(p.proposed_distribution) +
    '\nProjected operating capital: ' + money(p.projected_operating_capital) +
    (p.liquidity_warning === true
      ? '\nWARNING: Below protected float by ' + money(p.protected_float_shortfall || 0) + '. This warning does not change the calculated allocations.'
      : '\nProtected float maintained; headroom ' + money(Number(p.projected_operating_capital) - Number(p.protected_float || 0)) + '.') +
    (p.is_snapshot ? '\nThis saved estimate is not a fresh cash-balance check.' : '');
}

function renderPayrollLiquidity(p) {
  const text = payrollLiquidityText(p);
  if (!text) return '';
  return '<div class="' + (p.liquidity_warning === true ? 'pay-warning' : 'pay-note') +
    '" style="white-space:pre-line;margin:12px 0">' + escapeHtml(text) + '</div>';
}

function renderPayroll() {
  const p = payrollState.preview || {};
  const settings = p.settings || {};
  const existing = p.existing_settlement || null;
  const legacy = p.calculation_basis === 'LEGACY_POST_FLOAT' ||
    (!!existing && p.realized_profit == null);
  const profitBase = Number(p.profit_base ?? p.post_float_profit ?? 0);
  const profit = legacy ? profitBase : Number(p.realized_profit ?? profitBase);

  const selectedWeekIsHistorical =
    new Date(payrollState.weekEnd).getTime() <
    pdmFinancialWeekFor(new Date()).start.getTime();

  const start =
    new Date(p.week_start || payrollState.weekStart);

  const end =
    new Date(p.week_end || payrollState.weekEnd);

  setText(
    'payrollPeriodLabel',
    'Pay period · ' +
      start.toLocaleDateString('en-GB') +
      ' 12:00 UTC – ' +
      end.toLocaleDateString('en-GB') +
      ' 12:00 UTC'
  );

  updatePayrollWeekNav();

  const allocationTotal =
    Number(p.allocation_percent_total || 0);

  const employeeRemainder =
    Number(p.employee_percent_remainder || 0);

  document.getElementById('payrollBody').innerHTML = `
    ${existing ? renderExistingSettlementBanner(existing) : ''}

    <div class="pay-grid">
      ${payrollCard(
        'Operating Capital',
        money(p.operating_capital || 0),
        existing ? 'Saved balance at finalisation' : 'Live dealership cash balance'
      )}

      ${payrollCard(
        'Protected Float',
        money(p.protected_float || 0),
        'Liquidity safeguard; does not define profit'
      )}

      ${payrollCard(
        legacy ? 'Historical Allocation Base' : 'Realised Profit',
        money(profit),
        legacy ? 'Original capital-based settlement; unchanged'
          : p.calculation_basis === 'REALIZED_SALES_PLUS_EXPORT_PROCEEDS'
            ? 'Exact sale profit + full export proceeds (rule at the time)'
            : 'Exact sale profit only; exports go to Operating Capital'
      )}

      ${payrollCard(
        'Employee Pool',
        money(p.employee_pool || 0),
        percent(employeeRemainder) + ' of allocation base'
      )}
    </div>

    <div class="pay-flow">
      <div class="pay-flow-item">
        <span>Allocation Base</span>
        <strong>${money(profitBase)}</strong>
      </div>

      <div class="pay-flow-item">
        <span>Rainy Day · ${percent(settings.rainy_day_percent || 0)}</span>
        <strong>${money(p.rainy_day_amount || 0)}</strong>
      </div>

      <div class="pay-flow-item">
        <span>Stakeholders · ${percent(p.stakeholder_percent_total || 0)}</span>
        <strong>${money(p.stakeholder_amount_total || 0)}</strong>
      </div>

      <div class="pay-flow-item">
        <span>Employees · ${percent(employeeRemainder)}</span>
        <strong>${money(p.employee_pool || 0)}</strong>
      </div>
    </div>

    ${!legacy && profitBase <= 0 ? `
      <div class="pay-warning">
        This period has no positive realised profit to allocate. The allocation base is $0, regardless of the cash balance.
      </div>
    ` : ''}

    ${legacy ? `<div class="pay-note">Historical settlement under the original capital-above-float rule. All saved amounts are unchanged.</div>` : `<div class="pay-note">Sales use their exact historical cost. Every export contributes its full cash proceeds. Imports and buybacks contribute no immediate profit. Losses are displayed, but the allocation base cannot be negative.</div>`}

    ${renderPayrollLiquidity(p)}

    ${allocationTotal > 100 ? `
      <div class="pay-warning">
        Allocation configuration exceeds 100%.
        Fix Rainy Day / stakeholder percentages before finalising payroll.
      </div>
    ` : ''}

    <div class="pay-section">
      <div class="pay-section-head">
        <div>
          <h2>Stakeholder Distribution</h2>
          <div class="pay-note">
            Rainy-day and stakeholder percentages each use the full allocation base.
            Employees share the remainder using activity points.
            Stakeholder-employees may also earn activity pay.
          </div>
        </div>
      </div>

      ${renderPayrollStakeholders(p.stakeholder_rows || [])}
    </div>

    <div class="pay-section">
      <div class="pay-section-head">
        <div>
          <h2>Employee Activity Pay</h2>
          <div class="pay-note">
            ${number(p.eligible_points || 0)} eligible points ·
            ${money(p.point_value || 0)} per point
          </div>
        </div>
      </div>

      ${renderPayrollEmployees(p.employee_rows || [])}
    </div>

    <div class="pay-actions">
      ${!existing ? `
        <button class="complete-sales-btn"
                onclick="finalizeMondaySettlement()"
                ${allocationTotal > 100 ? 'disabled' : ''}>
          FINALISE SETTLEMENT
        </button>
      ` : existing.status === 'FINALIZED' ? `
        <button class="complete-sales-btn"
                onclick="markMondaySettlementPaid('${jsString(existing.settlement_id || '')}')">
          MARK SETTLEMENT PAID
        </button>
      ` : `
        <span class="pay-status paid">PAID</span>
      `}
    </div>

    <div class="pay-section">
      <div class="pay-section-head">
        <div>
          <h2>Settlement Settings</h2>
          <div class="pay-note">
            These values drive the Accounts settlement engine.
          </div>
        </div>
      </div>

      ${renderPayrollSettings()}
    </div>

    <div class="pay-section">
      <div class="pay-section-head">
        <div>
          <h2>Employee / Stakeholder Configuration</h2>
          <div class="pay-note">
            Stakeholder percentage can coexist with employee payroll eligibility.
          </div>
        </div>
      </div>

      ${renderPayrollEmployeeConfig()}
    </div>

    <div class="pay-section">
      <div class="pay-section-head">
        <h2>Settlement History</h2>
      </div>

      ${renderPayrollHistory()}
    </div>

    ${bottomBrand()}
  `;
}


function payrollCard(label, value, sub) {
  return `
    <div class="pay-card">
      <span>${escapeHtml(label)}</span>
      <strong>${value}</strong>
      <small>${escapeHtml(sub || '')}</small>
    </div>
  `;
}


function renderExistingSettlementBanner(existing) {
  const paid =
    String(existing.status || '').toUpperCase() === 'PAID';

  return `
    <div class="${paid ? 'pay-good' : 'pay-warning'}">
      <strong>
        ${paid ? 'This settlement has been paid.' : 'This week has already been finalised.'}
      </strong>

      ${existing.finalized_by_name
        ? ` Finalised by ${escapeHtml(existing.finalized_by_name)}`
        : ''}

      ${existing.finalized_at
        ? ` on ${formatLogDate(existing.finalized_at)}.`
        : ''}

      ${paid && existing.paid_by_name
        ? ` Marked paid by ${escapeHtml(existing.paid_by_name)}`
        : ''}

      ${paid && existing.paid_at
        ? ` on ${formatLogDate(existing.paid_at)}.`
        : ''}
    </div>
  `;
}


function renderPayrollStakeholders(rows) {
  if (!rows.length) {
    return `
      <div class="placeholder">
        <p>No active stakeholder percentages configured yet.</p>
      </div>
    `;
  }

  return `
    <div class="pay-table-wrap">
      <table class="pay-table" style="min-width:700px">
        <thead>
          <tr>
            <th>Stakeholder</th>
            <th>Share</th>
            <th>Distribution</th>
            <th>Also Employee Eligible?</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td>${escapeHtml(r.employee_name || '')}</td>
              <td>${percent(r.stakeholder_percent || 0)}</td>
              <td class="pay-amount">
                ${money(r.stakeholder_amount || 0)}
              </td>
              <td>
                ${r.payroll_eligible === true ? 'Yes' : 'No'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}


function renderPayrollEmployees(rows) {
  if (!rows.length) {
    return `
      <div class="placeholder">
        <p>No active employees found.</p>
      </div>
    `;
  }

  return `
    <div class="pay-table-wrap">
      <table class="pay-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Imports</th>
            <th>Exports</th>
            <th>Buybacks</th>
            <th>Sales</th>
            <th>Points</th>
            <th>Employee Pay</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td>
                <strong>${escapeHtml(r.employee_name || '')}</strong>
                ${r.payroll_eligible !== true
                  ? '<div class="muted" style="font-size:10px">Not payroll eligible</div>'
                  : ''}
              </td>

              <td>${number(r.import_units || 0)}</td>
              <td>${number(r.export_units || 0)}</td>
              <td>${number(r.buyback_units || 0)}</td>
              <td>${number(r.sale_units || 0)}</td>
              <td>${number(r.activity_points || 0)}</td>

              <td class="${r.payroll_eligible === true ? 'pay-amount' : 'muted'}">
                ${r.payroll_eligible === true
                  ? money(r.employee_pay || 0)
                  : '—'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}


function renderPayrollSettings() {
  const cfg =
    (payrollState.config && payrollState.config.settings) ||
    (payrollState.preview && payrollState.preview.settings) ||
    {};

  return `
    <div class="card">
      <div class="pay-settings">
        <div class="pay-setting">
          <label>Protected Operating Float</label>
          <div class="pay-note">Liquidity warning threshold only; does not reduce realised profit.</div>
          <input id="paySettingFloat"
                 class="sales-input"
                 type="number"
                 min="0"
                 step="1000"
                 value="${Number(cfg.operating_float || 0)}">
        </div>

        <div class="pay-setting">
          <label>Rainy Day %</label>
          <input id="paySettingRainy"
                 class="sales-input"
                 type="number"
                 min="0"
                 max="100"
                 step="0.1"
                 value="${Number(cfg.rainy_day_percent || 0)}">
        </div>

        <div class="pay-setting">
          <label>Import Points / Vehicle</label>
          <input id="paySettingImport"
                 class="sales-input"
                 type="number"
                 min="0"
                 step="0.1"
                 value="${Number(cfg.import_points || 0)}">
        </div>

        <div class="pay-setting">
          <label>Export Points / Vehicle</label>
          <input id="paySettingExport"
                 class="sales-input"
                 type="number"
                 min="0"
                 step="0.1"
                 value="${Number(cfg.export_points || 0)}">
        </div>

        <div class="pay-setting">
          <label>Buyback Points / Vehicle</label>
          <input id="paySettingBuyback"
                 class="sales-input"
                 type="number"
                 min="0"
                 step="0.1"
                 value="${Number(cfg.buyback_points || 0)}">
        </div>

        <div class="pay-setting">
          <label>Sale Points / Vehicle</label>
          <input id="paySettingSale"
                 class="sales-input"
                 type="number"
                 min="0"
                 step="0.1"
                 value="${Number(cfg.sale_points || 0)}">
        </div>
      </div>

      <div id="paySettingsError"
           class="sale-message bad"
           style="margin-top:10px"></div>

      <div class="pay-actions">
        <button class="add-row-btn"
                onclick="saveMondayPayrollSettings()">
          SAVE SETTINGS
        </button>
      </div>
    </div>
  `;
}


function renderPayrollEmployeeConfig() {
  const rows =
    payrollState.config &&
    Array.isArray(payrollState.config.employees)
      ? payrollState.config.employees
      : [];

  if (!rows.length) {
    return `
      <div class="placeholder">
        <p>No employees found.</p>
      </div>
    `;
  }

  return `
    <div class="pay-table-wrap">
      <table class="pay-table pay-config-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Role</th>
            <th>Active</th>
            <th>Employee Pool Eligible</th>
            <th>Stakeholder %</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td>
                <strong>${escapeHtml(r.employee_name || '')}</strong>
                <div class="muted" style="font-size:10px">
                  ${escapeHtml(r.employee_code || '')}
                </div>
              </td>

              <td>${escapeHtml(r.role || '')}</td>
              <td>${r.active === true ? 'Yes' : 'No'}</td>

              <td>
                <input id="payEligible-${r.employee_id}"
                       type="checkbox"
                       ${r.payroll_eligible === true ? 'checked' : ''}>
              </td>

              <td>
                <input id="payStake-${r.employee_id}"
                       class="sales-input"
                       type="number"
                       min="0"
                       max="100"
                       step="0.1"
                       value="${Number(r.stakeholder_percent || 0)}">
              </td>

              <td>
                <button class="log-action log-restore"
                        onclick="savePayrollEmployeeConfig('${jsString(r.employee_id)}')">
                  SAVE
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}


function renderPayrollHistory() {
  const rows =
    Array.isArray(payrollState.history)
      ? payrollState.history
      : [];

  if (!rows.length) {
    return `
      <div class="placeholder">
        <p>No finalised settlements yet.</p>
      </div>
    `;
  }

  return `
    <div class="pay-table-wrap">
      <table class="pay-table">
        <thead>
          <tr>
            <th>Week</th>
            <th>Operating Capital</th>
            <th>Profit / Original Basis</th>
            <th>Rainy Day</th>
            <th>Stakeholders</th>
            <th>Employees</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => {
            const start = new Date(r.week_start);
            const end = new Date(r.week_end);

            return `
              <tr>
                <td>
                  ${start.toLocaleDateString('en-GB')}
                  –
                  ${new Date(end.getTime() - 1).toLocaleDateString('en-GB')}
                </td>

                <td>${money(r.operating_capital || 0)}</td>
                <td>
                  ${money(r.realized_profit ?? r.profit_base ?? r.post_float_profit ?? 0)}
                  <div class="muted" style="font-size:10px">${r.realized_profit == null ? 'Historical capital-based allocation' : 'Realised profit'}</div>
                </td>
                <td>${money(r.rainy_day_amount || 0)}</td>
                <td>${money(r.stakeholder_amount_total || 0)}</td>
                <td>${money(r.employee_pool || 0)}</td>

                <td>
                  <span class="pay-status ${String(r.status || '').toLowerCase()}">
                    ${escapeHtml(r.status || '')}
                  </span>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}


function saveMondayPayrollSettings() {
  const err =
    document.getElementById('paySettingsError');

  if (err) err.textContent = '';

  const payload = {
    operating_float:
      Number(document.getElementById('paySettingFloat')?.value || 0),

    rainy_day_percent:
      Number(document.getElementById('paySettingRainy')?.value || 0),

    import_points:
      Number(document.getElementById('paySettingImport')?.value || 0),

    export_points:
      Number(document.getElementById('paySettingExport')?.value || 0),

    buyback_points:
      Number(document.getElementById('paySettingBuyback')?.value || 0),

    sale_points:
      Number(document.getElementById('paySettingSale')?.value || 0)
  };

  if (!confirm(
    `Save Monday settlement settings?

Protected Float: ${money(payload.operating_float)}
Rainy Day: ${percent(payload.rainy_day_percent)}

Points:
Import ${payload.import_points}
Export ${payload.export_points}
Buyback ${payload.buyback_points}
Sale ${payload.sale_points}`
  )) {
    return;
  }

  showPageLoader(true);

  google.script.run
    .withSuccessHandler(() => {
      showPageLoader(false);
      fetchPayrollAll();
    })
    .withFailureHandler(error => {
      showPageLoader(false);
      if (err) err.textContent = cleanError(error);
    })
    .savePayrollSettings(
      state.token,
      payload
    );
}


function savePayrollEmployeeConfig(employeeId) {
  const eligible =
    document.getElementById('payEligible-' + employeeId)?.checked === true;

  const stake =
    Number(
      document.getElementById('payStake-' + employeeId)?.value || 0
    );

  if (!Number.isFinite(stake) || stake < 0 || stake > 100) {
    alert('Stakeholder percentage must be between 0 and 100.');
    return;
  }

  showPageLoader(true);

  google.script.run
    .withSuccessHandler(() => {
      showPageLoader(false);
      fetchPayrollAll();
    })
    .withFailureHandler(handleServerError)
    .saveEmployeeCompensation(
      state.token,
      employeeId,
      eligible,
      stake
    );
}


function finalizeMondaySettlement() {
  const p = payrollState.preview || {};

  const text =
    `Finalise this Monday settlement?

Operating Capital: ${money(p.operating_capital || 0)}
Protected Float: ${money(p.protected_float || 0)}
Realised Profit: ${money(p.realized_profit ?? p.profit_base ?? p.post_float_profit ?? 0)}
Allocation Base: ${money(p.profit_base ?? p.post_float_profit ?? 0)}

Rainy Day: ${money(p.rainy_day_amount || 0)}
Stakeholders: ${money(p.stakeholder_amount_total || 0)}
Employee Pool: ${money(p.employee_pool || 0)}

${payrollLiquidityText(p)}

Exact sale profit only; export proceeds go to Operating Capital. The float is a liquidity safeguard only.
This freezes a permanent snapshot of the week's settlement calculations.`;

  if (!confirm(text)) return;

  showPageLoader(true);

  google.script.run
    .withSuccessHandler(() => {
      showPageLoader(false);
      fetchPayrollAll();
    })
    .withFailureHandler(handleServerError)
    .finalizePayrollSettlement(
      state.token,
      payrollState.weekStart,
      payrollState.weekEnd
    );
}


function markMondaySettlementPaid(settlementId) {
  if (!confirm(
    'Mark this settlement PAID? Use this only after the Rainy Day transfer, stakeholder distributions and employee payments have actually been completed.'
  )) {
    return;
  }

  showPageLoader(true);

  google.script.run
    .withSuccessHandler(() => {
      showPageLoader(false);
      fetchPayrollAll();
    })
    .withFailureHandler(handleServerError)
    .markPayrollSettlementPaid(
      state.token,
      settlementId
    );
}


// ============================================================
// CUSTOMERS V1
// ============================================================

const customerState = {
  rows: [],
  summary: {},
  search: '',
  status: 'ALL'
};


function loadCustomers() {
  showPageLoader(true);

  google.script.run
    .withSuccessHandler(data => {
      showPageLoader(false);

      customerState.rows =
        data && Array.isArray(data.customers)
          ? data.customers
          : [];

      customerState.summary =
        data && data.summary
          ? data.summary
          : {};

      renderCustomers();
    })
    .withFailureHandler(handleServerError)
    .getCustomersDirectory(state.token);
}


function renderCustomers() {
  const s = customerState.summary || {};

  document.getElementById('content').innerHTML = `
    <div class="page-title">
      <div>
        <h1>Customers</h1>
        <div class="muted" style="margin-top:5px">
          Customer relationships, transaction history and dealership notes.
        </div>
      </div>

      <button class="add-row-btn"
              onclick="openAddCustomer()">
        + ADD CUSTOMER
      </button>
    </div>

    <div class="cust-summary">
      ${customerSummaryCard(
        'Customers',
        number(s.customer_count || 0)
      )}

      ${customerSummaryCard(
        'VIP',
        number(s.vip_count || 0)
      )}

      ${customerSummaryCard(
        'Vehicles Purchased',
        number(s.vehicles_bought || 0)
      )}

      ${customerSummaryCard(
        'Lifetime Sales Revenue',
        money(s.lifetime_sales_revenue || 0)
      )}
    </div>

    <div class="cust-toolbar">
      <div class="cust-filters">
        <div class="cust-filter cust-search">
          <label>Search</label>
          <input class="sales-input"
                 value="${escapeHtml(customerState.search)}"
                 placeholder="Customer, Discord or contact…"
                 oninput="setCustomerSearch(this.value)">
        </div>

        <div class="cust-filter">
          <label>Status</label>
          <select class="sales-input"
                  onchange="setCustomerStatus(this.value)">
            <option value="ALL"
              ${customerState.status === 'ALL' ? 'selected' : ''}>
              All Customers
            </option>

            <option value="REGULAR"
              ${customerState.status === 'REGULAR' ? 'selected' : ''}>
              Regular
            </option>

            <option value="VIP"
              ${customerState.status === 'VIP' ? 'selected' : ''}>
              VIP
            </option>

            <option value="FLAGGED"
              ${customerState.status === 'FLAGGED' ? 'selected' : ''}>
              Flagged
            </option>
          </select>
        </div>
      </div>

      <div id="customerCount" class="muted"></div>
    </div>

    <div class="cust-table-wrap">
      <table class="cust-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Status</th>
            <th>Bought</th>
            <th>Total Spend</th>
            <th>Sold Back</th>
            <th>Buyback Value</th>
            <th>Notes</th>
            <th>Last Transaction</th>
          </tr>
        </thead>

        <tbody id="customerRows"></tbody>
      </table>
    </div>

    ${bottomBrand()}
  `;

  renderCustomerRows();
}


function customerSummaryCard(label, value) {
  return `
    <div class="cust-summary-card">
      <span>${escapeHtml(label)}</span>
      <strong>${value}</strong>
    </div>
  `;
}


function setCustomerSearch(value) {
  customerState.search = value || '';
  renderCustomerRows();
}


function setCustomerStatus(value) {
  customerState.status = value || 'ALL';
  renderCustomerRows();
}


function renderCustomerRows() {
  const tbody =
    document.getElementById('customerRows');

  if (!tbody) return;

  const q =
    String(customerState.search || '')
      .trim()
      .toLowerCase();

  const rows =
    customerState.rows.filter(r => {
      if (customerState.status !== 'ALL') {
        if (
          String(r.customer_status || '').toUpperCase() !==
          customerState.status
        ) {
          return false;
        }
      }

      if (!q) return true;

      return [
        r.customer_name,
        r.discord,
        r.preferred_contact
      ].some(v =>
        String(v || '').toLowerCase().includes(q)
      );
    });

  setText(
    'customerCount',
    number(rows.length) +
      ' customer' +
      (rows.length === 1 ? '' : 's')
  );

  if (!rows.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8"
            class="muted"
            style="text-align:center;padding:34px">
          No customers match these filters.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML =
    rows.map(r => `
      <tr onclick="openCustomer('${jsString(r.customer_id)}')">
        <td>
          <div class="cust-name">
            ${escapeHtml(r.customer_name || '')}
          </div>

          <div class="cust-sub">
            ${escapeHtml(
              r.discord ||
              r.preferred_contact ||
              ''
            )}
          </div>
        </td>

        <td>
          ${customerStatusChip(r.customer_status)}
        </td>

        <td>
          ${number(r.vehicles_bought || 0)}
        </td>

        <td>
          ${money(r.total_spend || 0)}
        </td>

        <td>
          ${number(r.vehicles_sold_back || 0)}
        </td>

        <td>
          ${money(r.total_buyback_value || 0)}
        </td>

        <td>
          ${number(r.note_count || 0)}
        </td>

        <td>
          ${r.last_transaction
            ? formatLogDate(r.last_transaction)
            : '<span class="muted">No transactions</span>'}
        </td>
      </tr>
    `).join('');
}


function customerStatusChip(status) {
  const value =
    String(status || 'REGULAR').toUpperCase();

  return `
    <span class="cust-status ${value.toLowerCase()}">
      ${escapeHtml(value)}
    </span>
  `;
}


function openCustomer(customerId) {
  showPageLoader(true);

  google.script.run
    .withSuccessHandler(data => {
      showPageLoader(false);
      renderCustomerDrawer(data || {});
    })
    .withFailureHandler(handleServerError)
    .getCustomerDetail(
      state.token,
      customerId
    );
}


function renderCustomerDrawer(data) {
  document.getElementById('customerDrawer')?.remove();

  const p = data.profile || {};
  const activity =
    Array.isArray(data.activity)
      ? data.activity
      : [];

  const notes =
    Array.isArray(data.notes)
      ? data.notes
      : [];

  const sales =
    activity.filter(a => a.activity_type === 'SALE');

  const buybacks =
    activity.filter(a => a.activity_type === 'BUYBACK');

  const spent =
    sales.reduce(
      (sum,r) => sum + Number(r.amount || 0),
      0
    );

  const bought =
    sales.reduce(
      (sum,r) => sum + Number(r.quantity || 0),
      0
    );

  const soldBack =
    buybacks.reduce(
      (sum,r) => sum + Number(r.quantity || 0),
      0
    );

  const received =
    buybacks.reduce(
      (sum,r) => sum + Number(r.amount || 0),
      0
    );

  const backdrop =
    document.createElement('div');

  backdrop.id = 'customerDrawer';
  backdrop.className = 'cust-drawer-backdrop';

  backdrop.innerHTML = `
    <div class="cust-drawer">
      <div class="cust-drawer-head">
        <div>
          <h2>${escapeHtml(p.customer_name || '')}</h2>
          <div style="margin-top:7px">
            ${customerStatusChip(p.customer_status)}
          </div>
        </div>

        <button class="stock-close"
                onclick="closeCustomerDrawer()">
          ×
        </button>
      </div>

      <div class="cust-metrics">
        ${customerMetric('Vehicles Bought', number(bought))}
        ${customerMetric('Total Spend', money(spent))}
        ${customerMetric('Sold Back', number(soldBack))}
        ${customerMetric('Buyback Value', money(received))}
      </div>

      <div class="cust-profile-grid">
        <div class="cust-field">
          <label>Customer Name</label>
          <input class="sales-input vm-readonly"
                 value="${escapeHtml(p.customer_name || '')}"
                 disabled>
        </div>

        <div class="cust-field">
          <label>Status</label>
          <select id="custEditStatus"
                  class="sales-input">
            ${customerStatusOptions(p.customer_status)}
          </select>
        </div>

        <div class="cust-field">
          <label>Discord</label>
          <input id="custEditDiscord"
                 class="sales-input"
                 value="${escapeHtml(p.discord || '')}">
        </div>

        <div class="cust-field">
          <label>Preferred Contact / Notes</label>
          <input id="custEditContact"
                 class="sales-input"
                 value="${escapeHtml(p.preferred_contact || '')}">
        </div>
      </div>

      <div style="margin-top:12px">
        <label class="mgr-check"
               style="display:inline-flex">
          <input id="custEditActive"
                 type="checkbox"
                 ${p.active !== false ? 'checked' : ''}>
          Active Customer Profile
        </label>
      </div>

      <div id="custEditError"
           class="sale-message bad"
           style="margin-top:10px"></div>

      <div class="cust-actions">
        <button class="add-row-btn"
                onclick="saveCustomerProfile('${jsString(p.customer_id || '')}')">
          SAVE PROFILE
        </button>
      </div>

      <div class="cust-section">
        <div class="cust-section-label">Customer Notes</div>

        <div class="cust-note-box">
          <textarea id="custNewNote"
                    placeholder="Add a dealership note…"></textarea>

          <button class="add-row-btn"
                  onclick="submitCustomerNote('${jsString(p.customer_id || '')}')">
            ADD NOTE
          </button>
        </div>

        <div id="custNoteError"
             class="sale-message bad"
             style="margin-top:8px"></div>

        <div style="margin-top:8px">
          ${renderCustomerNotes(notes)}
        </div>
      </div>

      <div class="cust-section">
        <div class="cust-section-label">Transaction History</div>
        ${renderCustomerHistory(activity)}
      </div>

      <div class="cust-section">
        <div class="cust-section-label">Enquiries</div>

        <div class="muted" style="font-size:12px;line-height:1.5">
          ${Array.isArray(data.enquiries) && data.enquiries.length
            ? number(data.enquiries.length) + ' enquiry records.'
            : 'No enquiries yet. The database structure is ready for the public showroom enquiry flow in Customers V1.1.'}
        </div>
      </div>
    </div>
  `;

  backdrop.addEventListener('click', event => {
    if (event.target === backdrop) {
      closeCustomerDrawer();
    }
  });

  document.body.appendChild(backdrop);
}


function customerMetric(label, value) {
  return `
    <div class="cust-metric">
      <span>${escapeHtml(label)}</span>
      <strong>${value}</strong>
    </div>
  `;
}


function customerStatusOptions(current) {
  const value =
    String(current || 'REGULAR').toUpperCase();

  return [
    ['REGULAR','Regular'],
    ['VIP','VIP'],
    ['FLAGGED','Flagged']
  ].map(([v,label]) => `
    <option value="${v}"
            ${v === value ? 'selected' : ''}>
      ${label}
    </option>
  `).join('');
}


function renderCustomerNotes(notes) {
  if (!notes.length) {
    return `
      <div class="muted" style="padding:12px 0">
        No customer notes yet.
      </div>
    `;
  }

  return notes.map(n => `
    <div class="cust-note">
      <div>${escapeHtml(n.note || '')}</div>

      <div class="cust-note-meta">
        ${escapeHtml(n.created_by_name || 'Unknown')}
        · ${formatLogDate(n.created_at)}
      </div>
    </div>
  `).join('');
}


function renderCustomerHistory(rows) {
  if (!rows.length) {
    return `
      <div class="muted" style="padding:12px 0">
        No completed sale or buyback history.
      </div>
    `;
  }

  return `
    <div style="overflow:auto">
      <table class="cust-history">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Vehicle</th>
            <th>Qty</th>
            <th>Amount</th>
            <th>Employee</th>
            <th>Ref</th>
          </tr>
        </thead>

        <tbody>
          ${rows.map(r => `
            <tr>
              <td>${formatLogDate(r.activity_date)}</td>
              <td>${escapeHtml(r.activity_type || '')}</td>
              <td>${escapeHtml(r.vehicle_name || '')}</td>
              <td>${number(r.quantity || 0)}</td>
              <td>${money(r.amount || 0)}</td>
              <td>${escapeHtml(r.employee_name || '')}</td>
              <td>${escapeHtml(r.transaction_ref || '')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}


function saveCustomerProfile(customerId) {
  const err =
    document.getElementById('custEditError');

  if (err) err.textContent = '';

  const payload = {
    discord:
      document.getElementById('custEditDiscord')?.value.trim() || '',

    preferred_contact:
      document.getElementById('custEditContact')?.value.trim() || '',

    customer_status:
      document.getElementById('custEditStatus')?.value || 'REGULAR',

    active:
      document.getElementById('custEditActive')?.checked === true
  };

  showPageLoader(true);

  google.script.run
    .withSuccessHandler(() => {
      showPageLoader(false);
      closeCustomerDrawer();
      loadCustomers();
    })
    .withFailureHandler(error => {
      showPageLoader(false);

      if (err) {
        err.textContent = cleanError(error);
      }
    })
    .updateCustomerProfile(
      state.token,
      customerId,
      payload
    );
}


function submitCustomerNote(customerId) {
  const note =
    document.getElementById('custNewNote')?.value.trim() || '';

  const err =
    document.getElementById('custNoteError');

  if (err) err.textContent = '';

  if (!note) {
    if (err) err.textContent = 'Enter a note first.';
    return;
  }

  showPageLoader(true);

  google.script.run
    .withSuccessHandler(() => {
      showPageLoader(false);
      openCustomer(customerId);
    })
    .withFailureHandler(error => {
      showPageLoader(false);

      if (err) {
        err.textContent = cleanError(error);
      }
    })
    .addCustomerNote(
      state.token,
      customerId,
      note
    );
}


function openAddCustomer() {
  document.getElementById('customerDrawer')?.remove();

  const backdrop =
    document.createElement('div');

  backdrop.id = 'customerDrawer';
  backdrop.className = 'cust-drawer-backdrop';

  backdrop.innerHTML = `
    <div class="cust-drawer">
      <div class="cust-drawer-head">
        <div>
          <h2>Add Customer</h2>
          <div class="muted" style="margin-top:5px">
            Creates a CRM profile. No transaction is created.
          </div>
        </div>

        <button class="stock-close"
                onclick="closeCustomerDrawer()">
          ×
        </button>
      </div>

      <div class="cust-profile-grid">
        <div class="cust-field">
          <label>Customer Name</label>
          <input id="custAddName"
                 class="sales-input">
        </div>

        <div class="cust-field">
          <label>Status</label>
          <select id="custAddStatus"
                  class="sales-input">
            ${customerStatusOptions('REGULAR')}
          </select>
        </div>

        <div class="cust-field">
          <label>Discord</label>
          <input id="custAddDiscord"
                 class="sales-input">
        </div>

        <div class="cust-field">
          <label>Preferred Contact / Notes</label>
          <input id="custAddContact"
                 class="sales-input">
        </div>
      </div>

      <div id="custAddError"
           class="sale-message bad"
           style="margin-top:12px"></div>

      <div class="cust-actions">
        <button class="modal-cancel"
                onclick="closeCustomerDrawer()">
          CANCEL
        </button>

        <button class="add-row-btn"
                onclick="submitNewCustomer()">
          ADD CUSTOMER
        </button>
      </div>
    </div>
  `;

  backdrop.addEventListener('click', event => {
    if (event.target === backdrop) {
      closeCustomerDrawer();
    }
  });

  document.body.appendChild(backdrop);
}


function submitNewCustomer() {
  const err =
    document.getElementById('custAddError');

  if (err) err.textContent = '';

  const payload = {
    customer_name:
      document.getElementById('custAddName')?.value.trim() || '',

    discord:
      document.getElementById('custAddDiscord')?.value.trim() || '',

    preferred_contact:
      document.getElementById('custAddContact')?.value.trim() || '',

    customer_status:
      document.getElementById('custAddStatus')?.value || 'REGULAR'
  };

  if (!payload.customer_name) {
    if (err) err.textContent = 'Customer name is required.';
    return;
  }

  showPageLoader(true);

  google.script.run
    .withSuccessHandler(() => {
      showPageLoader(false);
      closeCustomerDrawer();
      loadCustomers();
    })
    .withFailureHandler(error => {
      showPageLoader(false);

      if (err) {
        err.textContent = cleanError(error);
      }
    })
    .createCustomerProfile(
      state.token,
      payload
    );
}


function closeCustomerDrawer() {
  document.getElementById('customerDrawer')?.remove();
}


// ============================================================
// OPERATING CAPITAL LEDGER V1.1
// ============================================================

function openOperatingCapitalReconcile() {
  const current =
    accountsState.data &&
    accountsState.data.operating_capital
      ? Number(
          accountsState.data.operating_capital.current_balance || 0
        )
      : 0;

  const value =
    prompt(
      'Enter the ACTUAL current PDM dealership-account balance.',
      String(Math.round(current))
    );

  if (value === null) return;

  const balance =
    Number(String(value).replace(/[$,\s]/g,''));

  if (!Number.isFinite(balance) || balance < 0) {
    alert('Enter a valid balance of 0 or more.');
    return;
  }

  const reason =
    prompt(
      'Reason for reconciling Operating Capital:',
      'Reconcile to live dealership account'
    );

  if (reason === null) return;

  if (!String(reason).trim()) {
    alert('A reconciliation reason is required.');
    return;
  }

  if (!confirm(
    `Reset the Operating Capital baseline?

Current displayed balance: ${money(current)}
New live account balance: ${money(balance)}

All future Sales / Exports / Imports / Buybacks and paid Monday settlements will move from this new baseline.

Existing historical transactions are not rewritten.`
  )) {
    return;
  }

  showPageLoader(true);

  google.script.run
    .withSuccessHandler(() => {
      showPageLoader(false);
      fetchAccounts();
    })
    .withFailureHandler(handleServerError)
    .setOperatingCapitalBaseline(
      state.token,
      balance,
      String(reason).trim()
    );
}
