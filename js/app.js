(() => {
  const initializeApp = (config) => firebase.initializeApp(config);
  const getDatabase = () => firebase.database();
  const ref = (db, path = '') => db.ref(path);
  const get = (reference) => reference.get();
  const set = (reference, value) => reference.set(value);
  const update = (reference, value) => reference.update(value);
  const remove = (reference) => reference.remove();
  const onValue = (reference, callback, cancelCallback = null) => reference.on('value', callback, cancelCallback || undefined);
  const getAuth = () => firebase.auth();
  const onAuthStateChanged = (auth, callback) => auth.onAuthStateChanged(callback);
  const signInWithEmailAndPassword = (auth, email, password) => auth.signInWithEmailAndPassword(email, password);
  const createUserWithEmailAndPassword = (auth, email, password) => auth.createUserWithEmailAndPassword(email, password);
  const signOut = (auth) => auth.signOut();

  if (typeof firebase === 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      const status = document.getElementById('statusBox');
      if (status) {
        status.textContent = 'Firebase SDK не загрузился. Проверь подключение к интернету или публикацию файлов на GitHub Pages.';
      }
    });
    return;
  }
  const YEAR = 2026;
  const APP_VERSION = 6;
  const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const MONTHS_SHORT = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
  const PX_PER_DAY = 18;
  const COLLAPSED_MONTH_WIDTH = 40;
  const COLLAPSED_MONTHS_STORAGE_KEY = `vacation_schedule_collapsed_months_${YEAR}`;
  const NORTHWEST_BRANCH_ID = 'branch_northwest';
  const CENTER_BRANCH_ID = 'branch_center';

  const DEFAULT_BRANCHS = [
    { id: NORTHWEST_BRANCH_ID, name: 'Филиал Северо-запад', order: 1, status: 'active' },
    { id: CENTER_BRANCH_ID, name: 'ГСП-Центр', order: 2, status: 'active' }
  ];

  const CENTER_BRANCH_SEED_DEPARTMENTS = [
    'Производственно-технический отдел',
    'Отдел снабжения',
    'Юридический отдел'
  ];

  const EMPLOYEE_COLOR_PALETTE = ['#2d63dd', '#f05a2a', '#4aa2ec', '#59c663', '#ec4dc9', '#8050f2', '#ff1d14', '#5ec56f', '#ef47db', '#efd928', '#41595a', '#09a94c'];

  const LEGACY_DEFAULT_DATA = {
    groups: [],
    vacations: []
  };

  const firebaseConfig = {
    apiKey: "AIzaSyAxIvQmP9dh6pB1EeO9gJvaROlW64DytKc",
    authDomain: "otpuska-55fa5.firebaseapp.com",
    databaseURL: "https://otpuska-55fa5-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "otpuska-55fa5",
    storageBucket: "otpuska-55fa5.firebasestorage.app",
    messagingSenderId: "148454076507",
    appId: "1:148454076507:web:46f7a6182a905e330d8f7e"
  };

  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);
  const auth = getAuth(app);

  const scheduleRef = ref(db, 'scheduleV2');
  const legacyStateRef = ref(db, 'schedule/main');
  const rolesRootRef = ref(db, 'roles');
  const invitesRootRef = ref(db, 'roleInvites');
  const profilesRootRef = ref(db, 'userProfiles');
  const employeeInvitesRootRef = ref(db, 'employeeInvites');
  const employeeAccessRootRef = ref(db, 'employeeAccess');

  const $ = (id) => document.getElementById(id);

  const els = {
    board: $('board'),
    branchBadge: $('branchBadge'),
    months: $('months'),
    namesCol: $('namesCol'),
    timelineCol: $('timelineCol'),
    timelineGrid: $('timelineGrid'),
    timelineGroups: $('timelineGroups'),
    tooltip: $('tooltip'),
    status: $('statusBox'),
    branchFilter: $('branchFilter'),
    groupFilter: $('groupFilter'),
    searchInput: $('searchInput'),
    expandAllMonthsBtn: $('expandAllMonthsBtn'),

    authStatus: $('authStatus'),
    requestAccessBtn: $('requestAccessBtn'),
    loginBtn: $('loginBtn'),
    logoutBtn: $('logoutBtn'),
    manageDepartmentsBtn: $('manageDepartmentsBtn'),
    manageAccessBtn: $('manageAccessBtn'),
    myEmployeesBtn: $('myEmployeesBtn'),
    importCsvBtn: $('importCsvBtn'),
    exportCsvBtn: $('exportCsvBtn'),
    exportExcelBtn: $('exportExcelBtn'),

    addBtn: $('addBtn'),
    resetBtn: $('resetBtn'),
    addEmployeeToolbarBtn: $('addEmployeeToolbarBtn'),
    removeEmployeeToolbarBtn: $('removeEmployeeToolbarBtn'),

    modalBackdrop: $('modalBackdrop'),
    modalTitle: $('modalTitle'),
    vacationId: $('vacationId'),
    employeeSelect: $('employeeSelect'),
    startDate: $('startDate'),
    endDate: $('endDate'),
    vacationColor: $('vacationColor'),
    vacationStatus: $('vacationStatus'),
    comment: $('comment'),
    deleteBtn: $('deleteBtn'),
    closeModalBtn: $('closeModalBtn'),
    saveBtn: $('saveBtn'),

    employeeModalBackdrop: $('employeeModalBackdrop'),
    employeeDepartmentSearch: $('employeeDepartmentSearch'),
    employeeDepartmentSelect: $('employeeDepartmentSelect'),
    suggestDepartmentBtn: $('suggestDepartmentBtn'),
    newEmployeeName: $('newEmployeeName'),
    newEmployeePosition: $('newEmployeePosition'),
    newEmployeeColor: $('newEmployeeColor'),
    employeeColorPicker: $('employeeColorPicker'),
    closeEmployeeModalBtn: $('closeEmployeeModalBtn'),
    saveEmployeeBtn: $('saveEmployeeBtn'),

    removeEmployeeModalBackdrop: $('removeEmployeeModalBackdrop'),
    removeEmployeeGroupSelect: $('removeEmployeeGroupSelect'),
    removeEmployeeSelect: $('removeEmployeeSelect'),
    closeRemoveEmployeeModalBtn: $('closeRemoveEmployeeModalBtn'),
    confirmRemoveEmployeeBtn: $('confirmRemoveEmployeeBtn'),

    authModalBackdrop: $('authModalBackdrop'),
    authFullName: $('authFullName'),
    authEmail: $('authEmail'),
    authPassword: $('authPassword'),
    authError: $('authError'),
    submitLoginBtn: $('submitLoginBtn'),
    submitRegisterBtn: $('submitRegisterBtn'),
    closeAuthModalBtn: $('closeAuthModalBtn'),

    departmentRequestModalBackdrop: $('departmentRequestModalBackdrop'),
    departmentRequestName: $('departmentRequestName'),
    departmentRequestError: $('departmentRequestError'),
    closeDepartmentRequestModalBtn: $('closeDepartmentRequestModalBtn'),
    saveDepartmentRequestBtn: $('saveDepartmentRequestBtn'),

    departmentAdminModalBackdrop: $('departmentAdminModalBackdrop'),
    adminDepartmentBranchSelect: $('adminDepartmentBranchSelect'),
    adminDepartmentName: $('adminDepartmentName'),
    adminDepartmentError: $('adminDepartmentError'),
    departmentList: $('departmentList'),
    departmentRequestsList: $('departmentRequestsList'),
    closeDepartmentAdminModalBtn: $('closeDepartmentAdminModalBtn'),
    addDepartmentDirectBtn: $('addDepartmentDirectBtn'),

    accessAdminModalBackdrop: $('accessAdminModalBackdrop'),
    accessInviteEmail: $('accessInviteEmail'),
    accessInviteDepartments: $('accessInviteDepartments'),
    accessInviteError: $('accessInviteError'),
    accessInviteSaveBtn: $('accessInviteSaveBtn'),
    accessInviteList: $('accessInviteList'),
    accessRequestList: $('accessRequestList'),
    accessRoleList: $('accessRoleList'),
    closeAccessAdminModalBtn: $('closeAccessAdminModalBtn'),

    accessRequestModalBackdrop: $('accessRequestModalBackdrop'),
    accessRequestEmailView: $('accessRequestEmailView'),
    accessRequestNameView: $('accessRequestNameView'),
    accessRequestDepartments: $('accessRequestDepartments'),
    accessRequestComment: $('accessRequestComment'),
    accessRequestError: $('accessRequestError'),
    closeAccessRequestModalBtn: $('closeAccessRequestModalBtn'),
    saveAccessRequestBtn: $('saveAccessRequestBtn'),

    myEmployeesModalBackdrop: $('myEmployeesModalBackdrop'),
    myEmployeesList: $('myEmployeesList'),
    closeMyEmployeesModalBtn: $('closeMyEmployeesModalBtn'),

    helpBtn: $('helpBtn'),
    helpModalBackdrop: $('helpModalBackdrop'),
    closeHelpModalBtn: $('closeHelpModalBtn'),

    importModalBackdrop: $('importModalBackdrop'),
    importFileInput: $('importFileInput'),
    importError: $('importError'),
    closeImportModalBtn: $('closeImportModalBtn'),
    submitImportBtn: $('submitImportBtn'),
    importTemplateBtn: $('importTemplateBtn'),

    toastContainer: $('toastContainer')
  };

  let state = buildEmptyState();
  let collapsedMonths = loadCollapsedMonths();
  let currentUser = null;
  let currentUserProfile = null;
  let currentRoleRecord = null;
  let pendingRegistrationFullName = '';

  let currentRole = 'viewer';
  let currentDepartmentIds = new Set();
  let currentEmployeeId = null;
  let currentEmployeePermission = 'view';
  let adminAccessSnapshot = { roles: {}, roleInvites: {}, accessRequests: {} };
  let initialLoadDone = false;

  function buildEmptyState() {
    return {
      meta: {
        year: YEAR,
        version: APP_VERSION,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      branches: {},
      departments: {},
      employees: {},
      vacations: {},
      departmentRequests: {},
      accessRequests: {}
    };
  }

  function slugify(text) {
    return String(text || '')
      .toLowerCase()
      .trim()
      .replace(/ё/g, 'е')
      .replace(/[^a-zа-я0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'item';
  }

  function normalizeText(text) {
    return String(text || '')
      .toLowerCase()
      .trim()
      .replace(/ё/g, 'е')
      .replace(/\s+/g, ' ');
  }

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function normalizeFullName(name) {
    return String(name || '').trim().replace(/\s+/g, ' ');
  }

  function isLikelyFullName(name) {
    const normalized = normalizeFullName(name);
    if (!normalized) return false;
    return normalized.split(' ').length >= 3;
  }

  function formatEmployeePosition(position) {
    const normalized = String(position || '').trim();
    return normalized ? ` (${normalized})` : '';
  }

  function employeeLabelWithPosition(employee) {
    if (!employee) return 'Сотрудник';
    return `${employee.displayName}${formatEmployeePosition(employee.position)}`;
  }

  function emailKey(email) {
    return normalizeEmail(email).replace(/[^a-z0-9]+/g, '_');
  }

  function makeId(prefix, seed = '') {
    return `${prefix}_${slugify(seed)}_${crypto.randomUUID().slice(0, 8)}`;
  }

  function nowTs() {
    return Date.now();
  }

  function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function hashString(text) {
    return Array.from(String(text || '')).reduce((acc, ch) => ((acc << 5) - acc + ch.charCodeAt(0)) | 0, 0);
  }

  function defaultEmployeeColor(seed) {
    const hash = Math.abs(hashString(seed));
    return EMPLOYEE_COLOR_PALETTE[hash % EMPLOYEE_COLOR_PALETTE.length];
  }

  function ensureEmployeeColors(targetState) {
    Object.values(targetState.employees || {}).forEach(emp => {
      if (!emp) return;
      if (emp.color) return;
      const firstVacation = Object.values(targetState.vacations || {}).find(vac => vac && vac.employeeId === emp.id && vac.color);
      emp.color = firstVacation?.color || defaultEmployeeColor(`${emp.displayName}-${emp.departmentId}`);
    });
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function roleLabel(role) {
    if (role === 'admin') return 'Администратор';
    if (role === 'manager') return 'Руководитель';
    if (role === 'employee') return 'Сотрудник';
    return 'Гость';
  }


  function showToast(message, type = 'success') {
    if (!els.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    els.toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 220);
    }, 2600);
  }

  function csvEscape(value) {
    const str = String(value ?? '');
    if (/[",;\n]/.test(str)) return `"${str.replaceAll('"', '""')}"`;
    return str;
  }

  function downloadBlob(content, filename, mimeType) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function parseCsvText(text) {
    const delimiter = (text.match(/;/g) || []).length > (text.match(/,/g) || []).length ? ';' : ',';
    const rows = [];
    let row = [];
    let value = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i + 1];
      if (char === '"') {
        if (inQuotes && next === '"') {
          value += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        row.push(value);
        value = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && next === '\n') i += 1;
        row.push(value);
        if (row.some(cell => String(cell).trim() !== '')) rows.push(row);
        row = [];
        value = '';
      } else {
        value += char;
      }
    }
    if (value || row.length) {
      row.push(value);
      if (row.some(cell => String(cell).trim() !== '')) rows.push(row);
    }
    if (rows.length === 0) return [];
    const headers = rows[0].map(cell => normalizeText(cell).replace(/\s+/g, '_'));
    return rows.slice(1).map(cols => Object.fromEntries(headers.map((header, idx) => [header, String(cols[idx] || '').trim()])));
  }


function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Не удалось прочитать файл'));
    reader.readAsText(file, 'utf-8');
  });
}

function parseDateString(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parts = raw.replace(/\./g, '-').replace(/\//g, '-').split('-').map(part => part.trim());
  if (parts.length !== 3) return '';
  if (parts[0].length === 4) {
    const [y, m, d] = parts;
    return `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const [d, m, y] = parts;
  return `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function normalizeVacationStatus(status) {
  const value = normalizeText(status);
  if (!value) return 'approved';
  const map = {
    approved: 'approved',
    approve: 'approved',
    согласован: 'approved',
    согласовано: 'approved',
    pending: 'pending',
    awaiting: 'pending',
    'на согласовании': 'pending',
    rejected: 'rejected',
    reject: 'rejected',
    отклонен: 'rejected',
    отклонён: 'rejected',
    cancelled: 'cancelled',
    canceled: 'cancelled',
    отменен: 'cancelled',
    отменён: 'cancelled'
  };
  return map[value] || 'approved';
}

function sanitizeColor(value, fallback = '#2d63dd') {
  const color = String(value || '').trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
}

function ensureBranchForImport(branchName) {
  const normalized = normalizeText(branchName);
  const existing = Object.values(state.branches || {}).find(branch => branch && normalizeText(branch.name) === normalized && branch.status !== 'archived');
  if (existing) return existing;
  const id = makeId('branch', branchName || 'branch');
  return {
    id,
    name: String(branchName || 'Филиал').trim() || 'Филиал',
    status: 'active',
    order: Object.keys(state.branches || {}).length + 1,
    createdAt: nowTs()
  };
}

function ensureDepartmentForImport(departmentName, branchId) {
  const normalized = normalizeText(departmentName);
  const existing = Object.values(state.departments || {}).find(dep => dep && dep.branchId === branchId && normalizeText(dep.name) === normalized && dep.status !== 'archived');
  if (existing) return existing;
  const id = makeId('dep', `${branchId}-${departmentName || 'department'}`);
  return {
    id,
    name: String(departmentName || 'Без отдела').trim() || 'Без отдела',
    branchId,
    status: 'active',
    order: getActiveDepartments(branchId).length + 1,
    createdAt: nowTs()
  };
}

function findEmployeeByNameAndDepartment(displayName, departmentId) {
  const normalized = normalizeText(displayName);
  return getEmployees({ departmentId }).find(emp => normalizeText(emp.displayName) === normalized) || null;
}

function buildExportRows() {
  const rows = [];
  const vacations = Object.values(state.vacations || {}).filter(Boolean).sort((a, b) => a.start.localeCompare(b.start));
  vacations.forEach(vacation => {
    const employee = state.employees?.[vacation.employeeId];
    const department = state.departments?.[vacation.departmentId || employee?.departmentId];
    const branch = state.branches?.[department?.branchId];
    if (!employee || !department || !branch) return;
    rows.push({
      employee_fio: employee.displayName || '',
      department: department.name || '',
      branch: branch.name || '',
      position: employee.position || '',
      employee_color: employee.color || vacation.color || '',
      start: vacation.start || '',
      end: vacation.end || '',
      status: vacation.status || 'approved',
      comment: vacation.comment || ''
    });
  });
  return rows;
}

  function loadCollapsedMonths() {
    try {
      const raw = localStorage.getItem(COLLAPSED_MONTHS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter(Number.isInteger) : [];
    } catch {
      return [];
    }
  }

  function saveCollapsedMonths() {
    try {
      localStorage.setItem(COLLAPSED_MONTHS_STORAGE_KEY, JSON.stringify(collapsedMonths));
    } catch {}
  }

  function ensureSeedStructure(target) {
    target.meta = {
      year: YEAR,
      version: APP_VERSION,
      createdAt: target.meta?.createdAt || nowTs(),
      updatedAt: nowTs()
    };

    target.branches = target.branches || {};
    target.departments = target.departments || {};
    target.employees = target.employees || {};
    target.vacations = target.vacations || {};
    target.departmentRequests = target.departmentRequests || {};
    target.accessRequests = target.accessRequests || {};

    DEFAULT_BRANCHS.forEach(branch => {
      if (!target.branches[branch.id]) {
        target.branches[branch.id] = {
          ...branch,
          createdAt: nowTs()
        };
      }
    });

    CENTER_BRANCH_SEED_DEPARTMENTS.forEach((name, index) => {
      const existing = Object.values(target.departments).find(dep => dep && dep.branchId === CENTER_BRANCH_ID && normalizeText(dep.name) === normalizeText(name));
      if (!existing) {
        const id = `dep_center_${slugify(name)}`;
        target.departments[id] = {
          id,
          name,
          branchId: CENTER_BRANCH_ID,
          status: 'active',
          order: index + 1,
          createdAt: nowTs()
        };
      }
    });

    return target;
  }

  function normalizeSchedulePayload(payload) {
    const next = buildEmptyState();
    if (!payload || typeof payload !== 'object') {
      return ensureSeedStructure(next);
    }

    next.meta = deepCopy(payload.meta || next.meta);
    next.branches = deepCopy(payload.branches || {});
    next.departments = deepCopy(payload.departments || {});
    next.employees = deepCopy(payload.employees || {});
    next.vacations = deepCopy(payload.vacations || {});
    next.departmentRequests = deepCopy(payload.departmentRequests || {});
    next.accessRequests = deepCopy(payload.accessRequests || {});

    Object.entries(next.branches).forEach(([id, branch]) => {
      if (!branch) delete next.branches[id];
      else next.branches[id] = { id, status: 'active', order: 999, ...branch };
    });

    Object.entries(next.departments).forEach(([id, dep]) => {
      if (!dep) delete next.departments[id];
      else next.departments[id] = { id, status: 'active', ...dep };
    });

    Object.entries(next.employees).forEach(([id, emp]) => {
      if (!emp) delete next.employees[id];
      else next.employees[id] = { id, isActive: true, ...emp };
    });

    Object.entries(next.vacations).forEach(([id, vac]) => {
      if (!vac) delete next.vacations[id];
      else next.vacations[id] = { id, status: 'approved', color: '#2d63dd', ...vac };
    });

    Object.entries(next.departmentRequests).forEach(([id, req]) => {
      if (!req) delete next.departmentRequests[id];
      else next.departmentRequests[id] = { id, status: 'pending', ...req };
    });

    Object.entries(next.accessRequests || {}).forEach(([id, req]) => {
      if (!req) delete next.accessRequests[id];
      else next.accessRequests[id] = { id, status: 'pending', requestedDepartmentIds: {}, ...req };
    });

    ensureEmployeeColors(next);
    return ensureSeedStructure(next);
  }


  function hasRealScheduleContent(scheduleState) {
    const employeeCount = Object.keys(scheduleState?.employees || {}).length;
    const vacationCount = Object.keys(scheduleState?.vacations || {}).length;
    const northwestDepartments = Object.values(scheduleState?.departments || {})
      .filter(Boolean)
      .filter(dep => dep.branchId === NORTHWEST_BRANCH_ID && dep.status !== 'archived').length;
    return employeeCount > 0 || vacationCount > 0 || northwestDepartments > 0;
  }

  function migrateLegacyState(legacyState) {
    const next = ensureSeedStructure(buildEmptyState());
    const data = legacyState && Array.isArray(legacyState.groups) ? legacyState : LEGACY_DEFAULT_DATA;
    const employeeMap = new Map();

    (data.groups || []).forEach((group, groupIndex) => {
      const departmentId = makeId('dep', group.name || `Отдел-${groupIndex + 1}`);
      next.departments[departmentId] = {
        id: departmentId,
        name: group.name || `Отдел ${groupIndex + 1}`,
        branchId: NORTHWEST_BRANCH_ID,
        status: 'active',
        order: groupIndex + 1,
        createdAt: nowTs()
      };

      (group.employees || []).forEach((fullName, employeeIndex) => {
        const employeeId = makeId('emp', `${group.name || 'dep'}-${fullName || employeeIndex}`);
        next.employees[employeeId] = {
          id: employeeId,
          displayName: fullName,
          departmentId,
          isActive: true,
          createdAt: nowTs()
        };
        if (!employeeMap.has(fullName)) {
          employeeMap.set(fullName, employeeId);
        }
      });
    });

    (data.vacations || []).forEach((vacation, index) => {
      const employeeId = employeeMap.get(vacation.employee);
      if (!employeeId) return;
      const employee = next.employees[employeeId];
      const vacationId = vacation.id || makeId('vac', `${vacation.employee}-${index}`);
      next.vacations[vacationId] = {
        id: vacationId,
        employeeId,
        departmentId: employee.departmentId,
        start: vacation.start,
        end: vacation.end,
        color: vacation.color || '#2d63dd',
        status: vacation.status || 'approved',
        comment: vacation.comment || '',
        createdAt: nowTs(),
        updatedAt: nowTs()
      };
    });

    return ensureSeedStructure(next);
  }

  function getBranches() {
    return Object.values(state.branches || {})
      .filter(Boolean)
      .filter(branch => branch.status !== 'archived')
      .sort((a, b) => (a.order || 999) - (b.order || 999) || a.name.localeCompare(b.name, 'ru'));
  }

  function getCurrentBranchId() {
    const branches = getBranches();
    const current = els.branchFilter.value;
    const availableIds = branches.map(branch => branch.id);
    if (availableIds.includes(current)) return current;
    return branches[0]?.id || NORTHWEST_BRANCH_ID;
  }

  function getCurrentBranchName() {
    const branchId = getCurrentBranchId();
    return state.branches?.[branchId]?.name || 'Филиал';
  }

  function getActiveDepartments(branchId = getCurrentBranchId()) {
    return Object.values(state.departments || {})
      .filter(Boolean)
      .filter(dep => dep.status !== 'archived')
      .filter(dep => dep.branchId === branchId)
      .sort((a, b) => (a.order || 999) - (b.order || 999) || a.name.localeCompare(b.name, 'ru'));
  }

  function getDepartmentName(departmentId) {
    return state.departments?.[departmentId]?.name || 'Без отдела';
  }

  function getEmployees({ branchId = null, departmentId = null, manageableOnly = false } = {}) {
    return Object.values(state.employees || {})
      .filter(Boolean)
      .filter(emp => emp.isActive !== false)
      .filter(emp => !departmentId || emp.departmentId === departmentId)
      .filter(emp => !branchId || state.departments?.[emp.departmentId]?.branchId === branchId)
      .filter(emp => !manageableOnly || canManageDepartment(emp.departmentId))
      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'ru'));
  }

  function getVacationsForEmployee(employeeId) {
    return Object.values(state.vacations || {})
      .filter(Boolean)
      .filter(vac => vac.employeeId === employeeId)
      .sort((a, b) => a.start.localeCompare(b.start));
  }

  function isAdmin() {
    return currentRole === 'admin';
  }

  function isManager() {
    return currentRole === 'manager';
  }

  function isEmployeeRole() {
    return currentRole === 'employee';
  }

  function canManageDepartment(departmentId) {
    if (isAdmin()) return true;
    return isManager() && currentDepartmentIds.has(departmentId);
  }

  function canEditAnything() {
    return isAdmin() || isManager();
  }

  function canCreateVacation() {
    return canEditAnything() || (isEmployeeRole() && currentEmployeePermission === 'edit' && !!currentEmployeeId);
  }

  function canResetAll() {
    return isAdmin();
  }

  function canManageDepartments() {
    return isAdmin();
  }

  function canManageAccess() {
    return isAdmin();
  }

  function canOpenMyEmployees() {
    return isAdmin() || isManager();
  }

  function canRequestManagerAccess() {
    return !!currentUser && currentRole === 'viewer';
  }

  function canManageVacation(vacation) {
    if (!vacation) return false;
    if (canManageDepartment(vacation.departmentId)) return true;
    return isEmployeeRole() && currentEmployeePermission === 'edit' && vacation.employeeId === currentEmployeeId;
  }

  function canManageEmployee(employee) {
    if (!employee) return false;
    return canManageDepartment(employee.departmentId);
  }

  function getDaysInYear() {
    return 365;
  }

  function daysInMonth(monthIndex) {
    return new Date(YEAR, monthIndex + 1, 0).getDate();
  }

  function isMonthCollapsed(monthIndex) {
    return collapsedMonths.includes(monthIndex);
  }

  function getMonthWidth(monthIndex) {
    return isMonthCollapsed(monthIndex) ? COLLAPSED_MONTH_WIDTH : daysInMonth(monthIndex) * PX_PER_DAY;
  }

  function getMonthOffset(monthIndex) {
    let offset = 0;
    for (let i = 0; i < monthIndex; i++) {
      offset += getMonthWidth(i);
    }
    return offset;
  }

  function dayIndex(dateStr) {
    const d = new Date(`${dateStr}T00:00:00`);
    const start = new Date(`${YEAR}-01-01T00:00:00`);
    return Math.floor((d - start) / 86400000);
  }

  function offsetForDayNumber(dayNumber) {
    const day = Math.min(Math.max(dayNumber, 0), getDaysInYear());
    if (day === getDaysInYear()) {
      return MONTHS.reduce((sum, _, monthIndex) => sum + getMonthWidth(monthIndex), 0);
    }

    const date = new Date(`${YEAR}-01-01T00:00:00`);
    date.setDate(date.getDate() + day);
    return offsetForDate(date.toISOString().slice(0, 10));
  }

  function offsetForDayIndex(dayIndexValue) {
    const date = new Date(`${YEAR}-01-01T00:00:00`);
    date.setDate(date.getDate() + dayIndexValue);
    return offsetForDate(date.toISOString().slice(0, 10));
  }

  function offsetForDate(dateStr) {
    const d = new Date(`${dateStr}T00:00:00`);
    const monthIndex = d.getMonth();
    const day = d.getDate() - 1;
    const baseOffset = getMonthOffset(monthIndex);
    if (isMonthCollapsed(monthIndex)) return baseOffset;
    return baseOffset + day * PX_PER_DAY;
  }

  function durationWidth(startStr, endStr) {
    const start = new Date(`${startStr}T00:00:00`);
    const end = new Date(`${endStr}T00:00:00`);
    let width = 0;
    const cursor = new Date(start);

    while (cursor <= end) {
      const monthIndex = cursor.getMonth();
      if (isMonthCollapsed(monthIndex)) {
        width += COLLAPSED_MONTH_WIDTH;
        const nextMonth = new Date(cursor);
        nextMonth.setMonth(monthIndex + 1, 1);
        nextMonth.setHours(0, 0, 0, 0);
        cursor.setTime(nextMonth.getTime());
      } else {
        width += PX_PER_DAY;
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    return Math.max(width - 2, 8);
  }

  function compactName(full) {
    const parts = String(full).trim().split(/\s+/);
    if (parts.length < 3) return full;
    return `${parts[0]} ${parts[1][0]}.${parts[2][0]}.`;
  }

  function formatTooltip(vacation) {
    const employee = state.employees?.[vacation.employeeId];
    const start = new Date(`${vacation.start}T00:00:00`);
    const end = new Date(`${vacation.end}T00:00:00`);
    const title = compactName(employee?.displayName || 'Сотрудник');
    const status = vacation.status && vacation.status !== 'approved' ? ` · ${vacationStatusLabel(vacation.status)}` : '';
    const comment = vacation.comment ? ` · ${vacation.comment}` : '';
    return `${title} ${MONTHS_SHORT[start.getMonth()]} ${start.getDate()}-${MONTHS_SHORT[end.getMonth()]} ${end.getDate()}${status}${comment}`;
  }

  function vacationStatusLabel(status) {
    if (status === 'pending') return 'на согласовании';
    if (status === 'rejected') return 'отклонен';
    if (status === 'cancelled') return 'отменен';
    return 'согласован';
  }

  async function loadStateFromCloud() {
    const scheduleResult = await get(scheduleRef).then(snapshot => ({ ok: true, snapshot })).catch(error => ({ ok: false, error }));
    const legacyResult = await get(legacyStateRef).then(snapshot => ({ ok: true, snapshot })).catch(error => ({ ok: false, error }));

    try {
      const hasLegacy = legacyResult.ok && legacyResult.snapshot.exists() && Array.isArray(legacyResult.snapshot.val()?.groups) && legacyResult.snapshot.val().groups.length > 0;

      if (scheduleResult.ok && scheduleResult.snapshot.exists()) {
        const normalized = normalizeSchedulePayload(scheduleResult.snapshot.val());
        if (hasRealScheduleContent(normalized) || !hasLegacy) {
          state = normalized;
          initialLoadDone = true;
          return;
        }
      }

      if (hasLegacy) {
        state = migrateLegacyState(legacyResult.snapshot.val());
        initialLoadDone = true;
        return;
      }

      if (!scheduleResult.ok) {
        console.error('Ошибка загрузки scheduleV2:', scheduleResult.error);
      }
      if (!legacyResult.ok) {
        console.error('Ошибка загрузки legacy schedule:', legacyResult.error);
      }

      state = ensureSeedStructure(buildEmptyState());
      initialLoadDone = true;
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      state = ensureSeedStructure(buildEmptyState());
      initialLoadDone = true;
    }
  }

  async function ensureScheduleInitialized() {
    if (!isAdmin()) return;
    try {
      const [snapshot, legacySnapshot] = await Promise.all([get(scheduleRef), get(legacyStateRef)]);
      const hasLegacy = legacySnapshot.exists() && Array.isArray(legacySnapshot.val()?.groups) && legacySnapshot.val().groups.length > 0;

      if (!snapshot.exists()) {
        await set(scheduleRef, normalizeSchedulePayload(state));
        return;
      }

      const normalized = normalizeSchedulePayload(snapshot.val());
      if (!hasRealScheduleContent(normalized) && hasLegacy) {
        const migrated = migrateLegacyState(legacySnapshot.val());
        await set(scheduleRef, migrated);
      }
    } catch (error) {
      console.error('Ошибка инициализации scheduleV2:', error);
    }
  }

  function subscribeToCloudUpdates() {
    onValue(scheduleRef, (snapshot) => {
      if (!snapshot.exists()) return;
      state = normalizeSchedulePayload(snapshot.val());
      createMonthsHeader();
      renderFilters();
      renderBoard();
      if (els.departmentAdminModalBackdrop.classList.contains('open')) {
        renderDepartmentAdminModal();
      }
      if (els.accessAdminModalBackdrop.classList.contains('open')) {
        loadAdminAccessData().then(renderAccessAdminModal).catch(console.error);
      }
      if (els.myEmployeesModalBackdrop.classList.contains('open')) {
        renderMyEmployeesModal().catch(console.error);
      }
    }, (error) => {
      console.error('Ошибка подписки на scheduleV2:', error);
      const message = currentUser ? 'Не удалось обновить данные из Firebase.' : 'Данные для гостя недоступны. Войдите в систему или откройте чтение scheduleV2 в Firebase Rules.';
      if (els.status) {
        els.status.textContent = message;
      }
    });
  }

  async function loadMyRole(uid) {
    try {
      const snapshot = await get(ref(db, `roles/${uid}`));
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Ошибка загрузки роли:', error);
      return null;
    }
  }

  async function tryBootstrapFirstAdmin(user) {
    try {
      await set(ref(db, `roles/${user.uid}`), {
        role: 'admin',
        email: normalizeEmail(user.email || ''),
        departmentIds: {},
        fullName: pendingRegistrationFullName || '',
        grantedAt: nowTs(),
        grantedBy: user.uid,
        source: 'bootstrap'
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async function tryApplyInviteRole(user) {
    if (!user?.email) return false;
    const key = emailKey(user.email);
    try {
      const inviteSnapshot = await get(ref(db, `roleInvites/${key}`));
      if (!inviteSnapshot.exists()) return false;
      const invite = inviteSnapshot.val();
      if (!invite || invite.isActive === false) return false;

      await set(ref(db, `roles/${user.uid}`), {
        role: invite.role || 'manager',
        email: normalizeEmail(user.email),
        departmentIds: invite.departmentIds || {},
        fullName: invite.fullName || pendingRegistrationFullName || '',
        inviteKey: key,
        grantedAt: nowTs(),
        grantedBy: invite.createdBy || 'admin',
        source: 'invite'
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async function loadCurrentUserProfile(uid) {
    try {
      const snapshot = await get(ref(db, `userProfiles/${uid}`));
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
      return null;
    }
  }

  async function ensureUserProfile(user, preferredFullName = '') {
    if (!user?.uid) return null;
    const existing = await loadCurrentUserProfile(user.uid);
    const fullName = normalizeFullName(preferredFullName || existing?.fullName || currentRoleRecord?.fullName || '');
    const payload = {
      ...(existing || {}),
      uid: user.uid,
      email: normalizeEmail(user.email || existing?.email || ''),
      fullName,
      updatedAt: nowTs(),
      lastLoginAt: nowTs(),
      createdAt: existing?.createdAt || nowTs()
    };
    try {
      await set(ref(db, `userProfiles/${user.uid}`), payload);
      currentUserProfile = payload;
      return payload;
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error);
      currentUserProfile = payload;
      return payload;
    }
  }

  async function findUserProfileByEmail(email) {
    const normalized = normalizeEmail(email);
    if (!normalized) return null;
    try {
      const snapshot = await get(profilesRootRef);
      if (!snapshot.exists()) return null;
      const profiles = snapshot.val() || {};
      return Object.values(profiles).find(profile => normalizeEmail(profile?.email) === normalized) || null;
    } catch (error) {
      console.error('Ошибка поиска профиля по email:', error);
      return null;
    }
  }

  async function tryApplyEmployeeInvite(user) {
    if (!user?.email) return false;
    const key = emailKey(user.email);
    try {
      const inviteSnapshot = await get(ref(db, `employeeInvites/${key}`));
      if (!inviteSnapshot.exists()) return false;
      const invite = inviteSnapshot.val();
      if (!invite || invite.isActive === false || !invite.employeeId) return false;

      await set(ref(db, `roles/${user.uid}`), {
        role: 'employee',
        email: normalizeEmail(user.email),
        fullName: currentUserProfile?.fullName || pendingRegistrationFullName || '',
        employeeId: invite.employeeId,
        departmentIds: invite.departmentId ? { [invite.departmentId]: true } : {},
        permission: invite.permission || 'view',
        inviteKey: key,
        grantedAt: nowTs(),
        grantedBy: invite.grantedBy || invite.createdBy || 'manager',
        source: 'employee_invite'
      });
      return true;
    } catch (error) {
      console.error('Ошибка применения прав сотрудника:', error);
      return false;
    }
  }

  async function resolveCurrentRole(user) {
    if (!user) return null;

    let roleRecord = await loadMyRole(user.uid);
    if (roleRecord) return roleRecord;

    const bootstrapped = await tryBootstrapFirstAdmin(user);
    if (bootstrapped) {
      roleRecord = await loadMyRole(user.uid);
      if (roleRecord) return roleRecord;
    }

    const invited = await tryApplyInviteRole(user);
    if (invited) {
      roleRecord = await loadMyRole(user.uid);
      if (roleRecord) return roleRecord;
    }

    const employeeInvited = await tryApplyEmployeeInvite(user);
    if (employeeInvited) {
      roleRecord = await loadMyRole(user.uid);
      if (roleRecord) return roleRecord;
    }

    return null;
  }

  function applyRoleRecord(roleRecord) {
    currentRoleRecord = roleRecord;
    currentRole = roleRecord?.role || 'viewer';
    currentDepartmentIds = new Set(Object.keys(roleRecord?.departmentIds || {}).filter(id => roleRecord.departmentIds[id] === true));
    currentEmployeeId = roleRecord?.employeeId || null;
    currentEmployeePermission = roleRecord?.permission || 'view';
  }

  function showTooltip(event, text) {
    els.tooltip.textContent = text;
    els.tooltip.classList.add('visible');
    moveTooltip(event);
  }

  function moveTooltip(event) {
    els.tooltip.style.left = `${event.clientX + 14}px`;
    els.tooltip.style.top = `${event.clientY - 28}px`;
  }

  function hideTooltip() {
    els.tooltip.classList.remove('visible');
  }

  function syncVacationColorToSelectedEmployee(force = false) {
    const employee = state.employees?.[els.employeeSelect.value];
    if (!employee?.color) return;
    if (force || !els.vacationId.value) {
      els.vacationColor.value = employee.color;
    }
  }

  function openEmployeeColorPicker(employeeId) {
    const employee = state.employees?.[employeeId];
    if (!employee || !canManageEmployee(employee)) return;
    els.employeeColorPicker.value = employee.color || defaultEmployeeColor(employee.displayName);
    els.employeeColorPicker.onchange = async () => {
      const nextColor = els.employeeColorPicker.value;
      const updates = {
        [`scheduleV2/employees/${employeeId}/color`]: nextColor,
        [`scheduleV2/employees/${employeeId}/updatedAt`]: nowTs(),
        [`scheduleV2/employees/${employeeId}/updatedBy`]: currentUser?.uid || 'unknown'
      };

      Object.values(state.vacations || {}).forEach(vacation => {
        if (vacation && vacation.employeeId === employeeId) {
          updates[`scheduleV2/vacations/${vacation.id}/color`] = nextColor;
          updates[`scheduleV2/vacations/${vacation.id}/updatedAt`] = nowTs();
          updates[`scheduleV2/vacations/${vacation.id}/updatedBy`] = currentUser?.uid || 'unknown';
        }
      });

      try {
        await update(ref(db), updates);
      } catch (error) {
        console.error('Ошибка обновления цвета сотрудника:', error);
        alert('Не удалось обновить цвет сотрудника');
      } finally {
        els.employeeColorPicker.value = '#2d63dd';
      }
    };
    els.employeeColorPicker.click();
  }

  function createMonthsHeader() {
    els.months.innerHTML = '';
    let totalWidth = 0;

    MONTHS.forEach((name, monthIndex) => {
      const days = daysInMonth(monthIndex);
      const collapsed = isMonthCollapsed(monthIndex);
      const width = getMonthWidth(monthIndex);
      totalWidth += width;

      const month = document.createElement('div');
      month.className = `month ${collapsed ? 'collapsed' : ''}`;
      month.style.width = `${width}px`;
      month.style.minWidth = `${width}px`;

      if (collapsed) {
        month.innerHTML = `<button class="month-collapse-pill" type="button" data-month="${monthIndex}" title="Развернуть ${name}"><span>${name}</span></button>`;
      } else {
        month.innerHTML = `
          <div class="month-head">
            <div class="month-name">${name}</div>
            <button class="month-toggle-btn" type="button" data-month="${monthIndex}" title="Свернуть ${name}">×</button>
          </div>
          <div class="days" style="grid-template-columns: repeat(${days}, minmax(0, 1fr));">
            ${Array.from({ length: days }, (_, i) => `<div class="day">${i + 1}</div>`).join('')}
          </div>
        `;
      }

      els.months.appendChild(month);
    });

    els.board.style.minWidth = `calc(var(--left-w) + ${totalWidth}px)`;
    els.timelineCol.style.width = `${totalWidth}px`;
    els.timelineCol.style.minWidth = `${totalWidth}px`;

    renderMonthSeparators();

    els.months.querySelectorAll('.month-toggle-btn, .month-collapse-pill').forEach(btn => {
      btn.addEventListener('click', () => toggleMonth(Number(btn.dataset.month)));
    });
  }

  function renderMonthSeparators() {
    els.timelineGrid.innerHTML = '';
    let offset = 0;
    for (let i = 0; i < MONTHS.length - 1; i++) {
      offset += getMonthWidth(i);
      const line = document.createElement('div');
      line.className = 'month-separator';
      line.style.left = `${offset}px`;
      els.timelineGrid.appendChild(line);
    }
  }

  function toggleMonth(monthIndex) {
    if (collapsedMonths.includes(monthIndex)) {
      collapsedMonths = collapsedMonths.filter(item => item !== monthIndex);
    } else {
      collapsedMonths = [...collapsedMonths, monthIndex].sort((a, b) => a - b);
    }
    saveCollapsedMonths();
    createMonthsHeader();
    renderBoard();
  }

  function expandAllMonths() {
    collapsedMonths = [];
    saveCollapsedMonths();
    createMonthsHeader();
    renderBoard();
  }

  function renderBranchFilter() {
    const branches = getBranches();
    const previous = els.branchFilter.value;
    els.branchFilter.innerHTML = branches.map(branch => `<option value="${escapeHtml(branch.id)}">${escapeHtml(branch.name)}</option>`).join('');
    const values = branches.map(branch => branch.id);
    els.branchFilter.value = values.includes(previous) ? previous : (branches[0]?.id || NORTHWEST_BRANCH_ID);
    els.branchBadge.textContent = getCurrentBranchName();

    els.adminDepartmentBranchSelect.innerHTML = branches.map(branch => `<option value="${escapeHtml(branch.id)}">${escapeHtml(branch.name)}</option>`).join('');
    els.adminDepartmentBranchSelect.value = getCurrentBranchId();
  }

  function renderDepartmentFilter() {
    const currentBranchId = getCurrentBranchId();
    const previous = els.groupFilter.value || 'all';
    const departments = getActiveDepartments(currentBranchId);
    els.groupFilter.innerHTML = `<option value="all">Все отделы</option>${departments.map(dep => `<option value="${escapeHtml(dep.id)}">${escapeHtml(dep.name)}</option>`).join('')}`;
    const values = ['all', ...departments.map(dep => dep.id)];
    els.groupFilter.value = values.includes(previous) ? previous : 'all';
  }

  function renderVacationEmployeeOptions() {
    const branchId = getCurrentBranchId();
    let employees = [];
    if (canEditAnything()) {
      employees = getEmployees({ branchId }).filter(emp => canManageEmployee(emp));
    } else if (isEmployeeRole() && currentEmployeeId && state.employees?.[currentEmployeeId]) {
      employees = [state.employees[currentEmployeeId]];
    }
    if (employees.length === 0) {
      els.employeeSelect.innerHTML = '<option value="">Нет доступных сотрудников</option>';
      return;
    }
    els.employeeSelect.innerHTML = employees.map(emp => `<option value="${escapeHtml(emp.id)}">${escapeHtml(employeeLabelWithPosition(emp))} — ${escapeHtml(getDepartmentName(emp.departmentId))}</option>`).join('');
  }

  function renderEmployeeDepartmentOptions() {
    const query = normalizeText(els.employeeDepartmentSearch.value);
    const departments = getActiveDepartments(getCurrentBranchId()).filter(dep => canManageDepartment(dep.id));
    const filtered = departments.filter(dep => !query || normalizeText(dep.name).includes(query));

    if (filtered.length === 0) {
      els.employeeDepartmentSelect.innerHTML = '<option value="">Отдел не найден</option>';
      return;
    }

    els.employeeDepartmentSelect.innerHTML = filtered.map(dep => `<option value="${escapeHtml(dep.id)}">${escapeHtml(dep.name)}</option>`).join('');
  }

  function renderRemoveEmployeeDepartmentOptions() {
    const previous = els.removeEmployeeGroupSelect.value;
    const departments = getActiveDepartments(getCurrentBranchId()).filter(dep => canManageDepartment(dep.id));
    if (departments.length === 0) {
      els.removeEmployeeGroupSelect.innerHTML = '<option value="">Нет доступных отделов</option>';
      els.removeEmployeeSelect.innerHTML = '<option value="">Нет сотрудников</option>';
      return;
    }

    els.removeEmployeeGroupSelect.innerHTML = departments.map(dep => `<option value="${escapeHtml(dep.id)}">${escapeHtml(dep.name)}</option>`).join('');
    const values = departments.map(dep => dep.id);
    els.removeEmployeeGroupSelect.value = values.includes(previous) ? previous : departments[0].id;
    refreshRemoveEmployeeSelect();
  }

  function refreshRemoveEmployeeSelect() {
    const departmentId = els.removeEmployeeGroupSelect.value;
    const employees = getEmployees({ departmentId }).filter(emp => canManageEmployee(emp));
    if (employees.length === 0) {
      els.removeEmployeeSelect.innerHTML = '<option value="">Нет сотрудников</option>';
      return;
    }
    els.removeEmployeeSelect.innerHTML = employees.map(emp => `<option value="${escapeHtml(emp.id)}">${escapeHtml(employeeLabelWithPosition(emp))}</option>`).join('');
  }

  function getFilteredGroups() {
    const branchId = getCurrentBranchId();
    const selectedDepartment = els.groupFilter.value || 'all';
    const query = normalizeText(els.searchInput.value);

    return getActiveDepartments(branchId)
      .filter(dep => selectedDepartment === 'all' || dep.id === selectedDepartment)
      .map(dep => ({
        department: dep,
        employees: getEmployees({ departmentId: dep.id }).filter(emp => {
          if (isEmployeeRole() && currentEmployeeId) return emp.id === currentEmployeeId;
          return !query || normalizeText(emp.displayName).includes(query);
        }).filter(emp => !query || normalizeText(emp.displayName).includes(query))
      }))
      .filter(group => group.employees.length > 0);
  }

  function renderFilters() {
    renderBranchFilter();
    renderDepartmentFilter();
    renderVacationEmployeeOptions();
    renderEmployeeDepartmentOptions();
    renderRemoveEmployeeDepartmentOptions();
  }

  function renderBoard() {
    const groups = getFilteredGroups();
    els.namesCol.innerHTML = '';
    els.timelineGroups.innerHTML = '';
    els.branchBadge.textContent = getCurrentBranchName();

    let visibleEmployees = 0;
    let visibleVacations = 0;

    if (groups.length === 0) {
      const hasAnyEmployees = Object.keys(state.employees || {}).length > 0;
      els.namesCol.innerHTML = `<div class="empty-state">${hasAnyEmployees ? 'Нет сотрудников для отображения' : 'Сотрудники пока не добавлены'}</div>`;
      els.timelineGroups.innerHTML = `<div class="empty-state">${hasAnyEmployees ? 'Выберите другой филиал, отдел или очистите поиск' : 'Добавьте сотрудников или проверьте подключение к Firebase'}</div>`;
    }

    groups.forEach(group => {
      const namesGroup = document.createElement('div');
      namesGroup.className = 'group';

      const timelineGroup = document.createElement('div');
      timelineGroup.className = 'group';

      const bodyNames = document.createElement('div');
      bodyNames.className = 'group-body';

      const bodyTimeline = document.createElement('div');
      bodyTimeline.className = 'group-body';

      namesGroup.innerHTML = `<div class="group-title">${escapeHtml(group.department.name)}</div>`;
      timelineGroup.innerHTML = `<div class="group-title ghost-title">${escapeHtml(group.department.name)}</div>`;

      group.employees.forEach(employee => {
        visibleEmployees += 1;

        const rowName = document.createElement('div');
        rowName.className = 'employee-row-name';
        rowName.innerHTML = `
          <span class="employee-name-wrap">
            <span class="employee-name-text">${escapeHtml(employee.displayName)}</span>
            ${employee.position ? `<span class="employee-position-text">(${escapeHtml(employee.position)})</span>` : ''}
          </span>
          <button type="button" class="employee-color-dot ${canManageEmployee(employee) ? 'is-editable' : ''}" data-employee-id="${escapeHtml(employee.id)}" title="${canManageEmployee(employee) ? 'Изменить закрепленный цвет сотрудника' : 'Закрепленный цвет сотрудника'}" style="--employee-color:${escapeHtml(employee.color || defaultEmployeeColor(employee.displayName))}"></button>
        `;
        bodyNames.appendChild(rowName);

        const rowTimeline = document.createElement('div');
        rowTimeline.className = 'vacation-row';

        const vacations = getVacationsForEmployee(employee.id);
        visibleVacations += vacations.length;

        vacations.forEach(vac => {
          const bar = document.createElement('div');
          bar.className = 'vacation-bar';
          if (vac.status && vac.status !== 'approved') {
            bar.classList.add(`status-${vac.status}`);
          }
          bar.style.left = `${offsetForDate(vac.start)}px`;
          bar.style.width = `${durationWidth(vac.start, vac.end)}px`;
          bar.style.background = vac.color || '#2d63dd';
          bar.dataset.tip = formatTooltip(vac);

          bar.addEventListener('mouseenter', e => showTooltip(e, bar.dataset.tip));
          bar.addEventListener('mousemove', moveTooltip);
          bar.addEventListener('mouseleave', hideTooltip);
          bar.addEventListener('dblclick', () => {
            if (!canManageVacation(vac)) return;
            openVacationModal(vac);
          });
          rowTimeline.appendChild(bar);
        });

        bodyTimeline.appendChild(rowTimeline);
      });

      addDepartmentOverlapLines(group.employees, bodyTimeline);
      namesGroup.appendChild(bodyNames);
      timelineGroup.appendChild(bodyTimeline);

      els.namesCol.appendChild(namesGroup);
      els.timelineGroups.appendChild(timelineGroup);
    });

    els.namesCol.querySelectorAll('.employee-color-dot.is-editable').forEach(btn => {
      btn.onclick = event => {
        event.stopPropagation();
        openEmployeeColorPicker(btn.dataset.employeeId);
      };
    });

    const hint = canEditAnything() ? 'Двойной клик по полоске — редактирование доступного отпуска' : 'Для редактирования войдите как руководитель';
    els.status.textContent = `Филиал: ${getCurrentBranchName()} · Сотрудников: ${visibleEmployees} · Отпусков: ${visibleVacations} · ${hint}`;
  }


function addDepartmentOverlapLines(employees, bodyTimeline) {
  const employeeIds = employees.map(emp => emp.id);
  if (employeeIds.length < 2) return;

  const vacationsByEmployee = Object.fromEntries(employeeIds.map(employeeId => [employeeId, getVacationsForEmployee(employeeId)]));
  const pairSegments = [];

  for (let i = 0; i < employeeIds.length; i++) {
    for (let j = i + 1; j < employeeIds.length; j++) {
      const firstId = employeeIds[i];
      const secondId = employeeIds[j];
      const firstVacations = vacationsByEmployee[firstId] || [];
      const secondVacations = vacationsByEmployee[secondId] || [];

      firstVacations.forEach(firstVac => {
        secondVacations.forEach(secondVac => {
          const start = firstVac.start > secondVac.start ? firstVac.start : secondVac.start;
          const end = firstVac.end < secondVac.end ? firstVac.end : secondVac.end;
          if (start > end) return;
          pairSegments.push({
            start,
            end,
            startDay: dayIndex(start),
            endDay: dayIndex(end),
            firstId,
            secondId
          });
        });
      });
    }
  }

  if (pairSegments.length === 0) return;

  pairSegments
    .sort((a, b) => a.startDay - b.startDay || a.endDay - b.endDay || a.firstId.localeCompare(b.firstId) || a.secondId.localeCompare(b.secondId))
    .forEach((segment, index) => {
      const lane = index % 4;
      const startLeft = offsetForDate(segment.start);
      const endLeft = offsetForDate(segment.end) + Math.max(PX_PER_DAY - 2, 8);
      const topOffset = 6 + lane * 18;
      const visibleDays = segment.endDay - segment.startDay + 1;

      const startLine = document.createElement('div');
      startLine.className = 'overlap-line overlap-line-start';
      startLine.style.left = `${startLeft}px`;
      startLine.style.top = `${topOffset}px`;
      startLine.style.bottom = '10px';
      bodyTimeline.appendChild(startLine);

      const endLine = document.createElement('div');
      endLine.className = 'overlap-line overlap-line-end';
      endLine.style.left = `${endLeft}px`;
      endLine.style.top = `${topOffset}px`;
      endLine.style.bottom = '10px';
      bodyTimeline.appendChild(endLine);

      const label = document.createElement('div');
      label.className = 'overlap-label';
      label.style.left = `${Math.max(startLeft + 8, (startLeft + endLeft) / 2)}px`;
      label.style.top = `${topOffset}px`;
      label.textContent = `${visibleDays} дн.`;
      bodyTimeline.appendChild(label);
    });
}

function updateAuthUI() {
    if (currentUser) {
      const email = currentUser.email ? ` · ${currentUser.email}` : '';
      els.authStatus.textContent = `${roleLabel(currentRole)}${email}`;
    } else {
      els.authStatus.textContent = 'Гость';
    }

    els.requestAccessBtn.hidden = !canRequestManagerAccess();
    els.loginBtn.hidden = !!currentUser;
    els.logoutBtn.hidden = !currentUser;
    els.addBtn.hidden = !canCreateVacation();
    els.resetBtn.hidden = !canResetAll();
    els.addEmployeeToolbarBtn.hidden = !canEditAnything();
    els.removeEmployeeToolbarBtn.hidden = !canEditAnything();
    els.manageDepartmentsBtn.hidden = !canManageDepartments();
    els.manageAccessBtn.hidden = !canManageAccess();
    els.myEmployeesBtn.hidden = !canOpenMyEmployees();
    els.importCsvBtn.hidden = !canEditAnything();
    els.exportCsvBtn.hidden = !canEditAnything();
    els.exportExcelBtn.hidden = !canEditAnything();
  }

  function openVacationModal(vacation = null) {
    if (!canCreateVacation()) return;
    renderVacationEmployeeOptions();
    els.modalBackdrop.classList.add('open');

    if (vacation) {
      els.modalTitle.textContent = 'Редактировать отпуск';
      els.vacationId.value = vacation.id;
      els.employeeSelect.value = vacation.employeeId;
      els.startDate.value = vacation.start;
      els.endDate.value = vacation.end;
      els.vacationColor.value = state.employees?.[vacation.employeeId]?.color || vacation.color || '#2d63dd';
      els.vacationStatus.value = vacation.status || 'approved';
      els.comment.value = vacation.comment || '';
      els.deleteBtn.hidden = false;
    } else {
      els.modalTitle.textContent = 'Добавить отпуск';
      els.vacationId.value = '';
      els.employeeSelect.selectedIndex = 0;
      els.startDate.value = `${YEAR}-01-15`;
      els.endDate.value = `${YEAR}-01-28`;
      els.vacationColor.value = state.employees?.[els.employeeSelect.value]?.color || '#2d63dd';
      els.vacationStatus.value = 'approved';
      els.comment.value = '';
      els.deleteBtn.hidden = true;
    }
  }

  function closeVacationModal() {
    els.modalBackdrop.classList.remove('open');
  }

  function openEmployeeModal() {
    if (!canEditAnything()) return;
    renderEmployeeDepartmentOptions();
    els.employeeDepartmentSearch.value = '';
    els.newEmployeeName.value = '';
    els.newEmployeePosition.value = '';
    els.newEmployeeColor.value = defaultEmployeeColor(`${getCurrentBranchId()}-${nowTs()}`);
    els.employeeModalBackdrop.classList.add('open');
  }

  function closeEmployeeModal() {
    els.employeeModalBackdrop.classList.remove('open');
  }

  function openRemoveEmployeeModal() {
    if (!canEditAnything()) return;
    renderRemoveEmployeeDepartmentOptions();
    els.removeEmployeeModalBackdrop.classList.add('open');
  }

  function closeRemoveEmployeeModal() {
    els.removeEmployeeModalBackdrop.classList.remove('open');
  }

  function openAuthModal() {
    els.authError.textContent = '';
    els.authPassword.value = '';
    if (!currentUser) {
      els.authFullName.value = currentUserProfile?.fullName || '';
      els.authEmail.value = currentUser?.email || '';
    }
    els.authModalBackdrop.classList.add('open');
  }

  function closeAuthModal() {
    els.authModalBackdrop.classList.remove('open');
  }

  function openDepartmentRequestModal() {
    if (!currentUser) {
      openAuthModal();
      return;
    }
    els.departmentRequestName.value = '';
    els.departmentRequestError.textContent = '';
    els.departmentRequestModalBackdrop.classList.add('open');
  }

  function closeDepartmentRequestModal() {
    els.departmentRequestModalBackdrop.classList.remove('open');
  }

  async function loadAdminAccessData() {
    if (!isAdmin()) return;
    const [rolesSnapshot, invitesSnapshot, accessRequestsSnapshot] = await Promise.all([get(rolesRootRef), get(invitesRootRef), get(ref(db, 'accessRequests'))]);
    adminAccessSnapshot = {
      roles: rolesSnapshot.exists() ? rolesSnapshot.val() : {},
      roleInvites: invitesSnapshot.exists() ? invitesSnapshot.val() : {},
      accessRequests: accessRequestsSnapshot.exists() ? accessRequestsSnapshot.val() : {}
    };
  }

  function openDepartmentAdminModal() {
    if (!isAdmin()) return;
    els.adminDepartmentError.textContent = '';
    els.adminDepartmentName.value = '';
    els.adminDepartmentBranchSelect.value = getCurrentBranchId();
    renderDepartmentAdminModal();
    els.departmentAdminModalBackdrop.classList.add('open');
  }

  function closeDepartmentAdminModal() {
    els.departmentAdminModalBackdrop.classList.remove('open');
  }

  function openAccessAdminModal() {
    if (!isAdmin()) return;
    els.accessInviteError.textContent = '';
    loadAdminAccessData().then(() => {
      renderAccessAdminModal();
      els.accessAdminModalBackdrop.classList.add('open');
    }).catch(error => {
      console.error('Ошибка загрузки доступов:', error);
      alert('Не удалось загрузить доступы');
    });
  }

  function closeAccessAdminModal() {
    els.accessAdminModalBackdrop.classList.remove('open');
  }

  function getManagedDepartmentCheckboxValues() {
    return Array.from(els.accessInviteDepartments.querySelectorAll('input[type="checkbox"]:checked')).map(input => input.value);
  }

  function renderDepartmentAdminModal() {
    const activeBranchId = els.adminDepartmentBranchSelect.value || getCurrentBranchId();
    const departments = getActiveDepartments(activeBranchId);
    const requests = Object.values(state.departmentRequests || {})
      .filter(Boolean)
      .filter(req => req.branchId === activeBranchId)
      .filter(req => (req.status || 'pending') === 'pending')
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (departments.length === 0) {
      els.departmentList.innerHTML = '<div class="admin-card">В этом филиале пока нет отделов.</div>';
    } else {
      els.departmentList.innerHTML = departments.map(dep => `
        <div class="admin-card">
          <div class="admin-card-header">
            <div>
              <div class="admin-card-title">${escapeHtml(dep.name)}</div>
              <div class="admin-card-meta">${escapeHtml(getCurrentBranchId() === dep.branchId ? getCurrentBranchName() : (state.branches?.[dep.branchId]?.name || 'Филиал'))}</div>
            </div>
            <div class="card-actions">
              <button type="button" data-action="rename-department" data-id="${escapeHtml(dep.id)}">Переименовать</button>
              <button type="button" data-action="archive-department" data-id="${escapeHtml(dep.id)}">Архивировать</button>
              <button type="button" data-action="delete-department" data-id="${escapeHtml(dep.id)}" class="danger-btn">Удалить</button>
            </div>
          </div>
        </div>
      `).join('');
    }

    if (requests.length === 0) {
      els.departmentRequestsList.innerHTML = '<div class="admin-card">Нет заявок для выбранного филиала.</div>';
    } else {
      els.departmentRequestsList.innerHTML = requests.map(req => `
        <div class="admin-card">
          <div class="admin-card-header">
            <div>
              <div class="admin-card-title">${escapeHtml(req.requestedName)}</div>
              <div class="admin-card-meta">Статус: ${escapeHtml(req.status || 'pending')} · ${req.requestedByEmail ? escapeHtml(req.requestedByEmail) : 'без email'}</div>
            </div>
            <div class="card-actions">
              <button type="button" data-action="approve-request" data-id="${escapeHtml(req.id)}">Одобрить</button>
              <button type="button" data-action="reject-request" data-id="${escapeHtml(req.id)}" class="danger-btn">Отклонить</button>
            </div>
          </div>
        </div>
      `).join('');
    }

    els.departmentList.querySelectorAll('[data-action="rename-department"]').forEach(btn => {
      btn.onclick = () => renameDepartment(btn.dataset.id);
    });
    els.departmentList.querySelectorAll('[data-action="archive-department"]').forEach(btn => {
      btn.onclick = () => archiveDepartment(btn.dataset.id);
    });
    els.departmentList.querySelectorAll('[data-action="delete-department"]').forEach(btn => {
      btn.onclick = () => deleteDepartment(btn.dataset.id);
    });
    els.departmentRequestsList.querySelectorAll('[data-action="approve-request"]').forEach(btn => {
      btn.onclick = () => approveDepartmentRequest(btn.dataset.id);
    });
    els.departmentRequestsList.querySelectorAll('[data-action="reject-request"]').forEach(btn => {
      btn.onclick = () => rejectDepartmentRequest(btn.dataset.id);
    });
  }

  function renderAccessAdminModal() {
    const branchGroups = getBranches().map(branch => ({
      branch,
      departments: getActiveDepartments(branch.id)
    })).filter(group => group.departments.length > 0);

    if (branchGroups.length === 0) {
      els.accessInviteDepartments.innerHTML = '<div class=\"admin-card\">Сначала создайте хотя бы один отдел.</div>';
      els.accessRequestDepartments.innerHTML = '<div class=\"admin-card\">Сначала создайте хотя бы один отдел.</div>';
    } else {
      const groupedCheckboxes = branchGroups.map(group => `
        <div class=\"checkbox-group\">
          <div class=\"checkbox-group-title\">${escapeHtml(group.branch.name)}</div>
          ${group.departments.map(dep => `
            <label class=\"checkbox-item\">
              <input type=\"checkbox\" value=\"${escapeHtml(dep.id)}\">
              <span>${escapeHtml(dep.name)}</span>
            </label>
          `).join('')}
        </div>
      `).join('');
      els.accessInviteDepartments.innerHTML = groupedCheckboxes;
      els.accessRequestDepartments.innerHTML = groupedCheckboxes;
    }

    const accessRequests = Object.values(adminAccessSnapshot.accessRequests || {})
      .filter(Boolean)
      .filter(req => (req.status || 'pending') === 'pending')
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    els.accessRequestList.innerHTML = accessRequests.length === 0
      ? '<div class=\"admin-card\">Новых запросов пока нет.</div>'
      : accessRequests.map(req => `
        <div class=\"admin-card\">
          <div class=\"admin-card-header\">
            <div>
              <div class=\"admin-card-title\">${escapeHtml(req.email || 'Без email')}</div>
              <div class=\"admin-card-meta\">${escapeHtml(req.name || 'Без имени')} · ${escapeHtml(formatDepartmentNames(req.requestedDepartmentIds || {}))}${req.comment ? ` · ${escapeHtml(req.comment)}` : ''}</div>
            </div>
            <div class=\"card-actions\">
              <button type=\"button\" data-action=\"approve-access-request\" data-id=\"${escapeHtml(req.id)}\">Одобрить</button>
              <button type=\"button\" data-action=\"reject-access-request\" data-id=\"${escapeHtml(req.id)}\" class=\"danger-btn\">Отклонить</button>
            </div>
          </div>
        </div>
      `).join('');

    const invites = Object.values(adminAccessSnapshot.roleInvites || {}).filter(Boolean).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    els.accessInviteList.innerHTML = invites.length === 0
      ? '<div class=\"admin-card\">Приглашений пока нет.</div>'
      : invites.map(invite => `
        <div class=\"admin-card\">
          <div class=\"admin-card-header\">
            <div>
              <div class=\"admin-card-title\">${escapeHtml(invite.email || 'Без email')}</div>
              <div class=\"admin-card-meta\">${escapeHtml((invite.role || 'manager') === 'manager' ? 'Руководитель' : invite.role)} · ${formatDepartmentNames(invite.departmentIds || {})}</div>
            </div>
            <div class=\"card-actions\">
              <button type=\"button\" data-action=\"delete-invite\" data-id=\"${escapeHtml(invite.key || emailKey(invite.email || ''))}\" class=\"danger-btn\">Удалить</button>
            </div>
          </div>
        </div>
      `).join('');

    const roles = Object.entries(adminAccessSnapshot.roles || {})
      .map(([uid, role]) => ({ uid, ...role }))
      .sort((a, b) => (a.email || '').localeCompare(b.email || '', 'ru'));

    els.accessRoleList.innerHTML = roles.length === 0
      ? '<div class=\"admin-card\">Ролей пока нет.</div>'
      : roles.map(role => `
        <div class=\"admin-card\">
          <div class=\"admin-card-header\">
            <div>
              <div class=\"admin-card-title\">${escapeHtml(role.email || role.uid)}</div>
              <div class=\"admin-card-meta\">${escapeHtml(roleLabel(role.role || 'viewer'))}${role.role === 'manager' ? ` · ${escapeHtml(formatDepartmentNames(role.departmentIds || {}))}` : ''}</div>
            </div>
            <div class=\"card-actions\">
              ${role.role === 'manager' ? `<button type=\"button\" data-action=\"revoke-role\" data-id=\"${escapeHtml(role.uid)}\" class=\"danger-btn\">Снять доступ</button>` : ''}
            </div>
          </div>
        </div>
      `).join('');

    els.accessRequestList.querySelectorAll('[data-action=\"approve-access-request\"]').forEach(btn => {
      btn.onclick = () => approveAccessRequest(btn.dataset.id);
    });
    els.accessRequestList.querySelectorAll('[data-action=\"reject-access-request\"]').forEach(btn => {
      btn.onclick = () => rejectAccessRequest(btn.dataset.id);
    });
    els.accessInviteList.querySelectorAll('[data-action=\"delete-invite\"]').forEach(btn => {
      btn.onclick = () => deleteInvite(btn.dataset.id);
    });
    els.accessRoleList.querySelectorAll('[data-action=\"revoke-role\"]').forEach(btn => {
      btn.onclick = () => revokeManagerRole(btn.dataset.id);
    });
  }

  function formatDepartmentNames(departmentIdsObj) {
    const ids = Object.keys(departmentIdsObj || {}).filter(id => departmentIdsObj[id] === true);
    if (ids.length === 0) return 'Отделы не выбраны';
    return ids.map(getDepartmentName).join(', ');
  }

  function validateVacation(vacation, skipId = '') {
    if (!vacation.employeeId || !vacation.start || !vacation.end) return 'Заполните все обязательные поля';
    if (vacation.end < vacation.start) return 'Дата окончания не может быть раньше даты начала';
    if (!vacation.start.startsWith(`${YEAR}-`) || !vacation.end.startsWith(`${YEAR}-`)) return `Диапазон должен быть внутри ${YEAR} года`;

    const employee = state.employees?.[vacation.employeeId];
    if (!employee) return 'Сотрудник не найден';
    const canEditOwnVacation = isEmployeeRole() && currentEmployeePermission === 'edit' && employee.id === currentEmployeeId;
    if (!canManageEmployee(employee) && !canEditOwnVacation) return 'Нет прав на этого сотрудника';

    const overlap = Object.values(state.vacations || {}).find(item =>
      item &&
      item.employeeId === vacation.employeeId &&
      item.id !== skipId &&
      !(vacation.end < item.start || vacation.start > item.end)
    );

    if (overlap) return `Пересечение с существующим отпуском: ${formatTooltip(overlap)}`;
    return '';
  }

  async function writeVacation(vacation) {
    await set(ref(db, `scheduleV2/vacations/${vacation.id}`), vacation);
  }

  async function saveVacation() {
    if (!canCreateVacation()) {
      alert('Недостаточно прав');
      return;
    }

    const employee = state.employees?.[els.employeeSelect.value];
    const existing = els.vacationId.value ? state.vacations?.[els.vacationId.value] : null;

    const vacation = {
      id: els.vacationId.value || makeId('vac', `${employee?.displayName || 'employee'}-${els.startDate.value}`),
      employeeId: els.employeeSelect.value,
      departmentId: employee?.departmentId || existing?.departmentId || '',
      start: els.startDate.value,
      end: els.endDate.value,
      color: employee?.color || existing?.color || '#2d63dd',
      status: els.vacationStatus.value,
      comment: els.comment.value.trim(),
      createdAt: existing?.createdAt || nowTs(),
      updatedAt: nowTs(),
      createdBy: existing?.createdBy || currentUser?.uid || 'unknown',
      updatedBy: currentUser?.uid || 'unknown'
    };

    const error = validateVacation(vacation, els.vacationId.value);
    if (error) {
      alert(error);
      return;
    }

    try {
      await writeVacation(vacation);
      closeVacationModal();
    } catch (error) {
      console.error('Ошибка сохранения отпуска:', error);
      alert('Не удалось сохранить отпуск');
    }
  }

  async function deleteVacation() {
    const id = els.vacationId.value;
    if (!id) return;
    const existing = state.vacations?.[id];
    if (!canManageVacation(existing)) {
      alert('Недостаточно прав');
      return;
    }
    if (!confirm('Удалить отпуск?')) return;

    try {
      await remove(ref(db, `scheduleV2/vacations/${id}`));
      closeVacationModal();
    } catch (error) {
      console.error('Ошибка удаления отпуска:', error);
      alert('Не удалось удалить отпуск');
    }
  }

  async function resetAllVacations() {
    if (!canResetAll()) {
      alert('Недостаточно прав');
      return;
    }
    if (!confirm('Удалить все отпуска во всех филиалах?')) return;
    try {
      await set(ref(db, 'scheduleV2/vacations'), {});
    } catch (error) {
      console.error('Ошибка сброса отпусков:', error);
      alert('Не удалось сбросить отпуска');
    }
  }

  async function addEmployee() {
    if (!canEditAnything()) {
      alert('Недостаточно прав');
      return;
    }

    const departmentId = els.employeeDepartmentSelect.value;
    const displayName = normalizeFullName(els.newEmployeeName.value);
    const position = String(els.newEmployeePosition.value || '').trim().replace(/\s+/g, ' ');
    const department = state.departments?.[departmentId];

    if (!departmentId || !displayName) {
      alert('Укажите отдел и ФИО сотрудника');
      return;
    }
    if (!department) {
      alert('Отдел не найден');
      return;
    }
    if (!canManageDepartment(departmentId)) {
      alert('Недостаточно прав для этого отдела');
      return;
    }

    const duplicate = getEmployees({ departmentId }).some(emp => normalizeText(emp.displayName) === normalizeText(displayName));
    if (duplicate) {
      alert('Такой сотрудник уже есть в выбранном отделе');
      return;
    }

    const employeeId = makeId('emp', `${department.name}-${displayName}`);
    const employee = {
      id: employeeId,
      displayName,
      position,
      departmentId,
      color: els.newEmployeeColor.value || defaultEmployeeColor(`${departmentId}-${displayName}`),
      isActive: true,
      createdAt: nowTs(),
      createdBy: currentUser?.uid || 'unknown'
    };

    try {
      await set(ref(db, `scheduleV2/employees/${employeeId}`), employee);
      closeEmployeeModal();
      els.newEmployeePosition.value = '';
    } catch (error) {
      console.error('Ошибка добавления сотрудника:', error);
      alert('Не удалось добавить сотрудника');
    }
  }

  async function removeEmployee() {
    const employeeId = els.removeEmployeeSelect.value;
    const employee = state.employees?.[employeeId];
    if (!employee) {
      alert('Сотрудник не найден');
      return;
    }
    if (!canManageEmployee(employee)) {
      alert('Недостаточно прав');
      return;
    }
    if (!confirm(`Удалить сотрудника "${employee.displayName}" и все его отпуска?`)) return;

    const updates = {
      [`scheduleV2/employees/${employeeId}`]: null
    };

    Object.values(state.vacations || {}).forEach(vac => {
      if (vac && vac.employeeId === employeeId) {
        updates[`scheduleV2/vacations/${vac.id}`] = null;
      }
    });

    try {
      await update(ref(db), updates);
      closeRemoveEmployeeModal();
    } catch (error) {
      console.error('Ошибка удаления сотрудника:', error);
      alert('Не удалось удалить сотрудника');
    }
  }

  async function createDepartmentDirect() {
    if (!isAdmin()) return;
    const branchId = els.adminDepartmentBranchSelect.value;
    const name = els.adminDepartmentName.value.trim().replace(/\s+/g, ' ');
    els.adminDepartmentError.textContent = '';

    if (!branchId || !name) {
      els.adminDepartmentError.textContent = 'Выберите филиал и введите название отдела';
      return;
    }

    const exists = Object.values(state.departments || {}).some(dep => dep && dep.branchId === branchId && normalizeText(dep.name) === normalizeText(name) && dep.status !== 'archived');
    if (exists) {
      els.adminDepartmentError.textContent = 'Такой отдел уже существует в выбранном филиале';
      return;
    }

    const departmentId = makeId('dep', `${branchId}-${name}`);
    const department = {
      id: departmentId,
      name,
      branchId,
      status: 'active',
      createdAt: nowTs(),
      createdBy: currentUser?.uid || 'unknown'
    };

    try {
      await set(ref(db, `scheduleV2/departments/${departmentId}`), department);
      els.adminDepartmentName.value = '';
      renderFilters();
    } catch (error) {
      console.error('Ошибка создания отдела:', error);
      els.adminDepartmentError.textContent = 'Не удалось создать отдел';
    }
  }

  async function renameDepartment(departmentId) {
    if (!isAdmin()) return;
    const department = state.departments?.[departmentId];
    if (!department) return;

    const nextName = prompt('Новое название отдела', department.name);
    if (!nextName) return;
    const normalized = nextName.trim().replace(/\s+/g, ' ');
    if (!normalized) return;

    try {
      await update(ref(db, `scheduleV2/departments/${departmentId}`), {
        name: normalized,
        updatedAt: nowTs(),
        updatedBy: currentUser?.uid || 'unknown'
      });
    } catch (error) {
      console.error('Ошибка переименования отдела:', error);
      alert('Не удалось переименовать отдел');
    }
  }

  async function archiveDepartment(departmentId) {
    if (!isAdmin()) return;
    const department = state.departments?.[departmentId];
    if (!department) return;
    const hasEmployees = getEmployees({ departmentId }).length > 0;
    if (hasEmployees) {
      alert('Сначала переместите или удалите сотрудников из отдела');
      return;
    }
    if (!confirm(`Архивировать отдел "${department.name}"?`)) return;

    try {
      await update(ref(db, `scheduleV2/departments/${departmentId}`), {
        status: 'archived',
        updatedAt: nowTs(),
        updatedBy: currentUser?.uid || 'unknown'
      });
    } catch (error) {
      console.error('Ошибка архивации отдела:', error);
      alert('Не удалось архивировать отдел');
    }
  }

  async function deleteDepartment(departmentId) {
    if (!isAdmin()) return;
    await loadAdminAccessData();
    const department = state.departments?.[departmentId];
    if (!department) return;

    const hasEmployees = getEmployees({ departmentId }).length > 0;
    const hasVacations = Object.values(state.vacations || {}).some(vac => vac && vac.departmentId === departmentId);
    if (hasEmployees || hasVacations) {
      alert('Нельзя удалить отдел, пока в нем есть сотрудники или отпуска');
      return;
    }
    if (!confirm(`Удалить отдел "${department.name}" без возможности восстановления?`)) return;

    const updates = {
      [`scheduleV2/departments/${departmentId}`]: null
    };

    Object.entries(adminAccessSnapshot.roleInvites || {}).forEach(([key, invite]) => {
      if (invite?.departmentIds?.[departmentId]) {
        const next = { ...(invite.departmentIds || {}) };
        delete next[departmentId];
        if (Object.keys(next).length === 0) updates[`roleInvites/${key}`] = null;
        else updates[`roleInvites/${key}/departmentIds`] = next;
      }
    });

    Object.entries(adminAccessSnapshot.roles || {}).forEach(([uid, role]) => {
      if (role?.departmentIds?.[departmentId]) {
        const next = { ...(role.departmentIds || {}) };
        delete next[departmentId];
        if (Object.keys(next).length === 0 && role.role === 'manager') updates[`roles/${uid}`] = null;
        else updates[`roles/${uid}/departmentIds`] = next;
      }
    });

    Object.entries(adminAccessSnapshot.accessRequests || {}).forEach(([id, req]) => {
      if (req?.requestedDepartmentIds?.[departmentId]) {
        const next = { ...(req.requestedDepartmentIds || {}) };
        delete next[departmentId];
        if (Object.keys(next).length === 0) updates[`accessRequests/${id}`] = null;
        else updates[`accessRequests/${id}/requestedDepartmentIds`] = next;
      }
    });

    try {
      await update(ref(db), updates);
      await loadAdminAccessData();
      renderFilters();
      renderDepartmentAdminModal();
      alert('Отдел удален');
    } catch (error) {
      console.error('Ошибка удаления отдела:', error);
      alert('Не удалось удалить отдел');
    }
  }

  async function saveDepartmentRequest() {
    if (!currentUser) {
      openAuthModal();
      return;
    }

    const requestedName = els.departmentRequestName.value.trim().replace(/\s+/g, ' ');
    const branchId = getCurrentBranchId();
    els.departmentRequestError.textContent = '';

    if (!requestedName) {
      els.departmentRequestError.textContent = 'Введите название отдела';
      return;
    }

    const exists = getActiveDepartments(branchId).some(dep => normalizeText(dep.name) === normalizeText(requestedName));
    if (exists) {
      els.departmentRequestError.textContent = 'Такой отдел уже есть в этом филиале';
      return;
    }

    const requestId = makeId('req', `${branchId}-${requestedName}`);
    const requestData = {
      id: requestId,
      branchId,
      requestedName,
      normalizedName: normalizeText(requestedName),
      status: 'pending',
      requestedBy: currentUser?.uid || 'unknown',
      requestedByEmail: currentUser?.email || '',
      createdAt: nowTs()
    };

    try {
      await set(ref(db, `scheduleV2/departmentRequests/${requestId}`), requestData);
      closeDepartmentRequestModal();
      alert('Заявка отправлена');
    } catch (error) {
      console.error('Ошибка создания заявки:', error);
      els.departmentRequestError.textContent = 'Не удалось отправить заявку';
    }
  }

  async function approveDepartmentRequest(requestId) {
    if (!isAdmin()) return;
    const requestData = state.departmentRequests?.[requestId];
    if (!requestData) return;

    const duplicate = getActiveDepartments(requestData.branchId).some(dep => normalizeText(dep.name) === normalizeText(requestData.requestedName));
    const updates = {};
    if (!duplicate) {
      const departmentId = makeId('dep', `${requestData.branchId}-${requestData.requestedName}`);
      updates[`scheduleV2/departments/${departmentId}`] = {
        id: departmentId,
        name: requestData.requestedName,
        branchId: requestData.branchId,
        status: 'active',
        createdAt: nowTs(),
        createdBy: currentUser?.uid || 'unknown',
        sourceRequestId: requestId
      };
    }
    updates[`scheduleV2/departmentRequests/${requestId}`] = null;

    try {
      await update(ref(db), updates);
      delete state.departmentRequests[requestId];
      renderFilters();
      renderDepartmentAdminModal();
    } catch (error) {
      console.error('Ошибка одобрения заявки:', error);
      alert('Не удалось одобрить заявку');
    }
  }

  async function rejectDepartmentRequest(requestId) {
    if (!isAdmin()) return;
    if (!confirm('Отклонить заявку?')) return;
    try {
      await remove(ref(db, `scheduleV2/departmentRequests/${requestId}`));
      delete state.departmentRequests[requestId];
      renderDepartmentAdminModal();
    } catch (error) {
      console.error('Ошибка отклонения заявки:', error);
      alert('Не удалось отклонить заявку');
    }
  }

  function renderDepartmentCheckboxGroups(container, selectedIds = []) {
    const selected = new Set(selectedIds);
    const branchGroups = getBranches().map(branch => ({
      branch,
      departments: getActiveDepartments(branch.id)
    })).filter(group => group.departments.length > 0);

    if (branchGroups.length === 0) {
      container.innerHTML = '<div class="admin-card">Сначала создайте хотя бы один отдел.</div>';
      return;
    }

    container.innerHTML = branchGroups.map(group => `
      <div class="checkbox-group">
        <div class="checkbox-group-title">${escapeHtml(group.branch.name)}</div>
        ${group.departments.map(dep => `
          <label class="checkbox-item">
            <input type="checkbox" value="${escapeHtml(dep.id)}" ${selected.has(dep.id) ? 'checked' : ''}>
            <span>${escapeHtml(dep.name)}</span>
          </label>
        `).join('')}
      </div>
    `).join('');
  }


  async function openMyEmployeesModal() {
    if (!canOpenMyEmployees()) return;
    await renderMyEmployeesModal();
    els.myEmployeesModalBackdrop.classList.add('open');
  }

  function closeMyEmployeesModal() {
    els.myEmployeesModalBackdrop.classList.remove('open');
  }

  async function renderMyEmployeesModal() {
    const employees = getEmployees({ manageableOnly: true });
    if (employees.length === 0) {
      els.myEmployeesList.innerHTML = '<div class="admin-card">Нет сотрудников в доступных вам отделах.</div>';
      return;
    }

    const inviteSnapshots = await Promise.all(employees.map(async employee => {
      const email = normalizeEmail(employee.accessEmail || '');
      if (!email) return [employee.id, null];
      try {
        const snapshot = await get(ref(db, `employeeInvites/${emailKey(email)}`));
        return [employee.id, snapshot.exists() ? snapshot.val() : null];
      } catch {
        return [employee.id, null];
      }
    }));
    const inviteMap = Object.fromEntries(inviteSnapshots);

    els.myEmployeesList.innerHTML = employees.map(employee => {
      const department = state.departments?.[employee.departmentId];
      const currentInvite = inviteMap[employee.id];
      const currentAccessEmail = currentInvite?.email || employee.accessEmail || '';
      const currentPermission = currentInvite?.permission || employee.accessPermission || 'view';
      return `
        <div class="admin-card">
          <div class="admin-card-header">
            <div>
              <div class="admin-card-title">${escapeHtml(employee.displayName)}${employee.position ? ` <span class="admin-card-meta">(${escapeHtml(employee.position)})</span>` : ''}</div>
              <div class="admin-card-meta">${escapeHtml(department?.name || 'Без отдела')}</div>
            </div>
            ${currentAccessEmail ? `<span class="status-pill status-approved">Доступ выдан</span>` : `<span class="status-pill status-pending">Доступ не выдан</span>`}
          </div>
          <div class="inline-form my-employee-access-form">
            <input type="email" data-field="email" data-employee-id="${escapeHtml(employee.id)}" placeholder="employee@company.ru" value="${escapeHtml(currentAccessEmail)}">
            <select data-field="permission" data-employee-id="${escapeHtml(employee.id)}">
              <option value="view" ${currentPermission === 'view' ? 'selected' : ''}>Только просмотр</option>
              <option value="edit" ${currentPermission === 'edit' ? 'selected' : ''}>Просмотр и редактирование</option>
            </select>
            <button type="button" data-action="save-employee-access" data-employee-id="${escapeHtml(employee.id)}">Сохранить доступ</button>
            ${currentAccessEmail ? `<button type="button" data-action="delete-employee-access" data-employee-id="${escapeHtml(employee.id)}" class="danger-btn">Отозвать</button>` : ''}
          </div>
        </div>
      `;
    }).join('');

    els.myEmployeesList.querySelectorAll('[data-action="save-employee-access"]').forEach(btn => {
      btn.onclick = () => saveEmployeeAccess(btn.dataset.employeeId);
    });
    els.myEmployeesList.querySelectorAll('[data-action="delete-employee-access"]').forEach(btn => {
      btn.onclick = () => deleteEmployeeAccess(btn.dataset.employeeId);
    });
  }

  async function saveEmployeeAccess(employeeId) {
    const employee = state.employees?.[employeeId];
    if (!employee || !canManageEmployee(employee)) {
      alert('Недостаточно прав');
      return;
    }

    const card = els.myEmployeesList.querySelector(`[data-action="save-employee-access"][data-employee-id="${CSS.escape(employeeId)}"]`)?.closest('.admin-card');
    if (!card) return;
    const emailInput = card.querySelector('[data-field="email"]');
    const permissionSelect = card.querySelector('[data-field="permission"]');
    const email = normalizeEmail(emailInput?.value || '');
    const permission = permissionSelect?.value === 'edit' ? 'edit' : 'view';

    if (!email) {
      alert('Введите email сотрудника');
      return;
    }

    const key = emailKey(email);
    const invite = {
      key,
      email,
      employeeId,
      departmentId: employee.departmentId,
      permission,
      isActive: true,
      grantedAt: nowTs(),
      grantedBy: currentUser?.uid || 'unknown'
    };

    const updates = {
      [`employeeInvites/${key}`]: invite,
      [`scheduleV2/employees/${employeeId}/accessEmail`]: email,
      [`scheduleV2/employees/${employeeId}/accessPermission`]: permission,
      [`scheduleV2/employees/${employeeId}/updatedAt`]: nowTs(),
      [`scheduleV2/employees/${employeeId}/updatedBy`]: currentUser?.uid || 'unknown',
      [`employeeAccess/${employeeId}`]: {
        employeeId,
        email,
        departmentId: employee.departmentId,
        permission,
        updatedAt: nowTs(),
        updatedBy: currentUser?.uid || 'unknown'
      }
    };

    try {
      await update(ref(db), updates);
      showToast('Доступ сотруднику сохранён');
      await renderMyEmployeesModal();
    } catch (error) {
      console.error('Ошибка выдачи доступа сотруднику:', error);
      alert('Не удалось сохранить доступ');
    }
  }

  async function deleteEmployeeAccess(employeeId) {
    const employee = state.employees?.[employeeId];
    if (!employee || !canManageEmployee(employee)) {
      alert('Недостаточно прав');
      return;
    }
    if (!confirm(`Отозвать доступ у ${employee.displayName}?`)) return;

    const email = normalizeEmail(employee.accessEmail || '');
    const updates = {
      [`scheduleV2/employees/${employeeId}/accessEmail`]: null,
      [`scheduleV2/employees/${employeeId}/accessPermission`]: null,
      [`employeeAccess/${employeeId}`]: null
    };
    if (email) {
      updates[`employeeInvites/${emailKey(email)}`] = null;
    }

    try {
      await update(ref(db), updates);
      showToast('Доступ сотрудника отозван');
      await renderMyEmployeesModal();
    } catch (error) {
      console.error('Ошибка отзыва доступа сотрудника:', error);
      alert('Не удалось отозвать доступ');
    }
  }

  function openHelpModal() {
    els.helpModalBackdrop.classList.add('open');
  }

  function closeHelpModal() {
    els.helpModalBackdrop.classList.remove('open');
  }

  function openImportModal() {
    if (!canEditAnything()) return;
    els.importError.textContent = '';
    els.importFileInput.value = '';
    els.importModalBackdrop.classList.add('open');
  }

  function closeImportModal() {
    els.importModalBackdrop.classList.remove('open');
  }

  function downloadImportTemplate() {
    const template = [
      'employee_fio,department,branch,position,employee_color,start,end,status,comment',
      'Иванов Иван Иванович,Юридический отдел,ГСП-Центр,Юрисконсульт,#2d63dd,2026-07-01,2026-07-14,approved,Основной отпуск'
    ].join('
');
    downloadBlob(`﻿${template}`, `vacation-import-template-${YEAR}.csv`, 'text/csv;charset=utf-8');
  }

  function exportCsv() {
    const rows = buildExportRows();
    if (rows.length === 0) {
      alert('Нет данных для экспорта');
      return;
    }
    const header = Object.keys(rows[0]);
    const csv = [header.join(',')]
      .concat(rows.map(row => header.map(key => csvEscape(row[key])).join(',')))
      .join('
');
    downloadBlob(`﻿${csv}`, `vacations-${YEAR}.csv`, 'text/csv;charset=utf-8');
  }

  function exportExcel() {
    const rows = buildExportRows();
    if (rows.length === 0) {
      alert('Нет данных для экспорта');
      return;
    }
    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Vacations');
    XLSX.writeFile(book, `vacations-${YEAR}.xlsx`);
  }

  async function importVacationsFromCsv() {
    if (!canEditAnything()) {
      alert('Недостаточно прав');
      return;
    }
    const file = els.importFileInput.files?.[0];
    els.importError.textContent = '';
    if (!file) {
      els.importError.textContent = 'Выберите CSV-файл';
      return;
    }

    try {
      const text = await readTextFile(file);
      const rows = parseCsvText(text.replace(/^﻿/, ''));
      if (rows.length === 0) {
        els.importError.textContent = 'Файл пустой или не распознан';
        return;
      }

      const updates = {};
      const plannedVacationsByEmployee = {};
      let importedCount = 0;

      rows.forEach((row, index) => {
        const employeeName = normalizeFullName(row.employee_fio || row.fio || row.employee || '');
        const departmentName = String(row.department || '').trim();
        const branchName = String(row.branch || getCurrentBranchName()).trim();
        const start = parseDateString(row.start);
        const end = parseDateString(row.end);
        const position = String(row.position || '').trim().replace(/\s+/g, ' ');
        const colorSeed = `${departmentName}-${employeeName}-${index}`;
        const employeeColor = sanitizeColor(row.employee_color, defaultEmployeeColor(colorSeed));
        const status = normalizeVacationStatus(row.status);
        const comment = String(row.comment || '').trim();

        if (!employeeName || !departmentName || !start || !end) {
          throw new Error(`Строка ${index + 2}: заполнены не все обязательные поля`);
        }
        if (!start.startsWith(`${YEAR}-`) || !end.startsWith(`${YEAR}-`)) {
          throw new Error(`Строка ${index + 2}: даты должны быть внутри ${YEAR} года`);
        }
        if (end < start) {
          throw new Error(`Строка ${index + 2}: дата окончания раньше даты начала`);
        }

        const branch = ensureBranchForImport(branchName);
        const department = ensureDepartmentForImport(departmentName, branch.id);
        const employee = findEmployeeByNameAndDepartment(employeeName, department.id) || {
          id: makeId('emp', `${department.id}-${employeeName}`),
          displayName: employeeName,
          position,
          departmentId: department.id,
          color: employeeColor,
          isActive: true,
          createdAt: nowTs(),
          createdBy: currentUser?.uid || 'unknown'
        };

        updates[`scheduleV2/branches/${branch.id}`] = { ...(state.branches?.[branch.id] || branch), ...(state.branches?.[branch.id] || {}) };
        updates[`scheduleV2/departments/${department.id}`] = { ...(state.departments?.[department.id] || department), ...(state.departments?.[department.id] || {}) };
        updates[`scheduleV2/employees/${employee.id}`] = {
          ...(state.employees?.[employee.id] || employee),
          id: employee.id,
          displayName: employeeName,
          position: position || state.employees?.[employee.id]?.position || '',
          departmentId: department.id,
          color: employeeColor,
          isActive: true,
          updatedAt: nowTs(),
          updatedBy: currentUser?.uid || 'unknown'
        };

        const vacation = {
          id: makeId('vac', `${employee.id}-${start}-${end}`),
          employeeId: employee.id,
          departmentId: department.id,
          start,
          end,
          color: employeeColor,
          status,
          comment,
          createdAt: nowTs(),
          updatedAt: nowTs(),
          createdBy: currentUser?.uid || 'import',
          updatedBy: currentUser?.uid || 'import'
        };
        const existingOverlap = Object.values(state.vacations || {}).find(item =>
          item && item.employeeId === employee.id && !(vacation.end < item.start || vacation.start > item.end)
        );
        if (existingOverlap) {
          throw new Error(`Строка ${index + 2}: пересечение с существующим отпуском ${existingOverlap.start} — ${existingOverlap.end}`);
        }
        const plannedOverlap = (plannedVacationsByEmployee[employee.id] || []).find(item => !(vacation.end < item.start || vacation.start > item.end));
        if (plannedOverlap) {
          throw new Error(`Строка ${index + 2}: пересечение с другой строкой импорта ${plannedOverlap.start} — ${plannedOverlap.end}`);
        }
        plannedVacationsByEmployee[employee.id] = [...(plannedVacationsByEmployee[employee.id] || []), vacation];
        updates[`scheduleV2/vacations/${vacation.id}`] = vacation;
        importedCount += 1;
      });

      await update(ref(db), updates);
      closeImportModal();
      showToast(`Импортировано отпусков: ${importedCount}`);
    } catch (error) {
      console.error('Ошибка импорта CSV:', error);
      els.importError.textContent = error?.message || 'Не удалось импортировать файл';
    }
  }

  function openAccessRequestModal() {
    if (!currentUser) {
      openAuthModal();
      return;
    }
    els.accessRequestError.textContent = '';
    els.accessRequestEmailView.textContent = currentUser?.email || 'Не указан';
    els.accessRequestNameView.textContent = currentUserProfile?.fullName || currentRoleRecord?.fullName || 'Не указано';
    els.accessRequestComment.value = '';
    renderDepartmentCheckboxGroups(els.accessRequestDepartments);
    els.accessRequestModalBackdrop.classList.add('open');
  }

  function closeAccessRequestModal() {
    els.accessRequestModalBackdrop.classList.remove('open');
  }

  function getAccessRequestDepartmentValues() {
    return Array.from(els.accessRequestDepartments.querySelectorAll('input[type="checkbox"]:checked')).map(input => input.value);
  }

  async function saveAccessRequest() {
    if (!currentUser) {
      openAuthModal();
      return;
    }

    const email = normalizeEmail(currentUser?.email || currentUserProfile?.email || '');
    const name = normalizeFullName(currentUserProfile?.fullName || currentRoleRecord?.fullName || '');
    const comment = els.accessRequestComment.value.trim();
    const departmentIds = getAccessRequestDepartmentValues();

    els.accessRequestError.textContent = '';
    if (!email) {
      els.accessRequestError.textContent = 'Не найден email текущего пользователя';
      return;
    }
    if (!isLikelyFullName(name)) {
      els.accessRequestError.textContent = 'В профиле не заполнено полное ФИО';
      return;
    }
    if (departmentIds.length === 0) {
      els.accessRequestError.textContent = 'Выберите хотя бы один отдел';
      return;
    }

    const requestId = makeId('access_req', email);
    const requestData = {
      id: requestId,
      email,
      name,
      comment,
      status: 'pending',
      requestedDepartmentIds: Object.fromEntries(departmentIds.map(id => [id, true])),
      createdAt: nowTs(),
      requestedByUid: currentUser?.uid || null
    };

    try {
      await set(ref(db, `accessRequests/${requestId}`), requestData);
      if (!adminAccessSnapshot.accessRequests) adminAccessSnapshot.accessRequests = {};
      adminAccessSnapshot.accessRequests[requestId] = requestData;
      closeAccessRequestModal();
      showToast('Запрос отправлен администратору');
    } catch (error) {
      console.error('Ошибка отправки запроса доступа:', error);
      els.accessRequestError.textContent = 'Не удалось отправить запрос';
    }
  }

  async function approveAccessRequest(requestId) {
    if (!isAdmin()) return;
    const req = adminAccessSnapshot.accessRequests?.[requestId];
    if (!req) return;
    const departmentIds = req.requestedDepartmentIds || {};
    if (Object.keys(departmentIds).length === 0) {
      alert('В запросе не выбраны отделы');
      return;
    }

    const key = emailKey(req.email || '');
    const updates = {
      [`roleInvites/${key}`]: {
        key,
        email: req.email,
        role: 'manager',
        departmentIds,
        isActive: true,
        createdAt: nowTs(),
        createdBy: currentUser?.uid || 'unknown',
        sourceRequestId: requestId,
        fullName: req.name || ''
      },
      [`accessRequests/${requestId}/status`]: 'approved',
      [`accessRequests/${requestId}/resolvedAt`]: nowTs(),
      [`accessRequests/${requestId}/resolvedBy`]: currentUser?.uid || 'unknown'
    };

    try {
      await update(ref(db), updates);
      await loadAdminAccessData();
      renderAccessAdminModal();
    } catch (error) {
      console.error('Ошибка одобрения запроса доступа:', error);
      alert('Не удалось одобрить запрос');
    }
  }

  async function rejectAccessRequest(requestId) {
    if (!isAdmin()) return;
    if (!confirm('Отклонить запрос на доступ?')) return;
    try {
      await update(ref(db, `accessRequests/${requestId}`), {
        status: 'rejected',
        resolvedAt: nowTs(),
        resolvedBy: currentUser?.uid || 'unknown'
      });
      await loadAdminAccessData();
      renderAccessAdminModal();
    } catch (error) {
      console.error('Ошибка отклонения запроса доступа:', error);
      alert('Не удалось отклонить запрос');
    }
  }

  async function saveInvite() {
    if (!isAdmin()) return;
    const email = normalizeEmail(els.accessInviteEmail.value);
    const departmentIds = getManagedDepartmentCheckboxValues();
    els.accessInviteError.textContent = '';

    if (!email) {
      els.accessInviteError.textContent = 'Введите email';
      return;
    }
    if (departmentIds.length === 0) {
      els.accessInviteError.textContent = 'Выберите хотя бы один отдел';
      return;
    }

    const key = emailKey(email);
    const departmentMap = Object.fromEntries(departmentIds.map(id => [id, true]));
    const invite = {
      key,
      email,
      role: 'manager',
      departmentIds: departmentMap,
      isActive: true,
      createdAt: nowTs(),
      createdBy: currentUser?.uid || 'unknown'
    };

    try {
      await set(ref(db, `roleInvites/${key}`), invite);
      els.accessInviteEmail.value = '';
      Array.from(els.accessInviteDepartments.querySelectorAll('input[type="checkbox"]')).forEach(input => {
        input.checked = false;
      });
      await loadAdminAccessData();
      renderAccessAdminModal();
    } catch (error) {
      console.error('Ошибка сохранения приглашения:', error);
      els.accessInviteError.textContent = 'Не удалось сохранить приглашение';
    }
  }

  async function deleteInvite(key) {
    if (!isAdmin()) return;
    if (!confirm('Удалить приглашение?')) return;
    try {
      await remove(ref(db, `roleInvites/${key}`));
      await loadAdminAccessData();
      renderAccessAdminModal();
    } catch (error) {
      console.error('Ошибка удаления приглашения:', error);
      alert('Не удалось удалить приглашение');
    }
  }

  async function revokeManagerRole(uid) {
    if (!isAdmin()) return;
    const role = adminAccessSnapshot.roles?.[uid];
    if (!role || role.role !== 'manager') return;
    if (!confirm(`Снять права руководителя у ${role.email || uid}?`)) return;

    try {
      await remove(ref(db, `roles/${uid}`));
      await loadAdminAccessData();
      renderAccessAdminModal();
    } catch (error) {
      console.error('Ошибка снятия роли:', error);
      alert('Не удалось снять доступ');
    }
  }

  async function signIn() {
    const email = normalizeEmail(els.authEmail.value);
    const password = els.authPassword.value;
    if (!email || !password) {
      els.authError.textContent = 'Введите email и пароль';
      return;
    }

    try {
      els.authError.textContent = '';
      pendingRegistrationFullName = '';
      await signInWithEmailAndPassword(auth, email, password);
      closeAuthModal();
    } catch (error) {
      console.error('Ошибка входа:', error);
      els.authError.textContent = 'Не удалось войти. Проверьте email и пароль.';
    }
  }

  async function registerAccount() {
    const fullName = normalizeFullName(els.authFullName.value);
    const email = normalizeEmail(els.authEmail.value);
    const password = els.authPassword.value;

    if (!isLikelyFullName(fullName)) {
      els.authError.textContent = 'Укажите полное имя';
      return;
    }
    if (!email || !password) {
      els.authError.textContent = 'Введите email и пароль';
      return;
    }
    if (password.length < 6) {
      els.authError.textContent = 'Пароль должен быть не короче 6 символов';
      return;
    }

    try {
      els.authError.textContent = '';
      pendingRegistrationFullName = fullName;
      await createUserWithEmailAndPassword(auth, email, password);
      closeAuthModal();
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      pendingRegistrationFullName = '';
      els.authError.textContent = 'Не удалось создать аккаунт. Возможно, email уже используется.';
    }
  }

  async function logoutUser() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Ошибка выхода:', error);
      alert('Не удалось выйти');
    }
  }

  function subscribeToAuth() {
    onAuthStateChanged(auth, async (user) => {
      currentUser = user || null;

      let roleRecord = null;
      if (user) {
        try {
          roleRecord = await resolveCurrentRole(user);
        } catch (error) {
          console.error('Ошибка определения роли:', error);
        }
      }

      applyRoleRecord(roleRecord);
      if (currentUser && pendingRegistrationFullName && roleRecord && !roleRecord.fullName) {
        try {
          await update(ref(db, `roles/${currentUser.uid}`), { fullName: pendingRegistrationFullName });
          roleRecord.fullName = pendingRegistrationFullName;
          applyRoleRecord(roleRecord);
        } catch (error) {
          console.error('Не удалось сохранить полное имя:', error);
        }
      }
      pendingRegistrationFullName = '';
      updateAuthUI();

      try {
        if (isAdmin()) {
          await ensureScheduleInitialized();
        }
      } catch (error) {
        console.error('Ошибка инициализации после входа:', error);
      }

      renderFilters();
      renderBoard();
    });
  }

  function attachStaticHandlers() {
    els.branchFilter.onchange = () => {
      renderFilters();
      renderBoard();
    };
    els.groupFilter.onchange = renderBoard;
    els.searchInput.oninput = renderBoard;
    els.expandAllMonthsBtn.onclick = expandAllMonths;

    els.addBtn.onclick = () => openVacationModal();
    els.resetBtn.onclick = resetAllVacations;
    els.addEmployeeToolbarBtn.onclick = openEmployeeModal;
    els.removeEmployeeToolbarBtn.onclick = openRemoveEmployeeModal;
    els.manageDepartmentsBtn.onclick = openDepartmentAdminModal;
    els.manageAccessBtn.onclick = openAccessAdminModal;
    els.myEmployeesBtn.onclick = openMyEmployeesModal;
    els.importCsvBtn.onclick = openImportModal;
    els.exportCsvBtn.onclick = exportCsv;
    els.exportExcelBtn.onclick = exportExcel;

    els.closeModalBtn.onclick = closeVacationModal;
    els.saveBtn.onclick = saveVacation;
    els.employeeSelect.onchange = () => syncVacationColorToSelectedEmployee(false);
    els.deleteBtn.onclick = deleteVacation;

    els.closeEmployeeModalBtn.onclick = closeEmployeeModal;
    els.saveEmployeeBtn.onclick = addEmployee;
    els.employeeDepartmentSearch.oninput = renderEmployeeDepartmentOptions;
    els.suggestDepartmentBtn.onclick = openDepartmentRequestModal;

    els.closeRemoveEmployeeModalBtn.onclick = closeRemoveEmployeeModal;
    els.confirmRemoveEmployeeBtn.onclick = removeEmployee;
    els.removeEmployeeGroupSelect.onchange = refreshRemoveEmployeeSelect;

    els.requestAccessBtn.onclick = openAccessRequestModal;
    els.loginBtn.onclick = openAuthModal;
    els.logoutBtn.onclick = logoutUser;
    els.closeAuthModalBtn.onclick = closeAuthModal;
    els.submitLoginBtn.onclick = signIn;
    els.submitRegisterBtn.onclick = registerAccount;

    els.closeDepartmentRequestModalBtn.onclick = closeDepartmentRequestModal;
    els.saveDepartmentRequestBtn.onclick = saveDepartmentRequest;

    els.closeDepartmentAdminModalBtn.onclick = closeDepartmentAdminModal;
    els.addDepartmentDirectBtn.onclick = createDepartmentDirect;
    els.adminDepartmentBranchSelect.onchange = renderDepartmentAdminModal;

    els.closeAccessAdminModalBtn.onclick = closeAccessAdminModal;
    els.accessInviteSaveBtn.onclick = saveInvite;

    els.closeAccessRequestModalBtn.onclick = closeAccessRequestModal;
    els.saveAccessRequestBtn.onclick = saveAccessRequest;

    els.closeMyEmployeesModalBtn.onclick = closeMyEmployeesModal;
    els.helpBtn.onclick = openHelpModal;
    els.closeHelpModalBtn.onclick = closeHelpModal;

    els.closeImportModalBtn.onclick = closeImportModal;
    els.importTemplateBtn.onclick = downloadImportTemplate;
    els.submitImportBtn.onclick = importVacationsFromCsv;

    els.modalBackdrop.addEventListener('click', e => { if (e.target === els.modalBackdrop) closeVacationModal(); });
    els.employeeModalBackdrop.addEventListener('click', e => { if (e.target === els.employeeModalBackdrop) closeEmployeeModal(); });
    els.removeEmployeeModalBackdrop.addEventListener('click', e => { if (e.target === els.removeEmployeeModalBackdrop) closeRemoveEmployeeModal(); });
    els.authModalBackdrop.addEventListener('click', e => { if (e.target === els.authModalBackdrop) closeAuthModal(); });
    els.departmentRequestModalBackdrop.addEventListener('click', e => { if (e.target === els.departmentRequestModalBackdrop) closeDepartmentRequestModal(); });
    els.departmentAdminModalBackdrop.addEventListener('click', e => { if (e.target === els.departmentAdminModalBackdrop) closeDepartmentAdminModal(); });
    els.accessAdminModalBackdrop.addEventListener('click', e => { if (e.target === els.accessAdminModalBackdrop) closeAccessAdminModal(); });
    els.accessRequestModalBackdrop.addEventListener('click', e => { if (e.target === els.accessRequestModalBackdrop) closeAccessRequestModal(); });
    els.myEmployeesModalBackdrop.addEventListener('click', e => { if (e.target === els.myEmployeesModalBackdrop) closeMyEmployeesModal(); });
    els.helpModalBackdrop.addEventListener('click', e => { if (e.target === els.helpModalBackdrop) closeHelpModal(); });
    els.importModalBackdrop.addEventListener('click', e => { if (e.target === els.importModalBackdrop) closeImportModal(); });

    [els.authEmail, els.authPassword].forEach(input => {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') signIn();
      });
    });

    window.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      closeVacationModal();
      closeEmployeeModal();
      closeRemoveEmployeeModal();
      closeAuthModal();
      closeDepartmentRequestModal();
      closeDepartmentAdminModal();
      closeAccessAdminModal();
      closeAccessRequestModal();
      closeMyEmployeesModal();
      closeHelpModal();
      closeImportModal();
    });
  }

  async function init() {
    state = ensureSeedStructure(buildEmptyState());
    createMonthsHeader();
    renderFilters();
    renderBoard();
    updateAuthUI();
    attachStaticHandlers();

    await loadStateFromCloud();
    createMonthsHeader();
    renderFilters();
    renderBoard();
    updateAuthUI();

    subscribeToCloudUpdates();
    subscribeToAuth();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init().catch(error => {
        console.error('Ошибка инициализации приложения:', error);
        if (els.status) {
          els.status.textContent = 'Приложение не запустилось. Проверь консоль браузера и подключение Firebase.';
        }
      });
    }, { once: true });
  } else {
    init().catch(error => {
      console.error('Ошибка инициализации приложения:', error);
      if (els.status) {
        els.status.textContent = 'Приложение не запустилось. Проверь консоль браузера и подключение Firebase.';
      }
    });
  }
})();
