(() => {
  const STORE = 'voice-routine-v1';
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const state = loadState();
  let editingRoutineId = null;
  let toastTimer;

  const dayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const fullDays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || '{}');
      return { tasks: Array.isArray(saved.tasks) ? saved.tasks : [], routines: Array.isArray(saved.routines) ? saved.routines : [] };
    } catch { return { tasks: [], routines: [] }; }
  }

  function persist() { localStorage.setItem(STORE, JSON.stringify(state)); render(); }
  function escapeHTML(value) { return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  function localDateKey(date) { const d = new Date(date); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  function dateAtOffset(offset) { const date = new Date(); date.setHours(0,0,0,0); date.setDate(date.getDate()+offset); return date; }
  function formatTime(value) { return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
  function showToast(message) {
    const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function render() {
    const today = localDateKey(new Date());
    const todayTasks = state.tasks.filter((task) => localDateKey(task.dueAt) === today).sort((a,b) => new Date(a.dueAt)-new Date(b.dueAt));
    const completed = todayTasks.filter((task) => task.done).length;
    $('#task-progress').textContent = `${completed}/${todayTasks.length}`;
    $('#routine-count').textContent = state.routines.filter((routine) => routine.active).length;
    $('#today-tasks').innerHTML = todayTasks.length ? todayTasks.map(taskCard).join('') : '<div class="empty-state">Tu día está despejado. Añade una tarea cuando quieras.</div>';

    $('#week-list').innerHTML = Array.from({ length: 7 }, (_, offset) => {
      const date = dateAtOffset(offset), key = localDateKey(date);
      const tasks = state.tasks.filter((task) => localDateKey(task.dueAt) === key).sort((a,b) => new Date(a.dueAt)-new Date(b.dueAt));
      const heading = offset === 0 ? 'Hoy' : offset === 1 ? 'Mañana' : new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }).format(date);
      const taskLines = tasks.length ? `<ul>${tasks.map((task) => `<li class="${task.done ? 'done' : ''}"><span class="dot"></span><span>${escapeHTML(task.title)}</span><span style="margin-left:auto;color:#9aa5b2">${formatTime(task.dueAt)}</span></li>`).join('')}</ul>` : '<div class="date-hint">Sin tareas</div>';
      return `<article class="week-day"><div class="week-day-heading"><strong>${escapeHTML(heading)}</strong><span>${tasks.filter((task) => task.done).length}/${tasks.length} hechas</span></div>${taskLines}</article>`;
    }).join('');

    $('#routine-list').innerHTML = state.routines.length ? state.routines.map(routineCard).join('') : '<div class="empty-state">Aún no tienes rutinas. Crea una para empezar.</div>';
    $$('.check-button').forEach((button) => button.addEventListener('click', () => toggleTask(button.dataset.id)));
    $$('.delete-task').forEach((button) => button.addEventListener('click', () => deleteTask(button.dataset.id)));
    $$('.edit-routine').forEach((button) => button.addEventListener('click', () => openRoutine(button.dataset.id)));
    $$('.delete-routine').forEach((button) => button.addEventListener('click', () => deleteRoutine(button.dataset.id)));
  }

  function taskCard(task) {
    return `<article class="task-card ${task.done ? 'completed' : ''}"><button class="check-button ${task.done ? 'done' : ''}" data-id="${task.id}" aria-label="${task.done ? 'Marcar pendiente' : 'Marcar completada'}">${task.done ? '✓' : ''}</button><div class="task-copy"><strong>${escapeHTML(task.title)}</strong><small>${formatTime(task.dueAt)}</small></div><button class="delete-button delete-task" data-id="${task.id}" aria-label="Eliminar tarea">×</button></article>`;
  }

  function routineCard(routine) {
    const days = routine.days.length === 7 ? 'Todos los días' : routine.days.map((day) => dayNames[day-1]).join(' · ');
    return `<article class="routine-card ${routine.active ? '' : 'routine-paused'}"><div class="routine-top"><span class="routine-glyph">↻</span><div class="routine-main"><strong>${escapeHTML(routine.name)}</strong><small>${escapeHTML(routine.time)} · ${escapeHTML(days)}${routine.active ? '' : ' · Pausada'}</small></div><div class="routine-actions"><button class="edit-routine" data-id="${routine.id}" aria-label="Editar rutina">✎</button><button class="delete-routine" data-id="${routine.id}" aria-label="Eliminar rutina">×</button></div></div>${routine.steps ? `<p class="routine-steps">${escapeHTML(routine.steps)}</p>` : ''}</article>`;
  }

  function addTask(title, dueAt) {
    state.tasks.push({ id: crypto.randomUUID(), title: title.trim(), dueAt: new Date(dueAt).toISOString(), done: false });
    persist(); showToast('Tarea guardada');
  }

  function parseQuickTask(text) {
    let title = text.trim(), date = new Date(Date.now() + 60 * 60 * 1000);
    if (/\bmañana\b/i.test(title)) { date.setDate(date.getDate()+1); title = title.replace(/\bmañana\b/i, ''); }
    else if (/\bhoy\b/i.test(title)) { title = title.replace(/\bhoy\b/i, ''); }
    const time = title.match(/\ba\s+las?\s+(\d{1,2})(?::(\d{2}))?\b|\b(\d{1,2}):(\d{2})\b/i);
    if (time) {
      const hour = Number(time[1] || time[3]), minute = Number(time[2] || time[4] || 0);
      if (hour <= 23 && minute <= 59) { date.setHours(hour, minute, 0, 0); title = title.replace(time[0], ''); }
    }
    title = title.replace(/\b(recuérdame(?: que)?|añade|agrega|tengo que)\b/ig, '').replace(/\s+/g, ' ').replace(/^[\s,.;:]+|[\s,.;:]+$/g, '');
    return { title, date };
  }

  function toggleTask(id) { const task = state.tasks.find((item) => item.id === id); if (task) { task.done = !task.done; persist(); } }
  function deleteTask(id) { state.tasks = state.tasks.filter((task) => task.id !== id); persist(); showToast('Tarea eliminada'); }
  function deleteRoutine(id) { state.routines = state.routines.filter((routine) => routine.id !== id); persist(); showToast('Rutina eliminada'); }

  function openTaskEditor() {
    const date = new Date(Date.now()+60*60*1000); date.setMinutes(date.getMinutes()-date.getTimezoneOffset());
    $('#task-date').value = date.toISOString().slice(0,16); $('#task-title').value = '';
    $('#task-dialog').showModal(); setTimeout(() => $('#task-title').focus(), 80);
  }

  function dayInputs(selected = [1,2,3,4,5,6,7]) {
    $('#day-options').innerHTML = dayNames.map((name, index) => `<label class="day-chip"><input type="checkbox" name="routine-day" value="${index+1}" ${selected.includes(index+1) ? 'checked' : ''}><span>${name}</span></label>`).join('');
  }

  function openRoutine(id = null) {
    editingRoutineId = id;
    const routine = state.routines.find((item) => item.id === id);
    $('#routine-dialog-title').textContent = routine ? 'Editar rutina' : 'Nueva rutina';
    $('#routine-name').value = routine?.name || ''; $('#routine-time').value = routine?.time || '08:00';
    $('#routine-steps').value = routine?.steps || ''; dayInputs(routine?.days || [1,2,3,4,5,6,7]);
    if (routine) {
      $('#routine-editor-form').insertAdjacentHTML('beforeend', `<label class="active-row"><input id="routine-active" type="checkbox" ${routine.active ? 'checked' : ''}> Rutina activa</label>`);
    } else { $('#routine-active')?.remove(); }
    $('#routine-dialog').showModal(); setTimeout(() => $('#routine-name').focus(), 80);
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ...state }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = `mi-rutina-copia-${localDateKey(new Date())}.json`; link.click(); URL.revokeObjectURL(url);
    showToast('Copia guardada en Archivos');
  }

  $('#today-label').textContent = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  $('#quick-task-form').addEventListener('submit', (event) => {
    event.preventDefault(); const field = $('#quick-task'), parsed = parseQuickTask(field.value);
    if (!parsed.title) { showToast('Escribe la tarea que quieres guardar'); return; }
    addTask(parsed.title, parsed.date); field.value = '';
  });
  $('#add-detailed-task').addEventListener('click', openTaskEditor);
  $('#task-editor-form').addEventListener('submit', (event) => {
    if (event.submitter?.value === 'cancel') return;
    event.preventDefault(); addTask($('#task-title').value, $('#task-date').value); $('#task-dialog').close();
  });
  $('#add-routine').addEventListener('click', () => openRoutine());
  $('#routine-editor-form').addEventListener('submit', (event) => {
    if (event.submitter?.value === 'cancel') return;
    event.preventDefault();
    const name = $('#routine-name').value.trim(); if (!name) return;
    const routine = state.routines.find((item) => item.id === editingRoutineId);
    const data = { name, time: $('#routine-time').value || '08:00', days: $$('input[name="routine-day"]:checked').map((input) => Number(input.value)), steps: $('#routine-steps').value.trim(), active: $('#routine-active') ? $('#routine-active').checked : true };
    if (routine) Object.assign(routine, data); else state.routines.push({ id: crypto.randomUUID(), ...data });
    persist(); $('#routine-dialog').close(); showToast('Rutina guardada');
  });
  $('#routine-dialog').addEventListener('close', () => $('#routine-active')?.remove());
  $('#backup-button').addEventListener('click', () => $('#restore-file').click());
  $('#restore-file').addEventListener('change', async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      const backup = JSON.parse(await file.text());
      if (!Array.isArray(backup.tasks) || !Array.isArray(backup.routines)) throw new Error('Formato no válido');
      state.tasks = backup.tasks; state.routines = backup.routines; persist(); showToast('Copia restaurada');
    } catch { showToast('No se pudo abrir esa copia'); }
    event.target.value = '';
  });
  $$('.tab').forEach((tab) => tab.addEventListener('click', () => {
    $$('.tab').forEach((item) => item.classList.toggle('active', item === tab));
    $$('.page').forEach((page) => page.classList.toggle('active', page.id === `page-${tab.dataset.page}`));
    $('#page-title').textContent = { today: 'Mi día', week: 'Mi semana', routines: 'Rutinas' }[tab.dataset.page];
  }));

  render();
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
})();
