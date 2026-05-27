// ── Interfaces & Types ────────────────────────────────────────────────────

interface Car {
  id: number;
  brand: string;
  model: string;
  year: string | number;
  plate?: string;
}

interface Refuel {
  id: number;
  car_id: number;
  km_since_last: string | number;
  liters_filled: string | number;
  price_per_liter?: string | number | null;
  avg_consumption: string | number;
  refuel_date: string;
  notes?: string | null;
  created_at?: string;
}

interface GasStation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  distanceKm: number;
  gasolina95: number | null;
  gasoleoA: number | null;
}

interface RawStation {
  IDEESS?: string;
  'Rótulo'?: string;
  'Dirección'?: string;
  'Localidad'?: string;
  'C.P.'?: string;
  'Provincia'?: string;
  'Precio Gasolina 95 E5'?: string;
  'Precio Gasoleo A'?: string;
  [key: string]: string | undefined;
}

interface StationsApiResponse {
  ListaEESSPrecio?: RawStation[];
  listaEESSPrecio?: RawStation[];
}

interface UserPosition {
  lat: number;
  lon: number;
}

interface UserProfile {
  username?: string;
  name?: string;
  email?: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  errors?: string[];
}

interface RefuelPayload {
  km_since_last: string;
  liters_filled: string;
  car_id: number;
  refuel_date?: string;
  price_per_liter?: string;
  notes?: string;
}

interface CarPayload {
  brand: string;
  model: string;
  year: string;
}

type SortOrder = 'asc' | 'desc';
type SortField =
  | 'refuel_date'
  | 'km_since_last'
  | 'liters_filled'
  | 'price_per_liter'
  | 'avg_consumption'
  | 'notes'
  | 'total_cost'
  | 'created_at'
  | null;
type ToastType = 'success' | 'error';
type TableState = 'loading' | 'empty' | 'data';

// Leaflet & Chart.js globals (cargados como scripts externos)
declare const L: any;
declare const Chart: any;

// ── Global State ──────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:3000/api/v1';
let allRefuels: Refuel[] = [];
let refuels: Refuel[] = [];
let cars: Car[] = [];
let activeCarId: number | null = null;
let chartInstance: any = null;
let editModeId: number | null = null;
let token: string | null = null;
let currentSortField: SortField = null;
let currentSortOrder: SortOrder = 'asc';
let stationsMap: any = null;
let stationsLayerGroup: any = null;
let stationsUserMarker: any = null;
let stationsData: GasStation[] = [];
let allStationsData: GasStation[] = [];
let radiusCircle: any = null;
let markersLayer: any = null;
let userPosition: UserPosition | null = null;
let favoriteStations: string[] = JSON.parse(localStorage.getItem('fuelTracker_favorites') ?? '[]');
let showOnlyFavorites = false;
const STATION_RADIUS_KM = 15;

// ── DOM References ────────────────────────────────────────────────────────

const dom = {
  authScreen:            document.getElementById('auth-screen'),
  appScreen:             document.getElementById('app-screen'),
  registerForm:          document.getElementById('register-form')          as HTMLFormElement | null,
  loginForm:             document.getElementById('login-form')             as HTMLFormElement | null,
  registerUsername:      document.getElementById('register-username')      as HTMLInputElement | null,
  registerEmail:         document.getElementById('register-email')         as HTMLInputElement | null,
  registerPassword:      document.getElementById('register-password')      as HTMLInputElement | null,
  registerBtn:           document.getElementById('register-btn')           as HTMLButtonElement | null,
  registerText:          document.getElementById('register-text'),
  loginEmail:            document.getElementById('login-email')            as HTMLInputElement | null,
  loginPassword:         document.getElementById('login-password')         as HTMLInputElement | null,
  loginBtn:              document.getElementById('login-btn')              as HTMLButtonElement | null,
  loginText:             document.getElementById('login-text'),
  logoutBtn:             document.getElementById('logout-btn')             as HTMLButtonElement | null,
  statAvg:               document.getElementById('stat-avg-consumption'),
  statKm:                document.getElementById('stat-total-km'),
  statLiters:            document.getElementById('stat-total-liters'),
  statCost:              document.getElementById('stat-total-cost'),
  form:                  document.getElementById('refuel-form')            as HTMLFormElement | null,
  carModalForm:          document.getElementById('car-modal-form')         as HTMLFormElement | null,
  carBrandInput:         document.getElementById('car_brand')              as HTMLSelectElement | null,
  carModelInput:         document.getElementById('car_model')              as HTMLSelectElement | null,
  carModelManualInput:   document.getElementById('car-model-manual')       as HTMLInputElement | null,
  carYearInput:          document.getElementById('car_year')               as HTMLInputElement | null,
  carModalSubmitBtn:     document.getElementById('car-modal-submit-btn')   as HTMLButtonElement | null,
  activeCarSelect:       document.getElementById('active-car-select')      as HTMLSelectElement | null,
  openCarModalBtn:       document.getElementById('open-car-modal-btn')     as HTMLButtonElement | null,
  carModal:              document.getElementById('car-modal'),
  closeCarModalBtn:      document.getElementById('close-car-modal-btn')    as HTMLButtonElement | null,
  brandHomeBtn:          document.getElementById('brand-home-btn')         as HTMLButtonElement | null,
  dashboardView:         document.getElementById('dashboard-view'),
  profileView:           document.getElementById('profile-view'),
  profileAvatar:         document.getElementById('profile-avatar'),
  profileUserName:       document.getElementById('profile-user-name'),
  profileStatsCars:      document.getElementById('profile-stats-cars'),
  profileStatsRefuels:   document.getElementById('profile-stats-refuels'),
  profileStatsKm:        document.getElementById('profile-stats-km'),
  profileCarsList:       document.getElementById('profile-cars-list'),
  profileEditBtn:        document.getElementById('profile-edit-btn')       as HTMLButtonElement | null,
  editProfileModal:      document.getElementById('edit-profile-modal'),
  editProfileForm:       document.getElementById('edit-profile-form')      as HTMLFormElement | null,
  editProfileNameInput:  document.getElementById('edit-profile-name')      as HTMLInputElement | null,
  editProfileCancelBtn:  document.getElementById('edit-profile-cancel-btn') as HTMLButtonElement | null,
  userAvatarBtn:         document.getElementById('user-avatar-btn')        as HTMLButtonElement | null,
  userAvatarLabel:       document.getElementById('user-avatar-label'),
  userDropdown:          document.getElementById('user-dropdown'),
  userDropdownName:      document.getElementById('user-dropdown-name'),
  userLogoutBtn:         document.getElementById('user-logout-btn')        as HTMLButtonElement | null,
  userProfileLink:       document.getElementById('user-profile-link')      as HTMLAnchorElement | null,
  kmInput:               document.getElementById('km_since_last')          as HTMLInputElement | null,
  litersInput:           document.getElementById('liters_filled')          as HTMLInputElement | null,
  priceInput:            document.getElementById('price_per_liter')        as HTMLInputElement | null,
  dateInput:             document.getElementById('refuel_date')            as HTMLInputElement | null,
  notesInput:            document.getElementById('notes')                  as HTMLTextAreaElement | null,
  preview:               document.getElementById('consumption-preview'),
  previewValue:          document.getElementById('preview-value'),
  submitBtn:             document.getElementById('submit-btn')             as HTMLButtonElement | null,
  submitText:            document.getElementById('submit-text'),
  cancelEditBtn:         document.getElementById('cancel-edit-btn')        as HTMLButtonElement | null,
  tbody:                 document.getElementById('refuels-tbody')          as HTMLTableSectionElement | null,
  tableLoading:          document.getElementById('table-loading'),
  tableEmpty:            document.getElementById('table-empty'),
  tableWrapper:          document.getElementById('table-wrapper'),
  tableCount:            document.getElementById('table-count'),
  chartCanvas:           document.getElementById('consumption-chart')      as HTMLCanvasElement | null,
  chartEmpty:            document.getElementById('chart-empty'),
  chartContainer:        document.getElementById('chart-container'),
  apiDot:                document.getElementById('api-status-dot'),
  apiText:               document.getElementById('api-status-text'),
  toast:                 document.getElementById('toast'),
  toastMsg:              document.getElementById('toast-message'),
  searchNotesInput:      document.getElementById('search-notes-input')     as HTMLInputElement | null,
  navStationsBtn:        document.getElementById('nav-stations-btn')       as HTMLButtonElement | null,
  stationsView:          document.getElementById('stations-view'),
  stationsList:          document.getElementById('cheapest-stations-list'),
  map:                   document.getElementById('map'),
  radiusSlider:          document.getElementById('radius-slider')          as HTMLInputElement | null,
  radiusLabel:           document.getElementById('radius-label'),
  sortStations:          document.getElementById('sort-stations')          as HTMLSelectElement | null,
  favoritesToggle:       document.getElementById('favorites-toggle')       as HTMLButtonElement | null,
};

let toastTimeout: ReturnType<typeof setTimeout> | undefined;

// ── Bootstrap ─────────────────────────────────────────────────────────────

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

// ── Auth Listeners ────────────────────────────────────────────────────────

function setupAuthListeners(): void {
  dom.registerForm!.addEventListener('submit', handleRegister);
  dom.loginForm!.addEventListener('submit', handleLogin);
}

function setupFormListeners(): void {
  dom.kmInput!.addEventListener('input', updateConsumptionPreview);
  dom.litersInput!.addEventListener('input', updateConsumptionPreview);
  dom.form!.addEventListener('submit', handleSubmit);
  dom.carModalForm!.addEventListener('submit', handleCarSubmit);
  dom.carBrandInput!.addEventListener('change', handleCarBrandChange);
  dom.carModelInput!.addEventListener('change', handleCarModelChange);
  dom.activeCarSelect!.addEventListener('change', handleActiveCarChange);
  dom.openCarModalBtn!.addEventListener('click', openCarModal);
  dom.closeCarModalBtn!.addEventListener('click', closeCarModal);
  dom.brandHomeBtn!.addEventListener('click', showDashboardView);

  if (dom.navStationsBtn) {
    dom.navStationsBtn.addEventListener('click', showStationsView);
  }

  if (dom.radiusSlider) {
    dom.radiusSlider.addEventListener('input', (event: Event) => {
      const value = Number((event.target as HTMLInputElement).value);
      if (dom.radiusLabel) {
        dom.radiusLabel.textContent = `Radio de búsqueda: ${value} km`;
      }
      updateMapRadius(value);
    });
  }

  if (dom.sortStations) {
    dom.sortStations.addEventListener('change', () => {
      updateMapRadius(Number(dom.radiusSlider?.value ?? 50));
    });
  }

  if (dom.favoritesToggle) {
    dom.favoritesToggle.addEventListener('click', () => {
      showOnlyFavorites = !showOnlyFavorites;
      dom.favoritesToggle!.classList.toggle('bg-fuel/20', showOnlyFavorites);
      dom.favoritesToggle!.classList.toggle('text-fuel', showOnlyFavorites);
      dom.favoritesToggle!.classList.toggle('border-fuel', showOnlyFavorites);
      dom.favoritesToggle!.classList.toggle('text-slate-400', !showOnlyFavorites);
      dom.favoritesToggle!.classList.toggle('border-dark-600', !showOnlyFavorites);
      updateMapRadius(Number(dom.radiusSlider?.value ?? 50));
    });
  }

  dom.userProfileLink!.addEventListener('click', (event: MouseEvent) => {
    event.preventDefault();
    showProfileView();
  });

  if (dom.profileEditBtn) {
    dom.profileEditBtn.addEventListener('click', openEditProfileModal);
  }
  if (dom.editProfileForm) {
    dom.editProfileForm.addEventListener('submit', handleEditProfileSubmit);
  }
  if (dom.editProfileCancelBtn) {
    dom.editProfileCancelBtn.addEventListener('click', closeEditProfileModal);
  }
  if (dom.editProfileModal) {
    dom.editProfileModal.addEventListener('click', (event: Event) => {
      if (event.target === dom.editProfileModal) closeEditProfileModal();
    });
  }
  if (dom.profileCarsList) {
    dom.profileCarsList.addEventListener('click', handleProfileCarsListClick);
  }

  dom.userAvatarBtn!.addEventListener('click', handleAvatarClick);
  dom.userLogoutBtn!.addEventListener('click', handleLogout);
  dom.carModal!.addEventListener('click', (event: Event) => {
    if (event.target === dom.carModal) closeCarModal();
  });
  dom.tbody!.addEventListener('click', handleTableAction);
  dom.cancelEditBtn!.addEventListener('click', resetForm);
  dom.searchNotesInput!.addEventListener('input', filterAndRenderTable);
  document.addEventListener('click', handleOutsideClick);
}

// ── Auth Handlers ─────────────────────────────────────────────────────────

async function handleRegister(e: Event): Promise<void> {
  e.preventDefault();
  const username = dom.registerUsername!.value.trim();
  const email    = dom.registerEmail!.value.trim();
  const password = dom.registerPassword!.value;

  if (!username || !email || !password) {
    showToast('Por favor rellena todos los campos', 'error');
    return;
  }

  dom.registerBtn!.disabled = true;
  dom.registerText!.textContent = 'Registrando...';

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    const json: ApiResponse<{ token: string; user?: UserProfile } & UserProfile> = await res.json();
    if (!res.ok) {
      throw new Error(json.message ?? 'Error en el registro');
    }

    const userPayload: UserProfile = (json.data as any)?.user ?? json.data ?? {};
    const loggedUsername = userPayload.username ?? userPayload.name ?? username;

    token = (json.data as any).token as string;
    localStorage.setItem('token', token);
    persistUserIdentity(loggedUsername, email);
    syncProfileNameToUi(loggedUsername);
    showToast('Cuenta creada correctamente', 'success');
    setTimeout(async () => {
      showAppScreen();
      setTodayAsDefault();
      setupFormListeners();
      await loadCars();
      await loadRefuels();
    }, 1000);
  } catch (error: unknown) {
    showToast((error as Error).message ?? 'Error al registrar', 'error');
  } finally {
    dom.registerBtn!.disabled = false;
    dom.registerText!.textContent = 'Registrarse';
  }
}

async function handleLogin(e: Event): Promise<void> {
  e.preventDefault();
  const email    = dom.loginEmail!.value.trim();
  const password = dom.loginPassword!.value;

  if (!email || !password) {
    showToast('Por favor rellena todos los campos', 'error');
    return;
  }

  dom.loginBtn!.disabled = true;
  dom.loginText!.textContent = 'Iniciando sesión...';

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const json: ApiResponse<{ token: string; user?: UserProfile } & UserProfile> = await res.json();
    if (!res.ok) {
      throw new Error(json.message ?? 'Error en el login');
    }

    const userPayload: UserProfile = (json.data as any)?.user ?? json.data ?? {};
    const loggedUsername = userPayload.username ?? userPayload.name ?? '';

    token = (json.data as any).token as string;
    localStorage.setItem('token', token);
    persistUserIdentity(loggedUsername, email);
    syncProfileNameToUi(loggedUsername || getStoredUserDisplay());
    showToast('Sesión iniciada correctamente', 'success');
    setTimeout(async () => {
      showAppScreen();
      setTodayAsDefault();
      setupFormListeners();
      await loadCars();
      await loadRefuels();
    }, 1000);
  } catch (error: unknown) {
    showToast((error as Error).message ?? 'Error al iniciar sesión', 'error');
  } finally {
    dom.loginBtn!.disabled = false;
    dom.loginText!.textContent = 'Iniciar sesión';
  }
}

function handleLogout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  token = null;
  closeUserDropdown();
  dom.registerForm!.reset();
  dom.loginForm!.reset();
  showAuthScreen();
  setupAuthListeners();
  showToast('Sesión cerrada correctamente', 'success');
}

// ── View Switching ────────────────────────────────────────────────────────

function showAuthScreen(): void {
  dom.authScreen!.classList.remove('hidden');
  dom.appScreen!.classList.add('hidden');
  closeUserDropdown();
}

const showDashboardView = (): void => {
  if (!dom.dashboardView || !dom.profileView || !dom.stationsView) return;
  dom.dashboardView.classList.remove('hidden');
  dom.profileView.classList.add('hidden');
  dom.stationsView.classList.add('hidden');
  closeUserDropdown();
};

const showProfileView = (): void => {
  if (!dom.dashboardView || !dom.profileView || !dom.stationsView) return;
  dom.dashboardView.classList.add('hidden');
  dom.profileView.classList.remove('hidden');
  dom.stationsView.classList.add('hidden');
  loadProfileStats();
  renderProfileCars();
  closeUserDropdown();
};

const showStationsView = (): void => {
  if (!dom.dashboardView || !dom.profileView || !dom.stationsView) return;
  dom.dashboardView.classList.add('hidden');
  dom.profileView.classList.add('hidden');
  dom.stationsView.classList.remove('hidden');
  closeUserDropdown();
  initStationsMap();
};

function showAppScreen(): void {
  dom.authScreen!.classList.add('hidden');
  dom.appScreen!.classList.remove('hidden');
  updateUserAvatar();
  showDashboardView();
}

// ── Edit Profile Modal ────────────────────────────────────────────────────

const openEditProfileModal = (): void => {
  if (!dom.editProfileModal || !dom.editProfileNameInput) return;
  dom.editProfileNameInput.value = getStoredUserDisplay() ?? '';
  dom.editProfileModal.classList.remove('hidden');
  dom.editProfileModal.classList.add('flex');
  dom.editProfileNameInput.focus();
};

const closeEditProfileModal = (): void => {
  if (!dom.editProfileModal) return;
  dom.editProfileModal.classList.add('hidden');
  dom.editProfileModal.classList.remove('flex');
};

// ── Auth Helpers ──────────────────────────────────────────────────────────

function getHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

const persistUserIdentity = (username: string, email: string): void => {
  const safeUsername = username?.trim();
  const safeEmail    = email?.trim();
  if (safeUsername) localStorage.setItem('userName', safeUsername);
  if (safeEmail)    localStorage.setItem('userEmail', safeEmail);
};

const getStoredUserDisplay = (): string => {
  const savedName = localStorage.getItem('userName');
  if (savedName && savedName.trim()) return savedName.trim();
  return 'Usuario';
};

const getUserInitialsFromName = (name = ''): string => {
  const displayName = name?.trim() ?? '';
  if (!displayName) return 'U';
  const parts = displayName.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const getUserInitials = (): string => getUserInitialsFromName(getStoredUserDisplay());

const updateUserAvatar = (): void => {
  if (!dom.userAvatarLabel) return;
  dom.userAvatarLabel.textContent = getUserInitials();
};

const syncProfileNameToUi = (name: string): void => {
  const safeName = name?.trim() || getStoredUserDisplay() || 'Usuario';
  persistUserIdentity(safeName, '');

  if (dom.profileUserName)   dom.profileUserName.textContent   = safeName;
  if (dom.userDropdownName)  dom.userDropdownName.textContent  = safeName;
  if (dom.profileAvatar)     dom.profileAvatar.textContent     = getUserInitialsFromName(safeName);

  updateUserAvatar();
};

const closeUserDropdown = (): void => {
  if (!dom.userDropdown || !dom.userAvatarBtn) return;
  dom.userDropdown.classList.add('hidden');
  dom.userAvatarBtn.setAttribute('aria-expanded', 'false');
};

const toggleUserDropdown = (): void => {
  if (!dom.userDropdown || !dom.userAvatarBtn) return;
  const isHidden = dom.userDropdown.classList.contains('hidden');
  if (isHidden) {
    dom.userDropdown.classList.remove('hidden');
    dom.userAvatarBtn.setAttribute('aria-expanded', 'true');
    return;
  }
  closeUserDropdown();
};

const handleAvatarClick = (event: MouseEvent): void => {
  event.stopPropagation();
  toggleUserDropdown();
};

const handleOutsideClick = (event: MouseEvent): void => {
  if (!dom.userDropdown || !dom.userAvatarBtn) return;
  const target = event.target as Node;
  if (dom.userAvatarBtn.contains(target) || dom.userDropdown.contains(target)) return;
  closeUserDropdown();
};

// ── Data Loading ──────────────────────────────────────────────────────────

async function loadRefuels(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/refuels`, { headers: getHeaders() });

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('token');
        token = null;
        showAuthScreen();
        return;
      }
      throw new Error(`HTTP ${res.status}`);
    }

    const json: ApiResponse<Refuel[]> = await res.json();
    allRefuels = json.data;
    loadProfileStats();
    setApiStatus(true);
    filterAndRenderTable();
  } catch (error: unknown) {
    console.error('[loadRefuels]', error);
    setApiStatus(false);
    showTableState('empty');
  }
}

async function loadCars(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/cars`, { headers: getHeaders() });

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('token');
        token = null;
        showAuthScreen();
        return;
      }
      throw new Error(`HTTP ${res.status}`);
    }

    const json: ApiResponse<Car[]> = await res.json();
    cars = json.data;
    loadProfileStats();
    renderProfileCars();
    populateActiveCarSelect(cars);

    if (cars.length > 0) {
      const nextCarId = activeCarId ?? cars[0].id;
      setActiveCarId(nextCarId, { shouldRender: true });
    } else {
      activeCarId = null;
      if (dom.activeCarSelect) dom.activeCarSelect.value = '';
      renderAll([]);
    }
  } catch (error: unknown) {
    console.error('[loadCars]', error);
    cars = [];
    loadProfileStats();
    renderProfileCars();
    populateActiveCarSelect(cars);
    activeCarId = null;
    renderAll([]);
  }
}

// ── Car UI ────────────────────────────────────────────────────────────────

function populateActiveCarSelect(items: Car[]): void {
  if (!dom.activeCarSelect) return;
  if (!items || items.length === 0) {
    dom.activeCarSelect.innerHTML = `<option value="">No tienes coches registrados</option>`;
    dom.activeCarSelect.disabled = true;
    return;
  }
  dom.activeCarSelect.innerHTML = `
    <option value="">Selecciona un coche</option>
    ${items.map((car) => `<option value="${car.id}">${car.brand} ${car.model} - ${car.year}</option>`).join('')}
  `;
  dom.activeCarSelect.disabled = false;
}

function setActiveCarId(carId: number | string | null, { shouldRender = true } = {}): void {
  activeCarId = carId ? Number(carId) : null;
  if (dom.activeCarSelect) dom.activeCarSelect.value = String(activeCarId ?? '');
  if (shouldRender) filterAndRenderTable();
}

function handleActiveCarChange(event: Event): void {
  const selected = (event.target as HTMLSelectElement).value;
  setActiveCarId(selected);
}

const fetchCarBrands = async (): Promise<void> => {
  try {
    const res = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    const brands: string[] = (json.Results as { MakeName: string }[] ?? [])
      .map((item) => item.MakeName)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

    dom.carBrandInput!.innerHTML =
      '<option value="">Selecciona una marca...</option>' +
      brands.map((brand) => `<option value="${brand}">${brand}</option>`).join('');
    dom.carBrandInput!.disabled = false;

    dom.carModelInput!.innerHTML = '<option value="">Selecciona una marca primero...</option>';
    dom.carModelInput!.disabled = true;
  } catch (error: unknown) {
    console.error('[fetchCarBrands]', error);
    dom.carBrandInput!.innerHTML = '<option value="">No se pudieron cargar las marcas</option>';
    dom.carBrandInput!.disabled = true;
  }
};

const fetchCarModels = async (brand: string): Promise<void> => {
  dom.carModelInput!.disabled = true;
  dom.carModelInput!.innerHTML = '<option value="">Cargando modelos...</option>';

  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(brand)}?format=json`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    const models: string[] = (json.Results as { Model_Name: string }[] ?? [])
      .map((item) => item.Model_Name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

    dom.carModelInput!.innerHTML =
      '<option value="">Selecciona un modelo...</option>' +
      models.map((model) => `<option value="${model}">${model}</option>`).join('') +
      '<option value="otro">🔄 No encuentro mi modelo... (Escribir a mano)</option>';
    dom.carModelInput!.disabled = false;
    dom.carModelInput!.classList.remove('hidden');
    dom.carModelManualInput!.classList.add('hidden');
    dom.carModelManualInput!.removeAttribute('required');
    dom.carModelManualInput!.value = '';
  } catch (error: unknown) {
    console.error('[fetchCarModels]', error);
    dom.carModelInput!.innerHTML = '<option value="">No se pudieron cargar los modelos</option>';
    dom.carModelInput!.disabled = true;
  }
};

const handleCarBrandChange = async (event: Event): Promise<void> => {
  const selectedBrand = (event.target as HTMLSelectElement).value.trim();

  if (!selectedBrand) {
    dom.carModelInput!.innerHTML = '<option value="">Selecciona una marca primero...</option>';
    dom.carModelInput!.disabled = true;
    dom.carModelInput!.classList.remove('hidden');
    dom.carModelManualInput!.classList.add('hidden');
    dom.carModelManualInput!.removeAttribute('required');
    dom.carModelManualInput!.value = '';
    return;
  }

  await fetchCarModels(selectedBrand);
};

const handleCarModelChange = (): void => {
  if (dom.carModelInput!.value === 'otro') {
    dom.carModelInput!.classList.add('hidden');
    dom.carModelManualInput!.classList.remove('hidden');
    dom.carModelManualInput!.setAttribute('required', 'required');
    dom.carModelManualInput!.focus();
    return;
  }
  dom.carModelInput!.classList.remove('hidden');
  dom.carModelManualInput!.classList.add('hidden');
  dom.carModelManualInput!.removeAttribute('required');
  dom.carModelManualInput!.value = '';
};

async function createCar(data: CarPayload): Promise<Car> {
  const res = await fetch(`${API_BASE}/cars`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  const json: ApiResponse<Car> = await res.json();
  if (!res.ok) {
    const msg = json.errors ? json.errors.join('. ') : json.message;
    throw new Error(msg);
  }
  return json.data;
}

const handleCarSubmit = async (event: Event): Promise<void> => {
  event.preventDefault();

  const selectedModel = dom.carModelInput!.value.trim();
  const manualModel   = dom.carModelManualInput!.value.trim();
  const modelValue    = selectedModel === 'otro' ? manualModel : selectedModel;

  const payload: CarPayload = {
    brand: dom.carBrandInput!.value.trim(),
    model: modelValue,
    year:  dom.carYearInput!.value.trim(),
  };

  if (!payload.brand || !payload.model || !payload.year) {
    showToast('Por favor completa marca, modelo y año', 'error');
    return;
  }

  dom.carModalSubmitBtn!.disabled = true;
  dom.carModalSubmitBtn!.textContent = 'Registrando...';

  try {
    const createdCar = await createCar(payload);
    cars.unshift(createdCar);
    populateActiveCarSelect(cars);
    if (!activeCarId) setActiveCarId(createdCar.id);
    dom.carModalForm!.reset();
    closeCarModal();
    showToast('Vehículo registrado correctamente', 'success');
  } catch (error: unknown) {
    console.error('[handleCarSubmit]', error);
    showToast((error as Error).message ?? 'Error al registrar el vehículo', 'error');
  } finally {
    dom.carModalSubmitBtn!.disabled = false;
    dom.carModalSubmitBtn!.textContent = 'Registrar vehículo';
  }
};

// ── Refuel CRUD ───────────────────────────────────────────────────────────

async function createRefuel(data: RefuelPayload): Promise<Refuel> {
  const res = await fetch(`${API_BASE}/refuels`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  const json: ApiResponse<Refuel> = await res.json();
  if (!res.ok) {
    const msg = json.errors ? json.errors.join('. ') : json.message;
    throw new Error(msg);
  }
  return json.data;
}

async function updateRefuel(id: number, data: RefuelPayload): Promise<Refuel> {
  const res = await fetch(`${API_BASE}/refuels/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  const json: ApiResponse<Refuel> = await res.json();
  if (!res.ok) {
    const msg = json.errors ? json.errors.join('. ') : json.message;
    throw new Error(msg);
  }
  return json.data;
}

async function deleteRefuel(id: number): Promise<true> {
  const res = await fetch(`${API_BASE}/refuels/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  const json: ApiResponse<unknown> = await res.json();
  if (!res.ok) {
    const msg = json.message ?? 'Error al eliminar el repostaje';
    throw new Error(msg);
  }
  return true;
}

// ── Render ────────────────────────────────────────────────────────────────

function renderAll(data: Refuel[]): void {
  renderStats(data);
  renderChart(data);
  renderTable(data);
  updateSortIndicators();
}

function renderStats(data: Refuel[]): void {
  if (data.length === 0) {
    dom.statAvg!.textContent    = '—';
    dom.statKm!.textContent     = '—';
    dom.statLiters!.textContent = '—';
    dom.statCost!.textContent   = '—';
    return;
  }

  const totals = data.reduce(
    (acc, r) => {
      acc.km          += Number.parseFloat(String(r.km_since_last));
      acc.liters      += Number.parseFloat(String(r.liters_filled));
      acc.sumConsump  += Number.parseFloat(String(r.avg_consumption));
      if (r.price_per_liter) {
        acc.cost += Number.parseFloat(String(r.liters_filled)) * Number.parseFloat(String(r.price_per_liter));
      }
      return acc;
    },
    { km: 0, liters: 0, sumConsump: 0, cost: 0 },
  );

  const avgConsumption = totals.sumConsump / data.length;
  dom.statAvg!.textContent    = avgConsumption.toFixed(2);
  dom.statKm!.textContent     = totals.km.toLocaleString('es-ES', { maximumFractionDigits: 0 });
  dom.statLiters!.textContent = totals.liters.toFixed(1);
  dom.statCost!.textContent   = totals.cost > 0
    ? totals.cost.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '—';
}

const loadProfileStats = (): void => {
  const userName    = getStoredUserDisplay() || 'Usuario';
  const carsCount   = cars.length;
  const refuelsCount = allRefuels.length;
  const totalKm     = allRefuels.reduce((sum, refuel) => sum + Number.parseFloat(String(refuel.km_since_last || 0)), 0);

  syncProfileNameToUi(userName);

  if (dom.profileStatsCars)    dom.profileStatsCars.textContent    = `${carsCount} coche${carsCount === 1 ? '' : 's'}`;
  if (dom.profileStatsRefuels) dom.profileStatsRefuels.textContent = `${refuelsCount} repostaje${refuelsCount === 1 ? '' : 's'}`;
  if (dom.profileStatsKm)      dom.profileStatsKm.textContent      = `${totalKm.toLocaleString('es-ES', { maximumFractionDigits: 0 })} km totales`;
};

const renderProfileCars = (): void => {
  if (!dom.profileCarsList) return;

  if (!cars.length) {
    dom.profileCarsList.innerHTML = `
      <div class="rounded-2xl border border-dashed border-dark-500 bg-dark-800/70 px-5 py-6 text-sm text-ink-muted">
        No tienes coches todavía. Usa el botón de + para registrar tu primer vehículo.
      </div>
    `;
    return;
  }

  dom.profileCarsList.innerHTML = cars.map((car) => `
    <article
      data-car-id="${car.id}"
      class="rounded-2xl border border-dark-600 bg-dark-800 p-5 shadow-lg cursor-pointer transition-all duration-200 hover:border-fuel/70 hover:bg-dark-700/80"
    >
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-ink-faint">${car.brand || 'Marca'}</p>
          <h4 class="mt-2 font-display text-xl font-600 uppercase tracking-wider text-ink">${car.model || 'Modelo'}</h4>
          <p class="mt-2 text-sm text-ink-muted">${car.year || 'Año'} · ${car.plate || 'Sin matrícula'}</p>
        </div>
        <button type="button" data-action="delete-car" data-car-id="${car.id}" class="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-300 transition hover:bg-red-500/20">
          <span class="inline-flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
            Eliminar
          </span>
        </button>
      </div>
      <div class="mt-4 flex flex-wrap gap-2 text-xs text-ink-muted">
        <span class="rounded-full border border-dark-500 px-2.5 py-1">${allRefuels.filter((refuel) => Number(refuel.car_id) === Number(car.id)).length} repostajes</span>
      </div>
    </article>
  `).join('');
};

const handleProfileCarsListClick = async (event: Event): Promise<void> => {
  const target = event.target as Element;
  const button = target.closest<HTMLButtonElement>('[data-action="delete-car"]');

  if (button) {
    event.stopPropagation();
    event.preventDefault();

    const carId = Number(button.dataset.carId);
    if (!Number.isFinite(carId)) return;

    const confirmed = window.confirm('¿Seguro que quieres eliminar este coche?');
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/cars/${carId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (!res.ok) {
        const contentType = res.headers.get('content-type') ?? '';
        let errorMessage = `HTTP ${res.status}`;
        if (contentType.includes('application/json')) {
          const json: ApiResponse<unknown> = await res.json();
          errorMessage = json.message ?? errorMessage;
        }
        throw new Error(errorMessage);
      }

      cars = cars.filter((car) => car.id !== carId);
      populateActiveCarSelect(cars);

      if (activeCarId === carId) activeCarId = cars[0]?.id ?? null;

      if (!activeCarId) {
        if (dom.activeCarSelect) dom.activeCarSelect.value = '';
        renderAll([]);
      } else {
        setActiveCarId(activeCarId, { shouldRender: true });
      }

      loadProfileStats();
      renderProfileCars();
      showToast('Coche eliminado correctamente', 'success');
    } catch (error: unknown) {
      console.error('[handleProfileCarsListClick]', error);
      showToast((error as Error).message ?? 'Error al eliminar el coche', 'error');
    }

    return;
  }

  const card = target.closest<HTMLElement>('[data-car-id]');
  if (!card) return;

  const carId = Number(card.dataset.carId);
  if (!Number.isFinite(carId)) return;

  setActiveCarId(carId, { shouldRender: true });
  showDashboardView();
};

const updateUserProfile = async (username: string): Promise<UserProfile> => {
  const res = await fetch(`${API_BASE}/auth/me`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ username }),
  });

  const contentType = res.headers.get('content-type') ?? '';
  const json: ApiResponse<{ user?: UserProfile } & UserProfile> = contentType.includes('application/json')
    ? await res.json()
    : {};

  if (!res.ok) throw new Error(json.message ?? `HTTP ${res.status}`);

  const payload: UserProfile = (json.data as any)?.user ?? json.data ?? {};
  return payload.username ? payload : { username };
};

const handleEditProfileSubmit = async (event: Event): Promise<void> => {
  event.preventDefault();
  if (!dom.editProfileNameInput) return;

  const updatedName = dom.editProfileNameInput.value.trim();
  if (!updatedName) {
    showToast('El nombre no puede estar vacío', 'error');
    return;
  }

  try {
    const updatedProfile = await updateUserProfile(updatedName);
    syncProfileNameToUi(updatedProfile.username ?? updatedName);
    closeEditProfileModal();
    showToast('Nombre actualizado correctamente', 'success');
  } catch (error: unknown) {
    console.error('[handleEditProfileSubmit]', error);
    showToast((error as Error).message ?? 'No se pudo actualizar el perfil', 'error');
  }
};

// ── Chart ─────────────────────────────────────────────────────────────────

function renderChart(data: Refuel[]): void {
  if (data.length < 2) {
    dom.chartEmpty!.classList.remove('hidden');
    dom.chartContainer!.classList.add('hidden');
    return;
  }

  dom.chartEmpty!.classList.add('hidden');
  dom.chartContainer!.classList.remove('hidden');

  const sorted = [...data].reverse();
  const labels = sorted.map((r) => formatDate(r.refuel_date));
  const values = sorted.map((r) => Number.parseFloat(String(r.avg_consumption)));

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
        backgroundColor: (ctx: any) => {
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
          callbacks: { label: (ctx: any) => ` ${ctx.parsed.y.toFixed(2)} L/100km` },
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
            callback: (v: number) => v.toFixed(1),
          },
          grace: '10%',
        },
      },
    },
  });
}

// ── Table ─────────────────────────────────────────────────────────────────

function renderTable(data: Refuel[]): void {
  if (data.length === 0) {
    showTableState('empty');
    return;
  }

  showTableState('data');
  dom.tableCount!.textContent = `${data.length} registro${data.length !== 1 ? 's' : ''}`;
  dom.tbody!.innerHTML = data.map((r, i) => {
    const consumption = Number.parseFloat(String(r.avg_consumption));
    const totalCost   = r.price_per_liter
      ? (Number.parseFloat(String(r.liters_filled)) * Number.parseFloat(String(r.price_per_liter))).toFixed(2)
      : '—';
    const badgeClass = consumption < 6 ? 'consumption-good'
                     : consumption < 8 ? 'consumption-average'
                     :                   'consumption-bad';
    const delay = Math.min(i * 50, 500);

    return `
      <tr class="table-row-fade border-b border-dark-700 hover:bg-dark-700/40 transition-colors" data-animation-delay="${delay}">
        <td class="px-6 py-4 font-mono text-sm text-ink">${formatDate(r.refuel_date)}</td>
        <td class="px-4 py-4 font-mono text-sm text-right text-ink">${Number.parseFloat(String(r.km_since_last)).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}<span class="text-ink-faint text-xs ml-1">km</span></td>
        <td class="px-4 py-4 font-mono text-sm text-right text-ink">${Number.parseFloat(String(r.liters_filled)).toFixed(3)}<span class="text-ink-faint text-xs ml-1">L</span></td>
        <td class="px-4 py-4 font-mono text-sm text-right text-ink-muted">${r.price_per_liter ? Number.parseFloat(String(r.price_per_liter)).toFixed(3) + ' €' : '—'}</td>
        <td class="px-4 py-4 font-mono text-sm text-right text-ink-muted">${totalCost === '—' ? '—' : totalCost + ' €'}</td>
        <td class="px-4 py-4 text-center"><span class="consumption-badge ${badgeClass}">${consumption.toFixed(2)} L/100</span></td>
        <td class="px-6 py-4 text-sm text-ink-faint max-w-[160px] truncate">${r.notes ?? ''}</td>
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

  dom.tbody!.querySelectorAll<HTMLTableRowElement>('tr.table-row-fade').forEach((row) => {
    const delayValue = row.dataset.animationDelay ?? '0';
    row.style.setProperty('--animation-delay', `${delayValue}ms`);
  });
}

function updateSortIndicators(): void {
  const indicators = document.querySelectorAll<HTMLElement>('[data-sort-field]');
  indicators.forEach((el) => {
    const field = el.getAttribute('data-sort-field');
    el.textContent = field === currentSortField
      ? (currentSortOrder === 'asc' ? '▲' : '▼')
      : '';
  });
}

function filterAndRenderTable(): void {
  const searchTerm = dom.searchNotesInput!.value.toLowerCase().trim();

  let filtered = [...allRefuels];

  if (activeCarId) {
    filtered = filtered.filter((r) => Number(r.car_id) === Number(activeCarId));
  } else {
    filtered = [];
  }

  if (searchTerm !== '') {
    filtered = filtered.filter((r) => (r.notes ?? '').toLowerCase().includes(searchTerm));
  }

  if (currentSortField) {
    filtered = sortArray(filtered, currentSortField, currentSortOrder);
  }

  refuels = filtered;
  renderAll(refuels);
}

function sortArray(data: Refuel[], field: NonNullable<SortField>, order: SortOrder): Refuel[] {
  return [...data].sort((a, b) => {
    let valA: unknown = a[field as keyof Refuel];
    let valB: unknown = b[field as keyof Refuel];

    if (valA === null || typeof valA === 'undefined') valA = '';
    if (valB === null || typeof valB === 'undefined') valB = '';

    if (field === 'refuel_date' || field === 'created_at') {
      const dateA = new Date(String(valA));
      const dateB = new Date(String(valB));
      if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
      if (isNaN(dateA.getTime())) return order === 'asc' ? 1 : -1;
      if (isNaN(dateB.getTime())) return order === 'asc' ? -1 : 1;
      return order === 'asc'
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    }

    const numA = Number(valA);
    const numB = Number(valB);
    if (!isNaN(numA) && !isNaN(numB)) {
      return order === 'asc' ? numA - numB : numB - numA;
    }

    const strA = String(valA).toLowerCase();
    const strB = String(valB).toLowerCase();
    if (strA < strB) return order === 'asc' ? -1 : 1;
    if (strA > strB) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

function sortRefuels(field: NonNullable<SortField>): void {
  if (currentSortField === field) {
    currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    currentSortField = field;
    currentSortOrder = 'asc';
  }
  refuels = sortArray(refuels, field, currentSortOrder);
  renderTable(refuels);
  updateSortIndicators();
}

function calculateAndSortByTotalCost(): void {
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

// ── Table Actions ─────────────────────────────────────────────────────────

function handleTableAction(event: Event): void {
  const button = (event.target as Element).closest<HTMLButtonElement>('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  const id     = button.dataset.id;
  if (!id) return;

  if (action === 'edit')   { enterEditMode(Number(id)); return; }
  if (action === 'delete') { confirmDelete(Number(id)); }
}

function enterEditMode(id: number): void {
  const item = refuels.find((r) => r.id === id);
  if (!item) {
    showToast('No se encontró el repostaje seleccionado', 'error');
    return;
  }

  editModeId = id;
  setActiveCarId(item.car_id, { shouldRender: false });
  dom.dateInput!.value   = String(item.refuel_date);
  dom.kmInput!.value     = String(item.km_since_last);
  dom.litersInput!.value = String(item.liters_filled);
  dom.priceInput!.value  = String(item.price_per_liter ?? '');
  dom.notesInput!.value  = String(item.notes ?? '');
  dom.submitText!.textContent = 'Actualizar repostaje';
  dom.cancelEditBtn!.classList.remove('hidden');
  updateConsumptionPreview();
  showToast('Modo edición activado.', 'success');
}

function confirmDelete(id: number): void {
  const item = refuels.find((r) => r.id === id);
  if (!item) {
    showToast('No se encontró el repostaje seleccionado', 'error');
    return;
  }

  const confirmed = globalThis.confirm(
    `¿Eliminar repostaje del ${formatDate(item.refuel_date)}? Esta acción no se puede deshacer.`,
  );
  if (!confirmed) return;
  performDelete(id);
}

async function performDelete(id: number): Promise<void> {
  try {
    await deleteRefuel(id);
    allRefuels = allRefuels.filter((r) => r.id !== id);
    refuels    = refuels.filter((r) => r.id !== id);
    renderAll(refuels);
    showToast('Repostaje eliminado correctamente', 'success');
    if (editModeId === id) resetForm();
  } catch (error: unknown) {
    console.error('[performDelete]', error);
    showToast((error as Error).message ?? 'Error al eliminar el repostaje', 'error');
  }
}

async function handleSubmit(event: Event): Promise<void> {
  event.preventDefault();

  if (!activeCarId) {
    showToast('Selecciona un coche activo antes de registrar el repostaje', 'error');
    return;
  }

  const payload: RefuelPayload = {
    km_since_last: dom.kmInput!.value,
    liters_filled: dom.litersInput!.value,
    car_id: activeCarId,
  };

  if (dom.dateInput!.value) {
    const dateObj = new Date(dom.dateInput!.value + 'T00:00:00Z');
    payload.refuel_date = dateObj.toISOString().split('T')[0];
  }
  if (dom.priceInput!.value) payload.price_per_liter = dom.priceInput!.value;
  if (dom.notesInput!.value) payload.notes            = dom.notesInput!.value;

  setSubmitLoading(true);

  try {
    if (editModeId !== null) {
      const updated = await updateRefuel(editModeId, payload);
      allRefuels = allRefuels.map((r) => (r.id === updated.id ? updated : r));
      refuels    = refuels.map((r) => (r.id === updated.id ? updated : r));
      renderAll(refuels);
      showToast('Repostaje actualizado correctamente', 'success');
      resetForm();
      return;
    }

    const created = await createRefuel(payload);
    allRefuels.unshift(created);
    refuels.unshift(created);
    renderAll(refuels);
    dom.form!.reset();
    dom.preview!.classList.add('hidden');
    showToast('Repostaje registrado correctamente ✓', 'success');
  } catch (error: unknown) {
    console.error('[handleSubmit]', error);
    showToast((error as Error).message ?? 'Error al registrar el repostaje', 'error');
  } finally {
    setSubmitLoading(false);
  }
}

// ── Form Helpers ──────────────────────────────────────────────────────────

function setTodayAsDefault(): void {
  dom.dateInput!.value = new Date().toISOString().split('T')[0];
}

function updateConsumptionPreview(): void {
  const km     = Number.parseFloat(dom.kmInput!.value);
  const liters = Number.parseFloat(dom.litersInput!.value);

  if (km > 0 && liters > 0) {
    dom.previewValue!.textContent = ((liters / km) * 100).toFixed(2);
    dom.preview!.classList.remove('hidden');
  } else {
    dom.preview!.classList.add('hidden');
  }
}

function resetForm(): void {
  editModeId = null;
  dom.form!.reset();
  setTodayAsDefault();
  dom.preview!.classList.add('hidden');
  dom.submitText!.textContent = 'Registrar repostaje';
  dom.cancelEditBtn!.classList.add('hidden');
}

function formatDate(isoDate: string): string {
  if (!isoDate) return '—';

  let dateObj: Date;
  if (isoDate.includes('T')) {
    dateObj = new Date(isoDate);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    dateObj = new Date(isoDate + 'T00:00:00Z');
  } else {
    dateObj = new Date(isoDate);
  }

  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  return dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function setSubmitLoading(loading: boolean): void {
  dom.submitBtn!.disabled     = loading;
  dom.submitText!.textContent = loading
    ? 'Registrando...'
    : editModeId !== null ? 'Actualizar repostaje' : 'Registrar repostaje';
}

function showTableState(state: TableState): void {
  dom.tableLoading!.classList.toggle('hidden', state !== 'loading');
  dom.tableEmpty!.classList.toggle('hidden',   state !== 'empty');
  dom.tableWrapper!.classList.toggle('hidden', state !== 'data');
}

function setApiStatus(online: boolean): void {
  dom.apiDot!.className = `w-2 h-2 rounded-full ${online ? 'bg-green-500' : 'bg-red-500'}`;
  dom.apiText!.textContent = online ? 'API conectada' : 'API no disponible';
}

function showToast(message: string, type: ToastType = 'success'): void {
  clearTimeout(toastTimeout);
  dom.toastMsg!.textContent = message;
  const isSuccess = type === 'success';
  dom.toast!.className = `fixed bottom-6 right-6 z-50 rounded-xl border px-5 py-4 text-sm max-w-xs shadow-2xl ${
    isSuccess
      ? 'bg-dark-800 border-green-800 text-green-400'
      : 'bg-dark-800 border-red-800 text-red-400'
  }`;
  dom.toast!.classList.add('visible');
  toastTimeout = setTimeout(() => dom.toast!.classList.remove('visible'), 3500);
}

function toDecimalNumber(value: unknown): number | null {
  if (value === null || typeof value === 'undefined') return null;
  const normalized = String(value).trim().replace(',', '.');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

// ── Gas Stations ──────────────────────────────────────────────────────────

function parseStationsPayload(contents: unknown): RawStation[] {
  const raw = String(contents ?? '').trim();
  if (!raw) throw new Error('La respuesta de la API está vacía');

  const jsonText = (() => {
    const firstBrace = raw.indexOf('{');
    const lastBrace  = raw.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) return raw.slice(firstBrace, lastBrace + 1);
    return raw;
  })();

  const parsed = JSON.parse(jsonText) as StationsApiResponse;
  return Array.isArray(parsed?.ListaEESSPrecio)
    ? parsed.ListaEESSPrecio
    : Array.isArray(parsed?.listaEESSPrecio)
      ? parsed.listaEESSPrecio
      : [];
}

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function renderStationsList(stations: GasStation[]): void {
  if (!dom.stationsList) return;

  if (!stations.length) {
    dom.stationsList.innerHTML = `
      <div class="rounded-xl border border-dark-600 bg-dark-800/80 px-4 py-5 text-sm text-ink-muted">
        No se encontraron gasolineras en el radio seleccionado.
      </div>`;
    return;
  }

  const starSvg = (isFavorite: boolean): string =>
    isFavorite
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="#f97316" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 10.26 24 10.35 17.18 16.54 19.34 24.81 12 18.65 4.66 24.81 6.82 16.54 0 10.35 8.91 10.26 12 2"></polygon></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-500"><polygon points="12 2 15.09 10.26 24 10.35 17.18 16.54 19.34 24.81 12 18.65 4.66 24.81 6.82 16.54 0 10.35 8.91 10.26 12 2"></polygon></svg>`;

  dom.stationsList.innerHTML = stations.slice(0, 5).map((station) => `
    <article class="rounded-xl border border-dark-600 bg-dark-800/85 p-4 shadow-lg cursor-pointer hover:border-fuel transition-colors" data-station-id="${station.id}" data-lat="${station.lat}" data-lon="${station.lon}">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1">
          <h3 class="font-display text-lg font-600 uppercase tracking-wider text-ink">${station.name}</h3>
        </div>
        <div class="flex items-center gap-2">
          <button class="p-1 hover:bg-dark-700/50 rounded transition-colors flex items-center justify-center" onclick="toggleFavorite('${station.id}', event)" title="${favoriteStations.includes(station.id) ? 'Quitar de favoritas' : 'Añadir a favoritas'}">
            ${starSvg(favoriteStations.includes(station.id))}
          </button>
          <span class="rounded-full bg-fuel/10 px-2.5 py-1 text-xs font-semibold text-fuel whitespace-nowrap">${station.distanceKm.toFixed(1)} km</span>
        </div>
      </div>
      <p class="mt-3 text-sm text-ink-muted">${station.address}</p>
      <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div class="rounded-lg bg-dark-700/70 px-3 py-2">
          <p class="text-[11px] uppercase tracking-[0.2em] text-ink-faint">Gasolina 95 E5</p>
          <p class="mt-1 font-mono text-fuel">${station.gasolina95 == null ? 'No disponible' : `${station.gasolina95.toFixed(3)} €`}</p>
        </div>
        <div class="rounded-lg bg-dark-700/70 px-3 py-2">
          <p class="text-[11px] uppercase tracking-[0.2em] text-ink-faint">Gasóleo A</p>
          <p class="mt-1 font-mono text-fuel">${station.gasoleoA == null ? 'No disponible' : `${station.gasoleoA.toFixed(3)} €`}</p>
        </div>
      </div>
    </article>
  `).join('');

  dom.stationsList.addEventListener('click', (event: Event) => {
    const article = (event.target as Element).closest<HTMLElement>('article[data-station-id]');
    if (!article || !stationsMap) return;

    const lat       = parseFloat(article.getAttribute('data-lat') ?? '');
    const lon       = parseFloat(article.getAttribute('data-lon') ?? '');
    const stationId = article.getAttribute('data-station-id');

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

    stationsMap.flyTo([lat, lon], 15, { duration: 1.5 });

    markersLayer.eachLayer((marker: any) => {
      const markerLatLng = marker.getLatLng();
      if (Math.abs(markerLatLng.lat - lat) < 0.0001 && Math.abs(markerLatLng.lng - lon) < 0.0001) {
        marker.openPopup();
      }
    });
  });
}

function toggleFavorite(stationId: string, event: MouseEvent): void {
  event.stopPropagation();
  const index = favoriteStations.indexOf(stationId);
  if (index > -1) {
    favoriteStations.splice(index, 1);
  } else {
    favoriteStations.push(stationId);
  }
  localStorage.setItem('fuelTracker_favorites', JSON.stringify(favoriteStations));
  updateMapRadius(Number(dom.radiusSlider?.value ?? 50));
}

function updateMapRadius(km: number): void {
  if (!stationsMap || !userPosition || !markersLayer) return;

  const radiusMeters = Number(km) * 1000;

  if (radiusCircle) {
    stationsMap.removeLayer(radiusCircle);
    radiusCircle = null;
  }

  radiusCircle = L.circle([userPosition.lat, userPosition.lon], {
    radius: radiusMeters,
    color: '#f97316',
    weight: 2,
    dashArray: '8, 8',
    fillColor: '#f97316',
    fillOpacity: 0.08,
  }).addTo(stationsMap);

  markersLayer.clearLayers();

  const sortType = dom.sortStations?.value ?? 'gasolina';

  const filteredStations = allStationsData
    .filter((station) => {
      const withinRadius =
        Number.isFinite(station.lat) &&
        Number.isFinite(station.lon) &&
        station.distanceKm <= Number(km);
      if (showOnlyFavorites) return withinRadius && favoriteStations.includes(station.id);
      return withinRadius;
    })
    .sort((a, b) => {
      if (sortType === 'gasolina') return (a.gasolina95 ?? Number.POSITIVE_INFINITY) - (b.gasolina95 ?? Number.POSITIVE_INFINITY);
      if (sortType === 'gasoil')   return (a.gasoleoA   ?? Number.POSITIVE_INFINITY) - (b.gasoleoA   ?? Number.POSITIVE_INFINITY);
      if (sortType === 'distancia') return a.distanceKm - b.distanceKm;
      return 0;
    });

  filteredStations.forEach((station) => {
    const formatPrice = (value: number | null | undefined): string => {
      if (value == null || value === ('' as unknown)) return 'No disponible';
      return `${Number(value).toFixed(3)} €`;
    };

    const popupText = `
      <strong>${station.name}</strong><br>
      ${station.address}<br>
      <span>Gasolina 95 E5: ${formatPrice(station.gasolina95)}</span><br>
      <span>Gasóleo A: ${formatPrice(station.gasoleoA)}</span>
    `;

    L.marker([station.lat, station.lon]).addTo(markersLayer).bindPopup(popupText);
  });

  renderStationsList(filteredStations);
}

async function initStationsMap(): Promise<void> {
  if (!dom.map) return;

  const defaultCenter: [number, number] = [40.4168, -3.7038];

  if (!stationsMap) {
    stationsMap = L.map('map', { zoomControl: true, attributionControl: false }).setView(defaultCenter, 8);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(stationsMap);

    stationsLayerGroup = L.layerGroup().addTo(stationsMap);
    markersLayer       = L.layerGroup().addTo(stationsMap);
  } else {
    stationsMap.invalidateSize();
  }

  if (!stationsLayerGroup) stationsLayerGroup = L.layerGroup().addTo(stationsMap);
  if (!markersLayer)       markersLayer       = L.layerGroup().addTo(stationsMap);

  stationsLayerGroup.clearLayers();
  markersLayer.clearLayers();
  stationsUserMarker = null;
  stationsData       = [];
  allStationsData    = [];
  userPosition       = null;

  if (radiusCircle) {
    stationsMap.removeLayer(radiusCircle);
    radiusCircle = null;
  }
  renderStationsList([]);

  const onPositionSuccess = async (position: GeolocationPosition): Promise<void> => {
    const userLat = position.coords.latitude;
    const userLon = position.coords.longitude;
    userPosition  = { lat: userLat, lon: userLon };

    stationsMap.setView([userLat, userLon], 11);

    const userIcon = L.divIcon({
      className: 'custom-user-icon',
      html: '<div class="custom-user-marker"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    stationsUserMarker = L.marker([userLat, userLon], { icon: userIcon, title: 'Tú estás aquí' })
      .addTo(stationsLayerGroup)
      .bindPopup('Tú estás aquí')
      .openPopup();

    try {
      if (dom.stationsList) {
        dom.stationsList.innerHTML = `
          <div class="rounded-xl border border-dark-600 bg-dark-800/80 px-4 py-5 text-sm text-ink-muted animate-pulse">
            📡 Buscando gasolineras y precios en tiempo real...
          </div>`;
      }

      const proxyUrl = 'https://corsproxy.io/?https%3A%2F%2Fsedeaplicaciones.minetur.gob.es%2FServiciosRESTCarburantes%2FPreciosCarburantes%2FEstacionesTerrestres%2FFiltroProvincia%2F35';
      const response = await fetch(proxyUrl);
      const data     = await response.json() as StationsApiResponse;
      const stations: RawStation[] = data.ListaEESSPrecio ?? [];

      console.log(
        'Muestra API Gran Canaria (Datos Crudos):',
        stations.find((s) => s['Provincia'] === 'PALMAS (LAS)'),
      );

      stationsData = stations
        .map((station): GasStation | null => {
          const latKey = Object.keys(station).find((k) => k.includes('Latitud'));
          const lonKey = Object.keys(station).find((k) => k.includes('Longitud'));
          if (!latKey || !lonKey) return null;

          const lat = parseFloat(String(station[latKey] ?? '').replace(',', '.').trim());
          const lon = parseFloat(String(station[lonKey] ?? '').replace(',', '.').trim());
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

          const distanceKm = haversineDistanceKm(userLat, userLon, lat, lon);

          const gas95Str = String(station['Precio Gasolina 95 E5'] ?? '').replace(',', '.').trim();
          const gasAStr  = String(station['Precio Gasoleo A']       ?? '').replace(',', '.').trim();

          return {
            id:          station.IDEESS ?? `${station['C.P.'] ?? ''}-${station['Rótulo'] ?? ''}`,
            name:        station['Rótulo'] ?? 'Gasolinera',
            address:     `${station['Dirección'] ?? ''}${station['Localidad'] ? `, ${station['Localidad']}` : ''}`.replace(/^,\s*/, ''),
            lat,
            lon,
            distanceKm,
            gasolina95:  gas95Str !== '' ? parseFloat(gas95Str) : null,
            gasoleoA:    gasAStr  !== '' ? parseFloat(gasAStr)  : null,
          };
        })
        .filter((s): s is GasStation => s !== null)
        .sort((a, b) => {
          const priceA = a.gasolina95 ?? Number.POSITIVE_INFINITY;
          const priceB = b.gasolina95 ?? Number.POSITIVE_INFINITY;
          return priceA - priceB;
        });

      allStationsData = stationsData;
      console.log('1. Total de gasolineras procesadas:', allStationsData.length);

      const enCanarias = allStationsData.filter((s) => s.lat < 30);
      console.log('2. Gasolineras detectadas en Canarias:', enCanarias.length);
      if (enCanarias.length > 0) console.log('3. Muestra canaria:', enCanarias[0]);

      updateMapRadius(Number(dom.radiusSlider?.value ?? 50));
    } catch (error: unknown) {
      console.error('[initStationsMap]', error);
      showToast('No se pudieron cargar las gasolineras cercanas', 'error');
    }
  };

  const onPositionError = (error: GeolocationPositionError): void => {
    console.error('[initStationsMap] geolocation error', error);
    showToast('No se pudo obtener tu ubicación para mostrar gasolineras cercanas', 'error');
  };

  if (!navigator.geolocation) {
    showToast('Tu navegador no soporta geolocalización', 'error');
    return;
  }

  navigator.geolocation.getCurrentPosition(onPositionSuccess, onPositionError, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 600000,
  });
}

// ── Car Modal ─────────────────────────────────────────────────────────────

const openCarModal = (): void => {
  if (!dom.carModal) return;
  dom.carModal.classList.remove('hidden');
  dom.carModal.setAttribute('aria-hidden', 'false');

  dom.carBrandInput!.innerHTML = '<option value="">Cargando marcas...</option>';
  dom.carBrandInput!.disabled  = true;
  dom.carModelInput!.innerHTML = '<option value="">Selecciona una marca primero...</option>';
  dom.carModelInput!.disabled  = true;
  dom.carModelInput!.classList.remove('hidden');
  dom.carModelManualInput!.classList.add('hidden');
  dom.carModelManualInput!.removeAttribute('required');
  dom.carModelManualInput!.value = '';

  fetchCarBrands();
};

const closeCarModal = (): void => {
  if (!dom.carModal) return;
  dom.carModal.classList.add('hidden');
  dom.carModal.setAttribute('aria-hidden', 'true');
  dom.carModalForm!.reset();

  dom.carBrandInput!.innerHTML = '<option value="">Selecciona una marca...</option>';
  dom.carBrandInput!.disabled  = false;
  dom.carModelInput!.innerHTML = '<option value="">Selecciona una marca primero...</option>';
  dom.carModelInput!.disabled  = true;
  dom.carModelInput!.classList.remove('hidden');
  dom.carModelManualInput!.classList.add('hidden');
  dom.carModelManualInput!.removeAttribute('required');
  dom.carModelManualInput!.value = '';
};
