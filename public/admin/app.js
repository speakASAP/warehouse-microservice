(function () {
  const storage = {
    apiBase: 'warehouse-admin-api-base',
    token: 'warehouse-admin-token',
    refreshToken: 'warehouse-admin-refresh-token',
    authBase: 'warehouse-admin-auth-base',
    user: 'warehouse-admin-user',
  };

  const defaultApiBase = `${window.location.origin}/api`;
  const defaultAuthBase = 'https://auth.alfares.cz/auth';
  const adminRoles = new Set(['global:superadmin', 'internal:warehouse-microservice:admin']);
  const state = {
    apiBase: localStorage.getItem(storage.apiBase) || defaultApiBase,
    token: localStorage.getItem(storage.token) || '',
    refreshToken: localStorage.getItem(storage.refreshToken) || '',
    authBase: localStorage.getItem(storage.authBase) || defaultAuthBase,
    user: parseStoredUser(),
    warehouses: [],
    inventoryTopology: null,
    reservations: [],
    supplierReconciliation: null,
    supplierConflicts: [],
    selectedProductId: '',
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function init() {
    window.addEventListener('unhandledrejection', (event) => {
      event.preventDefault();
      showMessage(event.reason?.message || 'Request failed.', true);
    });
    bindAuth();
    bindNavigation();
    bindForms();
    bindActions();
    setEmptyRows();
    refreshPublicStatus();
    enforceAdminGate();
  }


  function bindAuth() {
    $$('[data-auth-tab]').forEach((button) => {
      button.addEventListener('click', () => showAuthTab(button.dataset.authTab));
    });
    $('#loginForm').addEventListener('submit', (event) => submitAuthForm(event, 'login'));
    $('#registerForm').addEventListener('submit', (event) => submitAuthForm(event, 'register'));
    $$('[data-action="logout"]').forEach((button) => {
      button.addEventListener('click', logout);
    });
    if (window.location.hash === '#register') showAuthTab('register');
  }

  function showAuthTab(tab) {
    $$('[data-auth-tab]').forEach((button) => button.classList.toggle('active', button.dataset.authTab === tab));
    $('#loginForm').classList.toggle('active', tab === 'login');
    $('#registerForm').classList.toggle('active', tab === 'register');
    $('#accessDenied').classList.add('hidden');
  }

  async function submitAuthForm(event, mode) {
    event.preventDefault();
    const form = event.currentTarget;
    state.authBase = state.authBase || defaultAuthBase;
    localStorage.setItem(storage.authBase, state.authBase);
    const data = formData(form);
    const path = mode === 'register' ? 'register' : 'login';
    try {
      const payload = await authRequest(path, data);
      applyAuthPayload(payload);
      if (hasWarehouseAdminRole()) {
        showAuthMessage('Access confirmed. Loading admin console.');
        revealAdminShell();
        await loadAuthorizedSummaries(true);
      } else {
        lockAdminShell(true);
      }
    } catch (error) {
      showAuthMessage(error.message || 'Authentication failed.', true);
    }
  }

  async function authRequest(path, body) {
    const response = await fetch(`${state.authBase}/${path}`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload.message || payload.error || `Auth request failed with ${response.status}`;
      throw new Error(Array.isArray(message) ? message.join(', ') : message);
    }
    return payload;
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
    localStorage.setItem(storage.token, state.token);
    localStorage.setItem(storage.refreshToken, state.refreshToken);
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
    const productId = formData(event.currentTarget).productId.trim();
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

  document.addEventListener('DOMContentLoaded', init);
})();
