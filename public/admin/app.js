(function () {
  const storage = {
    apiBase: 'warehouse-admin-api-base',
    token: 'warehouse-admin-token',
    refreshToken: 'warehouse-admin-refresh-token',
    authBase: 'warehouse-admin-auth-base',
    authState: 'warehouse-admin-auth-state',
    user: 'warehouse-admin-user',
  };

  const defaultApiBase = `${window.location.origin}/api`;
  const defaultAuthBase = 'https://auth.alfares.cz';
  const defaultCatalogApiBase = 'https://catalog.alfares.cz/api';
  const authClientId = 'warehouse-microservice';
  const adminRoles = new Set(['global:superadmin', 'internal:warehouse-microservice:admin']);
  const state = {
    apiBase: localStorage.getItem(storage.apiBase) || defaultApiBase,
    token: sessionStorage.getItem(storage.token) || localStorage.getItem(storage.token) || '',
    refreshToken: sessionStorage.getItem(storage.refreshToken) || localStorage.getItem(storage.refreshToken) || '',
    authBase: localStorage.getItem(storage.authBase) || defaultAuthBase,
    user: parseStoredUser(),
    warehouses: [],
    inventoryTopology: null,
    reservations: [],
    supplierReconciliation: null,
    supplierConflicts: [],
    selectedProductId: '',
    catalogApiBase: defaultCatalogApiBase,
    productSearchTimers: new WeakMap(),
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function init() {
    window.addEventListener('unhandledrejection', (event) => {
      event.preventDefault();
      showMessage(event.reason?.message || 'Request failed.', true);
    });
    bindAuth();
    const authFragmentState = consumeHostedAuthFragment();
    bindNavigation();
    bindForms();
    bindActions();
    setEmptyRows();
    refreshPublicStatus();
    if (authFragmentState === 'rejected') {
      showAuthMessage('Auth sign-in could not be verified. Please start sign-in again.', true);
    }
    enforceAdminGate();
  }


  function bindAuth() {
    $$('[data-auth-hosted]').forEach((button) => {
      button.addEventListener('click', () => {
        window.location.href = hostedAuthUrl(button.dataset.authHosted === 'register' ? '/register' : '/login');
      });
    });
    $$('[data-action="logout"]').forEach((button) => {
      button.addEventListener('click', logout);
    });
  }

  function randomState() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return 'warehouse-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  }

  function hostedAuthUrl(path) {
    const nonce = randomState();
    sessionStorage.setItem(storage.authState, nonce);
    state.authBase = state.authBase || defaultAuthBase;
    localStorage.setItem(storage.authBase, state.authBase);
    const returnUrl = new URL('/admin', window.location.origin);
    const url = new URL(path, state.authBase);
    url.searchParams.set('client_id', authClientId);
    url.searchParams.set('return_url', returnUrl.toString());
    url.searchParams.set('state', nonce);
    return url.toString();
  }

  function consumeHostedAuthFragment() {
    if (!window.location.hash || !window.location.hash.includes('access_token=')) return 'none';
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get('access_token') || '';
    const refreshToken = params.get('refresh_token') || '';
    const returnedState = params.get('state') || '';
    const expectedState = sessionStorage.getItem(storage.authState) || '';
    const cleanUrl = window.location.pathname + window.location.search;

    if (!accessToken || !expectedState || returnedState !== expectedState) {
      sessionStorage.removeItem(storage.authState);
      window.history.replaceState(null, document.title, cleanUrl);
      return 'rejected';
    }

    applyAuthPayload({ accessToken, refreshToken });
    sessionStorage.removeItem(storage.authState);
    window.history.replaceState(null, document.title, cleanUrl);
    return 'accepted';
  }

  function applyAuthPayload(payload) {
    state.token = payload.accessToken || '';
    state.refreshToken = payload.refreshToken || '';
    const tokenUser = decodeJwtPayload(state.token);
    state.user = {
      ...(payload.user || {}),
      roles: Array.isArray(tokenUser.roles) ? tokenUser.roles : payload.user?.roles || [],
      email: payload.user?.email || tokenUser.email || '',
      sub: tokenUser.sub || payload.user?.id || '',
    };
    sessionStorage.setItem(storage.token, state.token);
    if (state.refreshToken) sessionStorage.setItem(storage.refreshToken, state.refreshToken);
    localStorage.removeItem(storage.token);
    localStorage.removeItem(storage.refreshToken);
    localStorage.setItem(storage.user, JSON.stringify(state.user));
  }

  function enforceAdminGate() {
    if (hasWarehouseAdminRole()) {
      revealAdminShell();
      loadAuthorizedSummaries();
    } else {
      lockAdminShell(Boolean(state.token));
    }
  }

  function revealAdminShell() {
    $('#authGate').classList.add('hidden');
    $('#adminShell').classList.remove('hidden');
    $('#sessionEmail').textContent = state.user?.email || 'Authenticated admin';
    preparePickerForms().catch((error) => showMessage(error.message, true));
  }

  function lockAdminShell(showDenied) {
    $('#adminShell').classList.add('hidden');
    $('#authGate').classList.remove('hidden');
    $('#accessDenied').classList.toggle('hidden', !showDenied);
    if (showDenied) {
      showAuthMessage('Authenticated, but warehouse admin rights are required.', true);
    }
  }

  function hasWarehouseAdminRole() {
    const roles = Array.isArray(state.user?.roles) ? state.user.roles : decodeJwtPayload(state.token).roles || [];
    return roles.some((role) => adminRoles.has(role));
  }

  function logout() {
    state.token = '';
    state.refreshToken = '';
    state.user = null;
    sessionStorage.removeItem(storage.token);
    sessionStorage.removeItem(storage.refreshToken);
    sessionStorage.removeItem(storage.authState);
    localStorage.removeItem(storage.token);
    localStorage.removeItem(storage.refreshToken);
    localStorage.removeItem(storage.user);
    setEmptyRows();
    lockAdminShell(false);
    showAuthMessage('Signed out.');
  }

  function parseStoredUser() {
    try {
      const user = JSON.parse(localStorage.getItem(storage.user) || 'null');
      if (user && typeof user === 'object') return user;
    } catch (_error) {}
    return null;
  }

  function decodeJwtPayload(token) {
    if (!token || token.split('.').length < 2) return {};
    try {
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = payload.padEnd(payload.length + ((4 - payload.length % 4) % 4), '=');
      return JSON.parse(decodeURIComponent(escape(window.atob(padded))));
    } catch (_error) {
      return {};
    }
  }

  function showAuthMessage(text, isError) {
    const node = $('#authMessage');
    node.textContent = text;
    node.classList.toggle('error', Boolean(isError));
    node.classList.remove('hidden');
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
    $$('[data-action="refresh-status"]').forEach((button) => {
      button.addEventListener('click', () => refreshPublicStatus());
    });
    $('[data-action="load-warehouses"]').addEventListener('click', () => loadWarehouses(true));
    $('[data-action="load-inventory-topology"]').addEventListener('click', () => loadInventoryTopology(true));
    $('[data-action="load-reservations"]').addEventListener('click', () => loadReservations(true));
    $('[data-action="load-supplier-conflicts"]').addEventListener('click', () => loadSupplierConflicts(true));
    $('[data-action="reset-warehouse"]').addEventListener('click', () => resetWarehouseForm());
  }

  function bindForms() {
    $('#warehouseForm').addEventListener('submit', submitWarehouseForm);
    $('#warehouseForm').addEventListener('reset', () => {
      window.setTimeout(resetWarehouseForm, 0);
    });
    $('#stockLookupForm').addEventListener('submit', submitStockLookup);
    $('#topologyFilterForm').addEventListener('submit', submitTopologyFilter);
    $('#reservationLookupForm').addEventListener('submit', submitReservationLookup);
    $('#movementLookupForm').addEventListener('submit', submitMovementLookup);
    $('#stockActionForm').addEventListener('submit', submitStockAction);
    $('#reservationActionForm').addEventListener('submit', submitReservationAction);
    $('#stockOperationSelect')?.addEventListener('change', (event) => {
      toggleStockReservationFields(event.target.value);
    });
    $$('[data-product-picker]').forEach((root) => bindProductPicker(root));
    toggleStockReservationFields($('#stockOperationSelect')?.value || 'increment');
    $('#supplierReconciliationForm').addEventListener('submit', submitSupplierReconciliation);
    $('#supplierConflictFilterForm').addEventListener('submit', submitSupplierConflictFilter);
    $('#supplierConflictReviewForm').addEventListener('submit', submitSupplierConflictReview);
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
    if (panelId === 'warehouses' && !state.inventoryTopology) {
      loadInventoryTopology().catch((error) => showMessage(error.message, true));
    }
    if (panelId === 'reservations' && !state.reservations.length) {
      loadReservations().catch((error) => showMessage(error.message, true));
    }
    if (panelId === 'suppliers' && !state.supplierConflicts.length) {
      loadSupplierConflicts().catch((error) => showMessage(error.message, true));
    }
    if (panelId === 'actions' || panelId === 'stock') {
      preparePickerForms().catch((error) => showMessage(error.message, true));
    }
  }

  async function refreshPublicStatus() {
    const [health, ready] = await Promise.all([
      loadStatus('health', '#healthStatus', '#healthDetail'),
      loadStatus('ready', '#readyStatus', '#readyDetail'),
    ]);
    renderHealthSignals(health, ready);
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
      return payload;
    } catch (error) {
      $(statusSelector).textContent = 'Unavailable';
      $(detailSelector).textContent = error.message;
      card.classList.add('bad');
      return null;
    }
  }

  async function loadAuthorizedSummaries(force) {
    if (!state.token) {
      $('#warehouseDetail').textContent = 'token required';
      $('#reservationDetail').textContent = 'token required';
      renderMetrics('#warehouseMix', []);
      renderMetrics('#topologySummary', []);
      renderMetrics('#reservationMix', []);
      return;
    }

    await Promise.all([
      loadWarehouses(force).catch((error) => showMessage(error.message, true)),
      loadInventoryTopology(force).catch((error) => showMessage(error.message, true)),
      loadReservations(force).catch((error) => showMessage(error.message, true)),
    ]);
  }

  async function loadWarehouses(showToast) {
    const response = await request('warehouses');
    state.warehouses = asArray(response.data);
    renderWarehouses();
    renderWarehouseSummary();
    populateWarehousePickers();
    if (showToast) showMessage('Warehouses loaded.');
  }

  async function loadInventoryTopology(showToast, productId) {
    const input = $('#topologyProductId');
    const filter = String(productId ?? input?.value ?? '').trim();
    const query = filter ? '?productId=' + encodeURIComponent(filter) : '';
    const response = await request('warehouses/topology' + query);
    state.inventoryTopology = response.data || null;
    if (input && productId !== undefined) input.value = filter;
    renderInventoryTopology();
    renderWarehouseSummary();
    if (showToast) showMessage('Inventory topology loaded.');
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
    const validationError = validateWarehouseForm(data, form);
    if (validationError) {
      showMessage(validationError, true);
      return;
    }
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
    await loadInventoryTopology();
    showMessage(id ? 'Warehouse updated.' : 'Warehouse created.');
  }

  function validateWarehouseForm(data, form) {
    if (!data.name?.trim()) return 'Warehouse name is required.';
    if (data.name.length > 200) return 'Warehouse name must be 200 characters or less.';
    if (!data.code?.trim()) return 'Warehouse code is required.';
    if (data.code.length > 100) return 'Warehouse code must be 100 characters or less.';
    if (!['own', 'supplier', 'dropship'].includes(data.type)) return 'Warehouse type must be own, supplier, or dropship.';
    if (data.country && !/^[A-Za-z]{2}$/.test(data.country.trim())) return 'Country must be a 2-letter code, for example CZ.';
    if (data.postalCode && data.postalCode.length > 20) return 'PSČ must be 20 characters or less.';
    if (data.contactEmail && !form.elements.contactEmail.checkValidity()) return 'Contact email must be a valid email address.';
    const priority = Number(data.priority || 0);
    if (!Number.isInteger(priority) || priority < 0) return 'Priority must be a whole number 0 or higher.';
    return '';
  }

  async function submitTopologyFilter(event) {
    event.preventDefault();
    const productId = formData(event.currentTarget).productId.trim();
    await loadInventoryTopology(true, productId);
  }

  async function submitStockLookup(event) {
    event.preventDefault();
    const productId = readProductPickerValue(event.currentTarget);
    if (!productId) {
      showMessage('Choose a product first.', true);
      return;
    }
    state.selectedProductId = productId;
    $('#selectedProduct').textContent = productId;
    const [stockResponse, totalResponse] = await Promise.all([
      request(`stock/${encodeURIComponent(productId)}`),
      request(`stock/${encodeURIComponent(productId)}/total`),
    ]);
    renderStock(asArray(stockResponse.data));
    $('#totalAvailable').textContent = totalResponse?.data?.totalAvailable ?? '-';
    $('#topologyProductId').value = productId;
    await loadInventoryTopology(false, productId);
    syncProductPickers(productId);
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
    const form = event.currentTarget;
    const data = formData(form);
    const operation = data.operation;
    delete data.operation;
    data.productId = readProductPickerValue(form);
    data.quantity = Number(data.quantity);

    if (!data.productId) {
      showMessage('Choose a product first.', true);
      return;
    }
    if (!data.warehouseId) {
      showMessage('Choose a warehouse first.', true);
      return;
    }

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
    if (!data.reference) delete data.reference;

    const response = await request(`stock/${operation}`, { method: 'POST', body: data });
    showMessage(`${operation} completed. Available: ${response?.data?.available ?? 'updated'}.`);
    if (data.productId) {
      syncProductPickers(data.productId);
      const stockLookupForm = $('#stockLookupForm');
      if (stockLookupForm) {
        setProductPickerValue(stockLookupForm, data.productId);
        stockLookupForm.requestSubmit();
      }
    }
  }

  async function submitReservationAction(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = formData(form);
    const operation = data.operation;
    delete data.operation;
    data.productId = readProductPickerValue(form);
    if (!data.productId) {
      showMessage('Choose a product first.', true);
      return;
    }
    if (!data.warehouseId) {
      showMessage('Choose a warehouse first.', true);
      return;
    }
    if (!data.channel) delete data.channel;
    if (!data.reference) delete data.reference;
    const response = await request(`reservations/${operation}`, { method: 'POST', body: data });
    showMessage(`${operation} completed. Available: ${response?.data?.available ?? 'updated'}.`);
    await loadReservations();
  }

  async function loadSupplierConflicts(showToast) {
    const form = $('#supplierConflictFilterForm');
    const filters = form ? formData(form) : { status: 'conflict', limit: '50' };
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      const text = String(value || '').trim();
      if (text) params.set(key, text);
    });
    if (!params.has('status')) params.set('status', 'conflict');
    if (!params.has('limit')) params.set('limit', '50');

    const response = await request(`supplier-reconciliations?${params.toString()}`);
    state.supplierConflicts = asArray(response.data);
    renderSupplierConflicts(state.supplierConflicts);
    if (showToast) showMessage('Supplier conflicts loaded.');
  }

  async function submitSupplierConflictFilter(event) {
    event.preventDefault();
    await loadSupplierConflicts(true);
  }

  async function submitSupplierConflictReview(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = formData(form);
    if (!data.id) {
      showMessage('Select a conflict row to review.', true);
      return;
    }

    const body = { actor: data.actor, operatorNote: data.operatorNote };
    const response = await request(`supplier-reconciliations/${encodeURIComponent(data.id)}/review`, {
      method: 'PATCH',
      body,
    });
    prepareSupplierConflictReview(null);
    await loadSupplierConflicts();
    showMessage(`Conflict ${response.data?.id || data.id} marked reviewed.`);
  }

  async function submitSupplierReconciliation(event) {
    event.preventDefault();
    const data = formData(event.currentTarget);
    data.quantity = Number(data.quantity);
    if (data.observedAt) {
      data.observedAt = new Date(data.observedAt).toISOString();
    } else {
      delete data.observedAt;
    }

    const response = await request('supplier-reconciliations', { method: 'POST', body: data });
    state.supplierReconciliation = response.data || null;
    renderSupplierReconciliation(state.supplierReconciliation);
    showMessage(`Supplier reconciliation ${state.supplierReconciliation?.status || 'completed'}.`);
    if (data.productId) {
      $('#stockLookupForm').elements.productId.value = data.productId;
      $('#topologyProductId').value = data.productId;
      loadInventoryTopology(false, data.productId).catch((error) => showMessage(error.message, true));
    }
    await loadSupplierConflicts();
  }

  function renderWarehouses() {
    const rows = state.warehouses.map((warehouse) => {
      const location = formatWarehouseLocation(warehouse);
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
    const topologyTotals = state.inventoryTopology?.totals;
    if (topologyTotals) {
      $('#warehouseDetail').textContent = 'available ' + (topologyTotals.totalAvailable ?? 0);
    }
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

  function renderInventoryTopology() {
    const topology = state.inventoryTopology;
    if (!topology) {
      renderMetrics('#topologySummary', []);
      $('#topologyTable').innerHTML = emptyRow(8);
      return;
    }

    const totals = topology.totals || {};
    renderMetrics('#topologySummary', [
      { label: 'total available', value: totals.totalAvailable ?? 0 },
      { label: 'own warehouses', value: totals.ownWarehouseCount ?? 0 },
      { label: 'supplier managed', value: totals.supplierWarehouseCount ?? 0 },
      { label: 'products with stock', value: totals.productsWithStock ?? 0 },
    ]);

    const rows = asArray(topology.warehouses).map((warehouse) => {
      const supplier = warehouse.supplierId ? '<code>' + escapeHtml(warehouse.supplierId) + '</code>' : '-';
      return '\n        <tr>\n          <td><strong>' + escapeHtml(warehouse.warehouseName) + '</strong><br><code>' + escapeHtml(warehouse.warehouseId) + '</code></td>\n          <td>' + escapeHtml(warehouse.warehouseCode) + '</td>\n          <td>' + statusPill(warehouse.originType || warehouse.warehouseType) + '</td>\n          <td>' + supplier + '</td>\n          <td>' + (warehouse.totalQuantity ?? 0) + '</td>\n          <td>' + (warehouse.totalReserved ?? 0) + '</td>\n          <td>' + stockPill(warehouse.totalAvailable, 0) + '</td>\n          <td>' + (warehouse.productsWithStock ?? 0) + '</td>\n        </tr>\n      ';
    }).join('');
    $('#topologyTable').innerHTML = rows || emptyRow(8);
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

  function renderSupplierConflicts(conflicts) {
    const rows = conflicts.map((reconciliation) => `
      <tr>
        <td>${statusPill(reconciliation.status)}</td>
        <td>${reconciliation.reviewedAt ? statusPill('reviewed') + '<br><small>' + formatDate(reconciliation.reviewedAt) + '</small>' : statusPill('unreviewed')}</td>
        <td>${escapeHtml(reconciliation.supplierId)}</td>
        <td><code>${escapeHtml(reconciliation.productId)}</code></td>
        <td><code>${escapeHtml(reconciliation.warehouseId)}</code></td>
        <td>${reconciliation.supplierQuantity ?? '-'}</td>
        <td>${reconciliation.reservedQuantity ?? '-'}</td>
        <td>${escapeHtml(reconciliation.externalReference || '-')}</td>
        <td>${escapeHtml(reconciliation.conflictReason || '-')}</td>
        <td>${escapeHtml(reconciliation.operatorNote || '-')}</td>
        <td>
          <div class="row-actions">
            <button class="link-button" type="button" data-review-conflict="${escapeAttr(reconciliation.id)}">Review</button>
          </div>
        </td>
      </tr>
    `).join('');
    $('#supplierConflictTable').innerHTML = rows || emptyRow(11);
    $$('[data-review-conflict]').forEach((button) => {
      button.addEventListener('click', () => prepareSupplierConflictReview(button.dataset.reviewConflict));
    });
  }

  function prepareSupplierConflictReview(id) {
    const form = $('#supplierConflictReviewForm');
    if (!form) return;
    const reconciliation = id ? state.supplierConflicts.find((item) => item.id === id) : null;
    form.elements.id.value = reconciliation?.id || '';
    form.elements.displayId.value = reconciliation?.id || '';
    form.elements.actor.value = reconciliation?.reviewedBy || form.elements.actor.value || '';
    form.elements.operatorNote.value = reconciliation?.operatorNote || '';
    if (reconciliation) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function renderSupplierReconciliation(reconciliation) {
    if (!reconciliation) {
      $('#supplierResultTable').innerHTML = emptyRow(9);
      $('#supplierConflictTable').innerHTML = emptyRow(11);
      renderMetrics('#topologySummary', []);
      return;
    }

    $('#supplierResultTable').innerHTML = `
      <tr>
        <td>${statusPill(reconciliation.status)}</td>
        <td>${escapeHtml(reconciliation.supplierId)}</td>
        <td><code>${escapeHtml(reconciliation.productId)}</code></td>
        <td><code>${escapeHtml(reconciliation.warehouseId)}</code></td>
        <td>${reconciliation.supplierQuantity ?? '-'}</td>
        <td>${reconciliation.previousQuantity ?? '-'}</td>
        <td>${reconciliation.reservedQuantity ?? '-'}</td>
        <td>${escapeHtml(reconciliation.externalReference || '-')}</td>
        <td>${escapeHtml(reconciliation.conflictReason || '-')}</td>
      </tr>
    `;
  }

  function renderHealthSignals(health, ready) {
    const data = health?.data || health || {};
    const dependencies = data.dependencies || {};
    const operations = data.operations || {};
    const rabbitmq = dependencies.rabbitmq || {};
    const eventKind = rabbitmq.status === 'up' ? 'ok' : rabbitmq.status ? 'bad' : 'warn';

    setStatusCard('#eventStatus', '#eventDetail', rabbitmq.status === 'up' ? 'OK' : rabbitmq.status || 'Unknown', eventKind, rabbitmq.lastError || 'stock.events');

    const mutationFailures = Number(operations.mutations?.failures || 0);
    const eventFailures = Number(operations.stockEvents?.failures || 0);
    const opsKind = mutationFailures || eventFailures ? 'warn' : 'ok';
    setStatusCard('#operationsStatus', '#operationsDetail', opsKind === 'ok' ? 'OK' : 'Review', opsKind, `mutations ${mutationFailures}, events ${eventFailures}`);

    const readyData = ready?.data || ready || {};
    renderMetrics('#dependencyHealth', Object.entries(dependencies).map(([label, value]) => ({
      label,
      value: value?.status || value || '-',
    })).concat([{ label: 'readiness', value: readyData.status || '-' }]));

    renderMetrics('#operationsHealth', [
      metricFromStatus('mutation attempts', operations.mutations?.attempts),
      metricFromStatus('mutation failures', operations.mutations?.failures),
      metricFromStatus('event attempts', operations.stockEvents?.attempts),
      metricFromStatus('event failures', operations.stockEvents?.failures),
    ]);
  }

  function setStatusCard(statusSelector, detailSelector, label, kind, detail) {
    const card = $(statusSelector).closest('.status-card');
    card.classList.remove('ok', 'warn', 'bad');
    card.classList.add(kind);
    $(statusSelector).textContent = label;
    $(detailSelector).textContent = detail;
  }

  function metricFromStatus(label, value) {
    return { label, value: value ?? 0 };
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


  function formatWarehouseLocation(warehouse) {
    const cityLine = [warehouse.postalCode, warehouse.city].filter(Boolean).join(' ');
    const parts = [warehouse.address, cityLine, warehouse.country].filter(Boolean);
    return parts.length ? parts.join(', ') : '-';
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
      'postalCode',
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
    await loadInventoryTopology();
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
        ? `Request failed with ${response.status}`
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
    $('#topologyTable').innerHTML = emptyRow(8);
    $('#stockTable').innerHTML = emptyRow(7);
    $('#reservationsTable').innerHTML = emptyRow(7);
    $('#movementsTable').innerHTML = emptyRow(9);
    $('#supplierResultTable').innerHTML = emptyRow(9);
    $('#supplierConflictTable').innerHTML = emptyRow(11);
    renderMetrics('#topologySummary', []);
  }

  function emptyRow(colspan) {
    return `<tr><td colspan="${colspan}" class="empty">No data loaded.</td></tr>`;
  }

  function statusPill(status) {
    const value = status || 'unknown';
    const kind = ['active', 'fulfilled', 'returned', 'applied', 'reviewed'].includes(value)
      ? 'ok'
      : ['expired', 'cancelled', 'released', 'inactive', 'conflict', 'unreviewed'].includes(value)
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

  function toggleStockReservationFields(operation) {
    const panel = $('#stockReservationFields');
    if (!panel) return;
    panel.classList.toggle('hidden', operation !== 'reserve' && operation !== 'unreserve');
  }

  async function preparePickerForms() {
    if (!state.token) return;
    if (!state.warehouses.length) {
      await loadWarehouses(false);
    } else {
      populateWarehousePickers();
    }

    const urlProductId = new URLSearchParams(window.location.search).get('productId')?.trim();
    const productId = urlProductId || state.selectedProductId;
    if (productId) {
      await preloadProductPickers(productId);
    }
  }

  function populateWarehousePickers() {
    $$('[data-warehouse-select]').forEach((select) => {
      const selectedId = select.value || select.dataset.selectedId || '';
      const options = ['<option value="">Choose warehouse...</option>'];
      state.warehouses
        .filter((warehouse) => warehouse.isActive !== false)
        .sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')))
        .forEach((warehouse) => {
          const selected = warehouse.id === selectedId ? ' selected' : '';
          options.push(
            `<option value="${escapeAttr(warehouse.id)}"${selected}>${escapeHtml(warehouse.name)} (${escapeHtml(warehouse.code)})</option>`,
          );
        });
      select.innerHTML = options.join('');
    });
  }

  function bindProductPicker(root) {
    if (root.dataset.pickerBound === 'true') return;
    root.dataset.pickerBound = 'true';
    const search = root.querySelector('[data-product-search]');
    const select = root.querySelector('[data-product-select]');
    if (!select) return;

    const runSearch = () => {
      const existingTimer = state.productSearchTimers.get(root);
      if (existingTimer) window.clearTimeout(existingTimer);
      state.productSearchTimers.set(
        root,
        window.setTimeout(() => {
          loadProductOptions(select, search?.value || '', select.value).catch((error) => {
            showMessage(error.message, true);
          });
        }, 250),
      );
    };

    search?.addEventListener('input', runSearch);
    search?.addEventListener('search', runSearch);
  }

  function readProductPickerValue(formOrRoot) {
    const select = formOrRoot.querySelector?.('[data-product-select]') || formOrRoot.elements?.productId;
    return String(select?.value || '').trim();
  }

  function setProductPickerValue(formOrRoot, productId) {
    const select = formOrRoot.querySelector?.('[data-product-select]') || formOrRoot.elements?.productId;
    if (select) select.value = productId;
  }

  async function syncProductPickers(productId) {
    state.selectedProductId = productId;
    await preloadProductPickers(productId);
  }

  async function preloadProductPickers(productId) {
    const product = await fetchCatalogProduct(productId);
    $$('[data-product-select]').forEach((select) => {
      populateProductSelect(select, product ? [product] : [], productId);
      const search = select.closest('[data-product-picker]')?.querySelector('[data-product-search]');
      if (search && product) {
        search.value = product.sku || product.title || '';
      }
    });
  }

  async function loadProductOptions(select, search, selectedId = '') {
    const query = String(search || '').trim();
    const keepId = String(selectedId || select.value || '').trim();

    if (!query && !keepId) {
      select.innerHTML = '<option value="">Search SKU or title above...</option>';
      return;
    }

    let products = [];
    if (query.length >= 2) {
      products = await searchCatalogProducts(query);
    } else if (keepId) {
      const product = await fetchCatalogProduct(keepId);
      if (product) products = [product];
    }

    if (keepId && !products.some((product) => product.id === keepId)) {
      const selectedProduct = await fetchCatalogProduct(keepId);
      if (selectedProduct) products.unshift(selectedProduct);
    }

    populateProductSelect(select, products, keepId);
  }

  function populateProductSelect(select, products, selectedId = '') {
    const keepId = selectedId || select.value;
    const options = ['<option value="">Choose product...</option>'];
    products.forEach((product) => {
      const selected = product.id === keepId ? ' selected' : '';
      const sku = product.sku || 'SKU?';
      const title = product.title || product.id;
      options.push(`<option value="${escapeAttr(product.id)}"${selected}>${escapeHtml(sku)} — ${escapeHtml(title)}</option>`);
    });
    select.innerHTML = options.join('');
  }

  async function searchCatalogProducts(search) {
    const params = new URLSearchParams({ limit: '30', catalogScope: 'effective' });
    const query = String(search || '').trim();
    if (query) params.set('search', query);
    const payload = await catalogRequest(`products?${params.toString()}`);
    return asArray(payload?.data);
  }

  async function fetchCatalogProduct(productId) {
    const id = String(productId || '').trim();
    if (!id) return null;
    const payload = await catalogRequest(`products/${encodeURIComponent(id)}`);
    return payload?.data || null;
  }

  async function catalogRequest(path) {
    if (!state.token) {
      throw new Error('Sign in required before loading catalog products.');
    }

    const response = await fetch(`${state.catalogApiBase}/${path}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${state.token}`,
      },
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json() : await response.text();
    if (!response.ok) {
      const message = typeof payload === 'string'
        ? `Catalog request failed with ${response.status}`
        : payload.message || payload.error || `Catalog request failed with ${response.status}`;
      throw new Error(Array.isArray(message) ? message.join(', ') : message);
    }
    return payload;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
