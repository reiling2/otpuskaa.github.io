const RESET_CODE = "OTPUSK-RESET-2026";
    const LOCAL_FALLBACK_KEY = "vacation-product-firestore-fallback";
    const MS_DAY = 86400000;
    const ANNUAL_ALLOWANCE = 28;
    const MONTHS = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
    const DEFAULT_YEARS = [2026, 2027, 2028];
    const DEFAULT_DEPARTMENTS = [
      "Сметно-договорное управление",
      "Финансово-экономическое управление",
      "Управление приемки выполненных работ"
    ];
    const DEFAULT_EMPLOYEES = [
      { id:"e-sdu-manager", name:"Анна Фролова", dept:"Сметно-договорное управление", position:"Руководитель отдела", initials:"АФ", role:"manager" },
      { id:"e-sdu-1", name:"Иван Петров", dept:"Сметно-договорное управление", position:"Ведущий специалист", initials:"ИП", role:"staff" },
      { id:"e-sdu-2", name:"Мария Соколова", dept:"Сметно-договорное управление", position:"Специалист по договорам", initials:"МС", role:"staff" },
      { id:"e-feu-manager", name:"Ольга Морозова", dept:"Финансово-экономическое управление", position:"Руководитель отдела", initials:"ОМ", role:"manager" },
      { id:"e-feu-1", name:"Дмитрий Волков", dept:"Финансово-экономическое управление", position:"Экономист", initials:"ДВ", role:"staff" },
      { id:"e-feu-2", name:"Елена Смирнова", dept:"Финансово-экономическое управление", position:"Финансовый аналитик", initials:"ЕС", role:"staff" },
      { id:"e-upr-manager", name:"Павел Никитин", dept:"Управление приемки выполненных работ", position:"Руководитель отдела", initials:"ПН", role:"manager" },
      { id:"e-upr-1", name:"Сергей Орлов", dept:"Управление приемки выполненных работ", position:"Инженер приемки", initials:"СО", role:"staff" },
      { id:"e-upr-2", name:"Наталья Ким", dept:"Управление приемки выполненных работ", position:"Специалист приемки", initials:"НК", role:"staff" }
    ];
    const DEFAULT_VACATIONS = [
      { id:"v-sdu-1", employeeId:"e-sdu-1", start:"2026-07-13", end:"2026-07-26", status:"approved", type:"main", note:"Летний отпуск" },
      { id:"v-sdu-2", employeeId:"e-sdu-2", start:"2026-08-03", end:"2026-08-16", status:"planned", type:"main", note:"Плановый отпуск" },
      { id:"v-feu-1", employeeId:"e-feu-1", start:"2026-09-07", end:"2026-09-20", status:"approved", type:"main", note:"Согласовано с руководителем" },
      { id:"v-feu-2", employeeId:"e-feu-2", start:"2026-11-02", end:"2026-11-08", status:"planned", type:"extra", note:"Дополнительный отпуск" },
      { id:"v-upr-1", employeeId:"e-upr-1", start:"2026-06-15", end:"2026-06-28", status:"approved", type:"main", note:"Основной отпуск" },
      { id:"v-upr-2", employeeId:"e-upr-2", start:"2026-12-21", end:"2026-12-31", status:"planned", type:"main", note:"Конец года" }
    ];

    const defaultState = {
      year: 2026,
      query: "",
      filter: "all",
      zoom: 300,
      profile: null,
      viewDepts: [],
      departments: [...DEFAULT_DEPARTMENTS],
      collapsed: {},
      allowedConflicts: [],
      employees: [...DEFAULT_EMPLOYEES],
      managers: {
        "Сметно-договорное управление": "e-sdu-manager",
        "Финансово-экономическое управление": "e-feu-manager",
        "Управление приемки выполненных работ": "e-upr-manager"
      },
      vacations: [...DEFAULT_VACATIONS]
    };

    const statusText = { approved:"Утверждено", planned:"Запланировано", past:"Прошло" };
    const typeText = { main:"Основной", extra:"Дополнительный" };
    let state = startWithEmptyTimeline(clone(defaultState));
    let firebaseReady = false;
    let applyingRemoteState = false;
    let usingLocalFallback = false;

    const $ = id => document.getElementById(id);
    const els = {
      profileLine: $("profileLine"), title: $("title"), search: $("searchInput"), year: $("yearSelect"),
      multiDeptWrap: $("multiDeptWrap"), departmentPickerBtn: $("departmentPickerBtn"), departmentPopover: $("departmentPopover"),
      departmentOptions: $("departmentOptions"), departmentPickerLabel: $("departmentPickerLabel"),
      zoomSlider: $("zoomSlider"), zoomValue: $("zoomValue"), scroll: $("scrollArea"), table: $("timelineTable"),
      tooltip: $("tooltip"), toastWrap: $("toastWrap"),
      vacationModal: $("vacationModal"), employeeModal: $("employeeModal"), onboarding: $("onboarding"),
      vacationEmployee: $("vacationEmployee"), sidePanel: $("sidePanel"), sideTitle: $("sideTitle"), sideSub: $("sideSub"), sideBody: $("sideBody")
    };

    function clone(v){ return JSON.parse(JSON.stringify(v)); }
    function normalizeStatus(v){ return v === 'approved' ? 'approved' : 'planned'; }
    function isObject(v){ return !!v && typeof v === 'object' && !Array.isArray(v); }
    function clampNumber(value, min, max, fallback){
      const n = Number(value);
      return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
    }
    function cleanText(value, fallback = ""){
      return String(value ?? fallback).trim();
    }
    function safeId(value, prefix, used){
      const raw = cleanText(value);
      let id = /^[A-Za-z0-9_-]+$/.test(raw) ? raw : "";
      if (!id || used.has(id)) id = uid(prefix);
      while (used.has(id)) id = uid(prefix);
      used.add(id);
      return id;
    }
    function normalizeLoaded(data){
      const base = clone(defaultState);
      const source = isObject(data) ? data : {};
      const out = clone(base);
      const filters = new Set(["all", "planned", "approved", "past", "empty"]);
      const usedEmployeeIds = new Set();
      const usedVacationIds = new Set();

      out.year = Math.round(clampNumber(source.year, 1900, 2100, base.year));
      out.query = cleanText(source.query);
      out.filter = filters.has(source.filter) ? source.filter : base.filter;
      out.zoom = Math.round(clampNumber(source.zoom, 180, 420, base.zoom));

      out.employees = (Array.isArray(source.employees) ? source.employees : [])
        .map(raw => {
          if (!isObject(raw)) return null;
          const name = cleanText(raw.name);
          const dept = cleanText(raw.dept);
          if (!name || !dept) return null;
          const role = raw.role === 'manager' ? 'manager' : 'staff';
          const id = safeId(raw.id, 'e', usedEmployeeIds);
          const position = cleanText(raw.position, role === 'manager' ? 'Руководитель отдела' : 'Сотрудник');
          const initials = cleanText(raw.initials, initialsFromName(name)).slice(0, 3).toUpperCase();
          return { id, name, dept, position, initials: initials || initialsFromName(name), role };
        })
        .filter(Boolean);

      const hasStoredStructure = Array.isArray(source.departments) || Array.isArray(source.employees) || isObject(source.managers);
      const departments = new Set(hasStoredStructure ? [] : base.departments);
      out.employees.forEach(e => departments.add(e.dept));
      if (Array.isArray(source.departments)) source.departments.map(cleanText).filter(Boolean).forEach(d => departments.add(d));
      if (isObject(source.managers)) Object.keys(source.managers).map(cleanText).filter(Boolean).forEach(d => departments.add(d));
      if (!hasStoredStructure) Object.keys(base.managers).forEach(d => departments.add(d));
      out.departments = [...departments].sort((a,b)=>a.localeCompare(b,'ru'));

      const employeeIds = new Set(out.employees.map(e => e.id));
      const rawManagers = isObject(source.managers) ? source.managers : {};
      out.managers = {};
      out.departments.forEach(dept => {
        const managerId = cleanText(rawManagers[dept]);
        out.managers[dept] = employeeIds.has(managerId) ? managerId : null;
      });
      if (!Object.keys(rawManagers).length) {
        out.employees
          .filter(e => e.role === 'manager' && out.departments.some(dept => normalized(dept) === normalized(e.dept)))
          .forEach(e => { if (!out.managers[e.dept]) out.managers[e.dept] = e.id; });
      }
      Object.values(out.managers).filter(Boolean).forEach(id => {
        const employee = out.employees.find(e => e.id === id);
        if (employee) {
          employee.role = 'manager';
          employee.position = employee.position || 'Руководитель отдела';
        }
      });

      out.vacations = (Array.isArray(source.vacations) ? source.vacations : [])
        .map(raw => {
          if (!isObject(raw)) return null;
          const employeeId = cleanText(raw.employeeId);
          const start = cleanText(raw.start);
          const end = cleanText(raw.end);
          if (!employeeIds.has(employeeId) || !isValidDateISO(start) || !isValidDateISO(end) || parseDate(end) < parseDate(start)) return null;
          return {
            id: safeId(raw.id, 'v', usedVacationIds),
            employeeId,
            start,
            end,
            status: normalizeStatus(raw.status),
            type: raw.type === 'extra' ? 'extra' : 'main',
            note: cleanText(raw.note)
          };
        })
        .filter(Boolean);

      out.collapsed = {};
      if (isObject(source.collapsed)) {
        out.departments.forEach(dept => { if (source.collapsed[dept]) out.collapsed[dept] = true; });
      }

      out.viewDepts = Array.isArray(source.viewDepts)
        ? source.viewDepts.map(cleanText).filter(d => out.departments.some(item => normalized(item) === normalized(d)))
        : [];

      const vacationIds = new Set(out.vacations.map(v => v.id));
      out.allowedConflicts = Array.isArray(source.allowedConflicts)
        ? source.allowedConflicts
          .map(cleanText)
          .filter(key => {
            const [a,b] = key.split('__');
            return a && b && a !== b && vacationIds.has(a) && vacationIds.has(b);
          })
        : [];

      out.profile = normalizeProfile(source.profile, out);
      if (out.profile?.role === 'manager') {
        const employee = out.employees.find(e => e.id === out.profile.employeeId);
        if (employee) {
          employee.role = 'manager';
          employee.position = employee.position || 'Руководитель отдела';
        }
      }
      return out;
    }
    function startWithEmptyTimeline(nextState){
      nextState.viewDepts = [];
      return nextState;
    }
    function firebasePath(){
      return window.vacationFirebase?.stateDocPath || 'apps/vacation-plan/state/main';
    }
    function loadStateFromLocalFallback(){
      try {
        if (typeof localStorage === 'undefined') return startWithEmptyTimeline(clone(defaultState));
        const raw = localStorage.getItem(LOCAL_FALLBACK_KEY);
        if (!raw) return startWithEmptyTimeline(clone(defaultState));
        return startWithEmptyTimeline(normalizeLoaded(JSON.parse(raw)));
      } catch (error) {
        console.error('Не удалось загрузить локальный fallback', error);
        return startWithEmptyTimeline(clone(defaultState));
      }
    }
    function saveStateToLocalFallback(){
      try {
        if (typeof localStorage === 'undefined') return false;
        localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(state));
        return true;
      } catch (error) {
        console.error('Не удалось сохранить локальный fallback', error);
        if (typeof els !== 'undefined' && els.toastWrap) toast('Не удалось сохранить данные локально');
        return false;
      }
    }
    async function signInToFirebase(){
      const vf = window.vacationFirebase;
      if (!vf?.isConfigured || !vf.firebaseAuth) throw new Error('Firebase не настроен');
      if (vf.firebaseAuth.currentUser) return vf.firebaseAuth.currentUser;
      const result = await vf.firebaseAuth.signInAnonymously();
      return result.user;
    }
    async function loadStateFromFirebase(){
      firebaseReady = false;
      applyingRemoteState = true;
      usingLocalFallback = false;
      try {
        const vf = window.vacationFirebase;
        if (!vf?.isConfigured || !vf.stateDocRef) {
          state = loadStateFromLocalFallback();
          usingLocalFallback = true;
          firebaseReady = true;
          applyingRemoteState = false;
          render();
          maybeShowOnboarding();
          if (!els.onboarding.classList.contains('open')) scrollToWorkWindow('auto');
          toast('Firebase не настроен, используется локальное хранение');
          return state;
        }

        await signInToFirebase();
        const snapshot = await vf.stateDocRef.get();

        if (snapshot.exists) {
          state = startWithEmptyTimeline(normalizeLoaded(snapshot.data()));
        } else {
          state = startWithEmptyTimeline(clone(defaultState));
          await vf.stateDocRef.set(clone(state));
        }

        cleanupAllowedConflicts();
        firebaseReady = true;
        applyingRemoteState = false;
        render();
        maybeShowOnboarding();
        if (!els.onboarding.classList.contains('open')) scrollToWorkWindow('auto');
        return state;
      } catch (error) {
        console.error(`Не удалось загрузить Firestore-документ ${firebasePath()}`, error);
        toast('Не удалось загрузить данные из Firebase');
        state = loadStateFromLocalFallback();
        usingLocalFallback = true;
        firebaseReady = true;
        applyingRemoteState = false;
        render();
        maybeShowOnboarding();
        if (!els.onboarding.classList.contains('open')) scrollToWorkWindow('auto');
        return state;
      }
    }
    async function loadState(){
      return loadStateFromFirebase();
    }
    async function saveStateToFirebase(force = false){
      const vf = window.vacationFirebase;
      if (usingLocalFallback || !vf?.isConfigured || !vf.stateDocRef) return saveStateToLocalFallback();
      if ((!firebaseReady && !force) || applyingRemoteState) return false;
      try {
        await signInToFirebase();
        await vf.stateDocRef.set(clone(state));
        return true;
      } catch (error) {
        console.error(`Не удалось сохранить Firestore-документ ${firebasePath()}`, error);
        toast('Не удалось сохранить данные в Firebase');
        return false;
      }
    }
    function saveState(options = {}){
      const force = options === true || Boolean(options.force);
      return saveStateToFirebase(force);
    }
    let saveTimer = null;
    function scheduleSave(){
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveState, 350);
    }
    function escapeHTML(v){ return String(v ?? '').replace(/[&<>"']/g, s => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[s])); }
    function uid(p){ return p + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
    function toast(text){ const el = document.createElement('div'); el.className = 'toast'; el.textContent = text; els.toastWrap.appendChild(el); setTimeout(() => el.remove(), 2400); }
    function normalized(v){ return String(v || '').trim().toLowerCase(); }
    function normalizeProfile(profile, nextState){
      if (!isObject(profile)) return null;
      const employee = nextState.employees.find(e => e.id === cleanText(profile.employeeId));
      const name = employee?.name || cleanText(profile.name);
      if (!name) return null;
      const role = profile.role === 'manager' ? 'manager' : 'employee';
      const departments = nextState.departments || [];
      const depts = Array.isArray(profile.depts)
        ? profile.depts.map(cleanText).filter(d => departments.some(item => normalized(item) === normalized(d)))
        : [];
      const dept = employee?.dept || cleanText(profile.dept) || depts[0] || "";
      if (dept && !departments.some(item => normalized(item) === normalized(dept))) departments.push(dept);
      return {
        name,
        role,
        dept,
        depts: role === 'manager' ? (depts.length ? depts : [dept].filter(Boolean)) : [dept].filter(Boolean),
        employeeId: employee?.id || null
      };
    }

    function allDepartments(){
      const set = new Set((state.departments || []).filter(Boolean));
      state.employees.map(e => e.dept).filter(Boolean).forEach(dept => set.add(dept));
      Object.keys(state.managers || {}).forEach(dept => set.add(dept));
      return [...set].sort((a,b)=>a.localeCompare(b,'ru'));
    }
    function ensureDepartment(dept){
      const name = cleanText(dept);
      if (!name) return "";
      state.departments = Array.isArray(state.departments) ? state.departments : [];
      if (!state.departments.some(d => normalized(d) === normalized(name))) state.departments.push(name);
      if (!state.managers || typeof state.managers !== 'object') state.managers = {};
      if (!(name in state.managers)) state.managers[name] = null;
      return name;
    }
    function similarDepartments(value){
      const source = normalized(value); if (!source) return [];
      return allDepartments().filter(d => {
        const n = normalized(d);
        return n !== source && (n.includes(source) || source.includes(n) || n.startsWith(source.slice(0,3)));
      }).slice(0,3);
    }
    function isManager(){ return state.profile?.role === 'manager'; }
    function managerDepartments(){ return isManager() ? (state.profile.depts || [state.profile.dept].filter(Boolean)) : []; }
    function viewDepartments(){
      return Array.isArray(state.viewDepts) && state.viewDepts.length ? state.viewDepts : [];
    }

    function isValidDateObject(date){ return date instanceof Date && !Number.isNaN(date.getTime()); }
    function formatISO(date){
      if (!isValidDateObject(date)) return "";
      return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    }
    function parseDate(iso){
      const match = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!match) return new Date(NaN);
      const [, y, m, d] = match.map(Number);
      const date = new Date(y, m - 1, d);
      return formatISO(date) === String(iso) ? date : new Date(NaN);
    }
    function isValidDateISO(iso){ return isValidDateObject(parseDate(iso)); }
    function toDate(value){ return value instanceof Date ? new Date(value.getFullYear(), value.getMonth(), value.getDate()) : parseDate(value); }
    function yearStart(year = state.year){ return new Date(Number(year), 0, 1); }
    function yearEnd(year = state.year){ return new Date(Number(year), 11, 31); }
    function nextYearStart(year = state.year){ return new Date(Number(year) + 1, 0, 1); }
    function rangesOverlap(start, end, rangeStart, rangeEnd){
      return isValidDateObject(start) && isValidDateObject(end) && start <= rangeEnd && end >= rangeStart;
    }
    function dateLabel(iso){
      const date = parseDate(iso);
      return isValidDateObject(date) ? date.toLocaleDateString('ru-RU', { day:'numeric', month:'short' }).replace('.','') : '—';
    }
    function monthDays(i, year = state.year){ return new Date(year, i+1, 0).getDate(); }
    function daysBetweenDates(start, end){
      const a = toDate(start), b = toDate(end);
      if (!isValidDateObject(a) || !isValidDateObject(b) || b < a) return 0;
      return Math.round((b-a)/MS_DAY)+1;
    }
    function vacationDays(v){ return daysBetweenDates(v.start, v.end); }
    function workingDaysBetween(startISO, endISO){
      let count = 0, d = toDate(startISO), end = toDate(endISO);
      if (!isValidDateObject(d) || !isValidDateObject(end) || end < d) return 0;
      while (d <= end) { const day = d.getDay(); if (day !== 0 && day !== 6) count++; d.setDate(d.getDate()+1); }
      return count;
    }
    function workingDaysInYear(year){
      let count = 0, d = new Date(year,0,1);
      while (d.getFullYear() === year) { const day = d.getDay(); if (day !== 0 && day !== 6) count++; d.setDate(d.getDate()+1); }
      return count;
    }
    function visualStatus(v){
      const today = new Date();
      today.setHours(0,0,0,0);
      const end = parseDate(v.end);
      if (!isValidDateObject(end)) return normalizeStatus(v.status);
      return end < today ? 'past' : normalizeStatus(v.status);
    }

    function timelineWidth(){ return state.zoom * 12; }
    function xForDate(value, year = state.year){
      const date = toDate(value);
      if (!isValidDateObject(date)) return 0;
      if (date <= yearStart(year)) return 0;
      if (date >= nextYearStart(year)) return timelineWidth();
      const month = date.getMonth();
      const days = monthDays(month, year);
      return month * state.zoom + ((date.getDate()-1) / days) * state.zoom;
    }
    function dateFromX(x){
      const safeX = Math.max(0, Math.min(timelineWidth()-1, x));
      const month = Math.max(0, Math.min(11, Math.floor(safeX / state.zoom)));
      const inside = safeX - month * state.zoom;
      const day = Math.max(1, Math.min(monthDays(month), Math.floor((inside / state.zoom) * monthDays(month)) + 1));
      return new Date(state.year, month, day);
    }
    function rawWidth(start, end){
      const endPlus = toDate(end);
      if (!isValidDateObject(endPlus)) return 6;
      endPlus.setDate(endPlus.getDate()+1);
      return Math.max(6, xForDate(endPlus) - xForDate(start));
    }
    function clampVacation(v, year = state.year){
      const ys = yearStart(year), ye = yearEnd(year);
      let start = parseDate(v.start), end = parseDate(v.end);
      if (!rangesOverlap(start, end, ys, ye)) return null;
      if (start < ys) start = ys;
      if (end > ye) end = ye;
      return { start, end };
    }
    function vacationsForYear(employeeId, year = state.year){
      return state.vacations.filter(v => v.employeeId === employeeId && clampVacation(v, year));
    }
    function vacationDaysInYear(v, year = state.year){
      const period = clampVacation(v, year);
      return period ? daysBetweenDates(period.start, period.end) : 0;
    }
    function workingDaysInVacationYear(v, year = state.year){
      const period = clampVacation(v, year);
      return period ? workingDaysBetween(period.start, period.end) : 0;
    }

    function getEmployee(id){ return state.employees.find(e => e.id === id); }
    function profileEmployee(){
      if (!state.profile?.employeeId && !state.profile?.name) return null;
      const direct = state.employees.find(e => e.id === state.profile.employeeId) || state.employees.find(e => normalized(e.name) === normalized(state.profile.name));
      if (direct) return direct;
      if (isManager()) {
        const ids = uniqueEmployees(managerDepartments().map(d => managerForDepartment(d)).filter(Boolean));
        if (ids.length === 1) return ids[0];
      }
      return null;
    }
    function managerForDepartment(dept){ const managerId = state.managers?.[dept]; return managerId ? getEmployee(managerId) : null; }
    function employeeManagesDepartment(employeeId){
      return Object.values(state.managers || {}).some(id => id === employeeId);
    }
    function clearManagerLinks(employeeId){
      Object.keys(state.managers || {}).forEach(dept => { if (state.managers[dept] === employeeId) state.managers[dept] = null; });
    }
    function setDepartmentManager(dept, employeeId){
      const previousId = state.managers?.[dept];
      state.managers[dept] = employeeId;
      if (previousId && previousId !== employeeId && !employeeManagesDepartment(previousId)) {
        const previous = getEmployee(previousId);
        if (previous) {
          previous.role = 'staff';
          if (previous.position === 'Руководитель отдела') previous.position = 'Специалист';
        }
      }
    }

    function uniqueEmployees(list){
      const seen = new Set();
      return list.filter(e => e && !seen.has(e.id) && seen.add(e.id));
    }
    function initialsFromName(name){
      return String(name || '').trim().split(/\s+/).slice(0,2).map(p => p[0]).join('').toUpperCase() || 'Я';
    }
    function employeeOptionLabel(e){
      const role = e.role === 'manager' ? 'руководитель' : (e.dept || 'без отдела');
      return `${e.name} · ${e.position || role}`;
    }
    function findEmployeeByName(name, departments = []){
      const n = normalized(name);
      if (!n) return null;
      const pool = state.employees.filter(e => !departments.length || departments.some(d => normalized(d) === normalized(e.dept)) || e.role === 'manager');
      const exact = pool.find(e => normalized(e.name) === n);
      if (exact) return exact;
      const token = n.split(/\s+/)[0];
      if (token && token.length >= 4) {
        const surnameMatches = pool.filter(e => normalized(e.name).split(/\s+/)[0] === token);
        if (surnameMatches.length === 1) return surnameMatches[0];
      }
      return null;
    }
    function onboardingRole(){ return document.querySelector('input[name="onboardRole"]:checked')?.value || 'employee'; }
    function onboardingSelectedDepartments(){
      const role = onboardingRole();
      if (role === 'manager') return [...document.querySelectorAll('#managerDeptChecks input:checked')].map(i => i.value);
      if ($('onboardDept').value === '__new') return [];
      return [$('onboardDept').value].filter(Boolean);
    }
    function onboardingCandidates(){
      const role = onboardingRole();
      const selected = onboardingSelectedDepartments();
      if (role === 'manager') {
        const assignedIds = selected.map(d => state.managers?.[d]).filter(Boolean);
        const assigned = assignedIds.map(id => getEmployee(id)).filter(Boolean);
        const managers = state.employees.filter(e => e.role === 'manager');
        const inSelectedDepartments = selected.length ? state.employees.filter(e => selected.some(d => normalized(d) === normalized(e.dept))) : [];
        const byName = findEmployeeByName($('onboardName').value, selected);
        return uniqueEmployees([...assigned, ...managers, ...inSelectedDepartments, byName].filter(Boolean)).sort((a,b)=>a.name.localeCompare(b.name,'ru'));
      }
      if (!selected.length) return [];
      return state.employees
        .filter(e => e.role !== 'manager' && selected.some(d => normalized(d) === normalized(e.dept)))
        .sort((a,b)=>a.name.localeCompare(b.name,'ru'));
    }
    function renderIdentityPicker(){
      const field = $('existingEmployeeField');
      const select = $('existingEmployeeSelect');
      if (!field || !select) return;
      const candidates = onboardingCandidates();
      if (!candidates.length) {
        field.classList.add('hidden');
        select.innerHTML = '<option value="__new">Создать новую карточку</option>';
        select.value = '__new';
        return;
      }
      const current = select.value;
      field.classList.remove('hidden');
      select.innerHTML = '<option value="">Выберите сотрудника…</option>' +
        candidates.map(e => `<option value="${e.id}">${escapeHTML(employeeOptionLabel(e))}</option>`).join('') +
        '<option value="__new">Меня нет в списке — создать новую карточку</option>';
      const exact = findEmployeeByName($('onboardName').value, onboardingSelectedDepartments());
      if (exact && candidates.some(e => e.id === exact.id)) select.value = exact.id;
      else if ([...select.options].some(o => o.value === current)) select.value = current;
    }
    function selectedOnboardingEmployee(){
      const field = $('existingEmployeeField');
      const select = $('existingEmployeeSelect');
      if (!field || field.classList.contains('hidden') || !select.value || select.value === '__new') return null;
      return getEmployee(select.value);
    }
    function employeeStats(employeeId){
      const vacations = vacationsForYear(employeeId);
      const mainVacations = vacations.filter(v => vacationType(v) === 'main');
      const extraVacations = vacations.filter(v => vacationType(v) === 'extra');
      const mainDays = mainVacations.reduce((sum,v)=>sum+vacationDaysInYear(v),0);
      const extraDays = extraVacations.reduce((sum,v)=>sum+vacationDaysInYear(v),0);
      const calendarDays = mainDays + extraDays;
      const workDays = vacations.reduce((sum,v)=>sum+workingDaysInVacationYear(v),0);
      const left = Math.max(0, ANNUAL_ALLOWANCE-mainDays);
      const over = Math.max(0, mainDays-ANNUAL_ALLOWANCE);
      return { vacations, mainVacations, extraVacations, calendarDays, mainDays, extraDays, workDays, left, over };
    }

    function balanceLabel(stats){
      const mainPart = stats.over > 0
        ? `Основной: ${stats.mainDays}/${ANNUAL_ALLOWANCE} · сверх ${stats.over}`
        : `Основной: ${stats.mainDays}/${ANNUAL_ALLOWANCE} · осталось ${stats.left}`;
      return stats.extraDays > 0 ? `${mainPart} · Доп.: ${stats.extraDays}` : mainPart;
    }
    function conflictKey(a,b){ return [a,b].sort().join('__'); }
    function isConflictAllowed(a,b){ return state.allowedConflicts.includes(conflictKey(a,b)); }
    function cleanupAllowedConflicts(){
      const ids = new Set(state.vacations.map(v => v.id));
      state.allowedConflicts = (state.allowedConflicts || []).filter(key => {
        const [a,b] = String(key).split('__');
        return a && b && a !== b && ids.has(a) && ids.has(b);
      });
    }
    function removeAllowedConflictsFor(vacationId){
      state.allowedConflicts = (state.allowedConflicts || []).filter(key => !String(key).split('__').includes(vacationId));
    }
    function overlapsFor(vacation, deptContext){
      if (deptContext === '__manager__') return [];
      const current = clampVacation(vacation);
      if (!current) return [];
      const start = current.start, end = current.end;
      const intervals = [];
      state.vacations.forEach(other => {
        if (other.id === vacation.id || isConflictAllowed(vacation.id, other.id)) return;
        const otherEmployee = getEmployee(other.employeeId);
        if (!otherEmployee || otherEmployee.dept !== deptContext) return;
        const otherPeriod = clampVacation(other);
        if (!otherPeriod) return;
        const os = otherPeriod.start, oe = otherPeriod.end;
        const overlapStart = new Date(Math.max(start, os));
        const overlapEnd = new Date(Math.min(end, oe));
        if (overlapStart <= overlapEnd) intervals.push({ start: overlapStart, end: overlapEnd, other, otherEmployee });
      });
      return intervals.sort((a,b)=>a.start-b.start);
    }

    function getVisibleEmployees(){
      const query = normalized(state.query);
      const depts = viewDepartments();
      const filtered = state.employees.filter(e => {
        if (e.role === 'manager') return false;
        const deptOk = depts.some(d => normalized(d) === normalized(e.dept));
        const searchOk = !query || normalized(`${e.name} ${e.dept}`).includes(query);
        if (!deptOk || !searchOk) return false;
        const vacations = vacationsForYear(e.id);
        if (state.filter === 'empty') return vacations.length === 0;
        if (state.filter === 'planned') return vacations.some(v => visualStatus(v) === 'planned');
        if (state.filter === 'approved') return vacations.some(v => visualStatus(v) === 'approved');
        if (state.filter === 'past') return vacations.some(v => visualStatus(v) === 'past');
        return true;
      });
      return filtered;
    }

    function buildRows(){
      const depts = viewDepartments();
      const visible = getVisibleEmployees();
      const rows = [];
      if (isManager()) {
        const assignedManagers = uniqueEmployees(depts.map(d => managerForDepartment(d)).filter(Boolean));
        const manager = profileEmployee() || assignedManagers[0];
        if (manager) rows.push({ type:'manager', employee: manager, dept:'__manager__', title:'Руководитель' });
      } else {
        const dept = depts[0];
        const manager = managerForDepartment(dept);
        if (manager) rows.push({ type:'manager', employee: manager, dept, title:'Руководитель отдела' });
      }
      depts.forEach(dept => {
        rows.push({ type:'group', dept });
        if (!state.collapsed[dept]) {
          visible.filter(e => normalized(e.dept) === normalized(dept)).sort((a,b)=>a.name.localeCompare(b.name,'ru')).forEach(employee => rows.push({ type:'employee', employee, dept }));
        }
      });
      return rows;
    }

    function availableYears(){
      const years = new Set([...DEFAULT_YEARS, state.year]);
      state.vacations.forEach(v => {
        const start = parseDate(v.start), end = parseDate(v.end);
        if (isValidDateObject(start)) years.add(start.getFullYear());
        if (isValidDateObject(end)) years.add(end.getFullYear());
      });
      return [...years].filter(y => Number.isInteger(y) && y >= 1900 && y <= 2100).sort((a,b)=>a-b);
    }
    function employeesForCurrentView(){
      const depts = viewDepartments();
      if (!depts.length) return [];
      return state.employees.filter(e => depts.some(dept => normalized(dept) === normalized(e.dept)));
    }

    function syncControls(){
      document.documentElement.style.setProperty('--month', `${state.zoom}px`);
      els.title.textContent = `График отпусков ${state.year}`;
      els.profileLine.textContent = state.profile?.name ? `${state.profile.name} · ${isManager() ? 'руководитель' : state.profile.dept || 'сотрудник'}` : 'рабочий график команды';
      els.search.value = state.query;
      els.year.innerHTML = availableYears().map(year => `<option value="${year}">${year}</option>`).join('');
      els.year.value = String(state.year);
      els.zoomSlider.value = state.zoom;
      els.zoomValue.textContent = `${Math.round((state.zoom / 300) * 100)}%`;
      const viewEmployees = employeesForCurrentView();
      const hasSelectedDepartment = viewDepartments().length > 0;
      const hasEmployees = viewEmployees.length > 0;
      $('addVacationBtn').disabled = !hasSelectedDepartment || !hasEmployees;
      $('addVacationBtn').title = !hasSelectedDepartment ? 'Сначала выберите отдел' : hasEmployees ? '' : 'Сначала добавьте сотрудника в выбранный отдел';
      els.vacationEmployee.innerHTML = hasEmployees
        ? viewEmployees.map(e => `<option value="${e.id}">${escapeHTML(e.name)} · ${escapeHTML(e.dept)}</option>`).join('')
        : '<option value="">Нет сотрудников в выбранном отделе</option>';
      renderEmployeeDeptOptions($('employeeDept').value);
      document.querySelectorAll('[data-filter]').forEach(chip => chip.classList.toggle('active', chip.dataset.filter === state.filter));
      renderDepartmentControls();
    }

    function renderEmployeeDeptOptions(selectedDept = ''){
      const select = $('employeeDept');
      const departments = allDepartments();
      if (!departments.length) {
        select.innerHTML = '<option value="">Сначала добавьте отдел</option>';
        select.value = '';
        select.disabled = true;
        return;
      }
      select.disabled = false;
      const selected = departments.find(dept => normalized(dept) === normalized(selectedDept)) || departments[0];
      select.innerHTML = departments.map(dept => `<option value="${escapeHTML(dept)}">${escapeHTML(dept)}</option>`).join('');
      select.value = selected;
    }

    function renderDepartmentControls(){
      const departments = allDepartments();
      const selected = viewDepartments();
      els.multiDeptWrap.classList.remove('hidden');
      els.departmentPickerLabel.textContent = selected[0] || 'Выбрать отдел';
      $('deptAllBtn').classList.add('hidden');
      $('deptOwnBtn').classList.add('hidden');
      els.departmentOptions.innerHTML = departments.map(dept => {
        const checked = selected.some(d => normalized(d) === normalized(dept));
        return `<label class="dept-chip ${checked ? 'active' : ''}"><input type="radio" name="viewDept" value="${escapeHTML(dept)}" ${checked ? 'checked' : ''}><span>${escapeHTML(dept)}</span></label>`;
      }).join('');
      els.departmentOptions.querySelectorAll('label').forEach(label => {
        const input = label.querySelector('input');
        input.addEventListener('change', () => {
          els.departmentOptions.querySelectorAll('label').forEach(item => item.classList.remove('active'));
          label.classList.add('active');
        });
      });
    }
    function openDepartmentPicker(){
      renderDepartmentControls();
      setDepartmentPopoverOpen(true);
      setMenuOpen(false);
    }

    function vacationType(v){ return v.type === 'extra' ? 'extra' : 'main'; }
    function shortLabel(v){ return `${vacationType(v) === 'extra' ? 'Доп · ' : ''}${dateLabel(v.start)} – ${dateLabel(v.end)} (${vacationDays(v)})`; }
    function todayLineX(){
      const today = new Date();
      if (today.getFullYear() !== state.year) return null;
      return xForDate(today);
    }

    function renderTimeline(){
      const rows = buildRows();
      const personRow = Number(getComputedStyle(document.documentElement).getPropertyValue('--person-row').replace('px','')) || 76;
      const managerRow = Number(getComputedStyle(document.documentElement).getPropertyValue('--manager-row').replace('px','')) || 78;
      const groupRow = Number(getComputedStyle(document.documentElement).getPropertyValue('--group-row').replace('px','')) || 44;
      const heights = rows.map(r => r.type === 'group' ? `${groupRow}px` : r.type === 'manager' ? `${managerRow}px` : `${personRow}px`);
      els.table.style.gridTemplateRows = `var(--head-row) ${heights.length ? heights.join(' ') : '230px'}`;
      const html = [];
      const todayX = todayLineX();

      html.push(`<div class="corner">Сотрудник</div>`);
      html.push(`<div class="months-head"><div class="months-strip">${MONTHS.map(m => `<div class="month-head">${m}</div>`).join('')}<div class="buffer-head"></div>${todayX === null ? '' : `<div class="head-today-line" style="left:${todayX}px"></div>`}</div></div>`);

      if (!rows.length) {
        html.push(`
          <div class="empty-panel" style="grid-row:2;">
            <div class="empty-text">Выберите отдел, чтобы посмотреть график отпусков.</div>
            <button class="mini-btn primary-lite" data-choose-dept type="button">Выбрать отдел</button>
          </div>`);
        els.table.innerHTML = html.join('');
        const chooseDept = els.table.querySelector('[data-choose-dept]');
        if (chooseDept) chooseDept.addEventListener('click', openDepartmentPicker);
        return;
      }

      rows.forEach((row, index) => {
        const gridRow = index + 2;
        if (row.type === 'group') {
          html.push(`
            <div class="group-left" style="grid-row:${gridRow}">
              <button class="mini-btn" data-toggle-dept="${escapeHTML(row.dept)}" type="button">${state.collapsed[row.dept] ? '›' : '⌄'}</button>
              <span>${escapeHTML(row.dept)}</span>
            </div>
            <div class="group-rail" style="grid-row:${gridRow}">Отдел</div>
          `);
          return;
        }

        const stats = employeeStats(row.employee.id);
        const isSelf = state.profile?.employeeId === row.employee.id;
        const badge = row.type === 'manager' ? `<span class="manager-badge">${escapeHTML(row.title || 'Руководитель')}</span>` : '';
        const selfBadge = isSelf ? `<span class="self-badge">Вы</span>` : '';
        const shownPosition = row.type === 'manager' ? (row.title || row.employee.position || 'Руководитель отдела') : (row.employee.position || 'Сотрудник');
        const vacations = vacationsForYear(row.employee.id).sort((a,b)=>parseDate(a.start)-parseDate(b.start));

        html.push(`
          <div class="employee ${row.type === 'manager' ? 'manager-row' : ''}" style="grid-row:${gridRow}">
            <div class="avatar">${escapeHTML(row.employee.initials)}</div>
            <div>
              <div class="employee-name">${escapeHTML(row.employee.name)}${badge}${selfBadge}</div>
              <div class="employee-dept">${escapeHTML(shownPosition)}</div>
              <div class="employee-days">${escapeHTML(balanceLabel(stats))}</div>
            </div>
            <button class="more" type="button" data-edit-employee="${row.employee.id}">•••</button>
          </div>
        `);

        const bars = vacations.map(v => {
          const period = clampVacation(v); if (!period) return '';
          const startX = xForDate(period.start);
          const calendarWidth = rawWidth(period.start, period.end);
          const compact = calendarWidth < 150;
          const labelWidth = 168;
          const labelGap = 8;
          const nearEnd = compact && (startX + calendarWidth + labelGap + labelWidth > timelineWidth());
          const eventLeft = compact && nearEnd ? Math.max(0, startX - labelGap - labelWidth) : startX;
          const barX = startX - eventLeft;
          const labelX = compact ? (nearEnd ? 0 : barX + calendarWidth + labelGap) : barX;
          const eventWidth = compact ? (labelWidth + labelGap + calendarWidth) : calendarWidth;
          const context = row.type === 'manager' ? '__manager__' : row.dept;
          const overlaps = overlapsFor(v, context);
          const visual = visualStatus(v);
          const label = shortLabel(v);
          const tip = {
            employee: row.employee.name,
            dept: row.type === 'manager' ? 'Руководитель' : row.dept,
            status: statusText[visual],
            type: typeText[vacationType(v)],
            period: `${dateLabel(v.start)} — ${dateLabel(v.end)}`,
            days: vacationDaysInYear(v),
            workDays: workingDaysInVacationYear(v),
            note: v.note || 'Без комментария',
            conflict: overlaps.length > 0
          };
          const conflictSegments = overlaps.map(item => {
            const segLeft = xForDate(item.start) - startX;
            const segWidth = rawWidth(item.start, item.end);
            return `<span class="conflict" style="left:${segLeft}px; width:${segWidth}px;"></span>`;
          }).join('');
          return `
            <button class="vacation ${visual} ${vacationType(v) === 'extra' ? 'extra' : ''} ${compact ? 'compact' : ''} ${nearEnd ? 'near-end' : ''} ${overlaps.length ? 'conflicted' : ''}" style="left:${eventLeft}px; --event-w:${eventWidth}px; --bar-x:${barX}px; --bar-w:${calendarWidth}px; --label-x:${labelX}px;" data-vacation="${v.id}" data-dept-context="${escapeHTML(context)}" data-tip='${escapeHTML(JSON.stringify(tip))}' type="button">
              <span class="vacation-bar">${conflictSegments}</span>
              <span class="vacation-label">${escapeHTML(label)}${overlaps.length ? '<span class="warn">!</span>' : ''}</span>
            </button>`;
        }).join('');

        html.push(`
          <div class="track-wrap" data-track-employee="${row.employee.id}" data-track-dept="${escapeHTML(row.dept)}" style="grid-row:${gridRow}">
            <div class="track-bg">${Array.from({length:12}, () => '<div class="track-cell"></div>').join('')}<div class="track-cell"></div></div>
            <div class="track-overlay">
              <div class="drag-selection" data-drag-for="${row.employee.id}:${escapeHTML(row.dept)}"></div>
              ${bars}
            </div>
          </div>
        `);
      });

      if (todayX !== null) html.push(`<div class="timeline-today-overlay" style="left:calc(var(--left-col) + ${todayX}px)"></div>`);
      els.table.innerHTML = html.join('');
      bindTimelineEvents();
    }

    function render(){ syncControls(); renderTimeline(); }

    function bindTimelineEvents(){
      document.querySelectorAll('.vacation').forEach(bar => {
        bar.addEventListener('mouseenter', event => {
          const data = JSON.parse(bar.dataset.tip);
          els.tooltip.innerHTML = `
            <div class="tooltip-title">${escapeHTML(data.employee)}</div>
            <div class="tooltip-sub">${escapeHTML(data.dept)} · ${escapeHTML(data.status)} · ${escapeHTML(data.type || 'Основной')}</div>
            <div class="tooltip-row"><span>Период</span><strong>${escapeHTML(data.period)}</strong></div>
            <div class="tooltip-row"><span>Календарных</span><strong>${data.days}</strong></div>
            <div class="tooltip-row"><span>Рабочих</span><strong>${data.workDays}</strong></div>
            <div class="tooltip-sub">${data.conflict ? 'Есть пересечение внутри отдела.' : escapeHTML(data.note)}</div>
          `;
          els.tooltip.classList.add('show'); moveTooltip(event);
        });
        bar.addEventListener('mousemove', moveTooltip);
        bar.addEventListener('mouseleave', () => els.tooltip.classList.remove('show'));
        bar.addEventListener('click', () => openVacationDetails(bar.dataset.vacation, bar.dataset.deptContext));
      });
      document.querySelectorAll('[data-edit-employee]').forEach(btn => btn.addEventListener('click', () => openEmployeeModal(btn.dataset.editEmployee)));
      document.querySelectorAll('[data-toggle-dept]').forEach(btn => btn.addEventListener('click', () => {
        const dept = btn.dataset.toggleDept; state.collapsed[dept] = !state.collapsed[dept]; saveState(); renderTimeline();
      }));
      document.querySelectorAll('.track-wrap').forEach(track => {
        track.addEventListener('mousedown', event => {
          if (event.button !== 0) return;
          if (event.target.closest('.vacation')) return;
          event.preventDefault();
          startSelection(track, event);
        });
        track.addEventListener('mousemove', event => { if (drag.active) updateSelection(track, event); });
        track.addEventListener('click', event => {
          if (event.target.closest('.vacation')) return;
          if (drag.justFinished) { drag.justFinished = false; return; }
        });
      });
    }

    function moveTooltip(event){ els.tooltip.style.left = `${event.clientX}px`; els.tooltip.style.top = `${event.clientY}px`; }

    let drag = { active:false, employeeId:null, dept:null, start:null, end:null, track:null, justFinished:false };
    function pointInTrack(track, event){
      const rect = track.getBoundingClientRect();
      const x = Math.max(0, Math.min(timelineWidth()-1, event.clientX - rect.left));
      return { x, date: dateFromX(x) };
    }
    function startSelection(track, event){
      const p = pointInTrack(track, event);
      drag = {
        active: true,
        employeeId: track.dataset.trackEmployee,
        dept: track.dataset.trackDept,
        start: p.date,
        end: p.date,
        track,
        justFinished: false
      };
      showSelection();
    }
    function updateSelection(track, event){
      if (!drag.active || drag.track !== track) return;
      const p = pointInTrack(track, event);
      drag.end = p.date;
      showSelection();
    }
    function showSelection(){
      if (!drag.active || !drag.track) return;
      const selector = drag.track.querySelector('.drag-selection');
      if (!selector) return;
      const start = drag.start <= drag.end ? drag.start : drag.end;
      const end = drag.start <= drag.end ? drag.end : drag.start;
      selector.style.left = `${xForDate(start)}px`;
      selector.style.width = `${rawWidth(start, end)}px`;
      selector.classList.add('show');
    }
    function hideSelection(){
      if (!drag.track) return;
      const selector = drag.track.querySelector('.drag-selection');
      if (selector) selector.classList.remove('show');
    }
    document.addEventListener('mouseup', event => {
      if (!drag.active) return;
      const employeeId = drag.employeeId;
      const start = drag.start <= drag.end ? drag.start : drag.end;
      const end = drag.start <= drag.end ? drag.end : drag.start;
      hideSelection();
      drag.active = false;
      drag.justFinished = true;
      const endDate = new Date(end);
      if (start.getTime() === end.getTime()) endDate.setDate(endDate.getDate()+6);
      openVacationModal(null, { employeeId, start: formatISO(start), end: formatISO(endDate) });
      setTimeout(() => { drag.justFinished = false; }, 80);
    });

    function openVacationDetails(id, deptContext){
      const vacation = state.vacations.find(v => v.id === id); if (!vacation) return;
      const employee = getEmployee(vacation.employeeId);
      if (!employee) return toast('Сотрудник для этого отпуска не найден');
      const context = deptContext || employee.dept;
      const conflicts = overlapsFor(vacation, context);
      const stats = employeeStats(employee.id);
      const vis = visualStatus(vacation);
      $('sideTitle').textContent = 'Отпуск';
      $('sideSub').textContent = `${employee.name} · ${context === '__manager__' ? 'Руководитель' : context}`;
      const employeeOptions = state.employees.map(e => `<option value="${e.id}" ${e.id === vacation.employeeId ? 'selected' : ''}>${escapeHTML(e.name)} · ${escapeHTML(e.role === 'manager' ? 'Руководитель' : e.dept)}</option>`).join('');
      $('sideBody').innerHTML = `
        <form id="sideVacationForm" class="form">
          <input type="hidden" id="sideVacationId" value="${vacation.id}">
          <div class="form-field">
            <label for="sideVacationEmployee">Сотрудник</label>
            <select id="sideVacationEmployee">${employeeOptions}</select>
          </div>
          <div class="form-row">
            <div class="form-field"><label for="sideVacationStart">Начало</label><input id="sideVacationStart" type="date" value="${vacation.start}" required></div>
            <div class="form-field"><label for="sideVacationEnd">Окончание</label><input id="sideVacationEnd" type="date" value="${vacation.end}" required></div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label for="sideVacationStatus">Статус</label>
              <select id="sideVacationStatus">
                <option value="planned" ${normalizeStatus(vacation.status) === 'planned' ? 'selected' : ''}>Запланировано</option>
                <option value="approved" ${normalizeStatus(vacation.status) === 'approved' ? 'selected' : ''}>Утверждено</option>
              </select>
            </div>
            <div class="form-field">
              <label for="sideVacationType">Тип отпуска</label>
              <select id="sideVacationType">
                <option value="main" ${vacationType(vacation) === 'main' ? 'selected' : ''}>Основной</option>
                <option value="extra" ${vacationType(vacation) === 'extra' ? 'selected' : ''}>Дополнительный</option>
              </select>
            </div>
          </div>
          <div class="form-field">
            <label for="sideVacationNote">Комментарий</label>
            <textarea id="sideVacationNote" placeholder="Например: поездка, перенос периода, важная причина">${escapeHTML(vacation.note || '')}</textarea>
          </div>
          <div class="detail-grid">
            <div class="detail-card"><div class="detail-label">Текущий статус</div><div class="detail-value"><span class="status-badge ${vis}">${statusText[vis]}</span></div></div>
            <div class="detail-card"><div class="detail-label">Дни в ${state.year}</div><div class="detail-value">${vacationDaysInYear(vacation)} календарных · ${workingDaysInVacationYear(vacation)} рабочих</div></div>
            <div class="detail-card"><div class="detail-label">Баланс ${state.year}</div><div class="detail-value">${escapeHTML(balanceLabel(stats))}</div></div>
          </div>
          <div class="form-actions">
            <button id="sideDeleteVacationBtn" class="danger-lite visible" type="button">Удалить</button>
            <div class="form-actions-right">
              <button id="sideCancelVacationBtn" class="ghost" type="button">Отмена</button>
              <button class="primary" type="submit">Сохранить</button>
            </div>
          </div>
        </form>
        <div class="section-title">Пересечения</div>
        ${conflicts.length ? conflicts.map(item => `
          <div class="issue critical">
            <div class="issue-title">${escapeHTML(item.otherEmployee.name)}</div>
            <div class="issue-text">${dateLabel(formatISO(item.start))} — ${dateLabel(formatISO(item.end))}, ${Math.round((item.end-item.start)/MS_DAY)+1} дн.</div>
            <button class="action-btn primary-lite" data-allow="${vacation.id}:${item.other.id}" style="margin-top:8px;">Отметить допустимым</button>
          </div>`).join('') : `<div class="issue"><div class="issue-title">Пересечений нет</div><div class="issue-text">В этом отделе нет пересекающихся отпусков.</div></div>`}
      `;
      els.sidePanel.classList.add('open'); bindSideEvents();
    }
    function bindSideEvents(){
      const sideForm = $('sideVacationForm');
      if (sideForm) {
        sideForm.addEventListener('submit', event => {
          event.preventDefault();
          const id = $('sideVacationId').value;
          const v = state.vacations.find(item => item.id === id);
          if (!v) return;
          const payload = vacationPayloadFromForm('sideVacation');
          const error = validateVacationPayload(payload, id);
          if (error) return toast(error);
          if (didVacationPeriodChange(v, payload)) removeAllowedConflictsFor(id);
          Object.assign(v, payload);
          cleanupAllowedConflicts();
          saveState();
          render();
          openVacationDetails(id, getEmployee(v.employeeId)?.dept);
          toast('Отпуск сохранён');
        });
      }
      const cancel = $('sideCancelVacationBtn');
      if (cancel) cancel.addEventListener('click', () => closeSidePanel());
      const del = $('sideDeleteVacationBtn');
      if (del) del.addEventListener('click', () => {
        const id = $('sideVacationId').value;
        if (!confirm('Удалить отпуск?\nЭто действие нельзя отменить.')) return;
        removeAllowedConflictsFor(id);
        state.vacations = state.vacations.filter(v => v.id !== id);
        saveState(); render(); closeSidePanel(); toast('Отпуск удалён');
      });
      document.querySelectorAll('[data-allow]').forEach(btn => btn.addEventListener('click', () => {
        const [a,b] = btn.dataset.allow.split(':'); const key = conflictKey(a,b); if (!state.allowedConflicts.includes(key)) state.allowedConflicts.push(key);
        saveState(); render(); toast('Пересечение отмечено допустимым'); const v = state.vacations.find(item => item.id === a); if (v) openVacationDetails(a, getEmployee(v.employeeId)?.dept);
      }));
    }
    function closeSidePanel(){ els.sidePanel.classList.remove('open'); }

    function defaultVacationRange(){
      const today = new Date();
      let start = today.getFullYear() === state.year ? new Date(today.getFullYear(), today.getMonth(), today.getDate()) : yearStart(state.year);
      if (start > yearEnd(state.year)) start = yearStart(state.year);
      while (start.getDay() === 0 || start.getDay() === 6) start.setDate(start.getDate()+1);
      const end = new Date(start);
      end.setDate(end.getDate()+13);
      if (end > yearEnd(state.year)) end.setTime(yearEnd(state.year).getTime());
      return { start: formatISO(start), end: formatISO(end) };
    }
    function vacationPayloadFromForm(prefix = 'vacation'){
      return {
        employeeId: $(`${prefix}Employee`).value,
        start: $(`${prefix}Start`).value,
        end: $(`${prefix}End`).value,
        status: normalizeStatus($(`${prefix}Status`).value),
        type: $(`${prefix}Type`).value === 'extra' ? 'extra' : 'main',
        note: $(`${prefix}Note`).value.trim()
      };
    }
    function validateVacationPayload(payload, currentId = null){
      if (!getEmployee(payload.employeeId)) return 'Сначала выберите существующего сотрудника';
      if (!isValidDateISO(payload.start) || !isValidDateISO(payload.end)) return 'Укажите корректные даты отпуска';
      if (parseDate(payload.end) < parseDate(payload.start)) return 'Дата окончания не может быть раньше начала';
      const duplicate = state.vacations.some(v =>
        v.id !== currentId &&
        v.employeeId === payload.employeeId &&
        v.start === payload.start &&
        v.end === payload.end &&
        vacationType(v) === payload.type
      );
      return duplicate ? 'Такой отпуск у сотрудника уже есть' : '';
    }
    function didVacationPeriodChange(vacation, payload){
      return vacation.employeeId !== payload.employeeId || vacation.start !== payload.start || vacation.end !== payload.end;
    }
    function openOwnVacation(){
      const employee = employeesForCurrentView()[0];
      if (!employee) {
        toast(viewDepartments().length ? 'Сначала добавьте сотрудника в выбранный отдел' : 'Сначала выберите отдел');
        if (!viewDepartments().length) openDepartmentPicker(); else openEmployeeModal();
        return;
      }
      openVacationModal(null, { employeeId: employee.id, ...defaultVacationRange(), status:'planned' });
    }
    function openVacationModal(id = null, preset = {}){
      if (!viewDepartments().length) {
        toast('Сначала выберите отдел');
        openDepartmentPicker();
        return;
      }
      if (!employeesForCurrentView().length) {
        toast('Сначала добавьте сотрудника в выбранный отдел');
        openEmployeeModal();
        return;
      }
      const defaults = defaultVacationRange();
      $('vacationForm').reset(); $('vacationId').value = ''; $('vacationModalTitle').textContent = 'Добавить отпуск';
      $('vacationEmployee').value = preset.employeeId || employeesForCurrentView()[0]?.id || '';
      $('vacationStart').value = preset.start || defaults.start;
      $('vacationEnd').value = preset.end || defaults.end;
      $('vacationStatus').value = preset.status || 'planned'; $('vacationType').value = preset.type || 'main'; $('vacationNote').value = ''; $('deleteVacationBtn').classList.remove('visible');
      if (id) {
        const v = state.vacations.find(item => item.id === id); if (!v) return;
        $('vacationModalTitle').textContent = 'Редактировать отпуск'; $('vacationId').value = v.id; $('vacationEmployee').value = v.employeeId;
        $('vacationStart').value = v.start; $('vacationEnd').value = v.end; $('vacationStatus').value = normalizeStatus(v.status); $('vacationType').value = vacationType(v); $('vacationNote').value = v.note || ''; $('deleteVacationBtn').classList.add('visible');
      }
      openModal(els.vacationModal);
    }
    function saveVacation(event){
      event.preventDefault();
      const id = $('vacationId').value;
      const payload = vacationPayloadFromForm('vacation');
      const error = validateVacationPayload(payload, id || null);
      if (error) return toast(error);
      if (id) {
        const vacation = state.vacations.find(v => v.id === id);
        if (!vacation) return toast('Отпуск не найден');
        if (didVacationPeriodChange(vacation, payload)) removeAllowedConflictsFor(id);
        Object.assign(vacation, payload);
        toast('Отпуск обновлён');
      }
      else {
        state.vacations.push({ id: uid('v'), ...payload });
        toast('Отпуск добавлен');
      }
      cleanupAllowedConflicts();
      saveState(); render(); closeModal(els.vacationModal);
    }
    function deleteVacation(){
      const id = $('vacationId').value; if (!id) return; if (!confirm('Удалить отпуск?\nЭто действие нельзя отменить.')) return;
      removeAllowedConflictsFor(id);
      state.vacations = state.vacations.filter(v => v.id !== id); saveState(); render(); closeModal(els.vacationModal); closeSidePanel(); toast('Отпуск удалён');
    }

    function addDepartment(){
      const entered = prompt('Введите название отдела');
      if (entered === null) return;
      const name = entered.trim();
      if (!name) return toast('Введите название отдела');
      const existing = allDepartments().find(dept => normalized(dept) === normalized(name));
      const dept = existing || ensureDepartment(name);
      state.viewDepts = [dept];
      saveState();
      render();
      toast(existing ? 'Отдел выбран' : 'Отдел добавлен');
    }
    function deleteDepartment(){
      const departments = allDepartments();
      if (!departments.length) return toast('Нет отделов для удаления');
      const current = viewDepartments()[0] || departments[0];
      const entered = prompt(`Введите название отдела для удаления:\n\n${departments.join('\n')}`, current);
      if (entered === null) return;
      const dept = departments.find(item => normalized(item) === normalized(entered));
      if (!dept) return toast('Такой отдел не найден');

      const employeeIds = new Set(state.employees.filter(e => normalized(e.dept) === normalized(dept)).map(e => e.id));
      const vacationCount = state.vacations.filter(v => employeeIds.has(v.employeeId)).length;
      const employeeCount = employeeIds.size;
      if (!confirm(`Удалить отдел "${dept}"?\nБудет удалено сотрудников: ${employeeCount}, отпусков: ${vacationCount}.\nЭто действие нельзя отменить.`)) return;

      state.departments = (state.departments || []).filter(item => normalized(item) !== normalized(dept));
      state.employees = state.employees.filter(e => !employeeIds.has(e.id));
      state.vacations = state.vacations.filter(v => !employeeIds.has(v.employeeId));
      delete state.managers[dept];
      delete state.collapsed[dept];
      state.viewDepts = viewDepartments().filter(item => normalized(item) !== normalized(dept));
      if (state.profile?.employeeId && employeeIds.has(state.profile.employeeId)) {
        state.profile = null;
      } else if (state.profile?.depts) {
        state.profile.depts = state.profile.depts.filter(item => normalized(item) !== normalized(dept));
        if (state.profile.dept && normalized(state.profile.dept) === normalized(dept)) state.profile.dept = state.profile.depts[0] || '';
        if (state.profile.role === 'manager' && !state.profile.depts.length) state.profile = null;
      }
      cleanupAllowedConflicts();
      saveState();
      render();
      closeSidePanel();
      toast('Отдел удалён');
    }

    function openEmployeeModal(id = null){
      $('employeeForm').reset();
      $('employeeId').value = '';
      $('employeeModalTitle').textContent = 'Добавить сотрудника';
      $('employeeRole').value = 'staff';
      $('deleteEmployeeBtn').classList.remove('visible');
      renderEmployeeDeptOptions(viewDepartments()[0] || allDepartments()[0] || '');
      if (id) {
        const e = getEmployee(id);
        if (!e) return;
        $('employeeModalTitle').textContent = 'Редактировать сотрудника';
        $('employeeId').value = e.id;
        $('employeeName').value = e.name;
        renderEmployeeDeptOptions(e.dept);
        $('employeeRole').value = e.role === 'manager' ? 'manager' : 'staff';
        $('employeePosition').value = e.position || (e.role === 'manager' ? 'Руководитель отдела' : 'Сотрудник');
        $('employeeInitials').value = e.initials;
        $('deleteEmployeeBtn').classList.add('visible');
      }
      openModal(els.employeeModal);
    }
    function saveEmployee(event){
      event.preventDefault();
      const id = $('employeeId').value;
      const existing = id ? getEmployee(id) : null;
      const role = $('employeeRole').value === 'manager' ? 'manager' : 'staff';
      const payload = { name: $('employeeName').value.trim(), dept: $('employeeDept').value.trim(), position: $('employeePosition').value.trim(), initials: $('employeeInitials').value.trim().toUpperCase(), role };
      if (!payload.name || !payload.dept || !payload.position || !payload.initials) return toast('Заполните все поля сотрудника');
      const duplicate = state.employees.some(e => e.id !== id && normalized(e.name) === normalized(payload.name) && normalized(e.dept) === normalized(payload.dept));
      if (duplicate) return toast('Такой сотрудник уже есть в этом отделе');
      ensureDepartment(payload.dept);
      if (id && existing) {
        const previousDept = existing.dept;
        const wasManager = existing.role === 'manager' || state.managers?.[previousDept] === id;
        Object.assign(existing, payload);
        if (wasManager && previousDept !== payload.dept && state.managers?.[previousDept] === id) state.managers[previousDept] = null;
        if (role === 'manager') {
          setDepartmentManager(payload.dept, id);
        } else {
          clearManagerLinks(id);
        }
        if (state.profile?.employeeId === id) {
          state.profile.name = payload.name;
          state.profile.dept = payload.dept;
          state.profile.role = role === 'manager' ? 'manager' : 'employee';
          state.profile.depts = [payload.dept];
        }
      } else {
        const employee = { id: uid('e'), ...payload };
        state.employees.push(employee);
        if (role === 'manager') setDepartmentManager(payload.dept, employee.id);
      }
      if (!viewDepartments().some(dept => normalized(dept) === normalized(payload.dept))) state.viewDepts = [payload.dept];
      saveState(); render(); closeModal(els.employeeModal); toast(id ? 'Сотрудник обновлён' : 'Сотрудник добавлен');
    }
    function deleteEmployee(){
      const id = $('employeeId').value; if (!id) return; const e = getEmployee(id);
      if (!confirm(`Удалить сотрудника ${e?.name || ''} и все его отпуска?\nЭто действие нельзя отменить.`)) return;
      state.vacations.filter(item => item.employeeId === id).forEach(v => removeAllowedConflictsFor(v.id));
      state.employees = state.employees.filter(item => item.id !== id);
      state.vacations = state.vacations.filter(item => item.employeeId !== id);
      Object.keys(state.managers || {}).forEach(dept => { if (state.managers[dept] === id) state.managers[dept] = null; });
      cleanupAllowedConflicts();
      if (state.profile?.employeeId === id) { state.profile = null; state.viewDepts = []; }
      saveState(); render(); maybeShowOnboarding(); closeModal(els.employeeModal); toast('Сотрудник удалён');
    }
    let lastFocusedElement = null;
    function focusFirstControl(container){
      requestAnimationFrame(() => {
        const target = container.querySelector('input:not([type="hidden"]), select, textarea, button');
        if (target) target.focus();
      });
    }
    function setMenuOpen(open){
      $('moreMenu').classList.toggle('open', open);
      $('moreBtn').setAttribute('aria-expanded', String(open));
    }
    function setDepartmentPopoverOpen(open){
      els.departmentPopover.classList.toggle('open', open);
      els.departmentPickerBtn.setAttribute('aria-expanded', String(open));
    }
    function openModal(modal){
      lastFocusedElement = document.activeElement;
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      focusFirstControl(modal);
    }
    function closeModal(modal){
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') lastFocusedElement.focus();
    }

    function setZoom(value){
      const centerDate = dateFromX(els.scroll.scrollLeft + (els.scroll.clientWidth - Number(getComputedStyle(document.documentElement).getPropertyValue('--left-col').replace('px','') || 294)) / 2);
      state.zoom = Math.max(180, Math.min(420, Number(value)));
      scheduleSave();
      syncControls();
      renderTimeline();
      requestAnimationFrame(() => {
        const leftCol = Number(getComputedStyle(document.documentElement).getPropertyValue('--left-col').replace('px','')) || 294;
        els.scroll.scrollLeft = Math.max(0, xForDate(centerDate) - Math.max(0, (els.scroll.clientWidth - leftCol) / 2));
      });
    }

    function exportCsv(){
      const rows = [['Сотрудник','Отдел','Начало','Окончание','Статус','Тип',`Календарных дней в ${state.year}`,`Рабочих дней в ${state.year}`,'Комментарий']];
      state.vacations
        .filter(v => clampVacation(v))
        .sort((a,b)=>parseDate(a.start)-parseDate(b.start))
        .forEach(v => {
          const e = getEmployee(v.employeeId);
          rows.push([e?.name || '', e?.role === 'manager' ? 'Руководитель' : e?.dept || '', v.start, v.end, statusText[visualStatus(v)], typeText[vacationType(v)], vacationDaysInYear(v), workingDaysInVacationYear(v), v.note || '']);
        });
      const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(';')).join('\n');
      downloadBlob(new Blob(['\ufeff' + csv], { type:'text/csv;charset=utf-8' }), `vacation-plan-${state.year}.csv`); toast('CSV экспортирован');
    }
    function exportJson(){ downloadBlob(new Blob([JSON.stringify(state,null,2)], { type:'application/json' }), `vacation-backup-${state.year}.json`); }
    function importJson(file){
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const data = JSON.parse(reader.result);
          if (!isObject(data) || !Array.isArray(data.employees) || !Array.isArray(data.vacations)) throw new Error();
          state = normalizeLoaded(data);
          cleanupAllowedConflicts();
          await saveState({ force: true });
          render();
          if (state.profile) closeOnboarding(); else maybeShowOnboarding();
          toast('Данные импортированы');
        }
        catch { toast('Не удалось импортировать JSON'); }
      };
      reader.readAsText(file);
    }
    function downloadBlob(blob, name){ const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 0); }
    function restoreWithCode(){
      const entered = prompt(`Введите код сброса, чтобы полностью откатить сайт к начальному состоянию.\nКод: ${RESET_CODE}`);
      if (entered === null) return;
      if (entered.trim() !== RESET_CODE) return toast('Неверный код сброса');
      state = startWithEmptyTimeline(clone(defaultState));
      saveState({ force: true }).then(saved => {
        render();
        maybeShowOnboarding();
        toast(saved ? 'Сайт сброшен к начальному состоянию' : 'Сброс выполнен только на экране');
      });
    }
    function renderOnboardDepartmentOptions(){
      const depts = allDepartments();
      $('onboardDept').innerHTML = depts.map(d => `<option value="${escapeHTML(d)}">${escapeHTML(d)}</option>`).join('') + `<option value="__new">Создать новый отдел…</option>`;
      $('managerDeptChecks').innerHTML = depts.map(d => `<label class="dept-check"><input type="checkbox" value="${escapeHTML(d)}"><span>${escapeHTML(d)}</span></label>`).join('');
      $('managerDeptChecks').querySelectorAll('label').forEach(label => {
        const input = label.querySelector('input');
        input.addEventListener('change', () => { label.classList.toggle('active', input.checked); renderIdentityPicker(); });
      });
      renderIdentityPicker();
    }
    function updateOnboardRole(){
      const role = document.querySelector('input[name="onboardRole"]:checked')?.value || 'employee';
      document.querySelectorAll('.role-card').forEach(card => card.classList.toggle('active', card.querySelector('input').checked));
      $('managerDepts').classList.toggle('show', role === 'manager'); $('employeeDeptField').classList.toggle('hidden', role === 'manager');
      renderIdentityPicker();
    }
    function updateNewDept(){
      const isNew = $('onboardDept').value === '__new'; $('deptCreateHint').classList.toggle('hidden', !isNew); if (!isNew) return;
      const value = $('newDeptName').value.trim(); const similar = similarDepartments(value); $('similarDeptWrap').innerHTML = similar.map(d => `<button class="similar-pill" type="button" data-similar="${escapeHTML(d)}">Использовать: ${escapeHTML(d)}</button>`).join(''); $('similarDeptWrap').classList.toggle('show', !!similar.length);
      renderIdentityPicker();
    }
    function finishOnboarding(event){
      event.preventDefault();
      const typedName = $('onboardName').value.trim();
      const role = onboardingRole();
      if (!typedName) return;

      let dept = '';
      let selected = [];
      let employee = selectedOnboardingEmployee();
      const pickerVisible = !$('existingEmployeeField').classList.contains('hidden');
      const pickerValue = $('existingEmployeeSelect').value;
      if (pickerVisible && !pickerValue) return toast('Выберите себя в списке или создайте новую карточку');

      if (role === 'manager') {
        selected = onboardingSelectedDepartments();
        if (!selected.length) return toast('Выберите хотя бы один отдел');
        selected = selected.map(ensureDepartment).filter(Boolean);
        dept = selected[0];
        if (!employee && pickerValue !== '__new') employee = findEmployeeByName(typedName, selected);
        if (!employee) {
          employee = { id: uid('e'), name: typedName, dept, position:'Руководитель отдела', initials: initialsFromName(typedName), role:'manager' };
          state.employees.push(employee);
        } else {
          employee.role = 'manager';
          employee.dept = employee.dept || dept;
          employee.position = employee.position || 'Руководитель отдела';
        }
        selected.forEach(d => state.managers[d] = employee.id);
      } else {
        if ($('onboardDept').value === '__new') {
          const typedDept = $('newDeptName').value.trim();
          if (!typedDept) return toast('Введите название нового отдела');
          if (!$('createDeptConfirm').checked) return toast('Подтвердите создание нового отдела');
          dept = ensureDepartment(typedDept);
        } else {
          dept = ensureDepartment($('onboardDept').value);
        }
        selected = [dept];
        if (!employee && pickerValue !== '__new') employee = findEmployeeByName(typedName, selected);
        if (!employee) {
          employee = { id: uid('e'), name: typedName, dept, position:'Сотрудник', initials: initialsFromName(typedName), role:'staff' };
          state.employees.push(employee);
        } else {
          employee.role = employee.role === 'manager' ? 'manager' : 'staff';
          employee.dept = employee.dept || dept;
          employee.position = employee.position || 'Сотрудник';
        }
      }

      state.profile = { name: employee.name, role, dept, depts:selected, employeeId: employee.id };
      state.viewDepts = role === 'manager' ? selected : [dept];
      saveState(); closeOnboarding(); render(); scrollToWorkWindow('auto'); toast('График настроен');
    }
    function closeOnboarding(){
      els.onboarding.classList.remove('open');
      els.onboarding.setAttribute('aria-hidden', 'true');
    }
    function maybeShowOnboarding(){
      closeOnboarding();
    }

    function scrollToWorkWindow(behavior = 'auto'){
      requestAnimationFrame(() => {
        const today = new Date();
        let target;
        if (today.getFullYear() === state.year) {
          target = new Date(state.year, Math.max(0, today.getMonth() - 1), 1);
        } else {
          target = new Date(state.year, 0, 1);
        }
        els.scroll.scrollTo({ left: Math.max(0, xForDate(target)), behavior });
      });
    }

    function bindStaticEvents(){
      els.search.addEventListener('input', e => { state.query = e.target.value; scheduleSave(); renderTimeline(); });
      els.year.addEventListener('change', e => { state.year = Number(e.target.value); saveState(); render(); });
      els.zoomSlider.addEventListener('input', e => setZoom(e.target.value));
      $('zoomOutBtn').addEventListener('click', () => setZoom(state.zoom - 10));
      $('zoomInBtn').addEventListener('click', () => setZoom(state.zoom + 10));
      document.querySelectorAll('[data-filter]').forEach(chip => chip.addEventListener('click', () => { state.filter = chip.dataset.filter; saveState(); render(); }));
      $('todayBtn').addEventListener('click', () => scrollToWorkWindow('smooth'));
      $('prevBtn').addEventListener('click', () => els.scroll.scrollBy({ left:-460, behavior:'smooth' }));
      $('nextBtn').addEventListener('click', () => els.scroll.scrollBy({ left:460, behavior:'smooth' }));
      $('addVacationBtn').addEventListener('click', openOwnVacation);

      $('moreBtn').addEventListener('click', e => { e.stopPropagation(); setMenuOpen(!$('moreMenu').classList.contains('open')); setDepartmentPopoverOpen(false); });
      $('departmentPickerBtn').addEventListener('click', e => { e.stopPropagation(); renderDepartmentControls(); setDepartmentPopoverOpen(!els.departmentPopover.classList.contains('open')); setMenuOpen(false); });
      $('deptAllBtn').addEventListener('click', () => { els.departmentOptions.querySelectorAll('input').forEach(i => { i.checked = true; i.closest('label').classList.add('active'); }); });
      $('deptOwnBtn').addEventListener('click', () => {
        const own = managerDepartments().length ? managerDepartments() : allDepartments();
        els.departmentOptions.querySelectorAll('input').forEach(i => { const checked = own.some(d => normalized(d) === normalized(i.value)); i.checked = checked; i.closest('label').classList.toggle('active', checked); });
      });
      $('deptApplyBtn').addEventListener('click', () => {
        const checked = [...els.departmentOptions.querySelectorAll('input:checked')].map(i => i.value); state.viewDepts = checked.length ? checked : managerDepartments();
        saveState(); render(); setDepartmentPopoverOpen(false);
      });

      $('addDepartmentBtn').addEventListener('click', addDepartment);
      $('addEmployeeBtn').addEventListener('click', () => { setMenuOpen(false); openEmployeeModal(); });
      $('deleteDepartmentBtn').addEventListener('click', () => { setMenuOpen(false); deleteDepartment(); });
      $('exportCsvBtn').addEventListener('click', exportCsv); $('backupBtn').addEventListener('click', exportJson); $('importBtn').addEventListener('click', () => $('importFile').click()); $('importFile').addEventListener('change', e => { const file = e.target.files[0]; if (file) importJson(file); e.target.value = ''; });
      $('printBtn').addEventListener('click', () => window.print()); $('restoreBtn').addEventListener('click', restoreWithCode);

      $('vacationForm').addEventListener('submit', saveVacation); $('employeeForm').addEventListener('submit', saveEmployee); $('deleteVacationBtn').addEventListener('click', deleteVacation); $('deleteEmployeeBtn').addEventListener('click', deleteEmployee);
      $('closeVacationModalBtn').addEventListener('click', () => closeModal(els.vacationModal)); $('cancelVacationBtn').addEventListener('click', () => closeModal(els.vacationModal)); $('closeEmployeeModalBtn').addEventListener('click', () => closeModal(els.employeeModal)); $('cancelEmployeeBtn').addEventListener('click', () => closeModal(els.employeeModal)); $('closeSideBtn').addEventListener('click', closeSidePanel);
      els.vacationModal.addEventListener('click', e => { if (e.target === els.vacationModal) closeModal(els.vacationModal); }); els.employeeModal.addEventListener('click', e => { if (e.target === els.employeeModal) closeModal(els.employeeModal); });

      $('onboardingForm').addEventListener('submit', finishOnboarding); document.querySelectorAll('input[name="onboardRole"]').forEach(i => i.addEventListener('change', updateOnboardRole)); $('onboardDept').addEventListener('change', () => { updateNewDept(); renderIdentityPicker(); }); $('newDeptName').addEventListener('input', updateNewDept); $('onboardName').addEventListener('input', renderIdentityPicker);
      $('similarDeptWrap').addEventListener('click', e => { const btn = e.target.closest('[data-similar]'); if (!btn) return; $('onboardDept').value = btn.dataset.similar; $('deptCreateHint').classList.add('hidden'); renderIdentityPicker(); });
      $('managerPickAllBtn').addEventListener('click', () => { document.querySelectorAll('#managerDeptChecks input').forEach(i => { i.checked = true; i.closest('label').classList.add('active'); }); renderIdentityPicker(); });
      $('managerClearBtn').addEventListener('click', () => { document.querySelectorAll('#managerDeptChecks input').forEach(i => { i.checked = false; i.closest('label').classList.remove('active'); }); renderIdentityPicker(); });
      $('skipOnboardingBtn').addEventListener('click', () => { state.profile = { name:'Гость', role:'employee', dept:'Все отделы', depts:[] }; state.viewDepts = allDepartments(); saveState(); closeOnboarding(); render(); scrollToWorkWindow('auto'); });

      document.addEventListener('click', e => {
        if (!$('moreMenu').contains(e.target) && e.target !== $('moreBtn')) setMenuOpen(false);
        if (!els.departmentPopover.contains(e.target) && !els.departmentPickerBtn.contains(e.target)) setDepartmentPopoverOpen(false);
      });
      document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        if (els.vacationModal.classList.contains('open')) closeModal(els.vacationModal);
        else if (els.employeeModal.classList.contains('open')) closeModal(els.employeeModal);
        else if (els.sidePanel.classList.contains('open')) closeSidePanel();
        else if ($('moreMenu').classList.contains('open')) setMenuOpen(false);
        else if (els.departmentPopover.classList.contains('open')) setDepartmentPopoverOpen(false);
      });
    }

    async function initApp(){
      bindStaticEvents();
      await loadStateFromFirebase();
    }

    initApp();
