import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  remove,
  onValue
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

(() => {
  const YEAR = 2026;
  const APP_VERSION = 2;
  const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const MONTHS_SHORT = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
  const PX_PER_DAY = 18;
  const COLLAPSED_MONTH_WIDTH = 26;
  const COLLAPSED_MONTHS_STORAGE_KEY = `vacation_schedule_collapsed_months_${YEAR}`;

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

  const LEGACY_DEFAULT_DATA = {
    groups: [
      { name: 'Сметно-договорное управление', employees: ['Козина Любовь Владимировна','Юрцева Анна Александровна','Егорова Анастасия Вадимовна','Никитина Виктория Викторовна','Шихтер Анна Викторовна','Цывунина Марина Ивановна','Лашина Юлия Сергеевна'] },
      { name: 'Финансово-экономическое управление', employees: ['Протасова Оксана Юрьевна','Алейникова Елена Игоревна','Дмитриев Дмитрий Иванович','Медведева Екатерина Алексеевна','Терещенко Валентина Александровна','Храмова Наталья Яковлевна'] },
      { name: 'Управление приемки выполненных работ', employees: ['Марчукюс Реворта Яковлевна','Лапшина Анна Сергеевна','Большакова Анна Владимировна','Сидорова Ольга Викторовна'] }
    ],
    vacations: [
      { id: crypto.randomUUID(), employee: 'Козина Любовь Владимировна', start: '2026-01-05', end: '2026-01-27', color: '#f05a2a', comment: '' },
      { id: crypto.randomUUID(), employee: 'Юрцева Анна Александровна', start: '2026-01-20', end: '2026-02-16', color: '#4aa2ec', comment: '' },
      { id: crypto.randomUUID(), employee: 'Егорова Анастасия Вадимовна', start: '2026-02-18', end: '2026-03-02', color: '#59c663', comment: '' },
      { id: crypto.randomUUID(), employee: 'Никитина Виктория Викторовна', start: '2026-03-01', end: '2026-03-24', color: '#60d2cf', comment: '' },
      { id: crypto.randomUUID(), employee: 'Шихтер Анна Викторовна', start: '2026-03-15', end: '2026-05-02', color: '#ec4dc9', comment: '' },
      { id: crypto.randomUUID(), employee: 'Лашина Юлия Сергеевна', start: '2026-05-06', end: '2026-06-12', color: '#2d63dd', comment: '' },
      { id: crypto.randomUUID(), employee: 'Протасова Оксана Юрьевна', start: '2026-02-24', end: '2026-03-10', color: '#ff1d14', comment: '' },
      { id: crypto.randomUUID(), employee: 'Алейникова Елена Игоревна', start: '2026-03-11', end: '2026-05-01', color: '#8050f2', comment: '' },
      { id: crypto.randomUUID(), employee: 'Дмитриев Дмитрий Иванович', start: '2026-01-10', end: '2026-02-11', color: '#5ec56f', comment: '' },
      { id: crypto.randomUUID(), employee: 'Терещенко Валентина Александровна', start: '2026-02-06', end: '2026-03-03', color: '#ef47db', comment: '' },
      { id: crypto.randomUUID(), employee: 'Храмова Наталья Яковлевна', start: '2026-05-05', end: '2026-06-11', color: '#efd928', comment: '' },
      { id: crypto.randomUUID(), employee: 'Марчукюс Реворта Яковлевна', start: '2026-01-29', end: '2026-03-02', color: '#41595a', comment: '' },
      { id: crypto.randomUUID(), employee: 'Лапшина Анна Сергеевна', start: '2026-02-24', end: '2026-04-03', color: '#09a94c', comment: '' },
      { id: crypto.randomUUID(), employee: 'Большакова Анна Владимировна', start: '2026-01-07', end: '2026-01-19', color: '#eb4abf', comment: '' },
      { id: crypto.randomUUID(), employee: 'Большакова Анна Владимировна', start: '2026-04-03', end: '2026-04-15', color: '#eb4abf', comment: '' },
      { id: crypto.randomUUID(), employee: 'Сидорова Ольга Викторовна', start: '2026-02-12', end: '2026-03-18', color: '#45ea06', comment: '' }
    ]
  };

  const $ = (id) => document.getElementById(id);

  const els = {
    board: $('board'),
    months: $('months'),
    namesCol: $('namesCol'),
    timelineCol: $('timelineCol'),
    timelineGrid: $('timelineGrid'),
    timelineGroups: $('timelineGroups'),
    tooltip: $('tooltip'),
    status: $('statusBox'),
    groupFilter: $('groupFilter'),
    searchInput: $('searchInput'),
    expandAllMonthsBtn: $('expandAllMonthsBtn'),

    authStatus: $('authStatus'),
    loginBtn: $('loginBtn'),
    logoutBtn: $('logoutBtn'),
    manageDepartmentsBtn: $('manageDepartmentsBtn'),
    manageAccessBtn: $('manageAccessBtn'),

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
    closeEmployeeModalBtn: $('closeEmployeeModalBtn'),
    saveEmployeeBtn: $('saveEmployeeBtn'),

    removeEmployeeModalBackdrop: $('removeEmployeeModalBackdrop'),
    removeEmployeeGroupSelect: $('removeEmployeeGroupSelect'),
    removeEmployeeSelect: $('removeEmployeeSelect'),
    closeRemoveEmployeeModalBtn: $('closeRemoveEmployeeModalBtn'),
    confirmRemoveEmployeeBtn: $('confirmRemoveEmployeeBtn'),

    authModalBackdrop: $('authModalBackdrop'),
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
    accessRoleList: $('accessRoleList'),
    closeAccessAdminModalBtn: $('closeAccessAdminModalBtn')
  };

  let state = buildEmptyState();
  let collapsedMonths = loadCollapsedMonths();
  let currentUser = null;
  let currentRoleRecord = null;
  let currentRole = 'viewer';
  let currentDepartmentIds = new Set();
  let initialSource = 'empty';
  let adminAccessSnapshot = { roles: {}, roleInvites: {} };

  function buildEmptyState() {
    return {
      meta: {
        year: YEAR,
        version: APP_VERSION,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      departments: {},
      employees: {},
      vacations: {},
      departmentRequests: {}
    };
  }

  function slugify(text) {
    return String(text || '')
      .toLowerCase()
      .trim()
      .replace(/ё/g, 'е')
      .replace(/[^a-zа-я0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50) || 'item';
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

  function emailKey(email) {
    return normalizeEmail(email).replace(/[^a-z0-9]+/g, '_');
  }

  function makeId(prefix, seed = '') {
    const safeSeed = slugify(seed);
    return `${prefix}_${safeSeed}_${crypto.randomUUID().slice(0, 8)}`;
  }

  function nowTs() {
    return Date.now();
  }

  function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function formatDateTime(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('ru-RU');
  }

  function compactName(full) {
    const parts = String(full).trim().split(/\s+/);
    if (parts.length < 3) return full;
    return `${parts[0]} ${parts[1][0]}.${parts[2][0]}.`;
  }

  function roleLabel(role) {
    if (role === 'admin') return 'Администратор';
    if (role === 'manager') return 'Руководитель';
    return 'Гость';
  }

  function statusLabel(status) {
    return {
      approved: 'Согласован',
      pending: 'На согласовании',
      rejected: 'Отклонен',
      cancelled: 'Отменен'
    }[status] || 'Согласован';
  }

  function requestStatusLabel(status) {
    return {
      pending: 'Ожидает решения',
      approved: 'Создан отдел',
      linked: 'Привязан к отделу',
      rejected: 'Отклонен'
    }[status] || 'Ожидает решения';
  }

  function loadCollapsedMonths() {
    try {
      const raw = localStorage.getItem(COLLAPSED_MONTHS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(Number.isInteger) : [];
    } catch {
      return [];
    }
  }

  function saveCollapsedMonths() {
    localStorage.setItem(COLLAPSED_MONTHS_STORAGE_KEY, JSON.stringify(collapsedMonths));
  }

  function isAdmin() {
    return currentRole === 'admin';
  }

  function isManager() {
    return currentRole === 'manager';
  }

  function canEditAnything() {
    return isAdmin() || isManager();
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

  function canManageDepartment(departmentId) {
    if (!departmentId) return false;
    if (isAdmin()) return true;
    if (!isManager()) return false;
    return currentDepartmentIds.has(departmentId);
  }

  function getDepartmentName(departmentId) {
    return state.departments?.[departmentId]?.name || 'Без отдела';
  }

  function getActiveDepartments() {
    return Object.values(state.departments || {})
      .filter(dep => dep && dep.status !== 'archived')
      .sort((a, b) => {
        const orderDiff = (a.sortOrder || 0) - (b.sortOrder || 0);
        if (orderDiff !== 0) return orderDiff;
        return String(a.name).localeCompare(String(b.name), 'ru');
      });
  }

  function getAllDepartments() {
    return Object.values(state.departments || {})
      .filter(Boolean)
      .sort((a, b) => String(a.name).localeCompare(String(b.name), 'ru'));
  }

  function getEmployees({ activeOnly = true, departmentId = null, manageableOnly = false } = {}) {
    return Object.values(state.employees || {})
      .filter(Boolean)
      .filter(emp => !activeOnly || emp.isActive !== false)
      .filter(emp => !departmentId || emp.departmentId === departmentId)
      .filter(emp => !manageableOnly || canManageDepartment(emp.departmentId))
      .filter(emp => state.departments?.[emp.departmentId] && state.departments[emp.departmentId].status !== 'archived')
      .sort((a, b) => String(a.displayName).localeCompare(String(b.displayName), 'ru'));
  }

  function getEmployeeById(employeeId) {
    return state.employees?.[employeeId] || null;
  }

  function getVacationsForEmployee(employeeId) {
    return Object.values(state.vacations || {})
      .filter(Boolean)
      .filter(vac => vac.employeeId === employeeId)
      .sort((a, b) => a.start.localeCompare(b.start));
  }

  function getDepartmentRequests() {
    return Object.values(state.departmentRequests || {})
      .filter(Boolean)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  function canManageVacation(vacation) {
    return canManageDepartment(vacation.departmentId);
  }

  function buildStateFromLegacy(legacy) {
    const nextState = buildEmptyState();
    const departmentIdByName = new Map();
    const employeeIdByComposite = new Map();

    (legacy.groups || []).forEach((group, index) => {
      const departmentId = makeId('dep', group.name);
      departmentIdByName.set(group.name, departmentId);
      nextState.departments[departmentId] = {
        id: departmentId,
        name: group.name,
        status: 'active',
        sortOrder: index + 1,
        createdAt: nowTs(),
        updatedAt: nowTs(),
        createdBy: 'system',
        updatedBy: 'system'
      };

      (group.employees || []).forEach((employeeName) => {
        const employeeId = makeId('emp', `${group.name}-${employeeName}`);
        employeeIdByComposite.set(`${group.name}||${employeeName}`, employeeId);
        nextState.employees[employeeId] = {
          id: employeeId,
          displayName: employeeName,
          departmentId,
          isActive: true,
          createdAt: nowTs(),
          updatedAt: nowTs(),
          createdBy: 'system',
          updatedBy: 'system'
        };
      });
    });

    (legacy.vacations || []).forEach((vacation) => {
      const matchingGroup = (legacy.groups || []).find(group => (group.employees || []).includes(vacation.employee));
      if (!matchingGroup) return;

      const departmentId = departmentIdByName.get(matchingGroup.name);
      const employeeId = employeeIdByComposite.get(`${matchingGroup.name}||${vacation.employee}`);
      if (!departmentId || !employeeId) return;

      const vacationId = vacation.id || makeId('vac', `${vacation.employee}-${vacation.start}`);
      nextState.vacations[vacationId] = {
        id: vacationId,
        employeeId,
        departmentId,
        start: vacation.start,
        end: vacation.end,
        color: vacation.color || '#2d63dd',
        comment: vacation.comment || '',
        status: vacation.status || 'approved',
        createdAt: nowTs(),
        updatedAt: nowTs(),
        createdBy: 'system',
        updatedBy: 'system'
      };
    });

    nextState.meta.createdAt = nowTs();
    nextState.meta.updatedAt = nowTs();
    return nextState;
  }

  function normalizeSchedulePayload(payload) {
    const base = buildEmptyState();
    return {
      meta: {
        ...base.meta,
        ...(payload?.meta || {})
      },
      departments: payload?.departments || {},
      employees: payload?.employees || {},
      vacations: payload?.vacations || {},
      departmentRequests: payload?.departmentRequests || {}
    };
  }

  async function loadStateFromCloud() {
    try {
      const [v2Snapshot, legacySnapshot] = await Promise.all([
        get(scheduleRef),
        get(legacyStateRef)
      ]);

      if (v2Snapshot.exists()) {
        const payload = v2Snapshot.val();
        if (payload && payload.departments && payload.employees && payload.vacations) {
          state = normalizeSchedulePayload(payload);
          initialSource = 'v2';
          return;
        }
      }

      if (legacySnapshot.exists()) {
        const legacy = legacySnapshot.val();
        if (legacy && Array.isArray(legacy.groups) && Array.isArray(legacy.vacations)) {
          state = buildStateFromLegacy(legacy);
          initialSource = 'legacy';
          return;
        }
      }

      state = buildStateFromLegacy(LEGACY_DEFAULT_DATA);
      initialSource = 'demo';
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      state = buildStateFromLegacy(LEGACY_DEFAULT_DATA);
      initialSource = 'demo';
    }
  }

  async function saveFullStateToCloud() {
    const payload = normalizeSchedulePayload({
      ...state,
      meta: {
        ...state.meta,
        year: YEAR,
        version: APP_VERSION,
        updatedAt: nowTs()
      }
    });

    await set(scheduleRef, payload);
    state = payload;
  }

  async function updateMetaTimestamp() {
    try {
      await update(ref(db, 'scheduleV2/meta'), {
        year: YEAR,
        version: APP_VERSION,
        updatedAt: nowTs()
      });
    } catch (error) {
      console.error('Ошибка обновления meta:', error);
    }
  }

  async function ensureScheduleInitialized() {
    const snapshot = await get(scheduleRef);
    if (snapshot.exists()) return;
    if (!isAdmin()) return;
    await saveFullStateToCloud();
    initialSource = 'v2';
  }

  async function loadMyRole(uid) {
    try {
      const snapshot = await get(ref(db, `roles/${uid}`));
      if (!snapshot.exists()) return null;
      return snapshot.val() || null;
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

    return null;
  }

  function applyRoleRecord(roleRecord) {
    currentRoleRecord = roleRecord;
    currentRole = roleRecord?.role || 'viewer';
    currentDepartmentIds = new Set(Object.keys(roleRecord?.departmentIds || {}).filter(depId => roleRecord.departmentIds[depId] === true));
  }

  function daysInMonth(monthIndex) {
    return new Date(YEAR, monthIndex + 1, 0).getDate();
  }

  function isMonthCollapsed(monthIndex) {
    return Array.isArray(collapsedMonths) && collapsedMonths.includes(monthIndex);
  }

  function getMonthWidth(monthIndex) {
    return isMonthCollapsed(monthIndex)
      ? COLLAPSED_MONTH_WIDTH
      : daysInMonth(monthIndex) * PX_PER_DAY;
  }

  function getMonthOffset(monthIndex) {
    let offset = 0;
    for (let i = 0; i < monthIndex; i++) {
      offset += getMonthWidth(i);
    }
    return offset;
  }

  function getDaysInYear() {
    return 365;
  }

  function dayIndex(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const start = new Date(`${YEAR}-01-01T00:00:00`);
    return Math.floor((d - start) / 86400000);
  }

  function offsetForDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const monthIndex = d.getMonth();
    const day = d.getDate() - 1;
    const baseOffset = getMonthOffset(monthIndex);
    if (isMonthCollapsed(monthIndex)) return baseOffset;
    return baseOffset + day * PX_PER_DAY;
  }

  function offsetForDayNumber(day) {
    if (day >= getDaysInYear()) {
      return MONTHS.reduce((sum, _, idx) => sum + getMonthWidth(idx), 0);
    }

    const date = new Date(`${YEAR}-01-01T00:00:00`);
    date.setDate(date.getDate() + day);
    const monthIndex = date.getMonth();
    const dayInMonth = date.getDate() - 1;
    const baseOffset = getMonthOffset(monthIndex);
    return isMonthCollapsed(monthIndex) ? baseOffset : baseOffset + dayInMonth * PX_PER_DAY;
  }

  function durationWidth(startStr, endStr) {
    const start = new Date(startStr + 'T00:00:00');
    const end = new Date(endStr + 'T00:00:00');
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

  function formatTooltip(vac) {
    const employee = getEmployeeById(vac.employeeId);
    const s = new Date(vac.start + 'T00:00:00');
    const e = new Date(vac.end + 'T00:00:00');
    const status = vac.status && vac.status !== 'approved' ? ` · ${statusLabel(vac.status)}` : '';
    const comment = vac.comment ? ` · ${vac.comment}` : '';
    return `${compactName(employee?.displayName || 'Сотрудник')} ${MONTHS_SHORT[s.getMonth()]} ${s.getDate()}-${MONTHS_SHORT[e.getMonth()]} ${e.getDate()}${status}${comment}`;
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
      month.title = collapsed ? `${name} — свернут, нажмите чтобы развернуть` : '';

      if (collapsed) {
        month.innerHTML = `
          <button class="month-collapse-pill" type="button" data-month="${monthIndex}" title="Развернуть ${name}" aria-label="Развернуть ${name}">›</button>
        `;
      } else {
        month.innerHTML = `
          <div class="month-head">
            <div class="month-name">${name}</div>
            <button class="month-toggle-btn" type="button" data-month="${monthIndex}" title="Свернуть ${name}" aria-label="Свернуть ${name}">×</button>
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
      btn.addEventListener('click', async () => {
        const monthIndex = Number(btn.dataset.month);
        await toggleMonth(monthIndex);
      });
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

  async function toggleMonth(monthIndex) {
    if (collapsedMonths.includes(monthIndex)) {
      collapsedMonths = collapsedMonths.filter(item => item !== monthIndex);
    } else {
      collapsedMonths = [...collapsedMonths, monthIndex].sort((a, b) => a - b);
    }

    saveCollapsedMonths();
    createMonthsHeader();
    renderBoard();
  }

  async function expandAllMonths() {
    collapsedMonths = [];
    saveCollapsedMonths();
    createMonthsHeader();
    renderBoard();
  }

  function getFilteredGroups() {
    const selectedDepartmentId = els.groupFilter.value || 'all';
    const q = normalizeText(els.searchInput.value);

    return getActiveDepartments()
      .filter(dep => selectedDepartmentId === 'all' || dep.id === selectedDepartmentId)
      .map(dep => ({
        department: dep,
        employees: getEmployees({ departmentId: dep.id }).filter(emp => !q || normalizeText(emp.displayName).includes(q))
      }))
      .filter(group => group.employees.length > 0);
  }

  function renderFilters() {
    const previousGroup = els.groupFilter.value || 'all';
    const departments = getActiveDepartments();

    els.groupFilter.innerHTML = `<option value="all">Все отделы</option>${departments
      .map(dep => `<option value="${escapeHtml(dep.id)}">${escapeHtml(dep.name)}</option>`)
      .join('')}`;

    const availableValues = ['all', ...departments.map(dep => dep.id)];
    els.groupFilter.value = availableValues.includes(previousGroup) ? previousGroup : 'all';

    renderVacationEmployeeOptions();
    renderRemoveEmployeeDepartmentOptions();
    renderEmployeeDepartmentOptions();
  }

  function renderVacationEmployeeOptions() {
    const employees = getEmployees({ manageableOnly: !isAdmin() }).filter(emp => isAdmin() || canManageDepartment(emp.departmentId));

    if (employees.length === 0) {
      els.employeeSelect.innerHTML = '<option value="">Нет доступных сотрудников</option>';
      return;
    }

    els.employeeSelect.innerHTML = employees
      .map(emp => `<option value="${escapeHtml(emp.id)}">${escapeHtml(emp.displayName)} — ${escapeHtml(getDepartmentName(emp.departmentId))}</option>`)
      .join('');
  }

  function renderEmployeeDepartmentOptions(query = els.employeeDepartmentSearch.value) {
    const normalizedQuery = normalizeText(query);
    const departments = getActiveDepartments().filter(dep => isAdmin() || canManageDepartment(dep.id));
    const filtered = departments.filter(dep => !normalizedQuery || normalizeText(dep.name).includes(normalizedQuery));

    if (filtered.length === 0) {
      els.employeeDepartmentSelect.innerHTML = '<option value="">Отдел не найден</option>';
      return;
    }

    els.employeeDepartmentSelect.innerHTML = filtered
      .map(dep => `<option value="${escapeHtml(dep.id)}">${escapeHtml(dep.name)}</option>`)
      .join('');
  }

  function renderRemoveEmployeeDepartmentOptions() {
    const previousValue = els.removeEmployeeGroupSelect.value || '';
    const departments = getActiveDepartments().filter(dep => isAdmin() || canManageDepartment(dep.id));

    if (departments.length === 0) {
      els.removeEmployeeGroupSelect.innerHTML = '<option value="">Нет доступных отделов</option>';
      els.removeEmployeeSelect.innerHTML = '<option value="">Нет сотрудников</option>';
      return;
    }

    els.removeEmployeeGroupSelect.innerHTML = departments
      .map(dep => `<option value="${escapeHtml(dep.id)}">${escapeHtml(dep.name)}</option>`)
      .join('');

    const values = departments.map(dep => dep.id);
    els.removeEmployeeGroupSelect.value = values.includes(previousValue) ? previousValue : departments[0].id;
    refreshRemoveEmployeeSelect();
  }

  function refreshRemoveEmployeeSelect() {
    const departmentId = els.removeEmployeeGroupSelect.value;
    const employees = getEmployees({ departmentId, manageableOnly: !isAdmin() });

    if (employees.length === 0) {
      els.removeEmployeeSelect.innerHTML = '<option value="">Нет сотрудников</option>';
      return;
    }

    els.removeEmployeeSelect.innerHTML = employees
      .map(emp => `<option value="${escapeHtml(emp.id)}">${escapeHtml(emp.displayName)}</option>`)
      .join('');
  }

  function renderBoard() {
    const groups = getFilteredGroups();
    els.namesCol.innerHTML = '';
    els.timelineGroups.innerHTML = '';

    let visibleEmployees = 0;
    let visibleVacations = 0;

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
        rowName.textContent = employee.displayName;
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

    const hint = canEditAnything()
      ? 'Двойной клик по полоске — редактирование доступного отпуска'
      : 'Для редактирования войдите как руководитель';

    els.status.textContent = `Сотрудников: ${visibleEmployees} · Отпусков: ${visibleVacations} · ${hint}`;
  }

  function addDepartmentOverlapLines(employees, bodyTimeline) {
    const employeeIds = new Set(employees.map(emp => emp.id));
    const vacations = Object.values(state.vacations || {})
      .filter(Boolean)
      .filter(v => employeeIds.has(v.employeeId))
      .map(v => ({ start: dayIndex(v.start), end: dayIndex(v.end) }));

    if (vacations.length < 2) return;

    const diff = new Array(getDaysInYear() + 1).fill(0);
    vacations.forEach(v => {
      diff[v.start] += 1;
      if (v.end + 1 < diff.length) diff[v.end + 1] -= 1;
    });

    let active = 0;
    let overlapStarted = false;

    for (let day = 0; day < getDaysInYear(); day++) {
      active += diff[day];
      const hasOverlap = active >= 2;

      if (hasOverlap && !overlapStarted) {
        const line = document.createElement('div');
        line.className = 'overlap-line';
        line.style.left = `${offsetForDayNumber(day)}px`;
        bodyTimeline.appendChild(line);
        overlapStarted = true;
      }

      if (!hasOverlap && overlapStarted) {
        const line = document.createElement('div');
        line.className = 'overlap-line';
        line.style.left = `${offsetForDayNumber(day)}px`;
        bodyTimeline.appendChild(line);
        overlapStarted = false;
      }
    }

    if (overlapStarted) {
      const line = document.createElement('div');
      line.className = 'overlap-line';
      line.style.left = `${offsetForDayNumber(getDaysInYear())}px`;
      bodyTimeline.appendChild(line);
    }
  }

  function updateAuthUI() {
    if (currentUser) {
      const email = currentUser.email ? ` · ${currentUser.email}` : '';
      els.authStatus.textContent = `${roleLabel(currentRole)}${email}`;
    } else {
      els.authStatus.textContent = 'Гость';
    }

    els.loginBtn.hidden = !!currentUser;
    els.logoutBtn.hidden = !currentUser;

    const canAddVacation = isAdmin() || (isManager() && getEmployees({ manageableOnly: true }).length > 0);
    const canManageEmployees = isAdmin() || (isManager() && [...currentDepartmentIds].length > 0);

    els.addBtn.hidden = !canAddVacation;
    els.resetBtn.hidden = !canResetAll();
    els.addEmployeeToolbarBtn.hidden = !canManageEmployees;
    els.removeEmployeeToolbarBtn.hidden = !canManageEmployees;
    els.manageDepartmentsBtn.hidden = !canManageDepartments();
    els.manageAccessBtn.hidden = !canManageAccess();

    renderFilters();
    renderBoard();
  }

  function openVacationModal(vacation = null) {
    if (!canEditAnything()) return;

    renderVacationEmployeeOptions();
    els.modalBackdrop.classList.add('open');

    if (vacation) {
      els.modalTitle.textContent = 'Редактировать отпуск';
      els.vacationId.value = vacation.id;
      els.employeeSelect.value = vacation.employeeId;
      els.startDate.value = vacation.start;
      els.endDate.value = vacation.end;
      els.vacationColor.value = vacation.color || '#2d63dd';
      els.vacationStatus.value = vacation.status || 'approved';
      els.comment.value = vacation.comment || '';
      els.deleteBtn.hidden = false;
    } else {
      els.modalTitle.textContent = 'Добавить отпуск';
      els.vacationId.value = '';
      els.employeeSelect.selectedIndex = 0;
      els.startDate.value = `${YEAR}-01-15`;
      els.endDate.value = `${YEAR}-01-28`;
      els.vacationColor.value = '#2d63dd';
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
    renderEmployeeDepartmentOptions('');
    els.employeeDepartmentSearch.value = '';
    els.newEmployeeName.value = '';
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
    els.authEmail.value = '';
    els.authPassword.value = '';
    els.authError.textContent = '';
    els.authModalBackdrop.classList.add('open');
  }

  function closeAuthModal() {
    els.authModalBackdrop.classList.remove('open');
  }

  function openDepartmentRequestModal(prefill = '') {
    if (!currentUser) {
      alert('Чтобы предложить новый отдел, войдите в систему.');
      return;
    }
    els.departmentRequestName.value = String(prefill || '').trim();
    els.departmentRequestError.textContent = '';
    els.departmentRequestModalBackdrop.classList.add('open');
  }

  function closeDepartmentRequestModal() {
    els.departmentRequestModalBackdrop.classList.remove('open');
  }

  function openDepartmentAdminModal() {
    if (!canManageDepartments()) return;
    renderDepartmentAdminModal();
    els.departmentAdminModalBackdrop.classList.add('open');
  }

  function closeDepartmentAdminModal() {
    els.departmentAdminModalBackdrop.classList.remove('open');
  }

  async function openAccessAdminModal() {
    if (!canManageAccess()) return;
    await loadAdminAccessData();
    renderAccessAdminModal();
    els.accessAdminModalBackdrop.classList.add('open');
  }

  function closeAccessAdminModal() {
    els.accessAdminModalBackdrop.classList.remove('open');
  }

  function validateVacationForm(vacation, skipId = '') {
    if (!vacation.employeeId || !vacation.start || !vacation.end) return 'Заполните все обязательные поля';
    if (vacation.end < vacation.start) return 'Дата окончания не может быть раньше даты начала';
    if (!vacation.start.startsWith(`${YEAR}-`) || !vacation.end.startsWith(`${YEAR}-`)) return `Диапазон должен быть внутри ${YEAR} года`;

    const employee = getEmployeeById(vacation.employeeId);
    if (!employee) return 'Сотрудник не найден';
    if (!canManageDepartment(employee.departmentId)) return 'Недостаточно прав для этого отдела';

    const overlap = Object.values(state.vacations || {}).find(existing =>
      existing.employeeId === vacation.employeeId &&
      existing.id !== skipId &&
      !(vacation.end < existing.start || vacation.start > existing.end)
    );

    if (overlap) {
      return `Пересечение с существующим отпуском: ${formatTooltip(overlap)}`;
    }

    return '';
  }

  async function saveVacation() {
    if (!canEditAnything()) {
      alert('Недостаточно прав для редактирования');
      return;
    }

    const employee = getEmployeeById(els.employeeSelect.value);
    if (!employee) {
      alert('Выберите сотрудника');
      return;
    }

    const vacation = {
      id: els.vacationId.value || makeId('vac', `${employee.displayName}-${els.startDate.value}`),
      employeeId: employee.id,
      departmentId: employee.departmentId,
      start: els.startDate.value,
      end: els.endDate.value,
      color: els.vacationColor.value,
      status: els.vacationStatus.value,
      comment: els.comment.value.trim(),
      createdAt: state.vacations?.[els.vacationId.value]?.createdAt || nowTs(),
      createdBy: state.vacations?.[els.vacationId.value]?.createdBy || (currentUser?.uid || 'system'),
      updatedAt: nowTs(),
      updatedBy: currentUser?.uid || 'system'
    };

    const error = validateVacationForm(vacation, els.vacationId.value);
    if (error) {
      alert(error);
      return;
    }

    try {
      await set(ref(db, `scheduleV2/vacations/${vacation.id}`), vacation);
      await updateMetaTimestamp();
      closeVacationModal();
    } catch (error) {
      console.error('Ошибка сохранения отпуска:', error);
      alert('Не удалось сохранить отпуск');
    }
  }

  async function deleteVacation() {
    const vacationId = els.vacationId.value;
    if (!vacationId) return;

    const vacation = state.vacations?.[vacationId];
    if (!vacation || !canManageVacation(vacation)) {
      alert('Недостаточно прав для удаления');
      return;
    }

    if (!confirm('Удалить этот отпуск?')) return;

    try {
      await remove(ref(db, `scheduleV2/vacations/${vacationId}`));
      await updateMetaTimestamp();
      closeVacationModal();
    } catch (error) {
      console.error('Ошибка удаления отпуска:', error);
      alert('Не удалось удалить отпуск');
    }
  }

  async function resetAllVacations() {
    if (!canResetAll()) {
      alert('Полный сброс доступен только администратору');
      return;
    }

    if (!confirm('Удалить вообще все отпуска? Это действие нельзя отменить.')) return;

    try {
      await set(ref(db, 'scheduleV2/vacations'), {});
      await updateMetaTimestamp();
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
    const fullName = els.newEmployeeName.value.trim().replace(/\s+/g, ' ');

    if (!departmentId || !fullName) {
      alert('Укажите отдел и ФИО сотрудника');
      return;
    }

    if (!canManageDepartment(departmentId)) {
      alert('Недостаточно прав для выбранного отдела');
      return;
    }

    const exists = getEmployees({ departmentId, activeOnly: false }).some(emp => normalizeText(emp.displayName) === normalizeText(fullName));
    if (exists) {
      alert('Такой сотрудник уже есть в выбранном отделе');
      return;
    }

    const employeeId = makeId('emp', `${departmentId}-${fullName}`);
    const employee = {
      id: employeeId,
      displayName: fullName,
      departmentId,
      isActive: true,
      createdAt: nowTs(),
      updatedAt: nowTs(),
      createdBy: currentUser?.uid || 'system',
      updatedBy: currentUser?.uid || 'system'
    };

    try {
      await set(ref(db, `scheduleV2/employees/${employeeId}`), employee);
      await updateMetaTimestamp();
      closeEmployeeModal();
    } catch (error) {
      console.error('Ошибка добавления сотрудника:', error);
      alert('Не удалось добавить сотрудника');
    }
  }

  async function removeEmployeeByModal() {
    if (!canEditAnything()) {
      alert('Недостаточно прав');
      return;
    }

    const employeeId = els.removeEmployeeSelect.value;
    const employee = getEmployeeById(employeeId);
    if (!employee) {
      alert('Сотрудник не найден');
      return;
    }

    if (!canManageDepartment(employee.departmentId)) {
      alert('Недостаточно прав для удаления этого сотрудника');
      return;
    }

    if (!confirm(`Удалить сотрудника «${employee.displayName}» и все его отпуска?`)) return;

    const updates = {};
    updates[`scheduleV2/employees/${employeeId}`] = null;

    Object.values(state.vacations || {}).forEach(vacation => {
      if (vacation.employeeId === employeeId) {
        updates[`scheduleV2/vacations/${vacation.id}`] = null;
      }
    });

    updates['scheduleV2/meta/updatedAt'] = nowTs();
    updates['scheduleV2/meta/year'] = YEAR;
    updates['scheduleV2/meta/version'] = APP_VERSION;

    try {
      await update(ref(db), updates);
      closeRemoveEmployeeModal();
    } catch (error) {
      console.error('Ошибка удаления сотрудника:', error);
      alert('Не удалось удалить сотрудника');
    }
  }

  async function createDepartmentRequest() {
    if (!currentUser) {
      els.departmentRequestError.textContent = 'Нужно войти в систему';
      return;
    }

    const requestedName = els.departmentRequestName.value.trim().replace(/\s+/g, ' ');
    const normalizedName = normalizeText(requestedName);

    if (!requestedName) {
      els.departmentRequestError.textContent = 'Введите название отдела';
      return;
    }

    const existingDepartment = getAllDepartments().find(dep => normalizeText(dep.name) === normalizedName);
    if (existingDepartment) {
      els.departmentRequestError.textContent = 'Такой отдел уже существует';
      return;
    }

    const existingPending = getDepartmentRequests().find(req => req.status === 'pending' && req.normalizedName === normalizedName);
    if (existingPending) {
      els.departmentRequestError.textContent = 'Такая заявка уже отправлена';
      return;
    }

    const requestId = makeId('req', requestedName);
    const requestPayload = {
      id: requestId,
      requestedName,
      normalizedName,
      status: 'pending',
      requestedBy: currentUser.uid,
      requestedByEmail: normalizeEmail(currentUser.email || ''),
      createdAt: nowTs(),
      updatedAt: nowTs()
    };

    try {
      await set(ref(db, `scheduleV2/departmentRequests/${requestId}`), requestPayload);
      await updateMetaTimestamp();
      closeDepartmentRequestModal();
      alert('Заявка на новый отдел отправлена');
    } catch (error) {
      console.error('Ошибка создания заявки:', error);
      els.departmentRequestError.textContent = 'Не удалось отправить заявку';
    }
  }

  async function addDepartmentDirect() {
    if (!canManageDepartments()) return;

    const name = els.adminDepartmentName.value.trim().replace(/\s+/g, ' ');
    if (!name) {
      els.adminDepartmentError.textContent = 'Введите название отдела';
      return;
    }

    const duplicate = getAllDepartments().find(dep => normalizeText(dep.name) === normalizeText(name));
    if (duplicate) {
      els.adminDepartmentError.textContent = 'Такой отдел уже есть';
      return;
    }

    const departmentId = makeId('dep', name);
    const payload = {
      id: departmentId,
      name,
      status: 'active',
      sortOrder: getAllDepartments().length + 1,
      createdAt: nowTs(),
      updatedAt: nowTs(),
      createdBy: currentUser?.uid || 'system',
      updatedBy: currentUser?.uid || 'system'
    };

    try {
      await set(ref(db, `scheduleV2/departments/${departmentId}`), payload);
      await updateMetaTimestamp();
      els.adminDepartmentName.value = '';
      els.adminDepartmentError.textContent = '';
    } catch (error) {
      console.error('Ошибка добавления отдела:', error);
      els.adminDepartmentError.textContent = 'Не удалось создать отдел';
    }
  }

  function renderDepartmentAdminModal() {
    els.adminDepartmentError.textContent = '';
    els.departmentList.innerHTML = '';
    els.departmentRequestsList.innerHTML = '';

    const departments = getAllDepartments();
    if (departments.length === 0) {
      els.departmentList.innerHTML = '<div class="admin-empty">Отделов пока нет</div>';
    } else {
      departments.forEach(dep => {
        const item = document.createElement('div');
        item.className = 'admin-row';
        item.innerHTML = `
          <div class="admin-row-main">
            <input class="admin-inline-input" data-department-input="${dep.id}" value="${escapeHtml(dep.name)}">
            <span class="badge ${dep.status === 'archived' ? 'badge-muted' : 'badge-ok'}">${dep.status === 'archived' ? 'Архив' : 'Активен'}</span>
          </div>
          <div class="admin-row-actions">
            <button type="button" class="mini-btn" data-action="rename-department" data-department-id="${dep.id}">Сохранить</button>
            <button type="button" class="mini-btn ${dep.status === 'archived' ? '' : 'danger-soft'}" data-action="toggle-department" data-department-id="${dep.id}">${dep.status === 'archived' ? 'Восстановить' : 'В архив'}</button>
          </div>
        `;
        els.departmentList.appendChild(item);
      });
    }

    const requests = getDepartmentRequests();
    if (requests.length === 0) {
      els.departmentRequestsList.innerHTML = '<div class="admin-empty">Заявок пока нет</div>';
    } else {
      requests.forEach(req => {
        const departmentOptions = getActiveDepartments()
          .map(dep => `<option value="${escapeHtml(dep.id)}">${escapeHtml(dep.name)}</option>`)
          .join('');

        const item = document.createElement('div');
        item.className = 'admin-row request-row';
        item.innerHTML = `
          <div class="admin-row-main request-main">
            <div>
              <div class="request-title">${escapeHtml(req.requestedName)}</div>
              <div class="request-meta">${escapeHtml(req.requestedByEmail || 'без email')} · ${formatDateTime(req.createdAt)}</div>
            </div>
            <span class="badge ${req.status === 'pending' ? 'badge-warn' : req.status === 'rejected' ? 'badge-danger' : 'badge-ok'}">${escapeHtml(requestStatusLabel(req.status))}</span>
          </div>
          ${req.status === 'pending' ? `
            <div class="request-controls">
              <select data-request-link-select="${req.id}">
                <option value="">Привязать к существующему отделу</option>
                ${departmentOptions}
              </select>
              <div class="admin-row-actions">
                <button type="button" class="mini-btn" data-action="approve-request" data-request-id="${req.id}">Создать отдел</button>
                <button type="button" class="mini-btn" data-action="link-request" data-request-id="${req.id}">Привязать</button>
                <button type="button" class="mini-btn danger-soft" data-action="reject-request" data-request-id="${req.id}">Отклонить</button>
              </div>
            </div>
          ` : req.linkedDepartmentId ? `<div class="request-meta">Отдел: ${escapeHtml(getDepartmentName(req.linkedDepartmentId))}</div>` : ''}
        `;
        els.departmentRequestsList.appendChild(item);
      });
    }
  }

  async function renameDepartment(departmentId) {
    const input = els.departmentList.querySelector(`[data-department-input="${departmentId}"]`);
    if (!input) return;
    const name = input.value.trim().replace(/\s+/g, ' ');
    if (!name) {
      alert('Название отдела не может быть пустым');
      return;
    }

    const duplicate = getAllDepartments().find(dep => dep.id !== departmentId && normalizeText(dep.name) === normalizeText(name));
    if (duplicate) {
      alert('Отдел с таким названием уже существует');
      return;
    }

    try {
      await update(ref(db, `scheduleV2/departments/${departmentId}`), {
        name,
        updatedAt: nowTs(),
        updatedBy: currentUser?.uid || 'system'
      });
      await updateMetaTimestamp();
    } catch (error) {
      console.error('Ошибка переименования отдела:', error);
      alert('Не удалось сохранить название отдела');
    }
  }

  async function toggleDepartmentStatus(departmentId) {
    const department = state.departments?.[departmentId];
    if (!department) return;

    const nextStatus = department.status === 'archived' ? 'active' : 'archived';
    const message = nextStatus === 'archived'
      ? `Перевести отдел «${department.name}» в архив?`
      : `Восстановить отдел «${department.name}»?`;

    if (!confirm(message)) return;

    try {
      await update(ref(db, `scheduleV2/departments/${departmentId}`), {
        status: nextStatus,
        updatedAt: nowTs(),
        updatedBy: currentUser?.uid || 'system'
      });
      await updateMetaTimestamp();
    } catch (error) {
      console.error('Ошибка смены статуса отдела:', error);
      alert('Не удалось обновить отдел');
    }
  }

  async function approveDepartmentRequestAsNew(requestId) {
    const request = state.departmentRequests?.[requestId];
    if (!request || request.status !== 'pending') return;

    const departmentId = makeId('dep', request.requestedName);
    const payload = {
      id: departmentId,
      name: request.requestedName,
      status: 'active',
      sortOrder: getAllDepartments().length + 1,
      createdAt: nowTs(),
      updatedAt: nowTs(),
      createdBy: currentUser?.uid || 'system',
      updatedBy: currentUser?.uid || 'system'
    };

    const updates = {};
    updates[`scheduleV2/departments/${departmentId}`] = payload;
    updates[`scheduleV2/departmentRequests/${requestId}/status`] = 'approved';
    updates[`scheduleV2/departmentRequests/${requestId}/linkedDepartmentId`] = departmentId;
    updates[`scheduleV2/departmentRequests/${requestId}/reviewedAt`] = nowTs();
    updates[`scheduleV2/departmentRequests/${requestId}/reviewedBy`] = currentUser?.uid || 'system';
    updates[`scheduleV2/departmentRequests/${requestId}/updatedAt`] = nowTs();
    updates['scheduleV2/meta/updatedAt'] = nowTs();
    updates['scheduleV2/meta/year'] = YEAR;
    updates['scheduleV2/meta/version'] = APP_VERSION;

    try {
      await update(ref(db), updates);
    } catch (error) {
      console.error('Ошибка подтверждения заявки:', error);
      alert('Не удалось создать отдел по заявке');
    }
  }

  async function linkDepartmentRequest(requestId, departmentId) {
    const request = state.departmentRequests?.[requestId];
    if (!request || request.status !== 'pending') return;
    if (!departmentId) {
      alert('Выберите отдел для привязки');
      return;
    }

    try {
      await update(ref(db, `scheduleV2/departmentRequests/${requestId}`), {
        status: 'linked',
        linkedDepartmentId: departmentId,
        reviewedAt: nowTs(),
        reviewedBy: currentUser?.uid || 'system',
        updatedAt: nowTs()
      });
      await updateMetaTimestamp();
    } catch (error) {
      console.error('Ошибка привязки заявки:', error);
      alert('Не удалось привязать заявку');
    }
  }

  async function rejectDepartmentRequest(requestId) {
    const request = state.departmentRequests?.[requestId];
    if (!request || request.status !== 'pending') return;
    if (!confirm(`Отклонить заявку «${request.requestedName}»?`)) return;

    try {
      await update(ref(db, `scheduleV2/departmentRequests/${requestId}`), {
        status: 'rejected',
        reviewedAt: nowTs(),
        reviewedBy: currentUser?.uid || 'system',
        updatedAt: nowTs()
      });
      await updateMetaTimestamp();
    } catch (error) {
      console.error('Ошибка отклонения заявки:', error);
      alert('Не удалось отклонить заявку');
    }
  }

  async function loadAdminAccessData() {
    const [rolesSnapshot, invitesSnapshot] = await Promise.all([
      get(rolesRootRef),
      get(invitesRootRef)
    ]);

    adminAccessSnapshot = {
      roles: rolesSnapshot.exists() ? rolesSnapshot.val() || {} : {},
      roleInvites: invitesSnapshot.exists() ? invitesSnapshot.val() || {} : {}
    };
  }

  function renderInviteDepartmentCheckboxes(selected = {}) {
    const departments = getActiveDepartments();
    if (departments.length === 0) {
      els.accessInviteDepartments.innerHTML = '<div class="admin-empty">Сначала создайте отделы</div>';
      return;
    }

    els.accessInviteDepartments.innerHTML = departments
      .map(dep => `
        <label class="checkbox-chip">
          <input type="checkbox" value="${escapeHtml(dep.id)}" ${selected[dep.id] ? 'checked' : ''}>
          <span>${escapeHtml(dep.name)}</span>
        </label>
      `)
      .join('');
  }

  function renderAccessAdminModal() {
    els.accessInviteError.textContent = '';
    els.accessInviteEmail.value = '';
    els.accessInviteSaveBtn.dataset.editKey = '';
    renderInviteDepartmentCheckboxes({});

    const invites = Object.values(adminAccessSnapshot.roleInvites || {})
      .filter(Boolean)
      .sort((a, b) => String(a.email).localeCompare(String(b.email), 'ru'));

    const roles = Object.entries(adminAccessSnapshot.roles || {})
      .map(([uid, value]) => ({ uid, ...(value || {}) }))
      .sort((a, b) => String(a.email || a.uid).localeCompare(String(b.email || b.uid), 'ru'));

    if (invites.length === 0) {
      els.accessInviteList.innerHTML = '<div class="admin-empty">Приглашений пока нет</div>';
    } else {
      els.accessInviteList.innerHTML = invites.map(invite => `
        <div class="admin-row">
          <div class="admin-row-main">
            <div>
              <div class="request-title">${escapeHtml(invite.email)}</div>
              <div class="request-meta">Отделы: ${escapeHtml(Object.keys(invite.departmentIds || {}).map(getDepartmentName).join(', ') || 'не выбраны')}</div>
            </div>
            <span class="badge ${invite.isActive === false ? 'badge-muted' : 'badge-ok'}">${invite.isActive === false ? 'Отключено' : 'Активно'}</span>
          </div>
          <div class="admin-row-actions">
            <button type="button" class="mini-btn" data-action="edit-invite" data-email-key="${escapeHtml(emailKey(invite.email))}">Изменить</button>
            <button type="button" class="mini-btn danger-soft" data-action="revoke-invite" data-email-key="${escapeHtml(emailKey(invite.email))}">Отозвать</button>
          </div>
        </div>
      `).join('');
    }

    if (roles.length === 0) {
      els.accessRoleList.innerHTML = '<div class="admin-empty">Назначенных ролей пока нет</div>';
    } else {
      els.accessRoleList.innerHTML = roles.map(role => `
        <div class="admin-row">
          <div class="admin-row-main">
            <div>
              <div class="request-title">${escapeHtml(role.email || role.uid)}</div>
              <div class="request-meta">${escapeHtml(roleLabel(role.role))} · Отделы: ${escapeHtml(Object.keys(role.departmentIds || {}).map(getDepartmentName).join(', ') || 'все')}</div>
            </div>
            <span class="badge ${role.role === 'admin' ? 'badge-warn' : 'badge-ok'}">${escapeHtml(role.role)}</span>
          </div>
          <div class="admin-row-actions">
            ${role.role === 'manager' ? `<button type="button" class="mini-btn danger-soft" data-action="revoke-role" data-uid="${escapeHtml(role.uid)}">Снять доступ</button>` : ''}
          </div>
        </div>
      `).join('');
    }
  }

  function collectSelectedInviteDepartmentIds() {
    const result = {};
    els.accessInviteDepartments.querySelectorAll('input[type="checkbox"]:checked').forEach(input => {
      result[input.value] = true;
    });
    return result;
  }

  async function saveManagerInvite(prefillKey = null) {
    if (!canManageAccess()) return;

    const email = normalizeEmail(els.accessInviteEmail.value);
    const departmentIds = collectSelectedInviteDepartmentIds();

    if (!email) {
      els.accessInviteError.textContent = 'Введите email';
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      els.accessInviteError.textContent = 'Некорректный email';
      return;
    }

    if (Object.keys(departmentIds).length === 0) {
      els.accessInviteError.textContent = 'Выберите хотя бы один отдел';
      return;
    }

    const key = prefillKey || emailKey(email);
    const payload = {
      email,
      role: 'manager',
      departmentIds,
      isActive: true,
      createdAt: adminAccessSnapshot.roleInvites?.[key]?.createdAt || nowTs(),
      updatedAt: nowTs(),
      createdBy: adminAccessSnapshot.roleInvites?.[key]?.createdBy || currentUser?.uid || 'system',
      updatedBy: currentUser?.uid || 'system'
    };

    try {
      await set(ref(db, `roleInvites/${key}`), payload);

      const matchingRoleEntry = Object.entries(adminAccessSnapshot.roles || {}).find(([, value]) => normalizeEmail(value?.email) === email);
      if (matchingRoleEntry) {
        const [uid, roleData] = matchingRoleEntry;
        if (roleData.role === 'manager') {
          await update(ref(db, `roles/${uid}`), {
            departmentIds,
            email,
            inviteKey: key,
            source: 'invite',
            updatedAt: nowTs()
          });
        }
      }

      await loadAdminAccessData();
      renderAccessAdminModal();
    } catch (error) {
      console.error('Ошибка сохранения доступа:', error);
      els.accessInviteError.textContent = 'Не удалось сохранить доступ';
    }
  }

  async function startEditingInvite(emailKeyValue) {
    const invite = adminAccessSnapshot.roleInvites?.[emailKeyValue];
    if (!invite) return;
    els.accessInviteEmail.value = invite.email || '';
    renderInviteDepartmentCheckboxes(invite.departmentIds || {});
    els.accessInviteSaveBtn.dataset.editKey = emailKeyValue;
  }

  async function revokeInvite(emailKeyValue) {
    const invite = adminAccessSnapshot.roleInvites?.[emailKeyValue];
    if (!invite) return;
    if (!confirm(`Отозвать приглашение для ${invite.email}?`)) return;

    try {
      await remove(ref(db, `roleInvites/${emailKeyValue}`));
      await loadAdminAccessData();
      renderAccessAdminModal();
    } catch (error) {
      console.error('Ошибка отзыва приглашения:', error);
      alert('Не удалось отозвать приглашение');
    }
  }

  async function revokeManagerRole(uid) {
    const role = adminAccessSnapshot.roles?.[uid];
    if (!role || role.role !== 'manager') return;
    if (!confirm(`Снять права руководителя у ${role.email || uid}?`)) return;

    try {
      await remove(ref(db, `roles/${uid}`));
      await loadAdminAccessData();
      renderAccessAdminModal();
    } catch (error) {
      console.error('Ошибка отзыва роли:', error);
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
      await signInWithEmailAndPassword(auth, email, password);
      closeAuthModal();
    } catch (error) {
      console.error('Ошибка входа:', error);
      els.authError.textContent = 'Не удалось войти. Проверьте email и пароль.';
    }
  }

  async function registerAccount() {
    const email = normalizeEmail(els.authEmail.value);
    const password = els.authPassword.value;

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
      await createUserWithEmailAndPassword(auth, email, password);
      closeAuthModal();
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      els.authError.textContent = 'Не удалось создать аккаунт. Возможно, email уже используется.';
    }
  }

  async function logoutUser() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Ошибка выхода:', error);
      alert('Не удалось выйти из аккаунта');
    }
  }

  function subscribeToCloudUpdates() {
    onValue(scheduleRef, (snapshot) => {
      if (snapshot.exists()) {
        state = normalizeSchedulePayload(snapshot.val());
        createMonthsHeader();
        renderFilters();
        renderBoard();
        if (els.departmentAdminModalBackdrop.classList.contains('open')) {
          renderDepartmentAdminModal();
        }
      }
    });
  }

  function subscribeToAuth() {
    onAuthStateChanged(auth, async (user) => {
      currentUser = user || null;
      const roleRecord = await resolveCurrentRole(user);
      applyRoleRecord(roleRecord);
      if (isAdmin()) {
        await ensureScheduleInitialized();
      }
      updateAuthUI();
    });
  }

  function attachStaticHandlers() {
    els.addBtn.onclick = () => openVacationModal();
    els.resetBtn.onclick = resetAllVacations;
    els.addEmployeeToolbarBtn.onclick = openEmployeeModal;
    els.removeEmployeeToolbarBtn.onclick = openRemoveEmployeeModal;
    els.manageDepartmentsBtn.onclick = openDepartmentAdminModal;
    els.manageAccessBtn.onclick = openAccessAdminModal;

    els.closeModalBtn.onclick = closeVacationModal;
    els.saveBtn.onclick = saveVacation;
    els.deleteBtn.onclick = deleteVacation;

    els.closeEmployeeModalBtn.onclick = closeEmployeeModal;
    els.saveEmployeeBtn.onclick = addEmployee;
    els.suggestDepartmentBtn.onclick = () => openDepartmentRequestModal(els.employeeDepartmentSearch.value || els.newEmployeeName.value);

    els.closeRemoveEmployeeModalBtn.onclick = closeRemoveEmployeeModal;
    els.confirmRemoveEmployeeBtn.onclick = removeEmployeeByModal;
    els.removeEmployeeGroupSelect.onchange = refreshRemoveEmployeeSelect;

    els.loginBtn.onclick = openAuthModal;
    els.logoutBtn.onclick = logoutUser;
    els.submitLoginBtn.onclick = signIn;
    els.submitRegisterBtn.onclick = registerAccount;
    els.closeAuthModalBtn.onclick = closeAuthModal;

    els.closeDepartmentRequestModalBtn.onclick = closeDepartmentRequestModal;
    els.saveDepartmentRequestBtn.onclick = createDepartmentRequest;

    els.closeDepartmentAdminModalBtn.onclick = closeDepartmentAdminModal;
    els.addDepartmentDirectBtn.onclick = addDepartmentDirect;

    els.closeAccessAdminModalBtn.onclick = closeAccessAdminModal;
    els.accessInviteSaveBtn.onclick = async () => {
      const editKey = els.accessInviteSaveBtn.dataset.editKey || null;
      await saveManagerInvite(editKey);
      els.accessInviteSaveBtn.dataset.editKey = '';
    };

    els.groupFilter.onchange = renderBoard;
    els.searchInput.oninput = renderBoard;
    els.expandAllMonthsBtn.onclick = expandAllMonths;
    els.employeeDepartmentSearch.oninput = () => renderEmployeeDepartmentOptions();

    els.departmentList.addEventListener('click', async (event) => {
      const action = event.target.dataset.action;
      const departmentId = event.target.dataset.departmentId;
      if (!action || !departmentId) return;

      if (action === 'rename-department') await renameDepartment(departmentId);
      if (action === 'toggle-department') await toggleDepartmentStatus(departmentId);
    });

    els.departmentRequestsList.addEventListener('click', async (event) => {
      const action = event.target.dataset.action;
      const requestId = event.target.dataset.requestId;
      if (!action || !requestId) return;

      if (action === 'approve-request') await approveDepartmentRequestAsNew(requestId);
      if (action === 'reject-request') await rejectDepartmentRequest(requestId);
      if (action === 'link-request') {
        const select = els.departmentRequestsList.querySelector(`[data-request-link-select="${requestId}"]`);
        await linkDepartmentRequest(requestId, select?.value || '');
      }
    });

    els.accessInviteList.addEventListener('click', async (event) => {
      const action = event.target.dataset.action;
      if (!action) return;
      if (action === 'edit-invite') await startEditingInvite(event.target.dataset.emailKey);
      if (action === 'revoke-invite') await revokeInvite(event.target.dataset.emailKey);
    });

    els.accessRoleList.addEventListener('click', async (event) => {
      const action = event.target.dataset.action;
      if (action === 'revoke-role') await revokeManagerRole(event.target.dataset.uid);
    });

    [
      els.modalBackdrop,
      els.employeeModalBackdrop,
      els.removeEmployeeModalBackdrop,
      els.authModalBackdrop,
      els.departmentRequestModalBackdrop,
      els.departmentAdminModalBackdrop,
      els.accessAdminModalBackdrop
    ].forEach(backdrop => {
      backdrop.addEventListener('click', e => {
        if (e.target !== backdrop) return;
        if (backdrop === els.modalBackdrop) closeVacationModal();
        if (backdrop === els.employeeModalBackdrop) closeEmployeeModal();
        if (backdrop === els.removeEmployeeModalBackdrop) closeRemoveEmployeeModal();
        if (backdrop === els.authModalBackdrop) closeAuthModal();
        if (backdrop === els.departmentRequestModalBackdrop) closeDepartmentRequestModal();
        if (backdrop === els.departmentAdminModalBackdrop) closeDepartmentAdminModal();
        if (backdrop === els.accessAdminModalBackdrop) closeAccessAdminModal();
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
    });

    els.authEmail.addEventListener('keydown', e => {
      if (e.key === 'Enter') signIn();
    });
    els.authPassword.addEventListener('keydown', e => {
      if (e.key === 'Enter') signIn();
    });
  }

  async function init() {
    await loadStateFromCloud();
    createMonthsHeader();
    renderFilters();
    renderBoard();
    attachStaticHandlers();
    subscribeToCloudUpdates();
    subscribeToAuth();

    if (initialSource !== 'v2') {
      els.status.textContent = `${els.status.textContent} · Обновленная структура данных будет сохранена после входа администратора`;
    }
  }

  init();
})();
