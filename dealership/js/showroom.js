  const state={
  page:'home',
  mode:'buy',
  catalogue:[],
  spotlight:null,
  spotlightCategory:'ALL',
  spotlightIndex:{pick:0,arrival:0,popular:0},
  spotlightPaused:{pick:false,arrival:false,popular:false},
  spotlightTimers:[]
};

function jsString(v){
  return String(v??'')
    .replaceAll('\\','\\\\')
    .replaceAll("'","\\'")
    .replaceAll('\n','\\n')
    .replaceAll('\r','');
}

function vehiclePhotoHtml(v) {
  const primary = String(v.image_url || '').trim();
  const alt = String(v.alt_image_url || '').trim();

  if (!primary) return '';

  return `
    <div class="vehicle-photo" data-photo-index="0">

      <img
        class="vehicle-photo-primary"
        src="${escapeHtml(primary)}"
        alt="${escapeHtml(v.display_name || 'Vehicle')}"
        loading="lazy"
        onerror="this.parentElement.remove()">

      ${
        alt
          ? `
            <img
              class="vehicle-photo-alt"
              src="${escapeHtml(alt)}"
              alt="${escapeHtml(v.display_name || 'Vehicle')} alternate"
              style="display:none"
              onload="vehicleAltLoaded(this)"
              onerror="vehicleAltFailed(this)">
          `
          : ''
      }

      <button
        class="photo-arrow photo-prev"
        type="button"
        style="display:none"
        onclick="event.stopPropagation();changeVehiclePhoto(this)">
        ‹
      </button>

      <button
        class="photo-arrow photo-next"
        type="button"
        style="display:none"
        onclick="event.stopPropagation();changeVehiclePhoto(this)">
        ›
      </button>

      <div class="photo-dots" style="display:none">
        <span class="photo-dot active"></span>
        <span class="photo-dot"></span>
      </div>

      <button
        class="photo-expand"
        type="button"
        onclick="event.stopPropagation();openCurrentVehiclePhoto(
          this,
          '${jsString(v.display_name || 'Vehicle')}'
        )">
        ⛶
      </button>

    </div>
  `;
}

function vehicleAltLoaded(img) {
  const wrap = img.closest('.vehicle-photo');
  if (!wrap) return;

  wrap.querySelectorAll('.photo-arrow')
    .forEach(button => {
      button.style.display = 'block';
    });

  const dots = wrap.querySelector('.photo-dots');
  if (dots) dots.style.display = 'flex';
}

function vehicleAltFailed(img) {
  img.remove();
}


function changeVehiclePhoto(button) {
  const wrap = button.closest('.vehicle-photo');
  if (!wrap) return;

  const primary =
    wrap.querySelector('.vehicle-photo-primary');

  const alt =
    wrap.querySelector('.vehicle-photo-alt');

  if (!primary || !alt) return;

  const current =
    Number(wrap.dataset.photoIndex || 0);

  const next =
    current === 0 ? 1 : 0;

  wrap.dataset.photoIndex = String(next);

  primary.style.display =
    next === 0 ? 'block' : 'none';

  alt.style.display =
    next === 1 ? 'block' : 'none';

  const dots =
    wrap.querySelectorAll('.photo-dot');

  dots.forEach((dot, index) => {
    dot.classList.toggle(
      'active',
      index === next
    );
  });
}


function openCurrentVehiclePhoto(button, vehicleName) {
  const wrap =
    button.closest('.vehicle-photo');

  if (!wrap) return;

  const index =
    Number(wrap.dataset.photoIndex || 0);

  const img =
    index === 1
      ? wrap.querySelector('.vehicle-photo-alt')
      : wrap.querySelector('.vehicle-photo-primary');

  if (!img || !img.src) return;

  openVehiclePhoto(
    img.src,
    vehicleName
  );
}

function openVehiclePhoto(url, vehicleName) {
  if (!url) return;

  const modal =
    document.getElementById('photoModal');

  const img =
    document.getElementById('photoModalImage');

  const title =
    document.getElementById('photoModalTitle');

  if (!modal || !img || !title) return;

  img.src = url;
  img.alt = vehicleName || 'Vehicle';
  title.textContent = vehicleName || 'Vehicle';

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeVehiclePhoto(){
  document.getElementById('photoModal')?.classList.add('hidden');
  document.body.style.overflow='';
}

function initialisePublicPortal() {
  google.script.run
    .withSuccessHandler(data => {
      state.catalogue =
        Array.isArray(data.catalogue) ? data.catalogue : [];

      populateCategories();

      if (data.updated_at) {
        const d = new Date(data.updated_at);
        document.getElementById('updatedAt').textContent =
          'Updated ' +
          d.toLocaleString('en-GB', {
            day:'2-digit',
            month:'short',
            hour:'2-digit',
            minute:'2-digit'
          });
      }

      applyFilters();
      renderSpotlightCategories();
      renderAllSpotlights();
    })
    .withFailureHandler(err => {
      document.getElementById('catalogue').innerHTML =
        `<div class="empty">Could not load the showroom.<br><br>${escapeHtml(cleanError(err))}</div>`;
    })
    .getPublicDealershipCatalogue();

  google.script.run
    .withSuccessHandler(data => {
      state.spotlight = data || {
        categories:[],
        picks:[],
        arrivals:[],
        popular:[]
      };

      renderSpotlightCategories();
      renderAllSpotlights();
      startSpotlightRotation();
    })
    .withFailureHandler(err => {
      console.warn('Spotlight unavailable:', cleanError(err));
      state.spotlight = {
        categories:[],
        picks:[],
        arrivals:[],
        popular:[]
      };
      renderAllSpotlights();
    })
    .getPublicSpotlight();
}

initialisePublicPortal();


function setPage(page) {
  const target =
    page === 'sell' ? 'sell' :
    page === 'buy' ? 'buy' :
    'home';

  state.page = target;

  const homePage = document.getElementById('homePage');
  const cataloguePage = document.getElementById('cataloguePage');

  if (homePage) {
    homePage.classList.toggle('hidden', target !== 'home');
  }

  if (cataloguePage) {
    cataloguePage.classList.toggle('hidden', target === 'home');
  }

  document.getElementById('homeTab')
    ?.classList.toggle('active', target === 'home');

  document.getElementById('buyTab')
    ?.classList.toggle('active', target === 'buy');

  document.getElementById('sellTab')
    ?.classList.toggle('active', target === 'sell');

  if (target === 'home') {
    window.scrollTo({top:0,behavior:'smooth'});
    return;
  }

  setMode(target);
  window.scrollTo({top:0,behavior:'smooth'});
}


function setMode(mode) {
  state.mode = mode === 'sell' ? 'sell' : 'buy';

  const availability =
    document.getElementById('availability');

  if (availability) {
    availability.style.display =
      state.mode === 'buy' ? '' : 'none';

    if (state.mode === 'buy' &&
        availability.value !== 'ALL') {
      availability.value = 'IN_STOCK';
    }
  }

  const sort = document.getElementById('sort');

  sort.innerHTML =
    state.mode === 'sell'
      ? '<option value="name">Vehicle A–Z</option>' +
        '<option value="buyback_high">Highest Buyback Range</option>' +
        '<option value="buyback_low">Lowest Buyback Range</option>'
      : '<option value="name">Vehicle A–Z</option>' +
        '<option value="price_low">Price: Low to High</option>' +
        '<option value="price_high">Price: High to Low</option>' +
        '<option value="stock_high">Most Stock</option>';

  applyFilters();
}


const SPOTLIGHT_ALLOWED_CATEGORIES = [
  'Compact',
  'Coupe',
  'Electric',
  'Muscle',
  'Sport',
  'Sport Classic',
  'SUV',
  'Trucks',
  'Misc',
  'Trailers',
  'Work Truck',
  'Sedans',
  'Semi-Trucks',
  'Heavy',
  'Super'
];


function renderSpotlightCategories() {
  const root =
    document.getElementById('spotlightCategories');

  if (!root) return;

  const catalogueCategories = new Set(
    state.catalogue
      .map(v => String(v.category || '').trim())
      .filter(Boolean)
  );

  const backendCategories = new Set(
    Array.isArray(state.spotlight?.categories)
      ? state.spotlight.categories
      : []
  );

  const categories =
    SPOTLIGHT_ALLOWED_CATEGORIES.filter(c =>
      catalogueCategories.has(c) ||
      backendCategories.has(c)
    );

  root.innerHTML =
    ['ALL', ...categories]
      .map(c => `
        <button
          class="spotlight-category ${state.spotlightCategory === c ? 'active' : ''}"
          onclick="setSpotlightCategory('${jsString(c)}')">
          ${escapeHtml(c === 'ALL' ? 'ALL' : c)}
        </button>
      `)
      .join('');
}


function setSpotlightCategory(category) {
  state.spotlightCategory =
    category && category !== '' ? category : 'ALL';

  state.spotlightIndex = {
    pick:0,
    arrival:0,
    popular:0
  };

  renderSpotlightCategories();
  renderAllSpotlights();
  restartSpotlightRotation();
}


function spotlightRows(type) {
  const category = state.spotlightCategory;

  let rows = [];

  if (type === 'pick') {
    rows = Array.isArray(state.spotlight?.picks)
      ? state.spotlight.picks.slice()
      : [];

    if (category !== 'ALL') {
      rows = rows.filter(v => v.category === category);
    }

    // If management has not selected enough PDM Picks yet,
    // fill the pool from healthy in-stock catalogue vehicles.
    if (rows.length < 3) {
      let fallback =
        state.catalogue
          .filter(v =>
            Number(v.stock_qty || 0) > 0 &&
            Number(v.sale_price || 0) > 0
          );

      if (category !== 'ALL') {
        fallback =
          fallback.filter(v => v.category === category);
      }

      fallback.sort((a,b) =>
        Number(b.stock_qty || 0) - Number(a.stock_qty || 0) ||
        String(a.display_name || '').localeCompare(
          String(b.display_name || '')
        )
      );

      const existing = new Set(
        rows.map(v => String(v.vehicle_id))
      );

      fallback.forEach(v => {
        if (rows.length >= 5) return;
        if (!existing.has(String(v.vehicle_id))) {
          rows.push({
            ...v,
            source_type:'PDM_PICK_FALLBACK',
            featured_priority:null
          });
          existing.add(String(v.vehicle_id));
        }
      });
    }
  }

  if (type === 'arrival') {
    rows = Array.isArray(state.spotlight?.arrivals)
      ? state.spotlight.arrivals.slice()
      : [];

    if (category !== 'ALL') {
      rows = rows.filter(v => v.category === category);
    }
  }

  if (type === 'popular') {
    rows = Array.isArray(state.spotlight?.popular)
      ? state.spotlight.popular.slice()
      : [];

    if (category !== 'ALL') {
      rows = rows.filter(v => v.category === category);
    }
  }

  return rows.slice(0, 5);
}


function spotlightRelativeArrival(iso) {
  if (!iso) return 'Recently arrived';

  const then = new Date(iso);
  if (isNaN(then)) return 'Recently arrived';

  const diff =
    Math.max(0, Date.now() - then.getTime());

  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);

  if (hours < 1) return 'Arrived within the hour';
  if (hours < 24) return 'Arrived today';
  if (days === 1) return 'Arrived yesterday';
  if (days < 7) return `Arrived ${days} days ago`;

  return 'Recently arrived';
}


function spotlightCopy(type, v) {
  if (type === 'pick') {
    return {
      label:'PDM PICK',
      sub:
        Number(v.stock_qty || 0) === 1
          ? 'Last one currently available'
          : `${number(v.stock_qty || 0)} currently available`
    };
  }

  if (type === 'arrival') {
    return {
      label:'JUST ARRIVED',
      sub:spotlightRelativeArrival(v.metric_date)
    };
  }

  const sold = Number(v.metric_value || 0);

  return {
    label:'CUSTOMER FAVOURITE',
    sub:
      `${number(sold)} sold this month` +
      (Number(v.stock_qty || 0) > 0
        ? ` · ${number(v.stock_qty)} in stock`
        : ' · Ask about availability')
  };
}


function renderSpotlight(type) {
  const map = {
    pick:'spotlightPick',
    arrival:'spotlightArrival',
    popular:'spotlightPopular'
  };

  const el = document.getElementById(map[type]);
  if (!el) return;

  const rows = spotlightRows(type);

  if (!rows.length) {
    el.innerHTML = `
      <div class="spotlight-empty">
        No ${escapeHtml(
          state.spotlightCategory === 'ALL'
            ? ''
            : state.spotlightCategory + ' '
        )}vehicles currently qualify for this spotlight.
      </div>
    `;
    return;
  }

  let index =
    Number(state.spotlightIndex[type] || 0);

  if (index >= rows.length) index = 0;

  state.spotlightIndex[type] = index;

  const v = rows[index];
  const copy = spotlightCopy(type, v);

  const image =
    String(v.image_url || '').trim();

  const dots =
    rows.length > 1
      ? `<div class="spotlight-dots">${
          rows.map((_,i) =>
            `<span class="spotlight-dot ${i === index ? 'active' : ''}"></span>`
          ).join('')
        }</div>`
      : '';

  const controls =
    rows.length > 1
      ? `
        <div class="spotlight-controls">
          <button class="spotlight-arrow"
            onclick="event.stopPropagation();moveSpotlight('${type}',-1)">‹</button>
          <button class="spotlight-arrow"
            onclick="event.stopPropagation();moveSpotlight('${type}',1)">›</button>
        </div>
      `
      : '';

  el.innerHTML = `
    ${
      image
        ? `<img
            class="spotlight-image"
            src="${escapeHtml(image)}"
            alt="${escapeHtml(v.display_name || 'Vehicle')}"
            onerror="this.remove()">`
        : ''
    }

    <div class="spotlight-shade"></div>

    ${dots}
    ${controls}

    <div class="spotlight-content">
      <div class="spotlight-label">${escapeHtml(copy.label)}</div>
      <div class="spotlight-name">
        ${escapeHtml(v.display_name || '')}
      </div>

      <div class="spotlight-meta">
        ${
          Number(v.sale_price || 0) > 0
            ? `<span class="spotlight-price">${money(v.sale_price)}</span>`
            : ''
        }
        <span>${escapeHtml(v.category || '')}</span>
      </div>

      <div class="spotlight-sub">
        ${escapeHtml(copy.sub)}
      </div>
    </div>
  `;

  el.onclick = () => openSpotlightVehicle(v);
}


function renderAllSpotlights() {
  renderSpotlight('pick');
  renderSpotlight('arrival');
  renderSpotlight('popular');
}


function moveSpotlight(type, delta) {
  const rows = spotlightRows(type);
  if (rows.length <= 1) return;

  const current =
    Number(state.spotlightIndex[type] || 0);

  state.spotlightIndex[type] =
    (current + delta + rows.length) % rows.length;

  renderSpotlight(type);
  restartSpotlightRotation();
}


function rotateSpotlight(type) {
  if (document.hidden) return;
  if (state.page !== 'home') return;
  if (state.spotlightPaused[type]) return;

  const rows = spotlightRows(type);
  if (rows.length <= 1) return;

  state.spotlightIndex[type] =
    (Number(state.spotlightIndex[type] || 0) + 1) %
    rows.length;

  renderSpotlight(type);
}


function pauseSpotlight(type, paused) {
  state.spotlightPaused[type] = paused === true;
}


function clearSpotlightTimers() {
  state.spotlightTimers.forEach(t => {
    clearTimeout(t);
    clearInterval(t);
  });

  state.spotlightTimers = [];
}


function startSpotlightRotation() {
  clearSpotlightTimers();

  const schedule = [
    ['pick', 0],
    ['arrival', 3300],
    ['popular', 6600]
  ];

  schedule.forEach(([type, delay]) => {
    const starter = setTimeout(() => {
      rotateSpotlight(type);

      const interval =
        setInterval(
          () => rotateSpotlight(type),
          10000
        );

      state.spotlightTimers.push(interval);
    }, delay + 10000);

    state.spotlightTimers.push(starter);
  });
}


function restartSpotlightRotation() {
  startSpotlightRotation();
}


function openSpotlightVehicle(v) {
  if (!v) return;

  setPage('buy');

  const search =
    document.getElementById('search');

  const category =
    document.getElementById('category');

  const availability =
    document.getElementById('availability');

  if (search) {
    search.value =
      String(v.display_name || '');
  }

  if (category) {
    category.value =
      String(v.category || 'ALL');
  }

  // Popular vehicles are allowed to be out of stock.
  if (availability) {
    availability.value = 'ALL';
  }

  applyFilters();

  setTimeout(() => {
    document.getElementById('catalogue')
      ?.scrollIntoView({
        behavior:'smooth',
        block:'start'
      });
  }, 80);
}


function populateCategories(){
  
  const categories=[...new Set(state.catalogue.map(v=>String(v.category||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  
  document.getElementById('category').innerHTML='<option value="ALL">All Categories</option>'+categories.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  }

function applyFilters() {
  const q =
    document.getElementById('search').value.trim().toLowerCase();

  const category =
    document.getElementById('category').value;

  const availability =
    document.getElementById('availability')?.value || 'IN_STOCK';

  const sort =
    document.getElementById('sort').value;

  let rows = state.catalogue.filter(v => {
    if (state.mode === 'buy') {
      // Never show unpriced vehicles as purchasable catalogue entries.
      if (Number(v.sale_price || 0) <= 0) {
        return false;
      }

      // Default customer view is current physical stock.
      if (
        availability === 'IN_STOCK' &&
        Number(v.stock_qty || 0) <= 0
      ) {
        return false;
      }
    } else {
      // Sell To PDM only needs a valid public buyback range.
      if (
        v.typical_buyback_min === null ||
        v.typical_buyback_max === null
      ) {
        return false;
      }
    }

    if (
      category !== 'ALL' &&
      String(v.category || '') !== category
    ) {
      return false;
    }

    if (q) {
      const haystack = [
        v.display_name,
        v.make,
        v.model,
        v.category
      ].join(' ').toLowerCase();

      if (!haystack.includes(q)) {
        return false;
      }
    }

    return true;
  });

  rows.sort((a, b) => {
    if (sort === 'price_low') {
      return Number(a.sale_price || 0) - Number(b.sale_price || 0);
    }

    if (sort === 'price_high') {
      return Number(b.sale_price || 0) - Number(a.sale_price || 0);
    }

    if (sort === 'stock_high') {
      return Number(b.stock_qty || 0) - Number(a.stock_qty || 0);
    }

    if (sort === 'buyback_high') {
      return Number(b.typical_buyback_max || 0) -
             Number(a.typical_buyback_max || 0);
    }

    if (sort === 'buyback_low') {
      return Number(a.typical_buyback_min || 0) -
             Number(b.typical_buyback_min || 0);
    }

    return String(a.display_name || '')
      .localeCompare(String(b.display_name || ''));
  });

  render(rows);
}


function render(rows) {
  const root =
    document.getElementById('catalogue');

  document.getElementById('resultCount').textContent =
    rows.length +
    ' vehicle' +
    (rows.length === 1 ? '' : 's');

  if (!rows.length) {
    root.innerHTML =
      '<div class="empty">No vehicles match those filters.</div>';
    return;
  }

  root.innerHTML = rows.map(v => {
    const inStock =
      Number(v.stock_qty || 0) > 0;

    const stockText =
      inStock
        ? Number(v.stock_qty) + ' IN STOCK'
        : 'NOT IN STOCK';

    const buyback =
      v.typical_buyback_min !== null &&
      v.typical_buyback_max !== null
        ? `${money(v.typical_buyback_min)} – ${money(v.typical_buyback_max)}`
        : 'Contact PDM';

    if (state.mode === 'sell') {
      return `
        <article class="vehicle">
          ${vehiclePhotoHtml(v)}
          <div class="vehicle-top">
            <div>
              <div class="category">
                ${escapeHtml(v.category || '')}
              </div>

              <h2>
                ${escapeHtml(v.display_name || '')}
              </h2>
            </div>

            <span class="stock ${inStock ? '' : 'none'}">
              ${escapeHtml(stockText)}
            </span>
          </div>

          <div class="buyback">
            <div class="buyback-label">
              Typical PDM Buyback
            </div>

            <div class="buyback-range">
              ${buyback}
            </div>

            <div class="buyback-note">
              Indicative range only. Final appraisal may vary
              with stock, condition and demand.
            </div>
          </div>

          ${Number(v.sale_price || 0) > 0 ? `
            <div class="price-grid">
              <div class="price">
                <span>Current PDM Price</span>
                <strong>${money(v.sale_price)}</strong>
              </div>

              <div class="price">
                <span>Current Stock</span>
                <strong>${number(v.stock_qty || 0)}</strong>
              </div>
            </div>
          ` : ''}
        </article>
      `;
    }

    return `
      <article class="vehicle">
        ${vehiclePhotoHtml(v)}
          <div class="vehicle-top">
          <div>
            <div class="category">
              ${escapeHtml(v.category || '')}
            </div>

            <h2>
              ${escapeHtml(v.display_name || '')}
            </h2>
          </div>

          <span class="stock ${inStock ? '' : 'none'}">
            ${escapeHtml(stockText)}
          </span>
        </div>

        <div class="price-grid">
          <div class="price">
            <span>PDM Sale Price</span>
            <strong>${money(v.sale_price)}</strong>
          </div>

          <div class="price">
            <span>Available</span>
            <strong>${number(v.stock_qty || 0)}</strong>
          </div>
        </div>

        <div class="buyback">
          <div class="buyback-label">
            Selling yours instead?
          </div>

          <div class="buyback-range">
            ${buyback}
          </div>

          <div class="buyback-note">
            Typical PDM buyback range. Final offer may vary.
          </div>
        </div>
      </article>
    `;
  }).join('');
}


document.addEventListener('keydown',event=>{
  if(event.key==='Escape') closeVehiclePhoto();
});
function money(v){return '$'+Number(v||0).toLocaleString('en-US',{maximumFractionDigits:0});}
function number(v){return Number(v||0).toLocaleString('en-US');}
function escapeHtml(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}
function cleanError(error){return String(error?.message||error||'Unknown error').replace(/^Exception:\s*/,'').replace(/^Error:\s*/,'');}

setPage('home');
