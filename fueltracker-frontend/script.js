const API_BASE = 'http://localhost:3000/api/v1';
let allRefuels = [];           // Almacena todos los repostajes sin filtrar
let refuels = [];              // Almacena los repostajes filtrados/ordenados para mostrar en tabla
let cars = [];                 // Coches del usuario para el selector superior
let activeCarId = null;        // Coche activo seleccionado en la barra superior
let chartInstance = null;
let editModeId = null;
let token = null;
let currentSortField = null;   // Campo por el que se está ordenando
let currentSortOrder = 'asc';  // 'asc' o 'desc'

const dom = {
  authScreen: document.getElementById('auth-screen'),
  appScreen: document.getElementById('app-screen'),
  registerForm: document.getElementById('register-form'),
  loginForm: document.getElementById('login-form'),
  registerUsername: document.getElementById('register-username'),
  registerEmail: document.getElementById('register-email'),
  registerPassword: document.getElementById('register-password'),
  registerBtn: document.getElementById('register-btn'),
  registerText: document.getElementById('register-text'),
  loginEmail: document.getElementById('login-email'),
  loginPassword: document.getElementById('login-password'),
  loginBtn: document.getElementById('login-btn'),
  loginText: document.getElementById('login-text'),
  logoutBtn: document.getElementById('logout-btn'),
  statAvg: document.getElementById('stat-avg-consumption'),
  statKm: document.getElementById('stat-total-km'),
  statLiters: document.getElementById('stat-total-liters'),
  statCost: document.getElementById('stat-total-cost'),
  form: document.getElementById('refuel-form'),
  carModalForm: document.getElementById('car-modal-form'),
  carBrandInput: document.getElementById('car_brand'),
  carModelInput: document.getElementById('car_model'),
  carYearInput: document.getElementById('car_year'),
  carModalSubmitBtn: document.getElementById('car-modal-submit-btn'),
  activeCarSelect: document.getElementById('active-car-select'),
  openCarModalBtn: document.getElementById('open-car-modal-btn'),
  carModal: document.getElementById('car-modal'),
  closeCarModalBtn: document.getElementById('close-car-modal-btn'),
  kmInput: document.getElementById('km_since_last'),
  litersInput: document.getElementById('liters_filled'),
  priceInput: document.getElementById('price_per_liter'),
  dateInput: document.getElementById('refuel_date'),
  notesInput: document.getElementById('notes'),
  preview: document.getElementById('consumption-preview'),
  previewValue: document.getElementById('preview-value'),
  submitBtn: document.getElementById('submit-btn'),
  submitText: document.getElementById('submit-text'),
  cancelEditBtn: document.getElementById('cancel-edit-btn'),
  tbody: document.getElementById('refuels-tbody'),
  tableLoading: document.getElementById('table-loading'),
  tableEmpty: document.getElementById('table-empty'),
  tableWrapper: document.getElementById('table-wrapper'),
  tableCount: document.getElementById('table-count'),
  chartCanvas: document.getElementById('consumption-chart'),
  chartEmpty: document.getElementById('chart-empty'),
  chartContainer: document.getElementById('chart-container'),
  apiDot: document.getElementById('api-status-dot'),
  apiText: document.getElementById('api-status-text'),
  toast: document.getElementById('toast'),
  toastMsg: document.getElementById('toast-message'),
  searchNotesInput: document.getElementById('search-notes-input'),
};

let toastTimeout;

document.addEventListener('DOMContentLoaded', async () => {
  token = localStorage.getItem('token');
  if (token) {
    showAppScreen();
    setTodayAsDefault();
    setupFormListeners();
    await loadCars();
    await loadRefuels();
  } else {
    showAuthScreen();
    setupAuthListeners();
  }
});

function setupAuthListeners() {
  dom.registerForm.addEventListener('submit', handleRegister);
  dom.loginForm.addEventListener('submit', handleLogin);
}

function setupFormListeners() {
  dom.kmInput.addEventListener('input', updateConsumptionPreview);
  dom.litersInput.addEventListener('input', updateConsumptionPreview);
  dom.form.addEventListener('submit', handleSubmit);
  dom.carModalForm.addEventListener('submit', handleCarSubmit);
  dom.activeCarSelect.addEventListener('change', handleActiveCarChange);
  dom.openCarModalBtn.addEventListener('click', openCarModal);
  dom.closeCarModalBtn.addEventListener('click', closeCarModal);
  dom.carModal.addEventListener('click', (event) => {
    if (event.target === dom.carModal) closeCarModal();
  });
  dom.tbody.addEventListener('click', handleTableAction);
  dom.logoutBtn.addEventListener('click', handleLogout);
  dom.cancelEditBtn.addEventListener('click', resetForm);
  dom.searchNotesInput.addEventListener('input', filterAndRenderTable);
}

async function handleRegister(e) {
  e.preventDefault();
  const username = dom.registerUsername.value.trim();
  const email = dom.registerEmail.value.trim();
  const password = dom.registerPassword.value;

  if (!username || !email || !password) {
    showToast('Por favor rellena todos los campos', 'error');
    return;
  }

  dom.registerBtn.disabled = true;
  dom.registerText.textContent = 'Registrando...';

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Error en el registro');
    }

    token = json.data.token;
    localStorage.setItem('token', token);
    showToast('Cuenta creada correctamente', 'success');
    setTimeout(async () => {
      showAppScreen();
      setTodayAsDefault();
      setupFormListeners();
      await loadCars();
      await loadRefuels();
    }, 1000);
  } catch (error) {
    showToast(error.message || 'Error al registrar', 'error');
  } finally {
    dom.registerBtn.disabled = false;
    dom.registerText.textContent = 'Registrarse';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = dom.loginEmail.value.trim();
  const password = dom.loginPassword.value;

  if (!email || !password) {
    showToast('Por favor rellena todos los campos', 'error');
    return;
  }

  dom.loginBtn.disabled = true;
  dom.loginText.textContent = 'Iniciando sesión...';

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Error en el login');
    }

    token = json.data.token;
    localStorage.setItem('token', token);
    showToast('Sesión iniciada correctamente', 'success');
    setTimeout(async () => {
      showAppScreen();
      setTodayAsDefault();
      setupFormListeners();
      await loadCars();
      await loadRefuels();
    }, 1000);
  } catch (error) {
    showToast(error.message || 'Error al iniciar sesión', 'error');
  } finally {
    dom.loginBtn.disabled = false;
    dom.loginText.textContent = 'Iniciar sesión';
  }
}

function handleLogout() {
  localStorage.removeItem('token');
  token = null;
  dom.registerForm.reset();
  dom.loginForm.reset();
  showAuthScreen();
  setupAuthListeners();
  showToast('Sesión cerrada correctamente', 'success');
}

function showAuthScreen() {
  dom.authScreen.classList.remove('hidden');
  dom.appScreen.classList.add('hidden');
  dom.logoutBtn.classList.add('hidden');
}

function showAppScreen() {
  dom.authScreen.classList.add('hidden');
  dom.appScreen.classList.remove('hidden');
  dom.logoutBtn.classList.remove('hidden');
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function loadRefuels() {
  try {
    const res = await fetch(`${API_BASE}/refuels`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('token');
        token = null;
        showAuthScreen();
        return;
      }
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();
    allRefuels = json.data;
    refuels = [...allRefuels];  // Inicializar refuels sin filtro
    setApiStatus(true);
    renderAll(refuels);
  } catch (error) {
    console.error('[loadRefuels]', error);
    setApiStatus(false);
    showTableState('empty');
  }
}

async function loadCars() {
  try {
    const res = await fetch(`${API_BASE}/cars`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('token');
        token = null;
        showAuthScreen();
        return;
      }
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();
    cars = json.data;
    populateActiveCarSelect(cars);
    if (!activeCarId && cars.length > 0) {
      setActiveCarId(cars[0].id, { shouldRender: false });
    }
  } catch (error) {
    console.error('[loadCars]', error);
    cars = [];
    populateActiveCarSelect(cars);
  }
}

function populateActiveCarSelect(items) {
  if (!dom.activeCarSelect) return;
  if (!items || items.length === 0) {
    dom.activeCarSelect.innerHTML = `
      <option value="">No tienes coches registrados</option>
    `;
    dom.activeCarSelect.disabled = true;
    return;
  }

  dom.activeCarSelect.innerHTML = `
    <option value="">Selecciona un coche</option>
    ${items.map((car) => `<option value="${car.id}">${car.brand} ${car.model} - ${car.year}</option>`).join('')}
  `;
  dom.activeCarSelect.disabled = false;
}

function setActiveCarId(carId, { shouldRender = true } = {}) {
  activeCarId = carId ? Number(carId) : null;
  if (dom.activeCarSelect) {
    dom.activeCarSelect.value = activeCarId || '';
  }
  if (shouldRender) {
    filterAndRenderTable();
  }
}

function handleActiveCarChange(event) {
  const selected = event.target.value;
  setActiveCarId(selected);
}

async function createCar(data) {
  const res = await fetch(`${API_BASE}/cars`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) {
    const msg = json.errors ? json.errors.join('. ') : json.message;
    throw new Error(msg);
  }
  return json.data;
}

const handleCarSubmit = async (event) => {
  event.preventDefault();

  const payload = {
    brand: dom.carBrandInput.value.trim(),
    model: dom.carModelInput.value.trim(),
    year: dom.carYearInput.value.trim(),
  };

  if (!payload.brand || !payload.model || !payload.year) {
    showToast('Por favor completa marca, modelo y año', 'error');
    return;
  }

  dom.carModalSubmitBtn.disabled = true;
  dom.carModalSubmitBtn.textContent = 'Registrando...';

  try {
    const createdCar = await createCar(payload);
    cars.unshift(createdCar);
    populateActiveCarSelect(cars);
    if (!activeCarId) {
      setActiveCarId(createdCar.id);
    }
    dom.carModalForm.reset();
    closeCarModal();
    showToast('Vehículo registrado correctamente', 'success');
  } catch (error) {
    console.error('[handleCarSubmit]', error);
    showToast(error.message || 'Error al registrar el vehículo', 'error');
  } finally {
    dom.carModalSubmitBtn.disabled = false;
    dom.carModalSubmitBtn.textContent = 'Registrar vehículo';
  }
};

async function createRefuel(data) {
  const res = await fetch(`${API_BASE}/refuels`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) {
    const msg = json.errors ? json.errors.join('. ') : json.message;
    throw new Error(msg);
  }
  return json.data;
}

async function updateRefuel(id, data) {
  const res = await fetch(`${API_BASE}/refuels/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) {
    const msg = json.errors ? json.errors.join('. ') : json.message;
    throw new Error(msg);
  }
  return json.data;
}

async function deleteRefuel(id) {
  const res = await fetch(`${API_BASE}/refuels/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  const json = await res.json();
  if (!res.ok) {
    const msg = json.message || 'Error al eliminar el repostaje';
    throw new Error(msg);
  }
  return true;
}

function renderAll(data) {
  renderStats(data);
  renderChart(data);
  renderTable(data);
  updateSortIndicators();
}

function renderStats(data) {
  if (data.length === 0) {
    dom.statAvg.textContent = '—';
    dom.statKm.textContent = '—';
    dom.statLiters.textContent = '—';
    dom.statCost.textContent = '—';
    return;
  }

  const totals = data.reduce((acc, r) => {
    acc.km += Number.parseFloat(r.km_since_last);
    acc.liters += Number.parseFloat(r.liters_filled);
    acc.sumConsump += Number.parseFloat(r.avg_consumption);
    if (r.price_per_liter) {
      acc.cost += Number.parseFloat(r.liters_filled) * Number.parseFloat(r.price_per_liter);
    }
    return acc;
  }, { km: 0, liters: 0, sumConsump: 0, cost: 0 });

  const avgConsumption = totals.sumConsump / data.length;
  dom.statAvg.textContent = avgConsumption.toFixed(2);
  dom.statKm.textContent = totals.km.toLocaleString('es-ES', { maximumFractionDigits: 0 });
  dom.statLiters.textContent = totals.liters.toFixed(1);
  dom.statCost.textContent = totals.cost > 0
    ? totals.cost.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '—';
}

function renderChart(data) {
  if (data.length < 2) {
    dom.chartEmpty.classList.remove('hidden');
    dom.chartContainer.classList.add('hidden');
    return;
  }

  dom.chartEmpty.classList.add('hidden');
  dom.chartContainer.classList.remove('hidden');
  const sorted = [...data].reverse();
  const labels = sorted.map(r => formatDate(r.refuel_date));
  const values = sorted.map(r => Number.parseFloat(r.avg_consumption));

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  chartInstance = new Chart(dom.chartCanvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'L/100km',
        data: values,
        borderColor: '#f97316',
        borderWidth: 2,
        fill: true,
        backgroundColor: (ctx) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height);
          gradient.addColorStop(0, 'rgba(249, 115, 22, 0.25)');
          gradient.addColorStop(1, 'rgba(249, 115, 22, 0)');
          return gradient;
        },
        pointBackgroundColor: '#f97316',
        pointBorderColor: '#07090d',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.35,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#161b22',
          borderColor: '#30363d',
          borderWidth: 1,
          titleColor: '#8b949e',
          bodyColor: '#e6edf3',
          padding: 12,
          callbacks: { label: (ctx) => ` ${ctx.parsed.y.toFixed(2)} L/100km` },
        },
      },
      scales: {
        x: {
          grid: { color: '#21262d', drawBorder: false },
          ticks: { color: '#8b949e', font: { family: 'JetBrains Mono', size: 11 } },
        },
        y: {
          grid: { color: '#21262d', drawBorder: false },
          ticks: {
            color: '#8b949e',
            font: { family: 'JetBrains Mono', size: 11 },
            callback: (v) => v.toFixed(1),
          },
          grace: '10%',
        },
      },
    },
  });
}

function renderTable(data) {
  if (data.length === 0) {
    showTableState('empty');
    return;
  }

  showTableState('data');
  dom.tableCount.textContent = `${data.length} registro${data.length !== 1 ? 's' : ''}`;
  dom.tbody.innerHTML = data.map((r, i) => {
    const consumption = Number.parseFloat(r.avg_consumption);
    const totalCost = r.price_per_liter
      ? (Number.parseFloat(r.liters_filled) * Number.parseFloat(r.price_per_liter)).toFixed(2)
      : '—';
    const badgeClass = consumption < 6  ? 'consumption-good'
                     : consumption < 8  ? 'consumption-average'
                     :                    'consumption-bad';
    const delay = Math.min(i * 50, 500);

    return `
      <tr class="row-animate border-b border-dark-700 hover:bg-dark-700/40 transition-colors" style="animation-delay: ${delay}ms; opacity: 0;">
        <td class="px-6 py-4 font-mono text-sm text-ink">${formatDate(r.refuel_date)}</td>
        <td class="px-4 py-4 font-mono text-sm text-right text-ink">${Number.parseFloat(r.km_since_last).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}<span class="text-ink-faint text-xs ml-1">km</span></td>
        <td class="px-4 py-4 font-mono text-sm text-right text-ink">${Number.parseFloat(r.liters_filled).toFixed(3)}<span class="text-ink-faint text-xs ml-1">L</span></td>
        <td class="px-4 py-4 font-mono text-sm text-right text-ink-muted">${r.price_per_liter ? Number.parseFloat(r.price_per_liter).toFixed(3) + ' €' : '—'}</td>
        <td class="px-4 py-4 font-mono text-sm text-right text-ink-muted">${totalCost === '—' ? '—' : totalCost + ' €'}</td>
        <td class="px-4 py-4 text-center"><span class="consumption-badge ${badgeClass}">${consumption.toFixed(2)} L/100</span></td>
        <td class="px-6 py-4 text-sm text-ink-faint max-w-[160px] truncate">${r.notes || ''}</td>
        <td class="px-4 py-4 text-center space-x-2 flex items-center justify-center gap-2">
          <button type="button" class="p-1 rounded hover:bg-dark-700/40" data-action="edit" data-id="${r.id}" aria-label="Editar">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
          </button>
          <button type="button" class="p-1 rounded hover:bg-red-700/10" data-action="delete" data-id="${r.id}" aria-label="Eliminar">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-ink hover:text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ── Actualizar indicadores visuales de orden en las cabeceras ───────────
function updateSortIndicators() {
  const indicators = document.querySelectorAll('[data-sort-field]');
  indicators.forEach((el) => {
    const field = el.getAttribute('data-sort-field');
    if (field === currentSortField) {
      el.textContent = currentSortOrder === 'asc' ? '▲' : '▼';
    } else {
      el.textContent = '';
    }
  });
}

// ── Filtrar repostajes por notas y renderizar tabla ──────────────────────
function filterAndRenderTable() {
  const searchTerm = dom.searchNotesInput.value.toLowerCase().trim();
  
  // Filtrar allRefuels según el término de búsqueda en la columna 'notes'
  if (searchTerm === '') {
    // Si el input está vacío, mostrar todos los datos
    refuels = [...allRefuels];
  } else {
    refuels = allRefuels.filter((r) => {
      const notes = (r.notes || '').toLowerCase();
      return notes.includes(searchTerm);
    });
  }
  
  // Mantener el ordenamiento actual si existe
  if (currentSortField) {
    refuels = sortArray(refuels, currentSortField, currentSortOrder);
  }
  
  // Renderizar tabla con datos filtrados
  renderTable(refuels);
  // Actualizar estadísticas con datos filtrados
  renderStats(refuels);
  updateSortIndicators();
}

// ── Función auxiliar para ordenar un array ───────────────────────────────
function sortArray(data, field, order) {
  const sorted = [...data].sort((a, b) => {
    let valA = a[field];
    let valB = b[field];

    // Manejo nulo/indefinido
    if (valA === null || typeof valA === 'undefined') valA = '';
    if (valB === null || typeof valB === 'undefined') valB = '';

    // Fechas: comparar como Date
    if (field === 'refuel_date' || field === 'created_at') {
      const dateA = new Date(valA);
      const dateB = new Date(valB);
      if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
      if (isNaN(dateA.getTime())) return order === 'asc' ? 1 : -1;
      if (isNaN(dateB.getTime())) return order === 'asc' ? -1 : 1;
      return order === 'asc' ? dateA - dateB : dateB - dateA;
    }

    // Números: intentar convertir
    const numA = Number(valA);
    const numB = Number(valB);
    if (!isNaN(numA) && !isNaN(numB)) {
      return order === 'asc' ? numA - numB : numB - numA;
    }

    // Strings: comparar localmente
    const strA = String(valA).toLowerCase();
    const strB = String(valB).toLowerCase();
    if (strA < strB) return order === 'asc' ? -1 : 1;
    if (strA > strB) return order === 'asc' ? 1 : -1;
    return 0;
  });
  
  return sorted;
}

// ── Ordenar repostajes por un campo específico ────────────────────────────
function sortRefuels(field) {
  // Si hace clic en el mismo campo, cambiar el orden; si no, poner ascendente
  if (currentSortField === field) {
    currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    currentSortField = field;
    currentSortOrder = 'asc';
  }
  
  // Ordenar refuels (datos filtrados actualmente)
  refuels = sortArray(refuels, field, currentSortOrder);
  
  // Renderizar tabla con datos ordenados
  renderTable(refuels);
  updateSortIndicators();
}

// ── Ordenar por Total € (cálculo dinámico) ───────────────────────────────
function calculateAndSortByTotalCost() {
  if (currentSortField === 'total_cost') {
    currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    currentSortField = 'total_cost';
    currentSortOrder = 'asc';
  }
  
  const sorted = [...refuels].sort((a, b) => {
    const costA = (Number(a.liters_filled) * Number(a.price_per_liter)) || 0;
    const costB = (Number(b.liters_filled) * Number(b.price_per_liter)) || 0;
    
    if (costA < costB) return currentSortOrder === 'asc' ? -1 : 1;
    if (costA > costB) return currentSortOrder === 'asc' ? 1 : -1;
    return 0;
  });
  
  refuels = sorted;
  renderTable(refuels);
  updateSortIndicators();
}

function handleTableAction(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  if (!id) return;

  if (action === 'edit') {
    enterEditMode(Number(id));
    return;
  }
  if (action === 'delete') {
    confirmDelete(Number(id));
  }
}

function enterEditMode(id) {
  const item = refuels.find((r) => r.id === id);
  if (!item) {
    showToast('No se encontró el repostaje seleccionado', 'error');
    return;
  }

  editModeId = id;
  dom.dateInput.value = item.refuel_date;
  dom.kmInput.value = item.km_since_last;
  dom.litersInput.value = item.liters_filled;
  dom.priceInput.value = item.price_per_liter || '';
  dom.notesInput.value = item.notes || '';
  if (dom.carSelect) {
    dom.carSelect.value = item.car_id || '';
  }
  dom.submitText.textContent = 'Actualizar repostaje';
  dom.cancelEditBtn.classList.remove('hidden');
  updateConsumptionPreview();
  showToast('Modo edición activado.', 'success');
}

function confirmDelete(id) {
  const item = refuels.find((r) => r.id === id);
  if (!item) {
    showToast('No se encontró el repostaje seleccionado', 'error');
    return;
  }

  const confirmed = globalThis.confirm(`¿Eliminar repostaje del ${formatDate(item.refuel_date)}? Esta acción no se puede deshacer.`);
  if (!confirmed) return;

  performDelete(id);
}

async function performDelete(id) {
  try {
    await deleteRefuel(id);
    // Eliminar de ambas listas
    allRefuels = allRefuels.filter((r) => r.id !== id);
    refuels = refuels.filter((r) => r.id !== id);
    renderAll(refuels);
    showToast('Repostaje eliminado correctamente', 'success');
    if (editModeId === id) resetForm();
  } catch (error) {
    console.error('[performDelete]', error);
    showToast(error.message || 'Error al eliminar el repostaje', 'error');
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  if (!activeCarId) {
    showToast('Selecciona un coche activo antes de registrar el repostaje', 'error');
    return;
  }

  const payload = {
    km_since_last: dom.kmInput.value,
    liters_filled: dom.litersInput.value,
    car_id: activeCarId,
  };

  // Enviar fecha en formato ISO completo para máxima compatibilidad
  if (dom.dateInput.value) {
    const dateObj = new Date(dom.dateInput.value + 'T00:00:00Z');
    payload.refuel_date = dateObj.toISOString().split('T')[0];
  }
  if (dom.priceInput.value) payload.price_per_liter = dom.priceInput.value;
  if (dom.notesInput.value) payload.notes = dom.notesInput.value;

  setSubmitLoading(true);

  try {
    if (editModeId !== null) {
      const updated = await updateRefuel(editModeId, payload);
      // Actualizar en ambas listas
      allRefuels = allRefuels.map((r) => (r.id === updated.id ? updated : r));
      refuels = refuels.map((r) => (r.id === updated.id ? updated : r));
      renderAll(refuels);
      showToast('Repostaje actualizado correctamente', 'success');
      resetForm();
      return;
    }

    const created = await createRefuel(payload);
    // Actualizar en ambas listas
    allRefuels.unshift(created);
    refuels.unshift(created);
    renderAll(refuels);
    dom.form.reset();
    dom.preview.classList.add('hidden');
    showToast('Repostaje registrado correctamente ✓', 'success');
  } catch (error) {
    console.error('[handleSubmit]', error);
    showToast(error.message || 'Error al registrar el repostaje', 'error');
  } finally {
    setSubmitLoading(false);
  }
}

function setTodayAsDefault() {
  const today = new Date().toISOString().split('T')[0];
  dom.dateInput.value = today;
}

function updateConsumptionPreview() {
  const km = Number.parseFloat(dom.kmInput.value);
  const liters = Number.parseFloat(dom.litersInput.value);

  if (km > 0 && liters > 0) {
    const estimated = (liters / km) * 100;
    dom.previewValue.textContent = estimated.toFixed(2);
    dom.preview.classList.remove('hidden');
  } else {
    dom.preview.classList.add('hidden');
  }
}

function resetForm() {
  editModeId = null;
  dom.form.reset();
  setTodayAsDefault();
  if (dom.carSelect) {
    dom.carSelect.value = '';
  }
  dom.preview.classList.add('hidden');
  dom.submitText.textContent = 'Registrar repostaje';
  dom.cancelEditBtn.classList.add('hidden');
}

function formatDate(isoDate) {
  if (!isoDate) return '—';
  
  let dateObj;
  // Manejar varios formatos posibles de fecha desde la BD
  if (isoDate.includes('T')) {
    // Es ISO completo (2025-12-31T00:00:00.000Z)
    dateObj = new Date(isoDate);
  } else if (isoDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Es YYYY-MM-DD, agregar UTC para evitar problemas de zona horaria
    dateObj = new Date(isoDate + 'T00:00:00Z');
  } else {
    // Intentar parseo genérico
    dateObj = new Date(isoDate);
  }
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  return dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function setSubmitLoading(loading) {
  dom.submitBtn.disabled = loading;
  dom.submitText.textContent = loading ? 'Registrando...' : (editModeId !== null ? 'Actualizar repostaje' : 'Registrar repostaje');
}

function showTableState(state) {
  dom.tableLoading.classList.toggle('hidden', state !== 'loading');
  dom.tableEmpty.classList.toggle('hidden', state !== 'empty');
  dom.tableWrapper.classList.toggle('hidden', state !== 'data');
}

function setApiStatus(online) {
  dom.apiDot.className = `w-2 h-2 rounded-full ${online ? 'bg-green-500' : 'bg-red-500'}`;
  dom.apiText.textContent = online ? 'API conectada' : 'API no disponible';
}

function showToast(message, type = 'success') {
  clearTimeout(toastTimeout);
  dom.toastMsg.textContent = message;
  const isSuccess = type === 'success';
  dom.toast.className = `fixed bottom-6 right-6 z-50 rounded-xl border px-5 py-4 text-sm max-w-xs shadow-2xl ${isSuccess ? 'bg-dark-800 border-green-800 text-green-400' : 'bg-dark-800 border-red-800 text-red-400'}`;
  dom.toast.classList.add('visible');
  toastTimeout = setTimeout(() => dom.toast.classList.remove('visible'), 3500);
}
