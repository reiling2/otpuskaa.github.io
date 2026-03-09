(() => {
  const YEAR = 2026;
  const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const MONTHS_SHORT = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
  const PX_PER_DAY = 18;
  const STORAGE_KEY = 'vacation-timeline-data-v4-2026';

  const DEFAULT_DATA = {
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
    modalBackdrop: $('modalBackdrop'),
    modalTitle: $('modalTitle'),
    vacationId: $('vacationId'),
    employeeSelect: $('employeeSelect'),
    startDate: $('startDate'),
    endDate: $('endDate'),
    vacationColor: $('vacationColor'),
    comment: $('comment'),
    deleteBtn: $('deleteBtn'),
    employeeModalBackdrop: $('employeeModalBackdrop'),
    employeeGroupSelect: $('employeeGroupSelect'),
    newEmployeeName: $('newEmployeeName'),
    removeEmployeeModalBackdrop: $('removeEmployeeModalBackdrop'),
    removeEmployeeGroupSelect: $('removeEmployeeGroupSelect'),
    removeEmployeeSelect: $('removeEmployeeSelect')
  };

  let state = loadState();

  function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && Array.isArray(saved.groups) && Array.isArray(saved.vacations)) return saved;
    } catch {}
    return deepCopy(DEFAULT_DATA);
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function daysInMonth(monthIndex) {
    return new Date(YEAR, monthIndex + 1, 0).getDate();
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
    return dayIndex(dateStr) * PX_PER_DAY;
  }

  function durationWidth(startStr, endStr) {
    return Math.max((dayIndex(endStr) - dayIndex(startStr) + 1) * PX_PER_DAY - 2, 8);
  }

  function compactName(full) {
    const parts = String(full).trim().split(/\s+/);
    if (parts.length < 3) return full;
    return `${parts[0]} ${parts[1][0]}.${parts[2][0]}.`;
  }

  function formatTooltip(vac) {
    const s = new Date(vac.start + 'T00:00:00');
    const e = new Date(vac.end + 'T00:00:00');
    return `${compactName(vac.employee)} ${MONTHS_SHORT[s.getMonth()]} ${s.getDate()}-${MONTHS_SHORT[e.getMonth()]} ${e.getDate()}`;
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function getAllEmployees() {
    return state.groups.flatMap(g => g.employees).sort((a, b) => a.localeCompare(b, 'ru'));
  }

  function createMonthsHeader() {
    els.months.innerHTML = '';
    let totalWidth = 0;

    MONTHS.forEach((name, monthIndex) => {
      const days = daysInMonth(monthIndex);
      const width = days * PX_PER_DAY;
      totalWidth += width;

      const month = document.createElement('div');
      month.className = 'month';
      month.style.width = `${width}px`;
      month.style.minWidth = `${width}px`;
      month.innerHTML = `
        <div class="month-name">${name}</div>
        <div class="days" style="grid-template-columns: repeat(${days}, minmax(0, 1fr));">
          ${Array.from({ length: days }, (_, i) => `<div class="day">${i + 1}</div>`).join('')}
        </div>
      `;
      els.months.appendChild(month);
    });

    els.board.style.minWidth = `calc(var(--left-w) + ${totalWidth}px)`;
    els.timelineCol.style.width = `${totalWidth}px`;
    els.timelineCol.style.minWidth = `${totalWidth}px`;
    renderMonthSeparators();
  }

  function renderMonthSeparators() {
    els.timelineGrid.innerHTML = '';
    let offset = 0;
    for (let i = 0; i < MONTHS.length - 1; i++) {
      offset += daysInMonth(i) * PX_PER_DAY;
      const line = document.createElement('div');
      line.className = 'month-separator';
      line.style.left = `${offset}px`;
      els.timelineGrid.appendChild(line);
    }
  }

  function renderFilters() {
    const groupOptions = state.groups.map(g => `<option value="${escapeHtml(g.name)}">${escapeHtml(g.name)}</option>`).join('');
    els.groupFilter.innerHTML = `<option value="all">Все отделы</option>${groupOptions}`;
    els.employeeGroupSelect.innerHTML = groupOptions;
    els.removeEmployeeGroupSelect.innerHTML = groupOptions;
    els.employeeSelect.innerHTML = getAllEmployees().map(emp => `<option value="${escapeHtml(emp)}">${escapeHtml(emp)}</option>`).join('');
    refreshRemoveEmployeeSelect();
  }

  function getFilteredGroups() {
    const selectedGroup = els.groupFilter.value;
    const q = els.searchInput.value.trim().toLowerCase();

    return state.groups
      .filter(group => selectedGroup === 'all' || group.name === selectedGroup)
      .map(group => ({
        name: group.name,
        employees: group.employees.filter(emp => !q || emp.toLowerCase().includes(q))
      }))
      .filter(group => group.employees.length > 0);
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

      namesGroup.innerHTML = `<div class="group-title">${escapeHtml(group.name)}</div>`;
      timelineGroup.innerHTML = `<div class="group-title" style="opacity:0">${escapeHtml(group.name)}</div>`;

      group.employees.forEach(employee => {
        visibleEmployees += 1;

        const rowName = document.createElement('div');
        rowName.className = 'employee-row-name';
        rowName.textContent = employee;
        bodyNames.appendChild(rowName);

        const rowTimeline = document.createElement('div');
        rowTimeline.className = 'vacation-row';

        const vacations = state.vacations.filter(v => v.employee === employee);
        visibleVacations += vacations.length;

        vacations.forEach(vac => {
          const bar = document.createElement('div');
          bar.className = 'vacation-bar';
          bar.style.left = `${offsetForDate(vac.start)}px`;
          bar.style.width = `${durationWidth(vac.start, vac.end)}px`;
          bar.style.background = vac.color;
          bar.dataset.tip = formatTooltip(vac) + (vac.comment ? ` · ${vac.comment}` : '');

          bar.addEventListener('mouseenter', e => showTooltip(e, bar.dataset.tip));
          bar.addEventListener('mousemove', moveTooltip);
          bar.addEventListener('mouseleave', hideTooltip);
          bar.addEventListener('dblclick', () => openVacationModal(vac));
          rowTimeline.appendChild(bar);
        });

        bodyTimeline.appendChild(rowTimeline);
      });

      addDepartmentOverlapLines(group, bodyTimeline);

      namesGroup.appendChild(bodyNames);
      timelineGroup.appendChild(bodyTimeline);

      els.namesCol.appendChild(namesGroup);
      els.timelineGroups.appendChild(timelineGroup);
    });

    els.status.textContent = `Сотрудников: ${visibleEmployees} · Отпусков: ${visibleVacations} · Двойной клик по полоске — редактирование`;
  }

  function addDepartmentOverlapLines(group, bodyTimeline) {
    const employeeSet = new Set(group.employees);
    const vacations = state.vacations
      .filter(v => employeeSet.has(v.employee))
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
        line.style.left = `${day * PX_PER_DAY}px`;
        bodyTimeline.appendChild(line);
        overlapStarted = true;
      }

      if (!hasOverlap && overlapStarted) {
        const line = document.createElement('div');
        line.className = 'overlap-line';
        line.style.left = `${day * PX_PER_DAY}px`;
        bodyTimeline.appendChild(line);
        overlapStarted = false;
      }
    }

    if (overlapStarted) {
      const line = document.createElement('div');
      line.className = 'overlap-line';
      line.style.left = `${getDaysInYear() * PX_PER_DAY}px`;
      bodyTimeline.appendChild(line);
    }
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

  function openVacationModal(vac = null) {
    els.modalBackdrop.classList.add('open');

    if (vac) {
      els.modalTitle.textContent = 'Редактировать отпуск';
      els.vacationId.value = vac.id;
      els.employeeSelect.value = vac.employee;
      els.startDate.value = vac.start;
      els.endDate.value = vac.end;
      els.vacationColor.value = vac.color;
      els.comment.value = vac.comment || '';
      els.deleteBtn.style.display = 'inline-block';
    } else {
      els.modalTitle.textContent = 'Добавить отпуск';
      els.vacationId.value = '';
      els.employeeSelect.selectedIndex = 0;
      els.startDate.value = `${YEAR}-01-15`;
      els.endDate.value = `${YEAR}-01-28`;
      els.vacationColor.value = '#2d63dd';
      els.comment.value = '';
      els.deleteBtn.style.display = 'none';
    }
  }

  function closeVacationModal() {
    els.modalBackdrop.classList.remove('open');
  }

  function openEmployeeModal() {
    renderFilters();
    els.employeeModalBackdrop.classList.add('open');
    els.employeeGroupSelect.value = state.groups[0]?.name || '';
    els.newEmployeeName.value = '';
  }

  function closeEmployeeModal() {
    els.employeeModalBackdrop.classList.remove('open');
  }

  function openRemoveEmployeeModal() {
    renderFilters();
    els.removeEmployeeModalBackdrop.classList.add('open');
    els.removeEmployeeGroupSelect.value = state.groups[0]?.name || '';
    refreshRemoveEmployeeSelect();
  }

  function closeRemoveEmployeeModal() {
    els.removeEmployeeModalBackdrop.classList.remove('open');
  }

  function refreshRemoveEmployeeSelect() {
    const groupName = els.removeEmployeeGroupSelect.value || state.groups[0]?.name || '';
    const group = state.groups.find(g => g.name === groupName);
    const employees = group ? [...group.employees].sort((a, b) => a.localeCompare(b, 'ru')) : [];

    if (employees.length === 0) {
      els.removeEmployeeSelect.innerHTML = '<option value="">Нет сотрудников</option>';
      return;
    }

    els.removeEmployeeSelect.innerHTML = employees
      .map(emp => `<option value="${escapeHtml(emp)}">${escapeHtml(emp)}</option>`)
      .join('');
  }

  function validateVacation(vac, skipId = '') {
    if (!vac.employee || !vac.start || !vac.end) return 'Заполните все обязательные поля';
    if (vac.end < vac.start) return 'Дата окончания не может быть раньше даты начала';
    if (!vac.start.startsWith(`${YEAR}-`) || !vac.end.startsWith(`${YEAR}-`)) return `Диапазон должен быть внутри ${YEAR} года`;

    const overlap = state.vacations.find(item =>
      item.employee === vac.employee &&
      item.id !== skipId &&
      !(vac.end < item.start || vac.start > item.end)
    );

    if (overlap) return `Пересечение с существующим отпуском: ${formatTooltip(overlap)}`;
    return '';
  }

  function saveVacation() {
    const vac = {
      id: els.vacationId.value || crypto.randomUUID(),
      employee: els.employeeSelect.value,
      start: els.startDate.value,
      end: els.endDate.value,
      color: els.vacationColor.value,
      comment: els.comment.value.trim()
    };

    const error = validateVacation(vac, els.vacationId.value);
    if (error) {
      alert(error);
      return;
    }

    const idx = state.vacations.findIndex(v => v.id === vac.id);
    if (idx >= 0) state.vacations[idx] = vac;
    else state.vacations.push(vac);

    state.vacations.sort((a, b) => a.start.localeCompare(b.start));
    saveState();
    renderBoard();
    closeVacationModal();
  }

  function deleteVacation() {
    const id = els.vacationId.value;
    if (!id) return;
    state.vacations = state.vacations.filter(v => v.id !== id);
    saveState();
    renderBoard();
    closeVacationModal();
  }

  function resetAllVacations() {
    state.vacations = [];
    saveState();
    renderBoard();
  }

  function addEmployee() {
    const groupName = els.employeeGroupSelect.value;
    const fullName = els.newEmployeeName.value.trim().replace(/\s+/g, ' ');

    if (!groupName || !fullName) {
      alert('Укажите отдел и ФИО сотрудника');
      return;
    }

    const group = state.groups.find(g => g.name === groupName);
    if (!group) {
      alert('Отдел не найден');
      return;
    }

    if (group.employees.some(emp => emp.toLowerCase() === fullName.toLowerCase())) {
      alert('Такой сотрудник уже есть в выбранном отделе');
      return;
    }

    group.employees.push(fullName);
    group.employees.sort((a, b) => a.localeCompare(b, 'ru'));
    saveState();
    renderFilters();
    renderBoard();
    closeEmployeeModal();
  }

  function removeEmployee() {
    const groupName = els.removeEmployeeGroupSelect.value;
    const employeeName = els.removeEmployeeSelect.value;

    if (!groupName || !employeeName) {
      alert('Выберите отдел и сотрудника');
      return;
    }

    const group = state.groups.find(g => g.name === groupName);
    if (!group) {
      alert('Отдел не найден');
      return;
    }

    group.employees = group.employees.filter(emp => emp !== employeeName);
    state.vacations = state.vacations.filter(v => v.employee !== employeeName);

    saveState();
    renderFilters();
    renderBoard();
    closeRemoveEmployeeModal();
  }

  $('addBtn').onclick = () => openVacationModal();
  $('resetBtn').onclick = resetAllVacations;
  $('addEmployeeToolbarBtn').onclick = openEmployeeModal;
  $('removeEmployeeToolbarBtn').onclick = openRemoveEmployeeModal;
  $('closeModalBtn').onclick = closeVacationModal;
  $('saveBtn').onclick = saveVacation;
  $('deleteBtn').onclick = deleteVacation;
  $('closeEmployeeModalBtn').onclick = closeEmployeeModal;
  $('saveEmployeeBtn').onclick = addEmployee;
  $('closeRemoveEmployeeModalBtn').onclick = closeRemoveEmployeeModal;
  $('confirmRemoveEmployeeBtn').onclick = removeEmployee;
  els.removeEmployeeGroupSelect.onchange = refreshRemoveEmployeeSelect;
  els.groupFilter.onchange = renderBoard;
  els.searchInput.oninput = renderBoard;

  els.modalBackdrop.addEventListener('click', e => { if (e.target === els.modalBackdrop) closeVacationModal(); });
  els.employeeModalBackdrop.addEventListener('click', e => { if (e.target === els.employeeModalBackdrop) closeEmployeeModal(); });
  els.removeEmployeeModalBackdrop.addEventListener('click', e => { if (e.target === els.removeEmployeeModalBackdrop) closeRemoveEmployeeModal(); });

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeVacationModal();
      closeEmployeeModal();
      closeRemoveEmployeeModal();
    }
  });

  createMonthsHeader();
  renderFilters();
  renderBoard();
})();