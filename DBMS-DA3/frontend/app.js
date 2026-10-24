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

// Update connection status in sidebar
function updateConnStatus(isOnline, customText) {
  const dot = $('#connDot');
  const txt = $('#connStatus');
  if (!dot || !txt) return;
  if (customText) {
    dot.className = 'dot checking';
    txt.textContent = customText;
    return;
  }
  if (isOnline) {
    dot.className = 'dot online';
    txt.textContent = 'Connected';
  } else {
    dot.className = 'dot offline';
    txt.textContent = 'Offline';
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
  staff: { title: 'Staff & access', desc: 'Manage administrative and branch operational team members.' }
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
    ${pageHead('Good afternoon, Alex', 'Here is what is happening across your courier network today.', 'Book parcel', 'openBookParcelModal()')}
    
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

// ------------------------------------------------------------------------------
// Event Listeners & Boot
// ------------------------------------------------------------------------------
$$('.navitem').forEach(b => b.addEventListener('click', () => go(b.dataset.page)));

$('#hamb')?.addEventListener('click', () => $('#sidebar')?.classList.toggle('open'));

$('#globalSearch')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const q = e.target.value.trim().toUpperCase();
    if (q.startsWith('TRK') || q.startsWith('P')) {
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
  await checkBackendHealth();
  go('dashboard');
  setInterval(checkBackendHealth, 30000);
})();