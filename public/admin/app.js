(function () {
  const storage = {
    apiBase: 'warehouse-admin-api-base',
    token: 'warehouse-admin-token',
  };

  const defaultApiBase = `${window.location.origin}/api`;
  const state = {
    apiBase: localStorage.getItem(storage.apiBase) || defaultApiBase,
    token: localStorage.getItem(storage.token) || '',
    warehouses: [],
    reservations: [],
    selectedProductId: '',
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function init() {
    window.addEventListener('unhandledrejection', (event) => {
      event.preventDefault();
      showMessage(event.reason?.message || 'Request failed.', true);
    });
    $('#apiBaseInput').value = state.apiBase;
    $('#tokenInput').value = state.token;
    bindNavigation();
    bindForms();
    bindActions();
    setEmptyRows();
    refreshPublicStatus();
    loadAuthorizedSummaries();
  }

  function bindNavigation() {
    $$('#navList .nav-item').forEach((button) => {
      button.addEventListener('click', () => showPanel(button.dataset.panel));
    });
    $$('[data-panel-link]').forEach((button) => {
      button.addEventListener('click', () => showPanel(button.dataset.panelLink));
    });
  }

  function bindActions() {
    $('[data-action="refresh-all"]').addEventListener('click', () => {
      refreshPublicStatus();
      loadAuthorizedSummaries(true);
    });
    $('[data-action="load-warehouses"]').addEventListener('click', () => loadWarehouses(true));
    $('[data-action="load-reservations"]').addEventListener('click', () => loadReservations(true));
    $('[data-action="reset-warehouse"]').addEventListener('click', () => resetWarehouseForm());
  }

  function bindForms() {
    $('#connectionForm').addEventListener('submit', (event) => {
      event.preventDefault();
      state.apiBase = $('#apiBaseInput').value.trim().replace(/\/$/, '') || defaultApiBase;
      state.token = $('#tokenInput').value.trim();
      localStorage.setItem(storage.apiBase, state.apiBase);
      localStorage.setItem(storage.token, state.token);
      showMessage('Connection settings saved.');
      refreshPublicStatus();
      loadAuthorizedSummaries(true);
    });

    $('#warehouseForm').addEventListener('submit', submitWarehouseForm);
    $('#warehouseForm').addEventListener('reset', () => {
      window.setTimeout(resetWarehouseForm, 0);
    });
    $('#stockLookupForm').addEventListener('submit', submitStockLookup);
    $('#reservationLookupForm').addEventListener('submit', submitReservationLookup);
    $('#movementLookupForm').addEventListener('submit', submitMovementLookup);
    $('#stockActionForm').addEventListener('submit', submitStockAction);
    $('#reservationActionForm').addEventListener('submit', submitReservationAction);
  }

  function showPanel(panelId) {
    $$('.nav-item').forEach((button) => {
      button.classList.toggle('active', button.dataset.panel === panelId);
    });
    $$('.panel').forEach((panel) => {
      panel.classList.toggle('active', panel.id === panelId);
    });

    if (panelId === 'warehouses' && !state.warehouses.length) {
      loadWarehouses().catch((error) => showMessage(error.message, true));
    }
    if (panelId === 'reservations' && !state.reservations.length) {
      loadReservations().catch((error) => showMessage(error.message, true));
    }
  }

  async function refreshPublicStatus() {
    await Promise.all([
      loadStatus('health', '#healthStatus', '#healthDetail'),
      loadStatus('ready', '#readyStatus', '#readyDetail'),
    ]);
  }

  async function loadStatus(path, statusSelector, detailSelector) {
    const card = $(statusSelector).closest('.status-card');
    card.classList.remove('ok', 'warn', 'bad');
    $(statusSelector).textContent = 'Checking';
    $(detailSelector).textContent = `/api/${path}`;

    try {
      const payload = await request(path, { auth: false });
      const status = normalizeStatus(payload);
      $(statusSelector).textContent = status.label;
      $(detailSelector).textContent = status.detail;
      card.classList.add(status.kind);
    } catch (error) {
      $(statusSelector).textContent = 'Unavailable';
      $(detailSelector).textContent = error.message;
      card.classList.add('bad');
    }
  }

  async function loadAuthorizedSummaries(force) {
    if (!state.token) {
      $('#warehouseDetail').textContent = 'token required';
      $('#reservationDetail').textContent = 'token required';
      renderMetrics('#warehouseMix', []);
      renderMetrics('#reservationMix', []);
      return;
    }

    await Promise.all([
      loadWarehouses(force).catch((error) => showMessage(error.message, true)),
      loadReservations(force).catch((error) => showMessage(error.message, true)),
    ]);
  }

  async function loadWarehouses(showToast) {
    const response = await request('warehouses');
    state.warehouses = asArray(response.data);
    renderWarehouses();
    renderWarehouseSummary();
    if (showToast) showMessage('Warehouses loaded.');
  }

  async function loadReservations(showToast) {
    const response = await request('reservations');
    state.reservations = asArray(response.data);
    renderReservations(state.reservations);
    renderReservationSummary(state.reservations);
    if (showToast) showMessage('Active reservations loaded.');
  }

  async function submitWarehouseForm(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = formData(form);
    const id = data.id;
    delete data.id;
    data.priority = Number(data.priority || 0);
    data.isActive = form.elements.isActive.checked;

    Object.keys(data).forEach((key) => {
      if (data[key] === '') data[key] = null;
    });

    const method = id ? 'PUT' : 'POST';
    const path = id ? `warehouses/${encodeURIComponent(id)}` : 'warehouses';
    await request(path, { method, body: data });
    resetWarehouseForm();
    await loadWarehouses();
    showMessage(id ? 'Warehouse updated.' : 'Warehouse created.');
  }

  async function submitStockLookup(event) {
    event.preventDefault();
    const productId = formData(event.currentTarget).productId.trim();
    state.selectedProductId = productId;
    $('#selectedProduct').textContent = productId;
    const [stockResponse, totalResponse] = await Promise.all([
      request(`stock/${encodeURIComponent(productId)}`),
      request(`stock/${encodeURIComponent(productId)}/total`),
    ]);
    renderStock(asArray(stockResponse.data));
    $('#totalAvailable').textContent = totalResponse?.data?.totalAvailable ?? '-';
    showMessage('Stock loaded.');
  }

  async function submitReservationLookup(event) {
    event.preventDefault();
    const data = formData(event.currentTarget);
    const path = data.type === 'order'
      ? `reservations/order/${encodeURIComponent(data.id)}`
      : `reservations/product/${encodeURIComponent(data.id)}`;
    const response = await request(path);
    const reservations = asArray(response.data);
    renderReservations(reservations);
    renderReservationSummary(reservations);
    showMessage('Reservations loaded.');
  }

  async function submitMovementLookup(event) {
    event.preventDefault();
    const data = formData(event.currentTarget);
    const limit = data.limit ? `?limit=${encodeURIComponent(data.limit)}` : '';
    const path = data.type === 'warehouse'
      ? `movements/warehouse/${encodeURIComponent(data.id)}${limit}`
      : `movements/product/${encodeURIComponent(data.id)}${limit}`;
    const response = await request(path);
    renderMovements(asArray(response.data));
    showMessage('Movements loaded.');
  }

  async function submitStockAction(event) {
    event.preventDefault();
    const data = formData(event.currentTarget);
    const operation = data.operation;
    delete data.operation;
    data.quantity = Number(data.quantity);

    if ((operation === 'reserve' || operation === 'unreserve') && (!data.orderId || !data.channel)) {
      showMessage('Order ID and channel are required for reserve and unreserve.', true);
      return;
    }

    if (operation !== 'reserve' && operation !== 'unreserve') {
      delete data.orderId;
      delete data.channel;
      delete data.expiresAt;
    }
    if (!data.expiresAt) delete data.expiresAt;

    const response = await request(`stock/${operation}`, { method: 'POST', body: data });
    showMessage(`${operation} completed. Available: ${response?.data?.available ?? 'updated'}.`);
    if (data.productId) {
      $('#stockLookupForm').elements.productId.value = data.productId;
      $('#stockLookupForm').requestSubmit();
    }
  }

  async function submitReservationAction(event) {
    event.preventDefault();
    const data = formData(event.currentTarget);
    const operation = data.operation;
    delete data.operation;
    if (!data.channel) delete data.channel;
    const response = await request(`reservations/${operation}`, { method: 'POST', body: data });
    showMessage(`${operation} completed. Available: ${response?.data?.available ?? 'updated'}.`);
    await loadReservations();
  }

  function renderWarehouses() {
    const rows = state.warehouses.map((warehouse) => {
      const location = [warehouse.city, warehouse.country].filter(Boolean).join(', ') || warehouse.address || '-';
      return `
        <tr>
          <td><strong>${escapeHtml(warehouse.name)}</strong><br><code>${escapeHtml(warehouse.id)}</code></td>
          <td>${escapeHtml(warehouse.code)}</td>
          <td><span class="pill">${escapeHtml(warehouse.type)}</span></td>
          <td>${escapeHtml(location)}</td>
          <td>${warehouse.priority ?? 0}</td>
          <td>${statusPill(warehouse.isActive ? 'active' : 'inactive')}</td>
          <td>
            <div class="row-actions">
              <button class="button" type="button" data-edit-warehouse="${escapeAttr(warehouse.id)}">Edit</button>
              <button class="button danger" type="button" data-delete-warehouse="${escapeAttr(warehouse.id)}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
    $('#warehousesTable').innerHTML = rows || emptyRow(7);

    $$('[data-edit-warehouse]').forEach((button) => {
      button.addEventListener('click', () => editWarehouse(button.dataset.editWarehouse));
    });
    $$('[data-delete-warehouse]').forEach((button) => {
      button.addEventListener('click', () => deleteWarehouse(button.dataset.deleteWarehouse));
    });
  }

  function renderWarehouseSummary() {
    $('#warehouseCount').textContent = state.warehouses.length;
    $('#warehouseDetail').textContent = state.token ? 'loaded' : 'token required';
    const counts = state.warehouses.reduce((acc, warehouse) => {
      const key = warehouse.type || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    renderMetrics('#warehouseMix', Object.entries(counts).map(([label, value]) => ({ label, value })));
  }

  function renderReservations(reservations) {
    const rows = reservations.map((reservation) => `
      <tr>
        <td>${escapeHtml(reservation.orderId)}</td>
        <td><code>${escapeHtml(reservation.productId)}</code></td>
        <td><code>${escapeHtml(reservation.warehouseId)}</code></td>
        <td>${reservation.quantity ?? '-'}</td>
        <td>${escapeHtml(reservation.channel)}</td>
        <td>${statusPill(reservation.status)}</td>
        <td>${formatDate(reservation.expiresAt)}</td>
      </tr>
    `).join('');
    $('#reservationsTable').innerHTML = rows || emptyRow(7);
  }

  function renderReservationSummary(reservations) {
    $('#reservationCount').textContent = reservations.length;
    $('#reservationDetail').textContent = state.token ? 'loaded' : 'token required';
    const counts = reservations.reduce((acc, reservation) => {
      const key = reservation.status || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    renderMetrics('#reservationMix', Object.entries(counts).map(([label, value]) => ({ label, value })));
  }

  function renderStock(items) {
    const rows = items.map((item) => `
      <tr>
        <td>${escapeHtml(item.warehouse?.name || item.warehouseId)}<br><code>${escapeHtml(item.warehouseId)}</code></td>
        <td>${item.quantity ?? '-'}</td>
        <td>${item.reserved ?? '-'}</td>
        <td>${stockPill(item.available, item.lowStockThreshold)}</td>
        <td>${item.lowStockThreshold ?? '-'}</td>
        <td>${escapeHtml(item.location || '-')}</td>
        <td>${formatDate(item.updatedAt)}</td>
      </tr>
    `).join('');
    $('#stockTable').innerHTML = rows || emptyRow(7);
  }

  function renderMovements(items) {
    const rows = items.map((movement) => `
      <tr>
        <td>${formatDate(movement.createdAt)}</td>
        <td><span class="pill">${escapeHtml(movement.type)}</span></td>
        <td><code>${escapeHtml(movement.productId)}</code></td>
        <td>${movement.quantity ?? '-'}</td>
        <td><code>${escapeHtml(movement.fromWarehouseId || '-')}</code></td>
        <td><code>${escapeHtml(movement.toWarehouseId || '-')}</code></td>
        <td>${escapeHtml(movement.reference || '-')}</td>
        <td>${escapeHtml(movement.reason || '-')}</td>
        <td>${escapeHtml(movement.createdBy || '-')}</td>
      </tr>
    `).join('');
    $('#movementsTable').innerHTML = rows || emptyRow(9);
  }

  function renderMetrics(selector, metrics) {
    $(selector).innerHTML = metrics.length
      ? metrics.map((metric) => `
        <div class="metric-row">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${metric.value}</strong>
        </div>
      `).join('')
      : '<div class="metric-row"><span>No data loaded</span><strong>-</strong></div>';
  }

  function editWarehouse(id) {
    const warehouse = state.warehouses.find((item) => item.id === id);
    if (!warehouse) return;
    const form = $('#warehouseForm');
    [
      'id',
      'name',
      'code',
      'type',
      'city',
      'country',
      'priority',
      'address',
      'contactEmail',
      'contactPhone',
      'supplierId',
    ].forEach((key) => {
      form.elements[key].value = warehouse[key] ?? '';
    });
    form.elements.isActive.checked = Boolean(warehouse.isActive);
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function deleteWarehouse(id) {
    const warehouse = state.warehouses.find((item) => item.id === id);
    if (!window.confirm(`Delete warehouse ${warehouse?.name || id}?`)) return;
    await request(`warehouses/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await loadWarehouses();
    showMessage('Warehouse deleted.');
  }

  function resetWarehouseForm() {
    const form = $('#warehouseForm');
    form.elements.id.value = '';
    form.elements.priority.value = '0';
    form.elements.type.value = 'own';
    form.elements.isActive.checked = true;
  }

  async function request(path, options = {}) {
    const auth = options.auth !== false;
    if (auth && !state.token) {
      throw new Error('Bearer token is required for this request.');
    }

    const headers = {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(auth ? { Authorization: `Bearer ${state.token}` } : {}),
    };

    const response = await fetch(`${state.apiBase}/${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json() : await response.text();
    if (!response.ok) {
      const message = typeof payload === 'string'
        ? payload
        : payload.message || payload.error || `Request failed with ${response.status}`;
      throw new Error(Array.isArray(message) ? message.join(', ') : message);
    }
    return payload;
  }

  function normalizeStatus(payload) {
    const data = payload?.data || payload || {};
    const raw = String(data.status || data.health || data.ready || payload?.status || 'ok').toLowerCase();
    const deps = data.dependencies || data.checks || {};
    const detail = Object.entries(deps).length
      ? Object.entries(deps).map(([key, value]) => `${key}: ${typeof value === 'object' ? value.status || 'seen' : value}`).join(', ')
      : raw;

    if (raw.includes('ok') || raw.includes('up') || raw.includes('ready') || raw === 'healthy') {
      return { label: 'OK', detail, kind: 'ok' };
    }
    if (raw.includes('degraded') || raw.includes('not_ready') || raw.includes('warn')) {
      return { label: 'Degraded', detail, kind: 'warn' };
    }
    return { label: raw || 'Unknown', detail, kind: 'bad' };
  }

  function formData(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function setEmptyRows() {
    $('#warehousesTable').innerHTML = emptyRow(7);
    $('#stockTable').innerHTML = emptyRow(7);
    $('#reservationsTable').innerHTML = emptyRow(7);
    $('#movementsTable').innerHTML = emptyRow(9);
  }

  function emptyRow(colspan) {
    return `<tr><td colspan="${colspan}" class="empty">No data loaded.</td></tr>`;
  }

  function statusPill(status) {
    const value = status || 'unknown';
    const kind = ['active', 'fulfilled', 'returned'].includes(value)
      ? 'ok'
      : ['expired', 'cancelled', 'released', 'inactive'].includes(value)
        ? 'warn'
        : '';
    return `<span class="pill ${kind}">${escapeHtml(value)}</span>`;
  }

  function stockPill(available, threshold) {
    const value = Number(available ?? 0);
    const limit = Number(threshold ?? 0);
    const kind = value <= 0 ? 'bad' : value <= limit ? 'warn' : 'ok';
    return `<span class="pill ${kind}">${value}</span>`;
  }

  function formatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString();
  }

  function showMessage(text, isError) {
    const node = $('#message');
    node.textContent = text;
    node.classList.toggle('error', Boolean(isError));
    node.classList.remove('hidden');
    window.clearTimeout(showMessage.timer);
    showMessage.timer = window.setTimeout(() => node.classList.add('hidden'), isError ? 8000 : 4200);
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function escapeAttr(value) {
    return escapeHtml(value).replaceAll('`', '&#096;');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
