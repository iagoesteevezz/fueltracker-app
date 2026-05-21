const API_BASE = 'http://localhost:3000/api/v1';
let refuels = [];
let chartInstance = null;
let editModeId = null;
let token = null;

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
};

let toastTimeout;

document.addEventListener('DOMContentLoaded', () => {
  token = localStorage.getItem('token');
  if (token) {
    showAppScreen();
    setTodayAsDefault();
    setupFormListeners();
    loadRefuels();
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
  dom.tbody.addEventListener('click', handleTableAction);
  dom.logoutBtn.addEventListener('click', handleLogout);
  dom.cancelEditBtn.addEventListener('click', resetForm);
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
    setTimeout(() => {
      showAppScreen();
      setTodayAsDefault();
      setupFormListeners();
      loadRefuels();
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
    setTimeout(() => {
      showAppScreen();
      setTodayAsDefault();
      setupFormListeners();
      loadRefuels();
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
    refuels = json.data;
    setApiStatus(true);
    renderAll(refuels);
  } catch (error) {
    console.error('[loadRefuels]', error);
    setApiStatus(false);
    showTableState('empty');
  }
}

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
        <td class="px-4 py-4 text-center space-x-2">
          <button type="button" class="action-btn action-btn-edit" data-action="edit" data-id="${r.id}">Editar</button>
          <button type="button" class="action-btn action-btn-delete" data-action="delete" data-id="${r.id}">Eliminar</button>
        </td>
      </tr>
    `;
  }).join('');
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

  const payload = {
    km_since_last: dom.kmInput.value,
    liters_filled: dom.litersInput.value,
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
      refuels = refuels.map((r) => (r.id === updated.id ? updated : r));
      renderAll(refuels);
      showToast('Repostaje actualizado correctamente', 'success');
      resetForm();
      return;
    }

    const created = await createRefuel(payload);
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
