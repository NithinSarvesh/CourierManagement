// ==============================================================================
// SwiftShip Courier Operations - Integrated Frontend API Client
// ==============================================================================

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

// Central API Base configuration (Configured via config.js, localStorage, or fallback to localhost:8082)
const isProductionOrigin = () => {
  if (typeof window === 'undefined' || !window.location) return false;
  const host = window.location.hostname;
  return host !== 'localhost' && host !== '127.0.0.1' && host !== '::1' && host !== '';
};

const isLocalEndpoint = (url) => {
  if (!url) return false;
  return url.includes('localhost') || url.includes('127.0.0.1') || url.includes('::1');
};

const resolveApiBase = () => {
  const runtimeConfig = (typeof window !== 'undefined' && window.SWIFTSHIP_CONFIG && typeof window.SWIFTSHIP_CONFIG.apiBase === 'string')
    ? window.SWIFTSHIP_CONFIG.apiBase.trim()
    : null;

  if (runtimeConfig !== null && runtimeConfig !== '') {
    return runtimeConfig.replace(/\/+$/, '');
  }

  const localStorageBase = (typeof localStorage !== 'undefined' && localStorage.getItem('SWIFTSHIP_API_BASE')) || '';
  if (localStorageBase.trim()) {
    // If running in production (e.g. Netlify) and stored URL is localhost, clean stale setting
    if (isProductionOrigin() && isLocalEndpoint(localStorageBase)) {
      try { localStorage.removeItem('SWIFTSHIP_API_BASE'); } catch (_) {}
    } else {
      return localStorageBase.trim().replace(/\/+$/, '');
    }
  }

  const globalBase = (typeof window !== 'undefined' && window.__API_BASE__) || '';
  if (globalBase.trim()) {
    return globalBase.trim().replace(/\/+$/, '');
  }

  // When deployed on Netlify or when runtimeConfig is empty string, default to same-origin Netlify Functions:
  if (isProductionOrigin() || runtimeConfig === '') {
    return '';
  }

  return 'http://localhost:8082';
};
const API_BASE = resolveApiBase();

// Status badge CSS classes
function statusClass(s) {
  if (!s) return 'pending';
  const norm = String(s).toUpperCase().replace(/[\s_-]+/g, '');
  if (norm.includes('DELIVERED') || norm.includes('PAID') || norm.includes('ACTIVE') || norm.includes('RESOLVED') || norm.includes('AVAILABLE') || norm.includes('SUCCESS')) {
    return 'delivered';
  }
  if (norm.includes('TRANSIT') || norm.includes('ONDELIVERY') || norm.includes('PROGRESS') || norm.includes('PICKEDUP') || norm.includes('INUSE')) {
    return 'transit';
  }
  if (norm.includes('CANCEL') || norm.includes('FAIL') || norm.includes('CLOSED') || norm.includes('INACTIVE')) {
    return 'cancelled';
  }
  return 'pending';
}

function badge(s) {
  return `<span class="status ${statusClass(s)}">${s || 'UNKNOWN'}</span>`;
}

function toast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ------------------------------------------------------------------------------
// Centralized API Client
// ------------------------------------------------------------------------------
async function api(path, method = 'GET', data = null) {
  if (isProductionOrigin() && isLocalEndpoint(API_BASE)) {
    updateConnStatus(false, 'Setup API (Click ⚙)');
    renderConfigNotice();
    throw new Error(`SwiftShip is published on Netlify (${window.location.hostname}), but the production backend API URL has not been configured yet. Click ⚙ in the sidebar to configure your API URL.`);
  }

  const url = `${API_BASE}${path}`;
  const options = {
    method,
    headers: {
      'Accept': 'application/json'
    }
  };
  if (data !== null) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(data);
  }

  let res;
  try {
    res = await fetch(url, options);
  } catch (netErr) {
    updateConnStatus(false);
    const target = API_BASE ? API_BASE : 'Netlify Functions';
    throw new Error(`Unable to connect to backend at ${target}. Please verify your Netlify Functions and Neo4j database connection.`);
  }

  updateConnStatus(true);

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson.message) errorMsg = errJson.message;
      else if (errJson.error) errorMsg = errJson.error;
      else if (errJson.errors && typeof errJson.errors === 'object') {
        errorMsg = Object.values(errJson.errors).join(', ');
      }
    } catch (_) {
      try {
        const text = await res.text();
        if (text) errorMsg = text;
      } catch (__) {}
    }
    throw new Error(errorMsg);
  }

  if (res.status === 204) return null;
  return await res.json();
}

// Update connection status in sidebar and topbar
function updateConnStatus(isOnline, customText) {
  const dot = $('#connDot');
  const txt = $('#connStatus');
  const topBadge = $('#topStatusBadge');
  const topLabel = $('#topStatusLabel');
  const dbInfo = $('#dbInfoStatus');

  if (customText) {
    if (dot) dot.className = 'dot checking';
    if (txt) txt.textContent = customText;
    if (topLabel) topLabel.textContent = customText;
    if (dbInfo) dbInfo.textContent = customText;
    return;
  }
  if (isOnline) {
    if (dot) dot.className = 'dot online';
    if (txt) txt.textContent = 'Connected';
    if (topLabel) topLabel.textContent = 'AuraDB Online';
    if (dbInfo) dbInfo.textContent = 'Cloud Graph Active';
  } else {
    if (dot) dot.className = 'dot offline';
    if (txt) txt.textContent = 'Offline';
    if (topLabel) topLabel.textContent = 'Backend Offline';
    if (dbInfo) dbInfo.textContent = 'Disconnected';
  }
}

// Render friendly banner when published without production API configured
function renderConfigNotice() {
  const content = $('#content');
  if (!content || $('#unconfiguredBanner')) return;
  const banner = document.createElement('div');
  banner.id = 'unconfiguredBanner';
  banner.style.cssText = 'background:#fffbeb;border:1px solid #f59e0b;color:#92400e;padding:16px 20px;border-radius:8px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;gap:16px;box-shadow:0 1px 3px rgba(0,0,0,0.05);';
  banner.innerHTML = `
    <div>
      <strong style="display:block;font-size:14px;margin-bottom:4px;">⚠️ Action Required: Backend API URL Not Configured</strong>
      <span style="font-size:12px;">SwiftShip is deployed on Netlify (<code>${window.location.hostname}</code>), but the backend URL is still pointing to localhost. Leave empty in <code>config.js</code> for same-origin Netlify Functions or click Configure below.</span>
    </div>
    <button type="button" class="btn primary" id="btnConfigureApiBanner" style="white-space:nowrap;padding:8px 16px;background:#d97706;border:none;color:#fff;border-radius:6px;cursor:pointer;font-weight:600;">⚙ Configure URL</button>
  `;
  content.prepend(banner);
  banner.querySelector('#btnConfigureApiBanner')?.addEventListener('click', promptBackendUrl);
}

// Check backend health periodically
async function checkBackendHealth() {
  if (isProductionOrigin() && isLocalEndpoint(API_BASE)) {
    updateConnStatus(false, 'Setup API (Click ⚙)');
    renderConfigNotice();
    return false;
  }
  try {
    const res = await fetch(`${API_BASE}/actuator/health`, { headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      updateConnStatus(true);
      return true;
    }
  } catch (_) {}
  try {
    const res = await fetch(`${API_BASE}/api/dashboard`, { headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      updateConnStatus(true);
      return true;
    }
  } catch (_) {}
  updateConnStatus(false);
  return false;
}

// ------------------------------------------------------------------------------
// Shared Reference Cache
// ------------------------------------------------------------------------------
const cache = {
  branches: [],
  services: [],
  customers: [],
  agents: []
};

async function loadReferenceData() {
  try {
    const [b, s] = await Promise.all([
      api('/api/branches').catch(() => []),
      api('/api/services').catch(() => [])
    ]);
    cache.branches = Array.isArray(b) ? b : [];
    cache.services = Array.isArray(s) ? s : [];
  } catch (_) {}
}

async function loadDropdownCustomers() {
  try {
    const res = await api('/api/customers?page=0&size=100').catch(() => ({ content: [] }));
    cache.customers = res?.content || (Array.isArray(res) ? res : []);
    return cache.customers;
  } catch (_) {
    return [];
  }
}

// ------------------------------------------------------------------------------
// Navigation & Lifecycle
// ------------------------------------------------------------------------------
let active = 'dashboard';

const pageMeta = {
  dashboard: { title: 'Overview', desc: 'Real-time metrics, recent bookings, and operations activity.' },
  parcels: { title: 'Parcels', desc: 'Book, manage, track, and monitor every parcel shipment.' },
  tracking: { title: 'Tracking', desc: 'Follow a shipment’s milestone journey from pickup to delivery.' },
  customers: { title: 'Customers', desc: 'Customer directory, contact profiles, and booking history.' },
  agents: { title: 'Delivery agents', desc: 'Manage delivery personnel, assignments, and active runs.' },
  vehicles: { title: 'Fleet', desc: 'Manage vehicle inventory, capacities, and driver assignments.' },
  branches: { title: 'Branches', desc: 'Explore hubs, connectivity network, and branch operations.' },
  routes: { title: 'Routes', desc: 'Explore transportation lanes and calculated route distances.' },
  payments: { title: 'Payments', desc: 'Financial transactions, revenue summaries, and payment methods.' },
  support: { title: 'Support tickets', desc: 'Customer support tickets, inquiry tracking, and resolution.' },
  services: { title: 'Services', desc: 'Shipping products, base pricing, and delivery commitments.' },
  staff: { title: 'Staff & access', desc: 'Manage administrative and branch operational team members.' },
  sqlbuilder: { title: 'SQL Query Builder', desc: 'Interactive SQL query generator for relational logistics schema with presets and relational algebra preview.' },
  plsql: { title: 'PL/SQL Lab', desc: 'Interactive Oracle PL/SQL reference lab with Triggers, Explicit Cursors, Cursor Attributes, and Packages.' },
  graph: { title: 'Live Graph Explorer', desc: 'Interactive force-directed graph visualization of live Neo4j AuraDB nodes and relationships.' }
};

function pageHead(title, desc, btnText, btnAction) {
  return `
    <div class="pagehead">
      <div>
        <div class="eyebrow">Operations / ${title}</div>
        <h1>${title}</h1>
        <p>${desc}</p>
      </div>
      ${btnText ? `<button class="btn primary" onclick="${btnAction}"><span class="plus">＋</span>${btnText}</button>` : ''}
    </div>
  `;
}

function renderErrorBanner(error) {
  if (isProductionOrigin() && isLocalEndpoint(API_BASE)) {
    return `
      <div class="error-banner" style="background:#fffbeb;border:1px solid #f59e0b;color:#92400e;padding:16px 20px;border-radius:8px;display:flex;align-items:center;justify-content:space-between;gap:16px;">
        <div>
          <strong style="display:block;font-size:14px;margin-bottom:4px;">⚠️ Action Required: Backend API URL Not Configured</strong>
          <span style="font-size:12px;">SwiftShip is deployed on Netlify (<code>${window.location.hostname}</code>), but the backend URL is still pointing to localhost. Set your API URL in <code>config.js</code> or click Configure below.</span>
        </div>
        <button type="button" class="btn primary" onclick="promptBackendUrl()" style="white-space:nowrap;padding:8px 16px;background:#d97706;border:none;color:#fff;border-radius:6px;cursor:pointer;font-weight:600;">⚙ Configure URL</button>
      </div>
    `;
  }
  return `
    <div class="error-banner">
      <div><b>Error:</b> ${error.message || error}</div>
      <button onclick="refreshCurrentPage()">Retry ↻</button>
    </div>
  `;
}

function renderLoading() {
  return `<div class="loading-spinner"><span class="dot checking"></span> Fetching live data from Neo4j...</div>`;
}

async function go(p) {
  active = p;
  const meta = pageMeta[p] || { title: p, desc: '' };
  $('#crumb').textContent = meta.title;
  $$('.navitem').forEach(b => b.classList.toggle('active', b.dataset.page === p));
  $('#sidebar')?.classList.remove('open');
  $('#sidebarOverlay')?.classList.remove('active');
  window.scrollTo(0, 0);

  const container = $('#content');
  container.innerHTML = renderLoading();

  try {
    switch (p) {
      case 'dashboard':
        container.innerHTML = await renderDashboard();
        break;
      case 'parcels':
        container.innerHTML = await renderParcels();
        break;
      case 'tracking':
        container.innerHTML = await renderTracking();
        break;
      case 'customers':
        container.innerHTML = await renderCustomers();
        break;
      case 'agents':
        container.innerHTML = await renderAgents();
        break;
      case 'vehicles':
        container.innerHTML = await renderVehicles();
        break;
      case 'branches':
        container.innerHTML = await renderBranches();
        break;
      case 'routes':
        container.innerHTML = await renderRoutes();
        break;
      case 'payments':
        container.innerHTML = await renderPayments();
        break;
      case 'support':
        container.innerHTML = await renderSupport();
        break;
      case 'services':
        container.innerHTML = await renderServices();
        break;
      case 'staff':
        container.innerHTML = await renderStaff();
        break;
      case 'sqlbuilder':
        container.innerHTML = await renderSqlBuilder();
        initSqlBuilderEvents();
        break;
      case 'plsql':
        container.innerHTML = await renderPlsqlLab();
        initPlsqlLabEvents();
        break;
      case 'graph':
        container.innerHTML = await renderGraphExplorer();
        initGraphExplorerEvents();
        break;
      default:
        container.innerHTML = await renderDashboard();
    }
  } catch (err) {
    container.innerHTML = `
      ${pageHead(meta.title, meta.desc)}
      ${renderErrorBanner(err)}
    `;
  }
}

function refreshCurrentPage() {
  go(active);
}

// ------------------------------------------------------------------------------
// View: Dashboard
// ------------------------------------------------------------------------------
async function renderDashboard() {
  const data = await api('/api/dashboard/summary').catch(async () => {
    return await api('/api/dashboard');
  });

  const totalParcels = data.totalParcels ?? 0;
  const delivered = data.deliveredParcelsCount ?? 0;
  const pending = data.pendingParcelsCount ?? 0;
  const totalCustomers = data.totalCustomers ?? 0;
  const revenue = data.totalCollectedRevenue != null ? `₹ ${Number(data.totalCollectedRevenue).toLocaleString()}` : '₹ 0';
  const pendingPay = data.pendingPaymentTotal != null ? `₹ ${Number(data.pendingPaymentTotal).toLocaleString()}` : '₹ 0';

  // Update sidebar parcels badge
  const navBadge = $('#navParcelCount');
  if (navBadge) navBadge.textContent = totalParcels;

  const recentParcels = data.recentBookings || [];
  const recentEvents = data.recentTrackingEvents || [];

  return `
    ${pageHead('Operations Overview', 'Real-time logistics monitoring, parcel tracking, fleet dispatch, and database operations.', 'Book parcel', 'openBookParcelModal()')}
    
    <div class="stats">
      <div class="stat">
        <div class="statlabel">Total shipments <span>📦</span></div>
        <div class="statvalue">${totalParcels.toLocaleString()}</div>
        <div class="statfoot"><b class="up">Live from Neo4j graph</b></div>
      </div>
      <div class="stat">
        <div class="statlabel">In transit / Active <span>🚚</span></div>
        <div class="statvalue">${pending.toLocaleString()}</div>
        <div class="statfoot">Needs dispatch attention</div>
      </div>
      <div class="stat">
        <div class="statlabel">Delivered shipments <span>✓</span></div>
        <div class="statvalue">${delivered.toLocaleString()}</div>
        <div class="statfoot"><b class="up">Delivered successfully</b></div>
      </div>
      <div class="stat">
        <div class="statlabel">Total revenue <span>₹</span></div>
        <div class="statvalue">${revenue}</div>
        <div class="statfoot">Pending: ${pendingPay}</div>
      </div>
    </div>

    <div class="dashboardgrid">
      <div>
        <div class="panel tablepanel">
          <div class="tablehead">
            <h3>Recent bookings</h3>
            <div class="filters">
              <button class="btn btn-sm" onclick="go('parcels')">View all parcels ↗</button>
            </div>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Tracking ID</th>
                <th>Customer</th>
                <th>Route</th>
                <th>Weight</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${recentParcels.length ? recentParcels.map(p => `
                <tr>
                  <td><b class="id">${p.trackingNumber}</b></td>
                  <td><b>${p.customerName || p.customerId || '—'}</b></td>
                  <td>${p.originBranchName || p.originBranchId || '—'} → ${p.destinationBranchName || p.destinationBranchId || '—'}</td>
                  <td>${p.weight != null ? p.weight + ' kg' : '—'}</td>
                  <td>${badge(p.status)}</td>
                  <td><button class="btn btn-sm" onclick="viewParcelDetails('${p.trackingNumber}')">View ↗</button></td>
                </tr>
              `).join('') : `<tr><td colspan="6" class="empty">No recent bookings recorded.</td></tr>`}
            </tbody>
          </table>
          <div class="tablebottom">
            <span>Showing ${recentParcels.length} live records</span>
          </div>
        </div>
      </div>

      <div>
        <div class="panel">
          <div class="panelhead">
            <h3>Recent tracking activity</h3>
            <small onclick="go('tracking')" style="cursor:pointer">Explore tracking ↗</small>
          </div>
          ${recentEvents.length ? recentEvents.slice(0, 5).map(e => `
            <div class="activity">
              <div class="acticon">⌖</div>
              <div>
                <b>${e.trackingNumber} · ${e.status}</b>
                <p>${e.location || 'Hub'} ${e.remarks ? '— ' + e.remarks : ''}</p>
              </div>
              <time>${formatTime(e.timestamp)}</time>
            </div>
          `).join('') : `<div class="empty">No recent tracking events recorded.</div>`}
        </div>

        <div class="panel">
          <div class="panelhead">
            <h3>Quick operations</h3>
          </div>
          <div class="detailcards" style="grid-template-columns:1fr 1fr">
            <button class="mini" style="text-align:left;cursor:pointer" onclick="openBookParcelModal()">
              <div style="color:#176b4b;font-size:18px">＋</div>
              <b>Book shipment</b>
            </button>
            <button class="mini" style="text-align:left;cursor:pointer" onclick="go('tracking')">
              <div style="color:#176b4b;font-size:18px">⌖</div>
              <b>Track parcel</b>
            </button>
            <button class="mini" style="text-align:left;cursor:pointer" onclick="openCreateCustomerModal()">
              <div style="color:#176b4b;font-size:18px">♙</div>
              <b>Add customer</b>
            </button>
            <button class="mini" style="text-align:left;cursor:pointer" onclick="openCreateTicketModal()">
              <div style="color:#176b4b;font-size:18px">☏</div>
              <b>Support ticket</b>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ------------------------------------------------------------------------------
// View: Parcels
// ------------------------------------------------------------------------------
async function renderParcels() {
  const pageData = await api('/api/parcels?page=0&size=50').catch(() => ({ content: [] }));
  const parcels = pageData.content || (Array.isArray(pageData) ? pageData : []);

  // Update badge
  const navBadge = $('#navParcelCount');
  if (navBadge) navBadge.textContent = pageData.totalElements ?? parcels.length;

  return `
    ${pageHead('Parcels', 'Create, manage, and monitor every shipment.', 'Book parcel', 'openBookParcelModal()')}
    
    <div class="panel tablepanel">
      <div class="tablehead">
        <h3>Shipments (${parcels.length})</h3>
        <div class="filters">
          <input placeholder="Filter by tracking ID or customer..." oninput="filterTableRows(this)">
          <button class="btn btn-sm" onclick="refreshCurrentPage()">Refresh ↻</button>
        </div>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Tracking ID</th>
            <th>Customer</th>
            <th>Origin</th>
            <th>Destination</th>
            <th>Service</th>
            <th>Weight</th>
            <th>Charge</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${parcels.length ? parcels.map(p => `
            <tr>
              <td><b class="id">${p.trackingNumber}</b></td>
              <td><b>${p.customerName || p.customerId || '—'}</b></td>
              <td>${p.originBranchName || p.originBranchId || '—'}</td>
              <td>${p.destinationBranchName || p.destinationBranchId || '—'}</td>
              <td>${p.serviceName || p.serviceId || '—'}</td>
              <td>${p.weight != null ? p.weight + ' kg' : '—'}</td>
              <td>₹ ${p.deliveryCharge != null ? p.deliveryCharge : '0'}</td>
              <td>${badge(p.status)}</td>
              <td><button class="btn btn-sm" onclick="viewParcelDetails('${p.trackingNumber}')">View ↗</button></td>
            </tr>
          `).join('') : `<tr><td colspan="9" class="empty">No parcels found. Book your first parcel using the button above.</td></tr>`}
        </tbody>
      </table>
      <div class="tablebottom">
        <span>Showing ${parcels.length} records</span>
      </div>
    </div>
  `;
}

// ------------------------------------------------------------------------------
// View: Tracking
// ------------------------------------------------------------------------------
async function renderTracking() {
  return `
    ${pageHead('Tracking', 'Follow a shipment’s milestone journey from pickup to delivery.')}
    
    <div class="panel">
      <div class="panelhead">
        <h3>Track shipment by number</h3>
        <small>Enter a valid tracking ID (e.g. TRK-20481)</small>
      </div>
      <div class="trackingbox">
        <input id="trackinput" placeholder="e.g. TRK-..." onkeydown="if(event.key==='Enter')searchTracking()">
        <button class="btn primary" onclick="searchTracking()">Track parcel →</button>
      </div>
      <div id="trackresult">
        <div class="empty">Enter a tracking number above to query the tracking timeline.</div>
      </div>
    </div>
  `;
}

async function searchTracking(trackingNumber) {
  const input = $('#trackinput');
  const num = (trackingNumber || (input ? input.value : '')).trim();
  if (!num) {
    toast('Please enter a tracking number');
    return;
  }
  const resultDiv = $('#trackresult');
  resultDiv.innerHTML = renderLoading();

  try {
    const [history, currentStatus, parcel] = await Promise.all([
      api(`/api/tracking/${encodeURIComponent(num)}`).catch(() => []),
      api(`/api/tracking/${encodeURIComponent(num)}/current-status`).catch(() => null),
      api(`/api/parcels/${encodeURIComponent(num)}`).catch(() => null)
    ]);

    const events = Array.isArray(history) ? history : [];
    const statusText = currentStatus?.status || parcel?.status || 'UNKNOWN';

    resultDiv.innerHTML = `
      <div class="detailcards" style="margin-bottom:20px">
        <div class="mini">
          <span class="eyebrow">Tracking Number</span>
          <p><b class="id" style="font-size:16px">${num}</b></p>
        </div>
        <div class="mini">
          <span class="eyebrow">Current Status</span>
          <p>${badge(statusText)}</p>
        </div>
        <div class="mini">
          <span class="eyebrow">Last Location</span>
          <p><b>${currentStatus?.location || 'Processing Hub'}</b></p>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h4 style="margin:0;font-size:13px">Tracking Timeline (${events.length} milestones)</h4>
        <button class="btn btn-sm primary" onclick="openAddTrackingEventModal('${num}')">＋ Add Tracking Scan</button>
      </div>

      <div class="timeline">
        ${events.length ? events.map(e => `
          <div class="step done">
            <b>${e.status} · ${e.location || 'Location Scan'}</b>
            <small>${formatTime(e.timestamp)} ${e.remarks ? '— ' + e.remarks : ''}</small>
          </div>
        `).join('') : `
          <div class="step">
            <b>No milestone scans recorded yet</b>
            <small>Use 'Add Tracking Scan' to record the first location scan.</small>
          </div>
        `}
      </div>
    `;
  } catch (err) {
    resultDiv.innerHTML = renderErrorBanner(err);
  }
}

// ------------------------------------------------------------------------------
// View: Customers
// ------------------------------------------------------------------------------
async function renderCustomers() {
  const pageData = await api('/api/customers?page=0&size=50').catch(() => ({ content: [] }));
  const customers = pageData.content || (Array.isArray(pageData) ? pageData : []);

  return `
    ${pageHead('Customers', 'Customer directory, contact profiles, and booking history.', 'Add customer', 'openCreateCustomerModal()')}
    
    <div class="panel tablepanel">
      <div class="tablehead">
        <h3>Customer Profiles (${customers.length})</h3>
        <div class="filters">
          <input placeholder="Filter customers..." oninput="filterTableRows(this)">
          <button class="btn btn-sm" onclick="refreshCurrentPage()">Refresh ↻</button>
        </div>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Customer ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Bookings</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${customers.length ? customers.map(c => `
            <tr>
              <td><b class="id">${c.customerId}</b></td>
              <td><b>${c.name}</b></td>
              <td>${c.email}</td>
              <td>${c.phone}</td>
              <td>${c.address || '—'}</td>
              <td>${c.totalBookingsCount != null ? c.totalBookingsCount : '—'}</td>
              <td><button class="btn btn-sm" onclick="viewCustomerDetails('${c.customerId}')">View ↗</button></td>
            </tr>
          `).join('') : `<tr><td colspan="7" class="empty">No customers registered yet.</td></tr>`}
        </tbody>
      </table>
      <div class="tablebottom">
        <span>Showing ${customers.length} records</span>
      </div>
    </div>
  `;
}

// ------------------------------------------------------------------------------
// View: Delivery Agents
// ------------------------------------------------------------------------------
async function renderAgents() {
  const agents = await api('/api/agents').catch(() => []);

  return `
    ${pageHead('Delivery agents', 'Manage delivery personnel, assignments, and active runs.', 'Add agent', 'openCreateAgentModal()')}
    
    <div class="panel tablepanel">
      <div class="tablehead">
        <h3>Field Agents (${agents.length})</h3>
        <div class="filters">
          <input placeholder="Filter agents..." oninput="filterTableRows(this)">
          <button class="btn btn-sm" onclick="refreshCurrentPage()">Refresh ↻</button>
        </div>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Agent ID</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Assigned Vehicle</th>
            <th>Active Runs</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${agents.length ? agents.map(a => `
            <tr>
              <td><b class="id">${a.agentId}</b></td>
              <td><b>${a.name}</b></td>
              <td>${a.phone}</td>
              <td>${badge(a.status)}</td>
              <td>${a.assignedVehicleRegistration || a.assignedVehicleId || 'None'}</td>
              <td>${a.activeDeliveriesCount != null ? a.activeDeliveriesCount : '0'}</td>
              <td><button class="btn btn-sm" onclick="viewAgentDetails('${a.agentId}')">View ↗</button></td>
            </tr>
          `).join('') : `<tr><td colspan="7" class="empty">No delivery agents registered.</td></tr>`}
        </tbody>
      </table>
      <div class="tablebottom">
        <span>Showing ${agents.length} records</span>
      </div>
    </div>
  `;
}

// ------------------------------------------------------------------------------
// View: Fleet (Vehicles)
// ------------------------------------------------------------------------------
async function renderVehicles() {
  const vehicles = await api('/api/vehicles').catch(() => []);

  return `
    ${pageHead('Fleet', 'Manage vehicle inventory, capacities, and driver assignments.', 'Add vehicle', 'openCreateVehicleModal()')}
    
    <div class="panel tablepanel">
      <div class="tablehead">
        <h3>Fleet Inventory (${vehicles.length})</h3>
        <div class="filters">
          <input placeholder="Filter fleet..." oninput="filterTableRows(this)">
          <button class="btn btn-sm" onclick="refreshCurrentPage()">Refresh ↻</button>
        </div>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Vehicle ID</th>
            <th>Registration</th>
            <th>Type</th>
            <th>Capacity (kg)</th>
            <th>Status</th>
            <th>Assigned Driver</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${vehicles.length ? vehicles.map(v => `
            <tr>
              <td><b class="id">${v.vehicleId}</b></td>
              <td><b>${v.registration}</b></td>
              <td>${v.type}</td>
              <td>${v.capacityKg != null ? v.capacityKg + ' kg' : '—'}</td>
              <td>${badge(v.status)}</td>
              <td>${v.assignedAgentName || v.assignedAgentId || 'Unassigned'}</td>
              <td><button class="btn btn-sm" onclick="viewVehicleDetails('${v.vehicleId}')">Manage ↗</button></td>
            </tr>
          `).join('') : `<tr><td colspan="7" class="empty">No vehicles registered.</td></tr>`}
        </tbody>
      </table>
      <div class="tablebottom">
        <span>Showing ${vehicles.length} records</span>
      </div>
    </div>
  `;
}

// ------------------------------------------------------------------------------
// View: Branches
// ------------------------------------------------------------------------------
async function renderBranches() {
  const branches = await api('/api/branches').catch(() => []);

  return `
    ${pageHead('Branches', 'Explore hubs, connectivity network, and branch operations.', 'Add branch', 'openCreateBranchModal()')}
    
    <div class="panel tablepanel">
      <div class="tablehead">
        <h3>Hub & Branch Locations (${branches.length})</h3>
        <div class="filters">
          <input placeholder="Filter branches..." oninput="filterTableRows(this)">
          <button class="btn btn-sm" onclick="refreshCurrentPage()">Refresh ↻</button>
        </div>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Branch ID</th>
            <th>Name</th>
            <th>City</th>
            <th>Address</th>
            <th>Phone</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${branches.length ? branches.map(b => `
            <tr>
              <td><b class="id">${b.branchId}</b></td>
              <td><b>${b.name}</b></td>
              <td>${b.city}</td>
              <td>${b.address}</td>
              <td>${b.phone || '—'}</td>
              <td><button class="btn btn-sm" onclick="viewBranchDetails('${b.branchId}')">Network ↗</button></td>
            </tr>
          `).join('') : `<tr><td colspan="6" class="empty">No branches found.</td></tr>`}
        </tbody>
      </table>
      <div class="tablebottom">
        <span>Showing ${branches.length} records</span>
      </div>
    </div>
  `;
}

// ------------------------------------------------------------------------------
// View: Routes
// ------------------------------------------------------------------------------
async function renderRoutes() {
  const routes = await api('/api/routes').catch(() => []);

  return `
    ${pageHead('Routes', 'Explore transportation lanes and calculated route distances.')}
    
    <div class="panel">
      <div class="panelhead">
        <h3>Explore Route Lanes</h3>
      </div>
      <div class="trackingbox">
        <input id="routeFromInput" placeholder="Origin city or branch...">
        <input id="routeToInput" placeholder="Destination city or branch...">
        <button class="btn primary" onclick="searchRoutes()">Search Route →</button>
      </div>
    </div>

    <div class="panel tablepanel">
      <div class="tablehead">
        <h3>Configured Transit Lanes (${routes.length})</h3>
        <div class="filters">
          <input placeholder="Filter routes..." oninput="filterTableRows(this)">
          <button class="btn btn-sm" onclick="refreshCurrentPage()">Refresh ↻</button>
        </div>
      </div>
      <table class="data-table" id="routesTable">
        <thead>
          <tr>
            <th>Origin</th>
            <th>Destination</th>
            <th>Distance</th>
            <th>Est. Duration</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${routes.length ? routes.map(r => `
            <tr>
              <td><b>${r.sourceBranch || r.originBranch || '—'}</b></td>
              <td><b>${r.destinationBranch || '—'}</b></td>
              <td>${r.distanceKm != null ? r.distanceKm + ' km' : '—'}</td>
              <td>${r.estimatedDurationMinutes != null ? formatDuration(r.estimatedDurationMinutes) : '—'}</td>
              <td>${badge(r.active !== false ? 'Active' : 'Inactive')}</td>
            </tr>
          `).join('') : `<tr><td colspan="5" class="empty">No route paths found in graph.</td></tr>`}
        </tbody>
      </table>
      <div class="tablebottom">
        <span>Showing ${routes.length} lanes</span>
      </div>
    </div>
  `;
}

async function searchRoutes() {
  const from = $('#routeFromInput')?.value.trim();
  const to = $('#routeToInput')?.value.trim();
  let query = '/api/routes';
  const params = [];
  if (from) params.push(`from=${encodeURIComponent(from)}`);
  if (to) params.push(`to=${encodeURIComponent(to)}`);
  if (params.length) query += '?' + params.join('&');

  try {
    const routes = await api(query);
    const tbody = $('#routesTable tbody');
    if (!tbody) return;
    if (routes.length) {
      tbody.innerHTML = routes.map(r => `
        <tr>
          <td><b>${r.sourceBranch || r.originBranch || '—'}</b></td>
          <td><b>${r.destinationBranch || '—'}</b></td>
          <td>${r.distanceKm != null ? r.distanceKm + ' km' : '—'}</td>
          <td>${r.estimatedDurationMinutes != null ? formatDuration(r.estimatedDurationMinutes) : '—'}</td>
          <td>${badge(r.active !== false ? 'Active' : 'Inactive')}</td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = `<tr><td colspan="5" class="empty">No route found between '${from}' and '${to}'.</td></tr>`;
    }
  } catch (err) {
    toast('Route search error: ' + err.message);
  }
}

// ------------------------------------------------------------------------------
// View: Payments
// ------------------------------------------------------------------------------
async function renderPayments() {
  const [pageData, summary] = await Promise.all([
    api('/api/payments?page=0&size=50').catch(() => ({ content: [] })),
    api('/api/payments/summary').catch(() => ({}))
  ]);

  const payments = pageData.content || (Array.isArray(pageData) ? pageData : []);

  const totalCollected = summary.totalCollected != null ? `₹ ${Number(summary.totalCollected).toLocaleString()}` : '₹ 0';
  const pendingAmount = summary.pendingAmount != null ? `₹ ${Number(summary.pendingAmount).toLocaleString()}` : '₹ 0';
  const totalTx = summary.totalTransactions ?? payments.length;

  return `
    ${pageHead('Payments', 'Financial transactions, revenue summaries, and payment methods.', 'Record payment', 'openCreatePaymentModal()')}
    
    <div class="stats" style="grid-template-columns:repeat(3,1fr)">
      <div class="stat">
        <div class="statlabel">Total collected <span>₹</span></div>
        <div class="statvalue">${totalCollected}</div>
        <div class="statfoot"><b class="up">Completed settlements</b></div>
      </div>
      <div class="stat">
        <div class="statlabel">Pending payments <span>◷</span></div>
        <div class="statvalue">${pendingAmount}</div>
        <div class="statfoot">Awaiting payment</div>
      </div>
      <div class="stat">
        <div class="statlabel">Total transactions <span>💳</span></div>
        <div class="statvalue">${totalTx}</div>
        <div class="statfoot">Recorded payments</div>
      </div>
    </div>

    <div class="panel tablepanel">
      <div class="tablehead">
        <h3>Payment Records (${payments.length})</h3>
        <div class="filters">
          <input placeholder="Filter payments..." oninput="filterTableRows(this)">
          <button class="btn btn-sm" onclick="refreshCurrentPage()">Refresh ↻</button>
        </div>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Payment ID</th>
            <th>Tracking ID</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Status</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${payments.length ? payments.map(p => `
            <tr>
              <td><b class="id">${p.paymentId}</b></td>
              <td><b>${p.trackingNumber || '—'}</b></td>
              <td>₹ ${p.amount != null ? p.amount : '0'}</td>
              <td>${p.method || 'CASH'}</td>
              <td>${badge(p.status)}</td>
              <td>${formatTime(p.paymentDate || p.createdAt)}</td>
              <td><button class="btn btn-sm" onclick="viewPaymentDetails('${p.paymentId}')">View ↗</button></td>
            </tr>
          `).join('') : `<tr><td colspan="7" class="empty">No payment records found.</td></tr>`}
        </tbody>
      </table>
      <div class="tablebottom">
        <span>Showing ${payments.length} transactions</span>
      </div>
    </div>
  `;
}

// ------------------------------------------------------------------------------
// View: Support Tickets
// ------------------------------------------------------------------------------
async function renderSupport() {
  const pageData = await api('/api/support-tickets?page=0&size=50').catch(() => ({ content: [] }));
  const tickets = pageData.content || (Array.isArray(pageData) ? pageData : []);

  return `
    ${pageHead('Support tickets', 'Customer support tickets, inquiry tracking, and resolution.', 'Create ticket', 'openCreateTicketModal()')}
    
    <div class="panel tablepanel">
      <div class="tablehead">
        <h3>Support Inquiries (${tickets.length})</h3>
        <div class="filters">
          <input placeholder="Filter tickets..." oninput="filterTableRows(this)">
          <button class="btn btn-sm" onclick="refreshCurrentPage()">Refresh ↻</button>
        </div>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Ticket ID</th>
            <th>Customer</th>
            <th>Tracking ID</th>
            <th>Subject</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${tickets.length ? tickets.map(t => `
            <tr>
              <td><b class="id">${t.ticketId}</b></td>
              <td><b>${t.customerName || t.customerId || '—'}</b></td>
              <td>${t.trackingNumber || '—'}</td>
              <td>${t.subject}</td>
              <td>${badge(t.priority || 'MEDIUM')}</td>
              <td>${badge(t.status || 'OPEN')}</td>
              <td><button class="btn btn-sm" onclick="viewTicketDetails('${t.ticketId}')">Manage ↗</button></td>
            </tr>
          `).join('') : `<tr><td colspan="7" class="empty">No support tickets found.</td></tr>`}
        </tbody>
      </table>
      <div class="tablebottom">
        <span>Showing ${tickets.length} tickets</span>
      </div>
    </div>
  `;
}

// ------------------------------------------------------------------------------
// View: Services
// ------------------------------------------------------------------------------
async function renderServices() {
  const services = await api('/api/services').catch(() => []);

  return `
    ${pageHead('Services', 'Shipping products, base pricing, and delivery commitments.', 'Add service', 'openCreateServiceModal()')}
    
    <div class="panel tablepanel">
      <div class="tablehead">
        <h3>Service Catalog (${services.length})</h3>
        <div class="filters">
          <input placeholder="Filter services..." oninput="filterTableRows(this)">
          <button class="btn btn-sm" onclick="refreshCurrentPage()">Refresh ↻</button>
        </div>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Service ID</th>
            <th>Service Name</th>
            <th>Delivery Estimate</th>
            <th>Base Charge</th>
            <th>Description</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${services.length ? services.map(s => `
            <tr>
              <td><b class="id">${s.serviceId}</b></td>
              <td><b>${s.name}</b></td>
              <td>${s.estimatedDays ? s.estimatedDays + ' business days' : '—'}</td>
              <td>₹ ${s.baseCharge != null ? s.baseCharge : '0'}</td>
              <td>${s.description || '—'}</td>
              <td>${badge(s.active !== false ? 'Active' : 'Inactive')}</td>
            </tr>
          `).join('') : `<tr><td colspan="6" class="empty">No services configured.</td></tr>`}
        </tbody>
      </table>
      <div class="tablebottom">
        <span>Showing ${services.length} services</span>
      </div>
    </div>
  `;
}

// ------------------------------------------------------------------------------
// View: Staff & Access
// ------------------------------------------------------------------------------
async function renderStaff() {
  const staff = await api('/api/staff').catch(() => []);

  return `
    ${pageHead('Staff & access', 'Manage administrative and branch operational team members.', 'Add staff', 'openCreateStaffModal()')}
    
    <div class="panel tablepanel">
      <div class="tablehead">
        <h3>Team Members (${staff.length})</h3>
        <div class="filters">
          <input placeholder="Filter team..." oninput="filterTableRows(this)">
          <button class="btn btn-sm" onclick="refreshCurrentPage()">Refresh ↻</button>
        </div>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Staff ID</th>
            <th>Name</th>
            <th>Role</th>
            <th>Email</th>
            <th>Branch</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${staff.length ? staff.map(s => `
            <tr>
              <td><b class="id">${s.staffId}</b></td>
              <td><b>${s.name}</b></td>
              <td>${s.role}</td>
              <td>${s.email || '—'}</td>
              <td>${s.branchName || s.branchId || 'Headquarters'}</td>
              <td>${badge(s.active !== false ? 'Active' : 'Inactive')}</td>
            </tr>
          `).join('') : `<tr><td colspan="6" class="empty">No staff accounts registered.</td></tr>`}
        </tbody>
      </table>
      <div class="tablebottom">
        <span>Showing ${staff.length} team members</span>
      </div>
    </div>
  `;
}

// ------------------------------------------------------------------------------
// Modal & Action System
// ------------------------------------------------------------------------------
function openModal({ title, fieldsHtml, onSubmit, submitText = 'Save record' }) {
  $('#modalTitle').textContent = title;
  $('#modalFields').innerHTML = fieldsHtml;
  $('#modalAlert').style.display = 'none';
  $('#modalCustomContent').style.display = 'none';
  $('#modalForm').style.display = 'block';
  $('#modalFoot').style.display = 'flex';
  $('#modalSubmitBtn').textContent = submitText;
  $('#modalSubmitBtn').disabled = false;

  $('#modalForm').onsubmit = async (e) => {
    e.preventDefault();
    const btn = $('#modalSubmitBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';
    $('#modalAlert').style.display = 'none';

    try {
      await onSubmit();
      closeModal();
      refreshCurrentPage();
    } catch (err) {
      $('#modalAlert').textContent = err.message || 'Operation failed';
      $('#modalAlert').style.display = 'block';
      btn.disabled = false;
      btn.textContent = submitText;
    }
  };

  $('#modalback').classList.add('show');
}

function openDetailModal({ title, contentHtml, actionsHtml = '' }) {
  $('#modalTitle').textContent = title;
  $('#modalAlert').style.display = 'none';
  $('#modalForm').style.display = 'none';
  $('#modalFoot').style.display = 'none';
  
  const custom = $('#modalCustomContent');
  custom.style.display = 'block';
  custom.innerHTML = `
    ${contentHtml}
    ${actionsHtml ? `<div class="modal-actions">${actionsHtml}</div>` : ''}
    <div class="modalfoot" style="margin-top:16px">
      <button type="button" class="btn" onclick="closeModal()">Close</button>
    </div>
  `;

  $('#modalback').classList.add('show');
}

function closeModal() {
  $('#modalback').classList.remove('show');
}

// ------------------------------------------------------------------------------
// Working Modals: Book Parcel, Add Customer, Support Ticket, etc.
// ------------------------------------------------------------------------------
async function openBookParcelModal() {
  await loadReferenceData();
  const customers = await loadDropdownCustomers();

  const customerOptions = customers.map(c => `<option value="${c.customerId}">${c.name} (${c.customerId})</option>`).join('');
  const originBranchOptions = cache.branches.map(b => `<option value="${b.branchId}">${b.name} (${b.city})</option>`).join('');
  const destBranchOptions = cache.branches.map(b => `<option value="${b.branchId}">${b.name} (${b.city})</option>`).join('');
  const serviceOptions = cache.services.map(s => `<option value="${s.serviceId}">${s.name} - ₹${s.baseCharge}</option>`).join('');

  openModal({
    title: 'Book New Parcel',
    submitText: 'Book Parcel',
    fieldsHtml: `
      <div class="field full">
        <label>Customer *</label>
        <select id="modal_customerId" required>
          <option value="">Select Customer</option>
          ${customerOptions}
        </select>
      </div>
      <div class="field">
        <label>Origin Branch *</label>
        <select id="modal_originBranchId" required>
          <option value="">Select Origin Branch</option>
          ${originBranchOptions}
        </select>
      </div>
      <div class="field">
        <label>Destination Branch *</label>
        <select id="modal_destinationBranchId" required>
          <option value="">Select Destination Branch</option>
          ${destBranchOptions}
        </select>
      </div>
      <div class="field">
        <label>Service Type *</label>
        <select id="modal_serviceId" required>
          <option value="">Select Service</option>
          ${serviceOptions}
        </select>
      </div>
      <div class="field">
        <label>Weight (kg) *</label>
        <input id="modal_weight" type="number" step="0.1" min="0.1" placeholder="e.g. 2.5" required>
      </div>
    `,
    onSubmit: async () => {
      const payload = {
        customerId: $('#modal_customerId').value,
        originBranchId: $('#modal_originBranchId').value,
        destinationBranchId: $('#modal_destinationBranchId').value,
        serviceId: $('#modal_serviceId').value,
        weight: parseFloat($('#modal_weight').value)
      };
      if (payload.originBranchId === payload.destinationBranchId) {
        throw new Error('Origin and destination branches must be different');
      }
      const res = await api('/api/parcels', 'POST', payload);
      toast(`Parcel booked! Tracking ID: ${res.trackingNumber}`);
    }
  });
}

function openCreateCustomerModal() {
  openModal({
    title: 'Register New Customer',
    submitText: 'Create Customer',
    fieldsHtml: `
      <div class="field full">
        <label>Full Name *</label>
        <input id="modal_cust_name" placeholder="e.g. Priya Sharma" required>
      </div>
      <div class="field">
        <label>Email Address *</label>
        <input id="modal_cust_email" type="email" placeholder="priya@example.com" required>
      </div>
      <div class="field">
        <label>Phone Number (10-15 digits) *</label>
        <input id="modal_cust_phone" type="tel" pattern="[0-9]{10,15}" placeholder="9876543210" required>
      </div>
      <div class="field full">
        <label>Delivery Address *</label>
        <input id="modal_cust_address" placeholder="Street, City, PIN" required>
      </div>
    `,
    onSubmit: async () => {
      const payload = {
        name: $('#modal_cust_name').value.trim(),
        email: $('#modal_cust_email').value.trim(),
        phone: $('#modal_cust_phone').value.trim(),
        address: $('#modal_cust_address').value.trim()
      };
      const res = await api('/api/customers', 'POST', payload);
      toast(`Customer created! ID: ${res.customerId}`);
    }
  });
}

function openCreateAgentModal() {
  openModal({
    title: 'Register Delivery Agent',
    submitText: 'Add Agent',
    fieldsHtml: `
      <div class="field full">
        <label>Agent Name *</label>
        <input id="modal_agent_name" placeholder="e.g. Rahul Kumar" required>
      </div>
      <div class="field">
        <label>Phone Number *</label>
        <input id="modal_agent_phone" type="tel" pattern="[0-9]{10,15}" placeholder="9876543210" required>
      </div>
      <div class="field">
        <label>Initial Status *</label>
        <select id="modal_agent_status">
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>
    `,
    onSubmit: async () => {
      const payload = {
        name: $('#modal_agent_name').value.trim(),
        phone: $('#modal_agent_phone').value.trim(),
        status: $('#modal_agent_status').value
      };
      const res = await api('/api/agents', 'POST', payload);
      toast(`Agent registered! ID: ${res.agentId}`);
    }
  });
}

function openCreateVehicleModal() {
  openModal({
    title: 'Register Vehicle to Fleet',
    submitText: 'Add Vehicle',
    fieldsHtml: `
      <div class="field">
        <label>Registration Number *</label>
        <input id="modal_veh_reg" placeholder="e.g. TN 09 AB 1234" required>
      </div>
      <div class="field">
        <label>Vehicle Type *</label>
        <select id="modal_veh_type" required>
          <option value="VAN">VAN</option>
          <option value="TRUCK">TRUCK</option>
          <option value="BIKE">BIKE</option>
        </select>
      </div>
      <div class="field full">
        <label>Capacity (kg) *</label>
        <input id="modal_veh_cap" type="number" step="1" min="1" placeholder="e.g. 500" required>
      </div>
    `,
    onSubmit: async () => {
      const payload = {
        registration: $('#modal_veh_reg').value.trim(),
        type: $('#modal_veh_type').value,
        capacityKg: parseFloat($('#modal_veh_cap').value)
      };
      const res = await api('/api/vehicles', 'POST', payload);
      toast(`Vehicle added! ID: ${res.vehicleId}`);
    }
  });
}

function openCreateBranchModal() {
  openModal({
    title: 'Create Branch Hub',
    submitText: 'Add Branch',
    fieldsHtml: `
      <div class="field">
        <label>Branch Name *</label>
        <input id="modal_branch_name" placeholder="e.g. Coimbatore South" required>
      </div>
      <div class="field">
        <label>City *</label>
        <input id="modal_branch_city" placeholder="e.g. Coimbatore" required>
      </div>
      <div class="field full">
        <label>Address *</label>
        <input id="modal_branch_address" placeholder="Hub street address" required>
      </div>
      <div class="field full">
        <label>Phone Number</label>
        <input id="modal_branch_phone" placeholder="+91 422 2345678">
      </div>
    `,
    onSubmit: async () => {
      const payload = {
        name: $('#modal_branch_name').value.trim(),
        city: $('#modal_branch_city').value.trim(),
        address: $('#modal_branch_address').value.trim(),
        phone: $('#modal_branch_phone').value.trim()
      };
      const res = await api('/api/branches', 'POST', payload);
      toast(`Branch created! ID: ${res.branchId}`);
    }
  });
}

function openCreatePaymentModal() {
  openModal({
    title: 'Record Payment',
    submitText: 'Submit Payment',
    fieldsHtml: `
      <div class="field full">
        <label>Tracking Number *</label>
        <input id="modal_pay_trk" placeholder="e.g. TRK-..." required>
      </div>
      <div class="field">
        <label>Amount (₹) *</label>
        <input id="modal_pay_amount" type="number" step="0.1" min="0.1" placeholder="e.g. 350" required>
      </div>
      <div class="field">
        <label>Payment Method *</label>
        <select id="modal_pay_method" required>
          <option value="UPI">UPI</option>
          <option value="CARD">CARD</option>
          <option value="CASH">CASH</option>
        </select>
      </div>
      <div class="field full">
        <label>Payment Status</label>
        <select id="modal_pay_status">
          <option value="PAID">PAID</option>
          <option value="PENDING">PENDING</option>
        </select>
      </div>
    `,
    onSubmit: async () => {
      const payload = {
        trackingNumber: $('#modal_pay_trk').value.trim(),
        amount: parseFloat($('#modal_pay_amount').value),
        method: $('#modal_pay_method').value,
        status: $('#modal_pay_status').value
      };
      const res = await api('/api/payments', 'POST', payload);
      toast(`Payment recorded! ID: ${res.paymentId}`);
    }
  });
}

async function openCreateTicketModal() {
  const customers = await loadDropdownCustomers();
  const customerOptions = customers.map(c => `<option value="${c.customerId}">${c.name} (${c.customerId})</option>`).join('');

  openModal({
    title: 'Create Support Ticket',
    submitText: 'Submit Ticket',
    fieldsHtml: `
      <div class="field full">
        <label>Customer *</label>
        <select id="modal_tkt_cust" required>
          <option value="">Select Customer</option>
          ${customerOptions}
        </select>
      </div>
      <div class="field full">
        <label>Tracking Number (Optional)</label>
        <input id="modal_tkt_trk" placeholder="e.g. TRK-...">
      </div>
      <div class="field full">
        <label>Subject *</label>
        <input id="modal_tkt_sub" placeholder="e.g. Delay inquiry" required>
      </div>
      <div class="field">
        <label>Priority</label>
        <select id="modal_tkt_pri">
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
          <option value="HIGH">HIGH</option>
          <option value="URGENT">URGENT</option>
        </select>
      </div>
      <div class="field">
        <label>Remarks</label>
        <input id="modal_tkt_rem" placeholder="Notes...">
      </div>
    `,
    onSubmit: async () => {
      const payload = {
        customerId: $('#modal_tkt_cust').value,
        trackingNumber: $('#modal_tkt_trk').value.trim() || null,
        subject: $('#modal_tkt_sub').value.trim(),
        priority: $('#modal_tkt_pri').value,
        remarks: $('#modal_tkt_rem').value.trim() || null
      };
      const res = await api('/api/support-tickets', 'POST', payload);
      toast(`Support ticket created! ID: ${res.ticketId}`);
    }
  });
}

function openCreateServiceModal() {
  openModal({
    title: 'Add Shipping Service',
    submitText: 'Create Service',
    fieldsHtml: `
      <div class="field full">
        <label>Service Name *</label>
        <input id="modal_svc_name" placeholder="e.g. Same-Day Express" required>
      </div>
      <div class="field">
        <label>Est. Delivery Days *</label>
        <input id="modal_svc_days" type="number" min="1" placeholder="1" required>
      </div>
      <div class="field">
        <label>Base Charge (₹) *</label>
        <input id="modal_svc_base" type="number" step="1" min="1" placeholder="150" required>
      </div>
      <div class="field full">
        <label>Description</label>
        <input id="modal_svc_desc" placeholder="Service details...">
      </div>
    `,
    onSubmit: async () => {
      const payload = {
        name: $('#modal_svc_name').value.trim(),
        estimatedDays: parseInt($('#modal_svc_days').value, 10),
        baseCharge: parseFloat($('#modal_svc_base').value),
        description: $('#modal_svc_desc').value.trim() || null,
        active: true
      };
      const res = await api('/api/services', 'POST', payload);
      toast(`Service created! ID: ${res.serviceId}`);
    }
  });
}

async function openCreateStaffModal() {
  await loadReferenceData();
  const branchOptions = cache.branches.map(b => `<option value="${b.branchId}">${b.name}</option>`).join('');

  openModal({
    title: 'Add Staff Member',
    submitText: 'Create Staff',
    fieldsHtml: `
      <div class="field full">
        <label>Full Name *</label>
        <input id="modal_staff_name" placeholder="e.g. Anita Roy" required>
      </div>
      <div class="field">
        <label>Role *</label>
        <select id="modal_staff_role" required>
          <option value="ADMIN">ADMIN</option>
          <option value="BRANCH_MANAGER">BRANCH_MANAGER</option>
          <option value="OPERATIONS">OPERATIONS</option>
          <option value="SUPPORT">SUPPORT</option>
        </select>
      </div>
      <div class="field">
        <label>Email Address</label>
        <input id="modal_staff_email" type="email" placeholder="anita@swiftship.com">
      </div>
      <div class="field full">
        <label>Assigned Branch</label>
        <select id="modal_staff_branch">
          <option value="">Headquarters / No branch</option>
          ${branchOptions}
        </select>
      </div>
    `,
    onSubmit: async () => {
      const payload = {
        name: $('#modal_staff_name').value.trim(),
        role: $('#modal_staff_role').value,
        email: $('#modal_staff_email').value.trim() || null,
        branchId: $('#modal_staff_branch').value || null,
        active: true
      };
      const res = await api('/api/staff', 'POST', payload);
      toast(`Staff account created! ID: ${res.staffId}`);
    }
  });
}

function openAddTrackingEventModal(trackingNumber) {
  openModal({
    title: `Add Milestone Scan for ${trackingNumber}`,
    submitText: 'Record Scan',
    fieldsHtml: `
      <div class="field">
        <label>Location *</label>
        <input id="modal_scan_loc" placeholder="e.g. Bengaluru Central Hub" required>
      </div>
      <div class="field">
        <label>Status Milestone *</label>
        <select id="modal_scan_status" required>
          <option value="PICKED_UP">PICKED_UP</option>
          <option value="IN_TRANSIT">IN_TRANSIT</option>
          <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
          <option value="DELIVERED">DELIVERED</option>
          <option value="DELIVERY_FAILED">DELIVERY_FAILED</option>
        </select>
      </div>
      <div class="field full">
        <label>Remarks</label>
        <input id="modal_scan_remarks" placeholder="Optional remarks or notes...">
      </div>
    `,
    onSubmit: async () => {
      const payload = {
        trackingNumber,
        location: $('#modal_scan_loc').value.trim(),
        status: $('#modal_scan_status').value,
        remarks: $('#modal_scan_remarks').value.trim() || null
      };
      await api('/api/tracking', 'POST', payload);
      toast(`Tracking milestone recorded for ${trackingNumber}`);
      if (active === 'tracking') {
        searchTracking(trackingNumber);
      }
    }
  });
}

// ------------------------------------------------------------------------------
// Detail Inspection Modals
// ------------------------------------------------------------------------------
async function viewParcelDetails(trackingNumber) {
  try {
    const [parcel, history] = await Promise.all([
      api(`/api/parcels/${encodeURIComponent(trackingNumber)}`),
      api(`/api/tracking/${encodeURIComponent(trackingNumber)}`).catch(() => [])
    ]);

    const contentHtml = `
      <div class="detail-grid">
        <div class="detail-item"><span>Tracking Number</span><b>${parcel.trackingNumber}</b></div>
        <div class="detail-item"><span>Status</span>${badge(parcel.status)}</div>
        <div class="detail-item"><span>Customer</span><b>${parcel.customerName || parcel.customerId || '—'}</b></div>
        <div class="detail-item"><span>Weight</span><b>${parcel.weight != null ? parcel.weight + ' kg' : '—'}</b></div>
        <div class="detail-item"><span>Origin Hub</span><b>${parcel.originBranchName || parcel.originBranchId || '—'}</b></div>
        <div class="detail-item"><span>Destination Hub</span><b>${parcel.destinationBranchName || parcel.destinationBranchId || '—'}</b></div>
        <div class="detail-item"><span>Delivery Charge</span><b>₹ ${parcel.deliveryCharge != null ? parcel.deliveryCharge : '0'}</b></div>
        <div class="detail-item"><span>Assigned Agent</span><b>${parcel.assignedAgentName || parcel.assignedAgentId || 'Unassigned'}</b></div>
      </div>
      <div style="margin-top:14px">
        <b style="font-size:12px">Tracking History (${history.length} events)</b>
        <div class="timeline" style="margin-top:10px">
          ${history.length ? history.map(h => `
            <div class="step done">
              <b>${h.status} · ${h.location || 'Hub'}</b>
              <small>${formatTime(h.timestamp)} ${h.remarks ? '— ' + h.remarks : ''}</small>
            </div>
          `).join('') : '<div class="step"><small>No milestone scans recorded.</small></div>'}
        </div>
      </div>
    `;

    const isCancelled = String(parcel.status).toUpperCase() === 'CANCELLED';
    const isDelivered = String(parcel.status).toUpperCase() === 'DELIVERED';

    const actionsHtml = `
      <button class="btn btn-sm primary" onclick="closeModal();openAddTrackingEventModal('${parcel.trackingNumber}')">＋ Add Scan</button>
      <button class="btn btn-sm" onclick="closeModal();openAssignAgentModal('${parcel.trackingNumber}')">Assign Agent</button>
      ${!isCancelled && !isDelivered ? `<button class="btn btn-sm btn-danger" onclick="cancelParcel('${parcel.trackingNumber}')">Cancel Parcel</button>` : ''}
    `;

    openDetailModal({
      title: `Shipment Details · ${parcel.trackingNumber}`,
      contentHtml,
      actionsHtml
    });
  } catch (err) {
    toast('Error loading parcel: ' + err.message);
  }
}

async function cancelParcel(trackingNumber) {
  if (!confirm(`Are you sure you want to cancel parcel ${trackingNumber}?`)) return;
  try {
    await api(`/api/parcels/${encodeURIComponent(trackingNumber)}/cancel`, 'POST', { reason: 'Cancelled by operator' });
    toast(`Parcel ${trackingNumber} has been cancelled.`);
    closeModal();
    refreshCurrentPage();
  } catch (err) {
    alert('Cancellation failed: ' + err.message);
  }
}

async function openAssignAgentModal(trackingNumber) {
  const agents = await api('/api/agents/available').catch(() => []);
  const allAgents = agents.length ? agents : await api('/api/agents').catch(() => []);
  const agentOptions = allAgents.map(a => `<option value="${a.agentId}">${a.name} (${a.status})</option>`).join('');

  openModal({
    title: `Assign Agent to ${trackingNumber}`,
    submitText: 'Assign Agent',
    fieldsHtml: `
      <div class="field full">
        <label>Available Agent *</label>
        <select id="modal_assign_agent" required>
          <option value="">Select Agent</option>
          ${agentOptions}
        </select>
      </div>
    `,
    onSubmit: async () => {
      const agentId = $('#modal_assign_agent').value;
      await api(`/api/agents/${encodeURIComponent(agentId)}/assign/${encodeURIComponent(trackingNumber)}`, 'POST');
      toast(`Agent ${agentId} assigned to ${trackingNumber}`);
    }
  });
}

async function viewCustomerDetails(customerId) {
  try {
    const [cust, history] = await Promise.all([
      api(`/api/customers/${encodeURIComponent(customerId)}`),
      api(`/api/customers/${encodeURIComponent(customerId)}/history`).catch(() => null)
    ]);

    const parcels = history?.parcels || [];

    const contentHtml = `
      <div class="detail-grid">
        <div class="detail-item"><span>Customer ID</span><b>${cust.customerId}</b></div>
        <div class="detail-item"><span>Name</span><b>${cust.name}</b></div>
        <div class="detail-item"><span>Email</span><b>${cust.email}</b></div>
        <div class="detail-item"><span>Phone</span><b>${cust.phone}</b></div>
        <div class="detail-item" style="grid-column:1/-1"><span>Address</span><b>${cust.address || '—'}</b></div>
      </div>
      <div style="margin-top:14px">
        <b style="font-size:12px">Booking History (${parcels.length} parcels)</b>
        <div style="max-height:160px;overflow-y:auto;margin-top:8px">
          ${parcels.length ? parcels.map(p => `
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f3f0;font-size:11px">
              <b>${p.trackingNumber}</b>
              <span>${p.originBranchName || p.originBranchId || 'Hub'} → ${p.destinationBranchName || p.destinationBranchId || 'Hub'}</span>
              <span>${badge(p.status)}</span>
            </div>
          `).join('') : '<div class="empty">No past shipments found.</div>'}
        </div>
      </div>
    `;

    openDetailModal({
      title: `Customer Profile · ${cust.name}`,
      contentHtml
    });
  } catch (err) {
    toast('Error loading customer: ' + err.message);
  }
}

async function viewAgentDetails(agentId) {
  try {
    const [agent, deliveries] = await Promise.all([
      api(`/api/agents/${encodeURIComponent(agentId)}`),
      api(`/api/agents/${encodeURIComponent(agentId)}/deliveries`).catch(() => null)
    ]);

    const activeRuns = deliveries?.activeDeliveries || [];

    const contentHtml = `
      <div class="detail-grid">
        <div class="detail-item"><span>Agent ID</span><b>${agent.agentId}</b></div>
        <div class="detail-item"><span>Name</span><b>${agent.name}</b></div>
        <div class="detail-item"><span>Phone</span><b>${agent.phone}</b></div>
        <div class="detail-item"><span>Status</span>${badge(agent.status)}</div>
        <div class="detail-item" style="grid-column:1/-1"><span>Vehicle</span><b>${agent.assignedVehicleRegistration || 'None'}</b></div>
      </div>
      <div style="margin-top:14px">
        <b style="font-size:12px">Active Deliveries (${activeRuns.length})</b>
        <div style="max-height:150px;overflow-y:auto;margin-top:8px">
          ${activeRuns.length ? activeRuns.map(p => `
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f3f0;font-size:11px">
              <b>${p.trackingNumber}</b>
              <span>${badge(p.status)}</span>
              <button class="btn btn-sm primary" onclick="closeModal();completeDelivery('${agent.agentId}','${p.trackingNumber}')">Mark Complete</button>
            </div>
          `).join('') : '<div class="empty">No parcels currently assigned.</div>'}
        </div>
      </div>
    `;

    const actionsHtml = `
      <button class="btn btn-sm" onclick="toggleAgentStatus('${agent.agentId}','${agent.status === 'AVAILABLE' ? 'INACTIVE' : 'AVAILABLE'}')">Set ${agent.status === 'AVAILABLE' ? 'INACTIVE' : 'AVAILABLE'}</button>
    `;

    openDetailModal({
      title: `Agent Profile · ${agent.name}`,
      contentHtml,
      actionsHtml
    });
  } catch (err) {
    toast('Error loading agent: ' + err.message);
  }
}

async function toggleAgentStatus(agentId, newStatus) {
  try {
    await api(`/api/agents/${encodeURIComponent(agentId)}/status`, 'PATCH', { status: newStatus });
    toast(`Agent status set to ${newStatus}`);
    closeModal();
    refreshCurrentPage();
  } catch (err) {
    alert('Failed to update status: ' + err.message);
  }
}

async function completeDelivery(agentId, trackingNumber) {
  try {
    await api(`/api/agents/${encodeURIComponent(agentId)}/complete/${encodeURIComponent(trackingNumber)}`, 'POST');
    toast(`Assignment completed for ${trackingNumber}`);
    closeModal();
    refreshCurrentPage();
  } catch (err) {
    alert('Failed to complete assignment: ' + err.message);
  }
}

async function viewVehicleDetails(vehicleId) {
  try {
    const [veh, agents] = await Promise.all([
      api(`/api/vehicles/${encodeURIComponent(vehicleId)}`),
      api('/api/agents').catch(() => [])
    ]);

    const contentHtml = `
      <div class="detail-grid">
        <div class="detail-item"><span>Vehicle ID</span><b>${veh.vehicleId}</b></div>
        <div class="detail-item"><span>Registration</span><b>${veh.registration}</b></div>
        <div class="detail-item"><span>Type</span><b>${veh.type}</b></div>
        <div class="detail-item"><span>Capacity</span><b>${veh.capacityKg} kg</b></div>
        <div class="detail-item"><span>Status</span>${badge(veh.status)}</div>
        <div class="detail-item"><span>Assigned Driver</span><b>${veh.assignedAgentName || 'Unassigned'}</b></div>
      </div>
    `;

    const isAssigned = !!veh.assignedAgentId;
    const actionsHtml = isAssigned
      ? `<button class="btn btn-sm btn-warn" onclick="unassignVehicle('${veh.vehicleId}')">Unassign Driver</button>`
      : `<button class="btn btn-sm primary" onclick="closeModal();openAssignVehicleModal('${veh.vehicleId}')">Assign Driver</button>`;

    openDetailModal({
      title: `Vehicle · ${veh.registration}`,
      contentHtml,
      actionsHtml
    });
  } catch (err) {
    toast('Error loading vehicle: ' + err.message);
  }
}

async function unassignVehicle(vehicleId) {
  try {
    await api(`/api/vehicles/${encodeURIComponent(vehicleId)}/unassign`, 'POST');
    toast('Vehicle unassigned successfully.');
    closeModal();
    refreshCurrentPage();
  } catch (err) {
    alert('Unassign failed: ' + err.message);
  }
}

async function openAssignVehicleModal(vehicleId) {
  const agents = await api('/api/agents').catch(() => []);
  const agentOptions = agents.map(a => `<option value="${a.agentId}">${a.name}</option>`).join('');

  openModal({
    title: 'Assign Driver to Vehicle',
    submitText: 'Assign Driver',
    fieldsHtml: `
      <div class="field full">
        <label>Select Agent *</label>
        <select id="modal_assign_veh_agent" required>
          <option value="">Select Agent</option>
          ${agentOptions}
        </select>
      </div>
    `,
    onSubmit: async () => {
      const agentId = $('#modal_assign_veh_agent').value;
      await api(`/api/vehicles/${encodeURIComponent(vehicleId)}/assign-agent/${encodeURIComponent(agentId)}`, 'POST');
      toast('Driver assigned to vehicle.');
    }
  });
}

async function viewBranchDetails(branchId) {
  try {
    const [branch, connected] = await Promise.all([
      api(`/api/branches/${encodeURIComponent(branchId)}`),
      api(`/api/branches/${encodeURIComponent(branchId)}/connected`).catch(() => [])
    ]);

    const contentHtml = `
      <div class="detail-grid">
        <div class="detail-item"><span>Branch ID</span><b>${branch.branchId}</b></div>
        <div class="detail-item"><span>Name</span><b>${branch.name}</b></div>
        <div class="detail-item"><span>City</span><b>${branch.city}</b></div>
        <div class="detail-item"><span>Phone</span><b>${branch.phone || '—'}</b></div>
        <div class="detail-item" style="grid-column:1/-1"><span>Address</span><b>${branch.address}</b></div>
      </div>
      <div style="margin-top:14px">
        <b style="font-size:12px">Connected Hubs (${connected.length})</b>
        <div style="margin-top:8px">
          ${connected.length ? connected.map(c => `
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f3f0;font-size:11px">
              <b>${c.name} (${c.city})</b>
              <span>${c.distanceKm != null ? c.distanceKm + ' km' : 'Direct link'}</span>
            </div>
          `).join('') : '<div class="empty">No direct transit connections found.</div>'}
        </div>
      </div>
    `;

    openDetailModal({
      title: `Hub Details · ${branch.name}`,
      contentHtml
    });
  } catch (err) {
    toast('Error loading branch: ' + err.message);
  }
}

async function viewPaymentDetails(paymentId) {
  try {
    const pay = await api(`/api/payments/${encodeURIComponent(paymentId)}`);
    const contentHtml = `
      <div class="detail-grid">
        <div class="detail-item"><span>Payment ID</span><b>${pay.paymentId}</b></div>
        <div class="detail-item"><span>Status</span>${badge(pay.status)}</div>
        <div class="detail-item"><span>Tracking Number</span><b>${pay.trackingNumber || '—'}</b></div>
        <div class="detail-item"><span>Amount</span><b>₹ ${pay.amount}</b></div>
        <div class="detail-item"><span>Payment Method</span><b>${pay.method}</b></div>
        <div class="detail-item"><span>Timestamp</span><b>${formatTime(pay.paymentDate || pay.createdAt)}</b></div>
      </div>
    `;
    openDetailModal({
      title: `Payment Receipt · ${pay.paymentId}`,
      contentHtml
    });
  } catch (err) {
    toast('Error loading payment: ' + err.message);
  }
}

async function viewTicketDetails(ticketId) {
  try {
    const tkt = await api(`/api/support-tickets/${encodeURIComponent(ticketId)}`);
    const contentHtml = `
      <div class="detail-grid">
        <div class="detail-item"><span>Ticket ID</span><b>${tkt.ticketId}</b></div>
        <div class="detail-item"><span>Priority</span>${badge(tkt.priority || 'MEDIUM')}</div>
        <div class="detail-item"><span>Status</span>${badge(tkt.status || 'OPEN')}</div>
        <div class="detail-item"><span>Customer</span><b>${tkt.customerName || tkt.customerId || '—'}</b></div>
        <div class="detail-item"><span>Tracking ID</span><b>${tkt.trackingNumber || 'None'}</b></div>
        <div class="detail-item"><span>Subject</span><b>${tkt.subject}</b></div>
        <div class="detail-item" style="grid-column:1/-1"><span>Remarks</span><b>${tkt.remarks || 'No notes added'}</b></div>
      </div>
    `;

    const actionsHtml = `
      <button class="btn btn-sm" onclick="updateTicketStatus('${tkt.ticketId}','IN_PROGRESS')">Set In-Progress</button>
      <button class="btn btn-sm primary" onclick="updateTicketStatus('${tkt.ticketId}','RESOLVED')">Mark Resolved</button>
      <button class="btn btn-sm btn-danger" onclick="updateTicketStatus('${tkt.ticketId}','CLOSED')">Close Ticket</button>
    `;

    openDetailModal({
      title: `Support Ticket · ${tkt.ticketId}`,
      contentHtml,
      actionsHtml
    });
  } catch (err) {
    toast('Error loading ticket: ' + err.message);
  }
}

async function updateTicketStatus(ticketId, newStatus) {
  try {
    await api(`/api/support-tickets/${encodeURIComponent(ticketId)}/status`, 'PUT', { status: newStatus });
    toast(`Ticket status updated to ${newStatus}`);
    closeModal();
    refreshCurrentPage();
  } catch (err) {
    alert('Update ticket status failed: ' + err.message);
  }
}

// ------------------------------------------------------------------------------
// Utilities
// ------------------------------------------------------------------------------
function filterTableRows(inp) {
  const q = inp.value.toLowerCase();
  $$('.data-table tbody tr').forEach(tr => {
    tr.style.display = tr.innerText.toLowerCase().includes(q) ? '' : 'none';
  });
}

function formatTime(isoStr) {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (_) {
    return isoStr;
  }
}

function formatDuration(minutes) {
  if (!minutes) return '—';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

// ==============================================================================
// DATABASE TOOLS: SQL Query Builder
// ==============================================================================

const SQL_SCHEMA = {
  parcels: {
    label: 'Parcels (Shipments)',
    alias: 'p',
    columns: [
      { name: 'parcel_id', type: 'VARCHAR(36)', pk: true },
      { name: 'tracking_number', type: 'VARCHAR(20)' },
      { name: 'customer_id', type: 'VARCHAR(36)', fk: 'customers.customer_id' },
      { name: 'origin_branch_id', type: 'VARCHAR(36)', fk: 'branches.branch_id' },
      { name: 'dest_branch_id', type: 'VARCHAR(36)', fk: 'branches.branch_id' },
      { name: 'service_id', type: 'VARCHAR(36)', fk: 'courier_services.service_id' },
      { name: 'delivery_agent_id', type: 'VARCHAR(36)', fk: 'delivery_agents.agent_id' },
      { name: 'weight_kg', type: 'DECIMAL(6,2)' },
      { name: 'status', type: 'VARCHAR(25)' },
      { name: 'created_at', type: 'TIMESTAMP' }
    ]
  },
  customers: {
    label: 'Customers',
    alias: 'c',
    columns: [
      { name: 'customer_id', type: 'VARCHAR(36)', pk: true },
      { name: 'full_name', type: 'VARCHAR(100)' },
      { name: 'email', type: 'VARCHAR(120)' },
      { name: 'phone_number', type: 'VARCHAR(20)' },
      { name: 'city', type: 'VARCHAR(50)' },
      { name: 'address', type: 'VARCHAR(255)' },
      { name: 'created_at', type: 'TIMESTAMP' }
    ]
  },
  branches: {
    label: 'Branches (Hubs)',
    alias: 'b',
    columns: [
      { name: 'branch_id', type: 'VARCHAR(36)', pk: true },
      { name: 'branch_name', type: 'VARCHAR(80)' },
      { name: 'city', type: 'VARCHAR(50)' },
      { name: 'state', type: 'VARCHAR(50)' },
      { name: 'pincode', type: 'VARCHAR(10)' },
      { name: 'manager_name', type: 'VARCHAR(100)' },
      { name: 'phone', type: 'VARCHAR(20)' }
    ]
  },
  delivery_agents: {
    label: 'Delivery Agents',
    alias: 'da',
    columns: [
      { name: 'agent_id', type: 'VARCHAR(36)', pk: true },
      { name: 'full_name', type: 'VARCHAR(100)' },
      { name: 'phone_number', type: 'VARCHAR(20)' },
      { name: 'vehicle_id', type: 'VARCHAR(36)', fk: 'vehicles.vehicle_id' },
      { name: 'assigned_branch_id', type: 'VARCHAR(36)', fk: 'branches.branch_id' },
      { name: 'active_status', type: 'VARCHAR(20)' }
    ]
  },
  vehicles: {
    label: 'Fleet Vehicles',
    alias: 'v',
    columns: [
      { name: 'vehicle_id', type: 'VARCHAR(36)', pk: true },
      { name: 'registration_number', type: 'VARCHAR(30)' },
      { name: 'vehicle_type', type: 'VARCHAR(20)' },
      { name: 'capacity_kg', type: 'DECIMAL(8,2)' },
      { name: 'active_status', type: 'VARCHAR(20)' }
    ]
  },
  courier_services: {
    label: 'Courier Services',
    alias: 'cs',
    columns: [
      { name: 'service_id', type: 'VARCHAR(36)', pk: true },
      { name: 'service_name', type: 'VARCHAR(60)' },
      { name: 'base_rate', type: 'DECIMAL(8,2)' },
      { name: 'per_kg_rate', type: 'DECIMAL(8,2)' },
      { name: 'est_delivery_days', type: 'INT' }
    ]
  },
  tracking_events: {
    label: 'Tracking Events',
    alias: 'te',
    columns: [
      { name: 'event_id', type: 'VARCHAR(36)', pk: true },
      { name: 'parcel_id', type: 'VARCHAR(36)', fk: 'parcels.parcel_id' },
      { name: 'event_status', type: 'VARCHAR(30)' },
      { name: 'location', type: 'VARCHAR(100)' },
      { name: 'event_timestamp', type: 'TIMESTAMP' },
      { name: 'remarks', type: 'VARCHAR(255)' }
    ]
  },
  payments: {
    label: 'Payments',
    alias: 'pay',
    columns: [
      { name: 'payment_id', type: 'VARCHAR(36)', pk: true },
      { name: 'parcel_id', type: 'VARCHAR(36)', fk: 'parcels.parcel_id' },
      { name: 'amount', type: 'DECIMAL(10,2)' },
      { name: 'payment_method', type: 'VARCHAR(25)' },
      { name: 'payment_status', type: 'VARCHAR(25)' },
      { name: 'transaction_time', type: 'TIMESTAMP' }
    ]
  },
  support_tickets: {
    label: 'Support Tickets',
    alias: 'st',
    columns: [
      { name: 'ticket_id', type: 'VARCHAR(36)', pk: true },
      { name: 'customer_id', type: 'VARCHAR(36)', fk: 'customers.customer_id' },
      { name: 'parcel_id', type: 'VARCHAR(36)', fk: 'parcels.parcel_id' },
      { name: 'subject', type: 'VARCHAR(120)' },
      { name: 'priority', type: 'VARCHAR(20)' },
      { name: 'status', type: 'VARCHAR(20)' },
      { name: 'created_at', type: 'TIMESTAMP' }
    ]
  },
  staff: {
    label: 'Staff Members',
    alias: 's',
    columns: [
      { name: 'staff_id', type: 'VARCHAR(36)', pk: true },
      { name: 'full_name', type: 'VARCHAR(100)' },
      { name: 'email', type: 'VARCHAR(120)' },
      { name: 'role', type: 'VARCHAR(30)' },
      { name: 'branch_id', type: 'VARCHAR(36)', fk: 'branches.branch_id' },
      { name: 'status', type: 'VARCHAR(20)' }
    ]
  }
};

const SQL_PRESETS = [
  {
    title: 'Pending Deliveries by Destination Hub',
    desc: 'Joins parcels with destination branches to identify in-transit distribution workload.',
    table: 'parcels',
    columns: ['p.tracking_number', 'p.status', 'b.branch_name AS destination_hub', 'p.weight_kg', 'p.created_at'],
    joins: [
      { type: 'INNER JOIN', table: 'branches', onLeft: 'p.dest_branch_id', onRight: 'b.branch_id' }
    ],
    wheres: [
      { column: 'p.status', operator: '=', value: "'IN_TRANSIT'" }
    ],
    groupBy: [],
    having: '',
    orderBy: 'p.created_at',
    orderDir: 'DESC',
    limit: 25,
    relAlgebra: 'π(tracking_number, status, branch_name, weight_kg) [ σ(status = \'IN_TRANSIT\') (parcels ⨝_{dest_branch_id = branch_id} branches) ]'
  },
  {
    title: 'High-Value Delayed Parcels with Paid Invoices',
    desc: 'Filters paid consignments above ₹1,500 that require priority transit monitoring.',
    table: 'parcels',
    columns: ['p.tracking_number', 'c.full_name AS customer_name', 'pay.amount AS invoice_amount', 'pay.payment_status', 'p.status AS shipment_status'],
    joins: [
      { type: 'INNER JOIN', table: 'customers', onLeft: 'p.customer_id', onRight: 'c.customer_id' },
      { type: 'INNER JOIN', table: 'payments', onLeft: 'p.parcel_id', onRight: 'pay.parcel_id' }
    ],
    wheres: [
      { column: 'pay.payment_status', operator: '=', value: "'PAID'" },
      { column: 'pay.amount', operator: '>=', value: '1500.00' }
    ],
    groupBy: [],
    having: '',
    orderBy: 'pay.amount',
    orderDir: 'DESC',
    limit: 25,
    relAlgebra: 'π(tracking_number, full_name, amount) [ σ(payment_status = \'PAID\' ∧ amount ≥ 1500) (parcels ⨝ customers ⨝ payments) ]'
  },
  {
    title: 'Delivery Agent Workload & Run Sheets',
    desc: 'Aggregates current assignment volume per active delivery personnel and fleet vehicle.',
    table: 'delivery_agents',
    columns: ['da.agent_id', 'da.full_name AS agent_name', 'da.phone_number', 'COUNT(p.parcel_id) AS assigned_shipments', 'v.registration_number AS vehicle_plate'],
    joins: [
      { type: 'LEFT OUTER JOIN', table: 'parcels', onLeft: 'da.agent_id', onRight: 'p.delivery_agent_id' },
      { type: 'LEFT OUTER JOIN', table: 'vehicles', onLeft: 'da.vehicle_id', onRight: 'v.vehicle_id' }
    ],
    wheres: [
      { column: 'da.active_status', operator: '=', value: "'ACTIVE'" }
    ],
    groupBy: ['da.agent_id', 'da.full_name', 'da.phone_number', 'v.registration_number'],
    having: '',
    orderBy: 'assigned_shipments',
    orderDir: 'DESC',
    limit: 25,
    relAlgebra: 'γ(agent_name, registration_number; COUNT(parcel_id) → assigned_shipments) [ σ(active_status = \'ACTIVE\') (delivery_agents ⟕ parcels ⟕ vehicles) ]'
  },
  {
    title: 'Customer Lifetime Spend & Order Concentration',
    desc: 'Computes total freight charges and booking frequency for high-volume accounts.',
    table: 'customers',
    columns: ['c.customer_id', 'c.full_name', 'c.city', 'COUNT(p.parcel_id) AS total_orders', 'COALESCE(SUM(pay.amount), 0.00) AS total_freight_expenditure'],
    joins: [
      { type: 'INNER JOIN', table: 'parcels', onLeft: 'c.customer_id', onRight: 'p.customer_id' },
      { type: 'LEFT OUTER JOIN', table: 'payments', onLeft: 'p.parcel_id', onRight: 'pay.parcel_id' }
    ],
    wheres: [],
    groupBy: ['c.customer_id', 'c.full_name', 'c.city'],
    having: 'COUNT(p.parcel_id) >= 2',
    orderBy: 'total_freight_expenditure',
    orderDir: 'DESC',
    limit: 25,
    relAlgebra: 'π(customer_id, full_name, total_orders, total_freight) [ σ(COUNT ≥ 2) (γ(customer_id; COUNT(parcel_id), SUM(amount)) (customers ⨝ parcels ⟕ payments)) ]'
  },
  {
    title: 'Critical Open Support Escalations',
    desc: 'Extracts urgent unresolved customer complaints linked to tracking numbers.',
    table: 'support_tickets',
    columns: ['st.ticket_id', 'st.subject', 'st.priority', 'st.status', 'c.full_name AS requester_name', 'c.phone_number', 'p.tracking_number'],
    joins: [
      { type: 'INNER JOIN', table: 'customers', onLeft: 'st.customer_id', onRight: 'c.customer_id' },
      { type: 'LEFT OUTER JOIN', table: 'parcels', onLeft: 'st.parcel_id', onRight: 'p.parcel_id' }
    ],
    wheres: [
      { column: 'st.status', operator: '=', value: "'OPEN'" },
      { column: 'st.priority', operator: '=', value: "'CRITICAL'" }
    ],
    groupBy: [],
    having: '',
    orderBy: 'st.created_at',
    orderDir: 'ASC',
    limit: 25,
    relAlgebra: 'π(ticket_id, subject, priority, full_name, tracking_number) [ σ(status=\'OPEN\' ∧ priority=\'CRITICAL\') (support_tickets ⨝ customers ⟕ parcels) ]'
  }
];

let sqlBuilderState = {
  activePresetIndex: 0,
  table: 'parcels',
  columns: [...SQL_PRESETS[0].columns],
  joins: JSON.parse(JSON.stringify(SQL_PRESETS[0].joins)),
  wheres: JSON.parse(JSON.stringify(SQL_PRESETS[0].wheres)),
  groupBy: [...SQL_PRESETS[0].groupBy],
  having: SQL_PRESETS[0].having,
  orderBy: SQL_PRESETS[0].orderBy,
  orderDir: SQL_PRESETS[0].orderDir,
  limit: SQL_PRESETS[0].limit,
  relAlgebra: SQL_PRESETS[0].relAlgebra
};

function generateSqlString(state) {
  const tMeta = SQL_SCHEMA[state.table] || { alias: 't' };
  const alias = tMeta.alias || 't';
  
  let sql = 'SELECT\n';
  if (state.columns.length === 0) {
    sql += '  *\n';
  } else {
    sql += state.columns.map(c => `  ${c}`).join(',\n') + '\n';
  }
  
  sql += `FROM ${state.table} ${alias}\n`;
  
  if (state.joins && state.joins.length > 0) {
    for (const j of state.joins) {
      const jMeta = SQL_SCHEMA[j.table] || { alias: 'j' };
      sql += `${j.type} ${j.table} ${jMeta.alias} ON ${j.onLeft} = ${j.onRight}\n`;
    }
  }
  
  if (state.wheres && state.wheres.length > 0) {
    const whereParts = state.wheres
      .filter(w => w.column && w.operator)
      .map(w => `${w.column} ${w.operator} ${w.value || "''"}`);
    if (whereParts.length > 0) {
      sql += 'WHERE ' + whereParts.join('\n  AND ') + '\n';
    }
  }
  
  if (state.groupBy && state.groupBy.length > 0) {
    sql += `GROUP BY ${state.groupBy.join(', ')}\n`;
  }
  
  if (state.having) {
    sql += `HAVING ${state.having}\n`;
  }
  
  if (state.orderBy) {
    sql += `ORDER BY ${state.orderBy} ${state.orderDir || 'ASC'}\n`;
  }
  
  if (state.limit && state.limit !== 'ALL') {
    sql += `LIMIT ${state.limit};\n`;
  } else {
    sql += ';\n';
  }
  
  return sql;
}

function highlightSqlSyntax(rawSql) {
  const keywords = [
    'SELECT', 'FROM', 'INNER JOIN', 'LEFT OUTER JOIN', 'RIGHT OUTER JOIN',
    'JOIN', 'ON', 'WHERE', 'AND', 'OR', 'GROUP BY', 'HAVING', 'ORDER BY',
    'LIMIT', 'ASC', 'DESC', 'COUNT', 'SUM', 'AVG', 'COALESCE', 'AS'
  ];
  
  let escaped = rawSql
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
    
  // Highlight strings
  escaped = escaped.replace(/'([^']*)'/g, '<span class="sql-str">\'$1\'</span>');
  
  // Highlight keywords
  for (const kw of keywords) {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g');
    escaped = escaped.replace(regex, '<span class="sql-kw">$1</span>');
  }
  
  return escaped;
}

async function renderSqlBuilder() {
  const curTable = SQL_SCHEMA[sqlBuilderState.table] || SQL_SCHEMA.parcels;
  const currentSql = generateSqlString(sqlBuilderState);
  const highlighted = highlightSqlSyntax(currentSql);
  
  return `
    ${pageHead('SQL Query Builder', 'Interactive SQL generator for logistics relational schema with live syntax preview, presets, and relational algebra.')}
    
    <div class="db-tool-container">
      <div class="disclaimer-badge">
        <span>⚠️</span>
        <div>
          <b>Educational Relational Preview Mode:</b>
          This interactive builder demonstrates relational DBMS constructs (Tables, Projection, Selection, Joins, Grouping). The live SwiftShip cloud application persists data in Neo4j AuraDB graph database.
        </div>
      </div>
      
      <div class="preset-container" id="presetContainer">
        ${SQL_PRESETS.map((p, idx) => `
          <button class="preset-chip ${sqlBuilderState.activePresetIndex === idx ? 'active' : ''}" onclick="applySqlPreset(${idx})">
            ${p.title}
          </button>
        `).join('')}
      </div>
      
      <div class="sql-workbench">
        <div>
          <!-- Table & Columns Clause -->
          <div class="clause-card">
            <div class="clause-header">
              <h4><span class="clause-keyword">FROM</span> Base Table</h4>
              <select id="builderTableSelect" onchange="onBuilderTableChange(this.value)">
                ${Object.entries(SQL_SCHEMA).map(([key, t]) => `
                  <option value="${key}" ${sqlBuilderState.table === key ? 'selected' : ''}>${t.label} (${key})</option>
                `).join('')}
              </select>
            </div>
            
            <div class="clause-header" style="margin-top:14px;">
              <h4><span class="clause-keyword">SELECT</span> Columns</h4>
              <div class="actions">
                <button type="button" class="btn btn-sm" onclick="selectAllColumns()">All</button>
                <button type="button" class="btn btn-sm ghost" onclick="clearColumns()">Clear</button>
              </div>
            </div>
            
            <div class="chip-selector" id="columnChips">
              ${curTable.columns.map(c => {
                const colKey = `${curTable.alias}.${c.name}`;
                const isSelected = sqlBuilderState.columns.some(sc => sc.startsWith(colKey) || sc === colKey);
                return `
                  <div class="chip-item ${isSelected ? 'selected' : ''}" onclick="toggleBuilderColumn('${colKey}')">
                    ${c.name} <small style="opacity:0.7">${c.type}</small>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          
          <!-- JOIN Clause -->
          <div class="clause-card">
            <div class="clause-header">
              <h4><span class="clause-keyword">JOIN</span> Table Relationships</h4>
              <button type="button" class="btn btn-sm" onclick="addJoinClause()">＋ Add Join</button>
            </div>
            
            <div id="joinRows">
              ${sqlBuilderState.joins.length === 0 ? '<p style="color:var(--muted);font-size:12px;margin:0;">No joins configured.</p>' : ''}
              ${sqlBuilderState.joins.map((j, idx) => `
                <div class="clause-row">
                  <select onchange="updateJoinField(${idx}, 'type', this.value)">
                    <option value="INNER JOIN" ${j.type === 'INNER JOIN' ? 'selected' : ''}>INNER JOIN</option>
                    <option value="LEFT OUTER JOIN" ${j.type === 'LEFT OUTER JOIN' ? 'selected' : ''}>LEFT JOIN</option>
                    <option value="RIGHT OUTER JOIN" ${j.type === 'RIGHT OUTER JOIN' ? 'selected' : ''}>RIGHT JOIN</option>
                  </select>
                  <select onchange="updateJoinField(${idx}, 'table', this.value)">
                    ${Object.entries(SQL_SCHEMA).map(([k, t]) => `
                      <option value="${k}" ${j.table === k ? 'selected' : ''}>${t.label}</option>
                    `).join('')}
                  </select>
                  <input placeholder="p.dest_branch_id" value="${j.onLeft}" oninput="updateJoinField(${idx}, 'onLeft', this.value)">
                  <span>=</span>
                  <input placeholder="b.branch_id" value="${j.onRight}" oninput="updateJoinField(${idx}, 'onRight', this.value)">
                  <button type="button" class="remove-btn" onclick="removeJoinClause(${idx})">×</button>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- WHERE Clause -->
          <div class="clause-card">
            <div class="clause-header">
              <h4><span class="clause-keyword">WHERE</span> Filters</h4>
              <button type="button" class="btn btn-sm" onclick="addWhereClause()">＋ Add Filter</button>
            </div>
            
            <div id="whereRows">
              ${sqlBuilderState.wheres.length === 0 ? '<p style="color:var(--muted);font-size:12px;margin:0;">No conditions specified.</p>' : ''}
              ${sqlBuilderState.wheres.map((w, idx) => `
                <div class="clause-row">
                  <input placeholder="column" value="${w.column}" oninput="updateWhereField(${idx}, 'column', this.value)">
                  <select onchange="updateWhereField(${idx}, 'operator', this.value)">
                    <option value="=" ${w.operator === '=' ? 'selected' : ''}>=</option>
                    <option value="!=" ${w.operator === '!=' ? 'selected' : ''}>!=</option>
                    <option value="&gt;" ${w.operator === '>' ? 'selected' : ''}>&gt;</option>
                    <option value="&lt;" ${w.operator === '<' ? 'selected' : ''}>&lt;</option>
                    <option value="&gt;=" ${w.operator === '>=' ? 'selected' : ''}>&gt;=</option>
                    <option value="&lt;=" ${w.operator === '<=' ? 'selected' : ''}>&lt;=</option>
                    <option value="LIKE" ${w.operator === 'LIKE' ? 'selected' : ''}>LIKE</option>
                    <option value="IN" ${w.operator === 'IN' ? 'selected' : ''}>IN</option>
                  </select>
                  <input placeholder="'IN_TRANSIT'" value="${w.value}" oninput="updateWhereField(${idx}, 'value', this.value)">
                  <button type="button" class="remove-btn" onclick="removeWhereClause(${idx})">×</button>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Order & Limit -->
          <div class="clause-card">
            <div class="formgrid">
              <div class="field">
                <label>Order By Column</label>
                <input placeholder="p.created_at" value="${sqlBuilderState.orderBy}" oninput="updateOrderBy(this.value)">
              </div>
              <div class="field">
                <label>Direction & Limit</label>
                <div style="display:flex;gap:8px;">
                  <select style="flex:1" onchange="updateOrderDir(this.value)">
                    <option value="DESC" ${sqlBuilderState.orderDir === 'DESC' ? 'selected' : ''}>DESC (Descending)</option>
                    <option value="ASC" ${sqlBuilderState.orderDir === 'ASC' ? 'selected' : ''}>ASC (Ascending)</option>
                  </select>
                  <select style="width:100px" onchange="updateLimit(this.value)">
                    <option value="10" ${String(sqlBuilderState.limit) === '10' ? 'selected' : ''}>10</option>
                    <option value="25" ${String(sqlBuilderState.limit) === '25' ? 'selected' : ''}>25</option>
                    <option value="50" ${String(sqlBuilderState.limit) === '50' ? 'selected' : ''}>50</option>
                    <option value="100" ${String(sqlBuilderState.limit) === '100' ? 'selected' : ''}>100</option>
                    <option value="ALL" ${String(sqlBuilderState.limit) === 'ALL' ? 'selected' : ''}>ALL</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Live SQL Preview Column -->
        <div>
          <div class="code-preview-card">
            <div class="code-preview-header">
              <span class="code-title">
                <span>📄</span> Formatted ANSI SQL Statement
              </span>
              <div class="code-actions">
                <button type="button" class="code-btn" id="btnCopySql" onclick="copySqlStatement()">
                  Copy SQL
                </button>
                <button type="button" class="code-btn" onclick="downloadSqlFile()">
                  Download .sql
                </button>
              </div>
            </div>
            
            <pre class="code-block" id="sqlOutputBlock">${highlighted}</pre>
            
            <div class="rel-algebra-panel">
              <b>Relational Algebra Projection:</b>
              <div id="relAlgebraText">${sqlBuilderState.relAlgebra || 'π [ σ ( R ⨝ S ) ]'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function initSqlBuilderEvents() {
  // Event listeners are bound via inline callbacks
}

function applySqlPreset(idx) {
  const p = SQL_PRESETS[idx];
  if (!p) return;
  sqlBuilderState = {
    activePresetIndex: idx,
    table: p.table,
    columns: [...p.columns],
    joins: JSON.parse(JSON.stringify(p.joins)),
    wheres: JSON.parse(JSON.stringify(p.wheres)),
    groupBy: [...p.groupBy],
    having: p.having,
    orderBy: p.orderBy,
    orderDir: p.orderDir,
    limit: p.limit,
    relAlgebra: p.relAlgebra
  };
  go('sqlbuilder');
  toast(`Loaded Preset: ${p.title}`);
}

function onBuilderTableChange(t) {
  sqlBuilderState.activePresetIndex = null;
  sqlBuilderState.table = t;
  const tMeta = SQL_SCHEMA[t];
  sqlBuilderState.columns = tMeta ? tMeta.columns.slice(0, 4).map(c => `${tMeta.alias}.${c.name}`) : [];
  sqlBuilderState.joins = [];
  sqlBuilderState.wheres = [];
  sqlBuilderState.orderBy = tMeta ? `${tMeta.alias}.${tMeta.columns[0].name}` : '';
  sqlBuilderState.relAlgebra = `π [ σ ( ${t} ) ]`;
  go('sqlbuilder');
}

function toggleBuilderColumn(colKey) {
  sqlBuilderState.activePresetIndex = null;
  const idx = sqlBuilderState.columns.indexOf(colKey);
  if (idx >= 0) {
    sqlBuilderState.columns.splice(idx, 1);
  } else {
    sqlBuilderState.columns.push(colKey);
  }
  updateSqlPreview();
}

function selectAllColumns() {
  const tMeta = SQL_SCHEMA[sqlBuilderState.table];
  if (!tMeta) return;
  sqlBuilderState.activePresetIndex = null;
  sqlBuilderState.columns = tMeta.columns.map(c => `${tMeta.alias}.${c.name}`);
  updateSqlPreview();
}

function clearColumns() {
  sqlBuilderState.activePresetIndex = null;
  sqlBuilderState.columns = [];
  updateSqlPreview();
}

function addJoinClause() {
  sqlBuilderState.activePresetIndex = null;
  sqlBuilderState.joins.push({
    type: 'INNER JOIN',
    table: 'branches',
    onLeft: 'p.dest_branch_id',
    onRight: 'b.branch_id'
  });
  go('sqlbuilder');
}

function updateJoinField(idx, field, val) {
  if (sqlBuilderState.joins[idx]) {
    sqlBuilderState.joins[idx][field] = val;
    updateSqlPreview();
  }
}

function removeJoinClause(idx) {
  sqlBuilderState.joins.splice(idx, 1);
  go('sqlbuilder');
}

function addWhereClause() {
  sqlBuilderState.activePresetIndex = null;
  const tMeta = SQL_SCHEMA[sqlBuilderState.table];
  sqlBuilderState.wheres.push({
    column: tMeta ? `${tMeta.alias}.status` : 'status',
    operator: '=',
    value: "'IN_TRANSIT'"
  });
  go('sqlbuilder');
}

function updateWhereField(idx, field, val) {
  if (sqlBuilderState.wheres[idx]) {
    sqlBuilderState.wheres[idx][field] = val;
    updateSqlPreview();
  }
}

function removeWhereClause(idx) {
  sqlBuilderState.wheres.splice(idx, 1);
  go('sqlbuilder');
}

function updateOrderBy(val) {
  sqlBuilderState.orderBy = val;
  updateSqlPreview();
}

function updateOrderDir(val) {
  sqlBuilderState.orderDir = val;
  updateSqlPreview();
}

function updateLimit(val) {
  sqlBuilderState.limit = val;
  updateSqlPreview();
}

function updateSqlPreview() {
  const codeBlock = $('#sqlOutputBlock');
  if (codeBlock) {
    const raw = generateSqlString(sqlBuilderState);
    codeBlock.innerHTML = highlightSqlSyntax(raw);
  }
  const relBlock = $('#relAlgebraText');
  if (relBlock) {
    const cols = sqlBuilderState.columns.length > 0 ? sqlBuilderState.columns.map(c => c.split('.')[1] || c).join(', ') : '*';
    relBlock.textContent = `π(${cols}) [ σ [ ${sqlBuilderState.table} ] ]`;
  }
}

function copySqlStatement() {
  const sql = generateSqlString(sqlBuilderState);
  navigator.clipboard.writeText(sql).then(() => {
    const btn = $('#btnCopySql');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = '✓ Copied!';
      btn.classList.add('success');
      setTimeout(() => {
        btn.textContent = orig;
        btn.classList.remove('success');
      }, 2000);
    }
    toast('SQL statement copied to clipboard');
  }).catch(() => {
    toast('Unable to access clipboard');
  });
}

function downloadSqlFile() {
  const sql = generateSqlString(sqlBuilderState);
  const blob = new Blob([sql], { type: 'text/sql;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `swiftship_${sqlBuilderState.table}_query.sql`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('Downloaded .sql file');
}

// ==============================================================================
// DATABASE TOOLS: Oracle PL/SQL Lab
// ==============================================================================

const PLSQL_PROGRAMS = [
  {
    id: 'trg_parcel_status_audit',
    category: 'triggers',
    title: 'trg_parcel_status_audit',
    badge: 'Database Trigger',
    desc: 'AFTER UPDATE OF status ON parcels FOR EACH ROW with autonomous audit history insertion.',
    code: `CREATE OR REPLACE TRIGGER trg_parcel_status_audit
AFTER UPDATE OF status ON parcels
FOR EACH ROW
WHEN (OLD.status IS NULL OR OLD.status != NEW.status)
DECLARE
  v_user VARCHAR2(30);
BEGIN
  -- Obtain active database session user
  SELECT USER INTO v_user FROM DUAL;

  -- Insert immutable tracking ledger entry
  INSERT INTO parcel_audit_trail (
    audit_id,
    parcel_id,
    tracking_number,
    old_status,
    new_status,
    changed_by,
    changed_at
  ) VALUES (
    sys_guid(),
    :NEW.parcel_id,
    :NEW.tracking_number,
    :OLD.status,
    :NEW.status,
    v_user,
    SYSTIMESTAMP
  );
END trg_parcel_status_audit;
/`,
    simulation: {
      action: 'UPDATE parcels SET status = \'OUT_FOR_DELIVERY\' WHERE tracking_number = \'CR1002348\';',
      output: `PL/SQL procedure successfully completed.
[DBMS_OUTPUT] Trigger trg_parcel_status_audit fired.
[DBMS_OUTPUT] Old Status: IN_TRANSIT -> New Status: OUT_FOR_DELIVERY
[DBMS_OUTPUT] Recorded audit row sys_guid()='A98F712E-5D3B-4921' by user 'SWIFTSHIP_ADMIN'
[DBMS_OUTPUT] 1 row updated in table PARCELS.`
    }
  },
  {
    id: 'trg_validate_parcel_pricing',
    category: 'triggers',
    title: 'trg_validate_parcel_pricing',
    badge: 'Database Trigger',
    desc: 'BEFORE INSERT OR UPDATE OF weight_kg, base_rate enforcing sanity limits and minimum rates.',
    code: `CREATE OR REPLACE TRIGGER trg_validate_parcel_pricing
BEFORE INSERT OR UPDATE OF weight_kg, base_rate ON parcels
FOR EACH ROW
DECLARE
  c_min_base_rate CONSTANT NUMBER := 40.00;
  c_max_weight    CONSTANT NUMBER := 500.00;
BEGIN
  -- Enforce strictly positive consignment mass
  IF :NEW.weight_kg <= 0 THEN
    RAISE_APPLICATION_ERROR(-20002, 'Weight must be strictly greater than 0.00 kg');
  END IF;

  -- Block overweight shipments exceeding single-vehicle legal freight bounds
  IF :NEW.weight_kg > c_max_weight THEN
    RAISE_APPLICATION_ERROR(-20003, 'Consignment exceeds single courier load limit of 500.00 kg');
  END IF;

  -- Enforce minimum base charge floor
  IF :NEW.base_rate < c_min_base_rate THEN
    :NEW.base_rate := c_min_base_rate;
  END IF;
END trg_validate_parcel_pricing;
/`,
    simulation: {
      action: 'INSERT INTO parcels (tracking_number, weight_kg, base_rate) VALUES (\'CR883719\', 12.5, 30.00);',
      output: `PL/SQL procedure successfully completed.
[DBMS_OUTPUT] Trigger trg_validate_parcel_pricing fired.
[DBMS_OUTPUT] Weight validated: 12.50 kg (Within bounds 0 < W <= 500)
[DBMS_OUTPUT] Floor rate adjustment: Base rate 30.00 < 40.00 -> Adjusted :NEW.base_rate to 40.00
[DBMS_OUTPUT] 1 row inserted.`
    }
  },
  {
    id: 'trg_prevent_unassigned_dispatch',
    category: 'triggers',
    title: 'trg_prevent_unassigned_dispatch',
    badge: 'Database Trigger',
    desc: 'BEFORE UPDATE OF status raising -20001 if status is OUT_FOR_DELIVERY without agent assignment.',
    code: `CREATE OR REPLACE TRIGGER trg_prevent_unassigned_dispatch
BEFORE UPDATE OF status ON parcels
FOR EACH ROW
BEGIN
  IF :NEW.status = 'OUT_FOR_DELIVERY' AND :NEW.delivery_agent_id IS NULL THEN
    RAISE_APPLICATION_ERROR(
      -20001,
      'Dispatch Integrity Violation: Parcel ' || :NEW.tracking_number ||
      ' cannot be marked OUT_FOR_DELIVERY without an assigned delivery agent.'
    );
  END IF;
END trg_prevent_unassigned_dispatch;
/`,
    simulation: {
      action: 'UPDATE parcels SET status = \'OUT_FOR_DELIVERY\' WHERE tracking_number = \'CR992811\' AND delivery_agent_id IS NULL;',
      output: `ORA-20001: Dispatch Integrity Violation: Parcel CR992811 cannot be marked OUT_FOR_DELIVERY without an assigned delivery agent.
ORA-06512: at "SWIFTSHIP.TRG_PREVENT_UNASSIGNED_DISPATCH", line 4
ORA-04088: error during execution of trigger 'SWIFTSHIP.TRG_PREVENT_UNASSIGNED_DISPATCH'
[DBMS_OUTPUT] Transaction rolled back safely.`
    }
  },
  {
    id: 'cur_overdue_deliveries',
    category: 'explicit_cursors',
    title: 'cur_overdue_deliveries',
    badge: 'Explicit Cursor',
    desc: 'Parameterized explicit cursor traversing overdue consignments with OPEN, FETCH, and CLOSE.',
    code: `DECLARE
  CURSOR c_overdue (p_days NUMBER) IS
    SELECT p.tracking_number, p.status, b.branch_name, p.created_at
    FROM parcels p
    JOIN branches b ON p.dest_branch_id = b.branch_id
    WHERE p.status IN ('PENDING', 'IN_TRANSIT')
      AND p.created_at < SYSDATE - p_days
    ORDER BY p.created_at ASC;

  v_rec c_overdue%ROWTYPE;
  v_count NUMBER := 0;
BEGIN
  DBMS_OUTPUT.PUT_LINE('=== OVERDUE SHIPMENT MONITOR (EXPLICIT CURSOR) ===');
  
  -- Open cursor with parameter (threshold = 2 days)
  OPEN c_overdue(2);
  LOOP
    FETCH c_overdue INTO v_rec;
    EXIT WHEN c_overdue%NOTFOUND;

    v_count := v_count + 1;
    DBMS_OUTPUT.PUT_LINE(
      '[' || v_count || '] Waybill: ' || v_rec.tracking_number ||
      ' | Destination: ' || v_rec.branch_name ||
      ' | Status: ' || v_rec.status
    );
  END LOOP;
  CLOSE c_overdue;

  DBMS_OUTPUT.PUT_LINE('Cursor scan concluded. Flagged consignments: ' || v_count);
END;
/`,
    simulation: {
      action: 'EXECUTE cur_overdue_deliveries(2);',
      output: `=== OVERDUE SHIPMENT MONITOR (EXPLICIT CURSOR) ===
[1] Waybill: CR100982 | Destination: New Delhi Central Hub | Status: IN_TRANSIT
[2] Waybill: CR100984 | Destination: Mumbai South Depot | Status: PENDING
[3] Waybill: CR101005 | Destination: Bengaluru Tech Hub | Status: IN_TRANSIT
Cursor scan concluded. Flagged consignments: 3
PL/SQL procedure successfully completed.`
    }
  },
  {
    id: 'cur_branch_manifest_for_loop',
    category: 'explicit_cursors',
    title: 'cur_branch_manifest_for_loop',
    badge: 'Cursor FOR Loop',
    desc: 'Automates record declaration, OPEN, FETCH, and CLOSE to produce driver dispatch sheets.',
    code: `DECLARE
  v_origin_hub VARCHAR2(36) := 'BR-DEL-01';
  v_manifest_total_wt NUMBER := 0;
BEGIN
  DBMS_OUTPUT.PUT_LINE('=== DISPATCH MANIFEST (CURSOR FOR LOOP) ===');
  DBMS_OUTPUT.PUT_LINE('Originating Hub: ' || v_origin_hub);

  -- Cursor FOR loop handles allocation and termination automatically
  FOR r_parcel IN (
    SELECT tracking_number, weight_kg, status
    FROM parcels
    WHERE origin_branch_id = v_origin_hub AND status = 'PICKED_UP'
    ORDER BY tracking_number
  ) LOOP
    v_manifest_total_wt := v_manifest_total_wt + r_parcel.weight_kg;
    DBMS_OUTPUT.PUT_LINE(
      '  -> Waybill: ' || r_parcel.tracking_number ||
      ' (' || r_parcel.weight_kg || ' kg)'
    );
  END LOOP;

  DBMS_OUTPUT.PUT_LINE('Manifest aggregate freight mass: ' || v_manifest_total_wt || ' kg');
END;
/`,
    simulation: {
      action: 'EXECUTE cur_branch_manifest_for_loop(\'BR-DEL-01\');',
      output: `=== DISPATCH MANIFEST (CURSOR FOR LOOP) ===
Originating Hub: BR-DEL-01
  -> Waybill: CR200114 (3.40 kg)
  -> Waybill: CR200118 (1.25 kg)
  -> Waybill: CR200122 (14.80 kg)
Manifest aggregate freight mass: 19.45 kg
PL/SQL procedure successfully completed.`
    }
  },
  {
    id: 'demo_implicit_cursor_attributes',
    category: 'implicit_cursors',
    title: 'demo_implicit_cursor_attributes',
    badge: 'Cursor Attributes',
    desc: 'Demonstrates SQL%ROWCOUNT, SQL%FOUND, SQL%NOTFOUND, and SQL%ISOPEN in bulk batch updates.',
    code: `DECLARE
  v_archived_count NUMBER := 0;
BEGIN
  DBMS_OUTPUT.PUT_LINE('=== DEMONSTRATING ORACLE IMPLICIT CURSOR ATTRIBUTES ===');

  -- Bulk update historical consignments
  UPDATE parcels
  SET status = 'ARCHIVED'
  WHERE status = 'DELIVERED'
    AND created_at < ADD_MONTHS(SYSDATE, -3);

  -- Check SQL%FOUND and SQL%ROWCOUNT
  IF SQL%FOUND THEN
    v_archived_count := SQL%ROWCOUNT;
    DBMS_OUTPUT.PUT_LINE('SQL%FOUND: TRUE');
    DBMS_OUTPUT.PUT_LINE('SQL%ROWCOUNT: ' || v_archived_count || ' rows transitioned to ARCHIVED.');
  ELSE
    DBMS_OUTPUT.PUT_LINE('SQL%NOTFOUND: TRUE');
    DBMS_OUTPUT.PUT_LINE('No historical parcels matched the retention archival criteria.');
  END IF;

  -- In Oracle, SQL%ISOPEN is always evaluated to FALSE immediately following SQL statement
  IF NOT SQL%ISOPEN THEN
    DBMS_OUTPUT.PUT_LINE('SQL%ISOPEN: FALSE (Implicit cursor automatically closed by engine).');
  END IF;
END;
/`,
    simulation: {
      action: 'EXECUTE demo_implicit_cursor_attributes;',
      output: `=== DEMONSTRATING ORACLE IMPLICIT CURSOR ATTRIBUTES ===
SQL%FOUND: TRUE
SQL%ROWCOUNT: 42 rows transitioned to ARCHIVED.
SQL%ISOPEN: FALSE (Implicit cursor automatically closed by engine).
PL/SQL procedure successfully completed.`
    }
  },
  {
    id: 'pkg_courier_operations',
    category: 'packages',
    title: 'pkg_courier_operations',
    badge: 'Package & TX',
    desc: 'Package specification and body with PRAGMA AUTONOMOUS_TRANSACTION audit logging and custom exceptions.',
    code: `CREATE OR REPLACE PACKAGE pkg_courier_operations AS
  e_capacity_exceeded EXCEPTION;
  PRAGMA EXCEPTION_INIT(e_capacity_exceeded, -20010);

  PROCEDURE book_consignment(
    p_customer_id IN VARCHAR2,
    p_dest_branch IN VARCHAR2,
    p_weight      IN NUMBER,
    o_tracking_no OUT VARCHAR2
  );

  PROCEDURE log_security_event(
    p_event_desc  IN VARCHAR2
  );
END pkg_courier_operations;
/

CREATE OR REPLACE PACKAGE BODY pkg_courier_operations AS
  PROCEDURE log_security_event(p_event_desc IN VARCHAR2) IS
    PRAGMA AUTONOMOUS_TRANSACTION;
  BEGIN
    INSERT INTO security_audit_logs (log_id, event_desc, logged_at)
    VALUES (sys_guid(), p_event_desc, SYSTIMESTAMP);
    COMMIT;
  END log_security_event;

  PROCEDURE book_consignment(
    p_customer_id IN VARCHAR2,
    p_dest_branch IN VARCHAR2,
    p_weight      IN NUMBER,
    o_tracking_no OUT VARCHAR2
  ) IS
  BEGIN
    IF p_weight > 500 THEN
      log_security_event('OVERWEIGHT_REJECT: Cust ' || p_customer_id || ' Mass ' || p_weight);
      RAISE e_capacity_exceeded;
    END IF;

    o_tracking_no := 'CR' || TO_CHAR(SYSDATE, 'YYYYMMDD') || LPAD(ROUND(DBMS_RANDOM.VALUE(1000, 9999)), 4, '0');
    
    INSERT INTO parcels (tracking_number, customer_id, dest_branch_id, weight_kg, status, created_at)
    VALUES (o_tracking_no, p_customer_id, p_dest_branch, p_weight, 'BOOKED', SYSDATE);
    
    COMMIT;
  END book_consignment;
END pkg_courier_operations;
/`,
    simulation: {
      action: 'pkg_courier_operations.book_consignment(\'C101\', \'BR-MUM-01\', 4.5, v_trk);',
      output: `PL/SQL procedure successfully completed.
[DBMS_OUTPUT] Assigned Waybill: CR202610254921
[DBMS_OUTPUT] Committed parcel record in table PARCELS.
[DBMS_OUTPUT] Autonomous transaction audit verified.`
    }
  }
];

let selectedPlsqlProgramId = 'trg_parcel_status_audit';
let plsqlSimulationOutput = null;

async function renderPlsqlLab() {
  const currentProg = PLSQL_PROGRAMS.find(p => p.id === selectedPlsqlProgramId) || PLSQL_PROGRAMS[0];
  
  return `
    ${pageHead('Oracle PL/SQL Lab', 'Interactive laboratory demonstrating Database Triggers, Explicit Cursors, Implicit Cursor Attributes, and Packages.')}
    
    <div class="db-tool-container">
      <div class="disclaimer-badge">
        <span>⚠️</span>
        <div>
          <b>Educational Reference Schema:</b>
          This PL/SQL lab demonstrates Oracle PL/SQL procedural database programming tailored to courier logistics requirements. The live SwiftShip cloud application uses Neo4j AuraDB graph database.
        </div>
      </div>
      
      <div class="plsql-grid">
        <div class="plsql-sidebar">
          <div class="program-list">
            ${PLSQL_PROGRAMS.map(prog => `
              <div class="program-item ${prog.id === currentProg.id ? 'active' : ''}" onclick="selectPlsqlProgram('${prog.id}')">
                <div class="program-item-title">
                  <span>${prog.title}</span>
                  <span class="program-badge">${prog.badge}</span>
                </div>
                <p class="program-item-desc">${prog.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="plsql-viewer">
          <div class="code-preview-card" style="position:static;">
            <div class="code-preview-header">
              <span class="code-title">
                <span>⚡</span> ${currentProg.title} <small style="color:var(--green);font-size:11px;">(${currentProg.badge})</small>
              </span>
              <div class="code-actions">
                <button type="button" class="code-btn" onclick="executePlsqlSimulation('${currentProg.id}')">
                  ▶ Run DBMS Simulation
                </button>
                <button type="button" class="code-btn" id="btnCopyPlsql" onclick="copyPlsqlCode()">
                  Copy PL/SQL
                </button>
                <button type="button" class="code-btn" onclick="downloadPlsqlFile('${currentProg.id}')">
                  Download .pls
                </button>
              </div>
            </div>
            
            <pre class="code-block" id="plsqlCodeBlock">${escapeHtml(currentProg.code)}</pre>
          </div>
          
          <div class="sim-output-box" id="plsqlSimBox">
            <div class="sim-header">
              <span>Oracle DBMS_OUTPUT.PUT_LINE Console Stream</span>
              <span>Buffer: Active</span>
            </div>
            <div id="plsqlSimContent">
              ${plsqlSimulationOutput || `[DBMS_OUTPUT] Simulation ready. Click "▶ Run DBMS Simulation" to execute anonymous block and inspect buffer output.`}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function initPlsqlLabEvents() {
  // Handled via inline callbacks
}

function selectPlsqlProgram(id) {
  selectedPlsqlProgramId = id;
  plsqlSimulationOutput = null;
  go('plsql');
}

function executePlsqlSimulation(id) {
  const prog = PLSQL_PROGRAMS.find(p => p.id === id);
  if (!prog) return;
  
  const box = $('#plsqlSimContent');
  if (box) {
    box.innerHTML = `<span style="color:#f59e0b;">Executing PL/SQL Anonymous Block on virtual Oracle 23ai session...</span>`;
    setTimeout(() => {
      plsqlSimulationOutput = `
<span style="color:#94a3b8;">-- Executed Statement:</span>
${escapeHtml(prog.simulation.action)}

<span style="color:#94a3b8;">-- DBMS_OUTPUT Stream:</span>
${escapeHtml(prog.simulation.output)}
      `.trim();
      box.innerHTML = plsqlSimulationOutput;
      toast(`Executed simulated block for ${prog.title}`);
    }, 300);
  }
}

function copyPlsqlCode() {
  const prog = PLSQL_PROGRAMS.find(p => p.id === selectedPlsqlProgramId);
  if (!prog) return;
  navigator.clipboard.writeText(prog.code).then(() => {
    const btn = $('#btnCopyPlsql');
    if (btn) {
      btn.textContent = '✓ Copied!';
      setTimeout(() => btn.textContent = 'Copy PL/SQL', 2000);
    }
    toast('PL/SQL code copied to clipboard');
  }).catch(() => {
    toast('Unable to copy to clipboard');
  });
}

function downloadPlsqlFile(id) {
  const prog = PLSQL_PROGRAMS.find(p => p.id === id);
  if (!prog) return;
  const blob = new Blob([prog.code], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${prog.id}.pls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast(`Downloaded ${prog.id}.pls`);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ==============================================================================
// DATABASE TOOLS: Live Neo4j Graph Explorer
// ==============================================================================

const GRAPH_PALETTE = {
  Parcel: '#10b981',
  Customer: '#3b82f6',
  Branch: '#f97316',
  DeliveryAgent: '#8b5cf6',
  Vehicle: '#f59e0b',
  CourierService: '#06b6d4',
  Payment: '#ec4899',
  SupportTicket: '#ef4444',
  Staff: '#6366f1',
  Route: '#14b8a6',
  Other: '#64748b'
};

let graphEngine = {
  canvas: null,
  ctx: null,
  nodes: [],
  edges: [],
  stats: null,
  selectedNode: null,
  hoveredNode: null,
  isDraggingNode: null,
  isPanning: false,
  panX: 0,
  panY: 0,
  zoom: 1,
  startDragX: 0,
  startDragY: 0,
  animationId: null,
  physicsRunning: true,
  filterLabel: 'ALL',
  searchQuery: '',
  limit: 80
};

async function renderGraphExplorer() {
  const queryParams = new URLSearchParams();
  queryParams.set('nodeLimit', String(graphEngine.limit));
  if (graphEngine.filterLabel && graphEngine.filterLabel !== 'ALL') {
    queryParams.set('label', graphEngine.filterLabel);
  }
  if (graphEngine.searchQuery) {
    queryParams.set('search', graphEngine.searchQuery);
  }
  
  let graphData = null;
  try {
    graphData = await api(`/api/graph/overview?${queryParams.toString()}`);
  } catch (err) {
    return `
      ${pageHead('Live Graph Explorer', 'Direct force-directed graph visualization of live Neo4j AuraDB nodes and relationships.')}
      ${renderErrorBanner(err)}
    `;
  }
  
  const rawNodes = graphData.nodes || [];
  const rawEdges = graphData.edges || [];
  const stats = graphData.stats || {};
  
  if (rawNodes.length === 0) {
    return `
      ${pageHead('Live Graph Explorer', 'Direct force-directed graph visualization of live Neo4j AuraDB nodes and relationships.')}
      
      <div class="panel" style="text-align:center;padding:60px 20px;">
        <div style="font-size:42px;margin-bottom:12px;">🕸</div>
        <h3 style="font:800 20px var(--font-head);margin:0 0 8px;">Database Connected — 0 Nodes Stored</h3>
        <p style="color:var(--muted);font-size:13px;max-width:540px;margin:0 auto 20px;">
          Your Neo4j AuraDB instance is connected and online. Currently there are no nodes matching your criteria in the database. Book a parcel or register a customer to populate real graph relationships.
        </p>
        <div class="actions" style="justify-content:center;">
          <button class="btn primary" onclick="openBookParcelModal()">＋ Book First Parcel</button>
          <button class="btn ghost" onclick="go('customers')">Customer Directory ↗</button>
        </div>
      </div>
    `;
  }
  
  return `
    ${pageHead('Live Graph Explorer', 'Direct force-directed graph visualization of live Neo4j AuraDB nodes and relationships.')}
    
    <div class="graph-wrapper">
      <div class="graph-stats-bar">
        <div class="graph-stat-pill">
          <span class="pill-dot"></span>
          <span>Nodes in View: <b id="statVisibleNodes">${rawNodes.length}</b></span>
        </div>
        <div class="graph-stat-pill">
          <span class="pill-dot" style="background:#3b82f6;"></span>
          <span>Relationships: <b id="statVisibleEdges">${rawEdges.length}</b></span>
        </div>
        <div class="graph-stat-pill">
          <span>AuraDB Total Nodes: <b>${stats.totalNodes ?? rawNodes.length}</b></span>
        </div>
        <div class="graph-stat-pill">
          <span>AuraDB Total Relationships: <b>${stats.totalRelationships ?? rawEdges.length}</b></span>
        </div>
      </div>
      
      <div class="graph-viewport-panel" id="graphViewport">
        <!-- Floating Toolbar -->
        <div class="graph-toolbar">
          <button type="button" class="graph-tool-btn" title="Zoom In" onclick="graphZoom(1.2)">＋</button>
          <button type="button" class="graph-tool-btn" title="Zoom Out" onclick="graphZoom(0.8)">−</button>
          <button type="button" class="graph-tool-btn" title="Fit to Screen" onclick="graphResetView()">⛶</button>
          <button type="button" class="graph-tool-btn" id="btnTogglePhysics" title="Pause / Resume Physics" onclick="graphTogglePhysics()">⏸</button>
          
          <select class="graph-filter-select" id="graphLabelFilter" onchange="graphOnLabelChange(this.value)">
            <option value="ALL">All Categories</option>
            ${(stats.availableLabels || []).map(l => `
              <option value="${l.label}" ${graphEngine.filterLabel === l.label ? 'selected' : ''}>${l.label} (${l.count})</option>
            `).join('')}
          </select>
          
          <select class="graph-filter-select" id="graphLimitSelect" onchange="graphOnLimitChange(this.value)">
            <option value="40" ${graphEngine.limit === 40 ? 'selected' : ''}>40 Nodes</option>
            <option value="80" ${graphEngine.limit === 80 ? 'selected' : ''}>80 Nodes</option>
            <option value="120" ${graphEngine.limit === 120 ? 'selected' : ''}>120 Nodes</option>
            <option value="160" ${graphEngine.limit === 160 ? 'selected' : ''}>160 Nodes</option>
          </select>
          
          <input class="graph-search-input" id="graphSearchInput" placeholder="Filter graph nodes..." oninput="graphOnSearch(this.value)">
        </div>
        
        <canvas id="graphCanvas"></canvas>
        
        <!-- Node Inspector Drawer -->
        <div class="node-drawer" id="nodeDrawer">
          <div class="drawer-head">
            <h4 id="drawerNodeTitle">Node Inspector</h4>
            <button type="button" class="drawer-close" onclick="closeNodeDrawer()">×</button>
          </div>
          <div id="drawerBody">
            <p style="color:var(--muted);font-size:12px;">Click any node to view entity properties and connected edges.</p>
          </div>
        </div>
      </div>
      
      <!-- Graph Legend -->
      <div class="graph-legend">
        ${Object.entries(GRAPH_PALETTE).map(([lbl, color]) => `
          <div class="legend-item">
            <span class="legend-dot" style="background:${color}"></span>
            <span>${lbl}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function initGraphExplorerEvents() {
  const canvas = $('#graphCanvas');
  if (!canvas) return;
  
  const viewport = $('#graphViewport');
  const rect = viewport.getBoundingClientRect();
  canvas.width = rect.width || 1000;
  canvas.height = 620;
  
  const ctx = canvas.getContext('2d');
  graphEngine.canvas = canvas;
  graphEngine.ctx = ctx;
  
  // Re-fetch raw data currently displayed
  api(`/api/graph/overview?nodeLimit=${graphEngine.limit}&label=${graphEngine.filterLabel === 'ALL' ? '' : graphEngine.filterLabel}`)
    .then(data => {
      buildForceGraph(data.nodes || [], data.edges || []);
    })
    .catch(() => {});
    
  // Canvas Mouse Listeners
  canvas.addEventListener('mousedown', onGraphMouseDown);
  window.addEventListener('mousemove', onGraphMouseMove);
  window.addEventListener('mouseup', onGraphMouseUp);
  canvas.addEventListener('wheel', onGraphWheel, { passive: false });
  
  // Window resize handler
  window.addEventListener('resize', onGraphResize);
}

function onGraphResize() {
  if (!graphEngine.canvas) return;
  const viewport = $('#graphViewport');
  if (!viewport) return;
  const rect = viewport.getBoundingClientRect();
  graphEngine.canvas.width = rect.width || 1000;
}

function buildForceGraph(rawNodes, rawEdges) {
  if (graphEngine.animationId) {
    cancelAnimationFrame(graphEngine.animationId);
  }
  
  const width = graphEngine.canvas.width;
  const height = graphEngine.canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Initialize Node positions
  const nodeMap = new Map();
  graphEngine.nodes = rawNodes.map((rn, idx) => {
    const angle = (idx / rawNodes.length) * Math.PI * 2;
    const radius = 120 + Math.random() * 140;
    const label = rn.primaryLabel || 'Other';
    const color = GRAPH_PALETTE[label] || GRAPH_PALETTE.Other;
    
    const nodeObj = {
      id: rn.id,
      caption: rn.caption || label,
      primaryLabel: label,
      labels: rn.labels || [],
      properties: rn.properties || {},
      color,
      radius: 20,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
      isPinned: false
    };
    nodeMap.set(rn.id, nodeObj);
    return nodeObj;
  });
  
  // Wire Edges
  graphEngine.edges = rawEdges
    .map(re => {
      const source = nodeMap.get(re.source);
      const target = nodeMap.get(re.target);
      if (!source || !target) return null;
      return {
        id: re.id,
        type: re.type,
        source,
        target,
        properties: re.properties || {}
      };
    })
    .filter(Boolean);
    
  graphEngine.panX = 0;
  graphEngine.panY = 0;
  graphEngine.zoom = 1;
  graphEngine.physicsRunning = true;
  
  runGraphLoop();
}

function runGraphLoop() {
  const ctx = graphEngine.ctx;
  const canvas = graphEngine.canvas;
  if (!ctx || !canvas) return;
  
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // 1. Force calculations if physics running
  if (graphEngine.physicsRunning) {
    const nodes = graphEngine.nodes;
    const edges = graphEngine.edges;
    
    // Repulsion between all pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy + 100;
        const dist = Math.sqrt(distSq);
        const force = 2800 / distSq;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        if (!a.isPinned) { a.vx -= fx; a.vy -= fy; }
        if (!b.isPinned) { b.vx += fx; b.vy += fy; }
      }
    }
    
    // Spring attraction along edges
    for (const e of edges) {
      const dx = e.target.x - e.source.x;
      const dy = e.target.y - e.source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const restLen = 90;
      const force = (dist - restLen) * 0.04;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      
      if (!e.source.isPinned) { e.source.vx += fx; e.source.vy += fy; }
      if (!e.target.isPinned) { e.target.vx -= fx; e.target.vy -= fy; }
    }
    
    // Centering gravity & damping
    for (const n of nodes) {
      if (!n.isPinned) {
        const dx = centerX - n.x;
        const dy = centerY - n.y;
        n.vx += dx * 0.015;
        n.vy += dy * 0.015;
        
        n.vx *= 0.85;
        n.vy *= 0.85;
        
        n.x += n.vx;
        n.y += n.vy;
      }
    }
  }
  
  // 2. Render Frame
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  
  // Transform for Pan & Zoom
  ctx.translate(width / 2 + graphEngine.panX, height / 2 + graphEngine.panY);
  ctx.scale(graphEngine.zoom, graphEngine.zoom);
  ctx.translate(-width / 2, -height / 2);
  
  // Draw Edges
  for (const e of graphEngine.edges) {
    const isHighlighted = graphEngine.hoveredNode && (e.source === graphEngine.hoveredNode || e.target === graphEngine.hoveredNode);
    ctx.strokeStyle = isHighlighted ? '#10b981' : '#cbd5e1';
    ctx.lineWidth = isHighlighted ? 2.5 : 1.2;
    
    ctx.beginPath();
    ctx.moveTo(e.source.x, e.source.y);
    ctx.lineTo(e.target.x, e.target.y);
    ctx.stroke();
    
    // Arrow
    const angle = Math.atan2(e.target.y - e.source.y, e.target.x - e.source.x);
    const arrowX = e.target.x - Math.cos(angle) * (e.target.radius + 6);
    const arrowY = e.target.y - Math.sin(angle) * (e.target.radius + 6);
    
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - 8 * Math.cos(angle - Math.PI / 6), arrowY - 8 * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(arrowX - 8 * Math.cos(angle + Math.PI / 6), arrowY - 8 * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    
    // Edge label badge in center
    const midX = (e.source.x + e.target.x) / 2;
    const midY = (e.source.y + e.target.y) / 2;
    ctx.font = '9px DM Sans';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.type, midX, midY - 6);
  }
  
  // Draw Nodes
  for (const n of graphEngine.nodes) {
    const isSelected = graphEngine.selectedNode === n;
    const isHovered = graphEngine.hoveredNode === n;
    const isMatch = !graphEngine.searchQuery || n.caption.toLowerCase().includes(graphEngine.searchQuery.toLowerCase());
    
    ctx.save();
    if (!isMatch) {
      ctx.globalAlpha = 0.2;
    }
    
    // Outer highlight circle
    if (isSelected || isHovered) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius + 6, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? 'rgba(5, 150, 105, 0.25)' : 'rgba(100, 116, 139, 0.15)';
      ctx.fill();
    }
    
    // Main circle
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
    ctx.fillStyle = n.color;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    
    // Node icon/symbol
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px DM Sans';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(n.primaryLabel.slice(0, 1), n.x, n.y);
    
    // Caption under node
    ctx.fillStyle = isSelected ? '#059669' : '#1e293b';
    ctx.font = isSelected ? 'bold 11px DM Sans' : '500 10.5px DM Sans';
    ctx.fillText(n.caption, n.x, n.y + n.radius + 12);
    
    ctx.restore();
  }
  
  ctx.restore();
  graphEngine.animationId = requestAnimationFrame(runGraphLoop);
}

function screenToGraphCoords(clientX, clientY) {
  const rect = graphEngine.canvas.getBoundingClientRect();
  const screenX = clientX - rect.left;
  const screenY = clientY - rect.top;
  const width = graphEngine.canvas.width;
  const height = graphEngine.canvas.height;
  
  const normX = screenX - (width / 2 + graphEngine.panX);
  const normY = screenY - (height / 2 + graphEngine.panY);
  
  const graphX = normX / graphEngine.zoom + width / 2;
  const graphY = normY / graphEngine.zoom + height / 2;
  
  return { x: graphX, y: graphY };
}

function findNodeAt(x, y) {
  for (let i = graphEngine.nodes.length - 1; i >= 0; i--) {
    const n = graphEngine.nodes[i];
    const dx = n.x - x;
    const dy = n.y - y;
    if (dx * dx + dy * dy <= (n.radius + 4) * (n.radius + 4)) {
      return n;
    }
  }
  return null;
}

function onGraphMouseDown(e) {
  const { x, y } = screenToGraphCoords(e.clientX, e.clientY);
  const clickedNode = findNodeAt(x, y);
  
  if (clickedNode) {
    graphEngine.isDraggingNode = clickedNode;
    clickedNode.isPinned = true;
    graphEngine.selectedNode = clickedNode;
    openNodeDrawer(clickedNode);
  } else {
    graphEngine.isPanning = true;
    graphEngine.startDragX = e.clientX - graphEngine.panX;
    graphEngine.startDragY = e.clientY - graphEngine.panY;
  }
}

function onGraphMouseMove(e) {
  if (graphEngine.isDraggingNode) {
    const { x, y } = screenToGraphCoords(e.clientX, e.clientY);
    graphEngine.isDraggingNode.x = x;
    graphEngine.isDraggingNode.y = y;
  } else if (graphEngine.isPanning) {
    graphEngine.panX = e.clientX - graphEngine.startDragX;
    graphEngine.panY = e.clientY - graphEngine.startDragY;
  } else if (graphEngine.canvas) {
    const { x, y } = screenToGraphCoords(e.clientX, e.clientY);
    const node = findNodeAt(x, y);
    if (node !== graphEngine.hoveredNode) {
      graphEngine.hoveredNode = node;
      graphEngine.canvas.style.cursor = node ? 'pointer' : 'grab';
    }
  }
}

function onGraphMouseUp() {
  if (graphEngine.isDraggingNode) {
    graphEngine.isDraggingNode.isPinned = false;
    graphEngine.isDraggingNode = null;
  }
  graphEngine.isPanning = false;
}

function onGraphWheel(e) {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.1 : 0.9;
  graphZoom(factor);
}

function graphZoom(factor) {
  const nextZoom = Math.min(Math.max(graphEngine.zoom * factor, 0.3), 3);
  graphEngine.zoom = nextZoom;
}

function graphResetView() {
  graphEngine.panX = 0;
  graphEngine.panY = 0;
  graphEngine.zoom = 1;
}

function graphTogglePhysics() {
  graphEngine.physicsRunning = !graphEngine.physicsRunning;
  const btn = $('#btnTogglePhysics');
  if (btn) {
    btn.textContent = graphEngine.physicsRunning ? '⏸' : '▶';
    btn.title = graphEngine.physicsRunning ? 'Pause Physics' : 'Resume Physics';
  }
}

function graphOnLabelChange(lbl) {
  graphEngine.filterLabel = lbl;
  go('graph');
}

function graphOnLimitChange(val) {
  graphEngine.limit = parseInt(val, 10) || 80;
  go('graph');
}

function graphOnSearch(q) {
  graphEngine.searchQuery = q.trim();
}

function openNodeDrawer(node) {
  const drawer = $('#nodeDrawer');
  const title = $('#drawerNodeTitle');
  const body = $('#drawerBody');
  if (!drawer || !title || !body) return;
  
  title.innerHTML = `
    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${node.color};margin-right:6px;"></span>
    ${escapeHtml(node.caption)}
  `;
  
  // Find connected edges
  const connectedEdges = graphEngine.edges.filter(e => e.source === node || e.target === node);
  
  body.innerHTML = `
    <div style="margin-bottom:14px;">
      <span class="tool-tag" style="background:${node.color}22;color:${node.color};font-size:10px;font-weight:700;">
        ${node.primaryLabel}
      </span>
      <span style="font-size:11px;color:var(--muted);margin-left:8px;font-family:var(--font-mono);">
        ID: ${node.id}
      </span>
    </div>
    
    <div style="margin-bottom:16px;">
      <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:6px;">Connected Relationships (${connectedEdges.length})</div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:140px;overflow-y:auto;">
        ${connectedEdges.length === 0 ? '<span style="font-size:11px;color:var(--muted);">No relationships visible in current view.</span>' : ''}
        ${connectedEdges.map(e => {
          const isSource = e.source === node;
          const other = isSource ? e.target : e.source;
          return `
            <div style="background:#f8fafc;border:1px solid var(--line);border-radius:6px;padding:6px 8px;font-size:11px;display:flex;align-items:center;justify-content:space-between;">
              <span>${isSource ? `→ [${e.type}]` : `← [${e.type}]`}</span>
              <b style="color:var(--ink);">${escapeHtml(other.caption)}</b>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    
    <div>
      <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:6px;">Properties</div>
      <table class="drawer-prop-table">
        <tbody>
          ${Object.entries(node.properties).map(([k, v]) => `
            <tr>
              <th>${escapeHtml(k)}</th>
              <td>${escapeHtml(String(v))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  drawer.classList.add('open');
}

function closeNodeDrawer() {
  $('#nodeDrawer')?.classList.remove('open');
  graphEngine.selectedNode = null;
}

// ------------------------------------------------------------------------------
// Enhanced Event Listeners & Boot
// ------------------------------------------------------------------------------
$$('.navitem').forEach(b => b.addEventListener('click', () => go(b.dataset.page)));

function toggleSidebar() {
  const sb = $('#sidebar');
  const overlay = $('#sidebarOverlay');
  if (!sb) return;
  
  if (window.innerWidth <= 768) {
    const isOpen = sb.classList.toggle('open');
    overlay?.classList.toggle('active', isOpen);
  } else {
    const isCompact = sb.classList.toggle('compact');
    try {
      localStorage.setItem('swiftship_sidebar_compact', isCompact ? 'true' : 'false');
    } catch (_) {}
  }
}

$('#hamb')?.addEventListener('click', toggleSidebar);

$('#sidebarOverlay')?.addEventListener('click', () => {
  $('#sidebar')?.classList.remove('open');
  $('#sidebarOverlay')?.classList.remove('active');
});

window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    $('#sidebar')?.classList.remove('open');
    $('#sidebarOverlay')?.classList.remove('active');
    closeModal();
    closeNodeDrawer();
  }
  // Global ⌘K or Ctrl+K search focus
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    $('#globalSearch')?.focus();
  }
});

$('#globalSearch')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const q = e.target.value.trim().toUpperCase();
    if (q.startsWith('TRK') || q.startsWith('P') || q.startsWith('CR')) {
      go('tracking');
      setTimeout(() => searchTracking(q), 100);
    } else if (q.startsWith('C')) {
      go('customers');
    } else {
      go('parcels');
    }
  }
});

function promptBackendUrl() {
  const current = localStorage.getItem('SWIFTSHIP_API_BASE') || (API_BASE ? API_BASE : 'Same Origin (Netlify Functions)');
  const next = prompt('SwiftShip Backend API Base URL:\n- Leave empty for same-origin Netlify Functions (recommended for Netlify Free)\n- Or enter custom backend URL (e.g. http://localhost:8082):', current);
  if (next !== null) {
    let trimmed = next.trim().replace(/\/+$/, '');
    if (trimmed && trimmed.toLowerCase() !== 'same origin (netlify functions)') {
      if (typeof window !== 'undefined' && window.location && window.location.protocol === 'https:' && trimmed.startsWith('http://') && !isLocalEndpoint(trimmed)) {
        const upgrade = confirm('You are browsing on HTTPS (Netlify). Browsers block unencrypted HTTP API calls (Mixed Content).\n\nDo you want to use HTTPS instead:\n' + trimmed.replace(/^http:\/\//, 'https://') + ' ?');
        if (upgrade) {
          trimmed = trimmed.replace(/^http:\/\//, 'https://');
        }
      }
      localStorage.setItem('SWIFTSHIP_API_BASE', trimmed);
      location.reload();
    } else if (localStorage.getItem('SWIFTSHIP_API_BASE')) {
      localStorage.removeItem('SWIFTSHIP_API_BASE');
      location.reload();
    }
  }
}

$('#connWorkspace')?.addEventListener('click', promptBackendUrl);

// Initial boot
(async function init() {
  const footerBase = $('#footerApiBase');
  if (footerBase) footerBase.textContent = API_BASE ? API_BASE : 'Netlify Functions (Same Origin)';
  
  // Restore sidebar compact state on desktop
  if (window.innerWidth > 768) {
    try {
      const savedCompact = localStorage.getItem('swiftship_sidebar_compact') === 'true';
      if (savedCompact) {
        $('#sidebar')?.classList.add('compact');
      }
    } catch (_) {}
  }
  
  await checkBackendHealth();
  go('dashboard');
  setInterval(checkBackendHealth, 30000);
})();