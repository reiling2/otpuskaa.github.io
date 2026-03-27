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
  const APP_VERSION = 3;
  const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const MONTHS_SHORT = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
  const PX_PER_DAY = 18;
  const COLLAPSED_MONTH_WIDTH = 26;
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
    accessRoleList: $('accessRoleList'),
    closeAccessAdminModalBtn: $('closeAccessAdminModalBtn')
  };

  let state = buildEmptyState();
  let collapsedMonths = loadCollapsedMonths();
  let currentUser = null;
  let currentRoleRecord = null;
  let currentRole = 'viewer';
  let currentDepartmentIds = new Set();
  let adminAccessSnapshot = { roles: {}, roleInvites: {} };
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
    return 'Гость';
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

  function canManageDepartment(departmentId) {
    if (isAdmin()) return true;
    return isManager() && currentDepartmentIds.has(departmentId);
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

  function canManageVacation(vacation) {
    if (!vacation) return false;
    return canManageDepartment(vacation.departmentId);
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
    try {
      const [scheduleSnapshot, legacySnapshot] = await Promise.all([get(scheduleRef), get(legacyStateRef)]);
      const hasLegacy = legacySnapshot.exists() && Array.isArray(legacySnapshot.val()?.groups) && legacySnapshot.val().groups.length > 0;

      if (scheduleSnapshot.exists()) {
        const normalized = normalizeSchedulePayload(scheduleSnapshot.val());
        if (hasRealScheduleContent(normalized) || !hasLegacy) {
          state = normalized;
          initialLoadDone = true;
          return;
        }
        state = migrateLegacyState(legacySnapshot.val());
        initialLoadDone = true;
        return;
      }

      if (hasLegacy) {
        state = migrateLegacyState(legacySnapshot.val());
        initialLoadDone = true;
        return;
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
    currentDepartmentIds = new Set(Object.keys(roleRecord?.departmentIds || {}).filter(id => roleRecord.departmentIds[id] === true));
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

      if (collapsed) {
        month.innerHTML = `<button class="month-collapse-pill" type="button" data-month="${monthIndex}" title="Развернуть ${name}">›</button>`;
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
    const employees = getEmployees({ branchId }).filter(emp => canManageEmployee(emp));
    if (employees.length === 0) {
      els.employeeSelect.innerHTML = '<option value="">Нет доступных сотрудников</option>';
      return;
    }
    els.employeeSelect.innerHTML = employees.map(emp => `<option value="${escapeHtml(emp.id)}">${escapeHtml(emp.displayName)} — ${escapeHtml(getDepartmentName(emp.departmentId))}</option>`).join('');
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
    els.removeEmployeeSelect.innerHTML = employees.map(emp => `<option value="${escapeHtml(emp.id)}">${escapeHtml(emp.displayName)}</option>`).join('');
  }

  function getFilteredGroups() {
    const branchId = getCurrentBranchId();
    const selectedDepartment = els.groupFilter.value || 'all';
    const query = normalizeText(els.searchInput.value);

    return getActiveDepartments(branchId)
      .filter(dep => selectedDepartment === 'all' || dep.id === selectedDepartment)
      .map(dep => ({
        department: dep,
        employees: getEmployees({ departmentId: dep.id }).filter(emp => !query || normalizeText(emp.displayName).includes(query))
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
      els.namesCol.innerHTML = `<div class="empty-state">Нет сотрудников для отображения</div>`;
      els.timelineGroups.innerHTML = `<div class="empty-state">Выберите другой филиал, отдел или очистите поиск</div>`;
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

    const hint = canEditAnything() ? 'Двойной клик по полоске — редактирование доступного отпуска' : 'Для редактирования войдите как руководитель';
    els.status.textContent = `Филиал: ${getCurrentBranchName()} · Сотрудников: ${visibleEmployees} · Отпусков: ${visibleVacations} · ${hint}`;
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
    els.addBtn.hidden = !canEditAnything();
    els.resetBtn.hidden = !canResetAll();
    els.addEmployeeToolbarBtn.hidden = !canEditAnything();
    els.removeEmployeeToolbarBtn.hidden = !canEditAnything();
    els.manageDepartmentsBtn.hidden = !canManageDepartments();
    els.manageAccessBtn.hidden = !canManageAccess();
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
    renderEmployeeDepartmentOptions();
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
    els.authError.textContent = '';
    els.authPassword.value = '';
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
    const [rolesSnapshot, invitesSnapshot] = await Promise.all([get(rolesRootRef), get(invitesRootRef)]);
    adminAccessSnapshot = {
      roles: rolesSnapshot.exists() ? rolesSnapshot.val() : {},
      roleInvites: invitesSnapshot.exists() ? invitesSnapshot.val() : {}
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
              <button type="button" data-action="archive-department" data-id="${escapeHtml(dep.id)}" class="danger-btn">Архивировать</button>
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
      els.accessInviteDepartments.innerHTML = '<div class="admin-card">Сначала создайте хотя бы один отдел.</div>';
    } else {
      els.accessInviteDepartments.innerHTML = branchGroups.map(group => `
        <div class="checkbox-group">
          <div class="checkbox-group-title">${escapeHtml(group.branch.name)}</div>
          ${group.departments.map(dep => `
            <label class="checkbox-item">
              <input type="checkbox" value="${escapeHtml(dep.id)}">
              <span>${escapeHtml(dep.name)}</span>
            </label>
          `).join('')}
        </div>
      `).join('');
    }

    const invites = Object.values(adminAccessSnapshot.roleInvites || {}).filter(Boolean).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    els.accessInviteList.innerHTML = invites.length === 0
      ? '<div class="admin-card">Приглашений пока нет.</div>'
      : invites.map(invite => `
        <div class="admin-card">
          <div class="admin-card-header">
            <div>
              <div class="admin-card-title">${escapeHtml(invite.email || 'Без email')}</div>
              <div class="admin-card-meta">${escapeHtml((invite.role || 'manager') === 'manager' ? 'Руководитель' : invite.role)} · ${formatDepartmentNames(invite.departmentIds || {})}</div>
            </div>
            <div class="card-actions">
              <button type="button" data-action="delete-invite" data-id="${escapeHtml(invite.key || emailKey(invite.email || ''))}" class="danger-btn">Удалить</button>
            </div>
          </div>
        </div>
      `).join('');

    const roles = Object.entries(adminAccessSnapshot.roles || {})
      .map(([uid, role]) => ({ uid, ...role }))
      .sort((a, b) => (a.email || '').localeCompare(b.email || '', 'ru'));

    els.accessRoleList.innerHTML = roles.length === 0
      ? '<div class="admin-card">Ролей пока нет.</div>'
      : roles.map(role => `
        <div class="admin-card">
          <div class="admin-card-header">
            <div>
              <div class="admin-card-title">${escapeHtml(role.email || role.uid)}</div>
              <div class="admin-card-meta">${escapeHtml(roleLabel(role.role || 'viewer'))}${role.role === 'manager' ? ` · ${escapeHtml(formatDepartmentNames(role.departmentIds || {}))}` : ''}</div>
            </div>
            <div class="card-actions">
              ${role.role === 'manager' ? `<button type="button" data-action="revoke-role" data-id="${escapeHtml(role.uid)}" class="danger-btn">Снять доступ</button>` : ''}
            </div>
          </div>
        </div>
      `).join('');

    els.accessInviteList.querySelectorAll('[data-action="delete-invite"]').forEach(btn => {
      btn.onclick = () => deleteInvite(btn.dataset.id);
    });
    els.accessRoleList.querySelectorAll('[data-action="revoke-role"]').forEach(btn => {
      btn.onclick = () => revokeManagerRole(btn.dataset.id);
    });
  }

  function formatDepartmentNames(departmentIdsObj) {
    const ids = Object.keys(departmentIdsObj || {}).filter(id => departmentIdsObj[id] === true);
    if (ids.length === 0) return 'Все филиалы без закрепленных отделов';
    return ids.map(getDepartmentName).join(', ');
  }

  function validateVacation(vacation, skipId = '') {
    if (!vacation.employeeId || !vacation.start || !vacation.end) return 'Заполните все обязательные поля';
    if (vacation.end < vacation.start) return 'Дата окончания не может быть раньше даты начала';
    if (!vacation.start.startsWith(`${YEAR}-`) || !vacation.end.startsWith(`${YEAR}-`)) return `Диапазон должен быть внутри ${YEAR} года`;

    const employee = state.employees?.[vacation.employeeId];
    if (!employee) return 'Сотрудник не найден';
    if (!canManageEmployee(employee)) return 'Нет прав на этого сотрудника';

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
    if (!canEditAnything()) {
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
      color: els.vacationColor.value,
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
    const displayName = els.newEmployeeName.value.trim().replace(/\s+/g, ' ');
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
      departmentId,
      isActive: true,
      createdAt: nowTs(),
      createdBy: currentUser?.uid || 'unknown'
    };

    try {
      await set(ref(db, `scheduleV2/employees/${employeeId}`), employee);
      closeEmployeeModal();
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
    updates[`scheduleV2/departmentRequests/${requestId}/status`] = 'approved';
    updates[`scheduleV2/departmentRequests/${requestId}/resolvedAt`] = nowTs();
    updates[`scheduleV2/departmentRequests/${requestId}/resolvedBy`] = currentUser?.uid || 'unknown';

    try {
      await update(ref(db), updates);
      renderFilters();
    } catch (error) {
      console.error('Ошибка одобрения заявки:', error);
      alert('Не удалось одобрить заявку');
    }
  }

  async function rejectDepartmentRequest(requestId) {
    if (!isAdmin()) return;
    if (!confirm('Отклонить заявку?')) return;
    try {
      await update(ref(db, `scheduleV2/departmentRequests/${requestId}`), {
        status: 'rejected',
        resolvedAt: nowTs(),
        resolvedBy: currentUser?.uid || 'unknown'
      });
    } catch (error) {
      console.error('Ошибка отклонения заявки:', error);
      alert('Не удалось отклонить заявку');
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

    els.closeModalBtn.onclick = closeVacationModal;
    els.saveBtn.onclick = saveVacation;
    els.deleteBtn.onclick = deleteVacation;

    els.closeEmployeeModalBtn.onclick = closeEmployeeModal;
    els.saveEmployeeBtn.onclick = addEmployee;
    els.employeeDepartmentSearch.oninput = renderEmployeeDepartmentOptions;
    els.suggestDepartmentBtn.onclick = openDepartmentRequestModal;

    els.closeRemoveEmployeeModalBtn.onclick = closeRemoveEmployeeModal;
    els.confirmRemoveEmployeeBtn.onclick = removeEmployee;
    els.removeEmployeeGroupSelect.onchange = refreshRemoveEmployeeSelect;

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

    els.modalBackdrop.addEventListener('click', e => { if (e.target === els.modalBackdrop) closeVacationModal(); });
    els.employeeModalBackdrop.addEventListener('click', e => { if (e.target === els.employeeModalBackdrop) closeEmployeeModal(); });
    els.removeEmployeeModalBackdrop.addEventListener('click', e => { if (e.target === els.removeEmployeeModalBackdrop) closeRemoveEmployeeModal(); });
    els.authModalBackdrop.addEventListener('click', e => { if (e.target === els.authModalBackdrop) closeAuthModal(); });
    els.departmentRequestModalBackdrop.addEventListener('click', e => { if (e.target === els.departmentRequestModalBackdrop) closeDepartmentRequestModal(); });
    els.departmentAdminModalBackdrop.addEventListener('click', e => { if (e.target === els.departmentAdminModalBackdrop) closeDepartmentAdminModal(); });
    els.accessAdminModalBackdrop.addEventListener('click', e => { if (e.target === els.accessAdminModalBackdrop) closeAccessAdminModal(); });

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
    });
  }

  async function init() {
    await loadStateFromCloud();
    createMonthsHeader();
    renderFilters();
    renderBoard();
    updateAuthUI();
    attachStaticHandlers();
    subscribeToCloudUpdates();
    subscribeToAuth();
  }

  init();
})();
