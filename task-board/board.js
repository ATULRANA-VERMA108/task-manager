const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8080/api'
  : 'https://task-manager-backend-mwe1.onrender.com/api';

document.addEventListener('DOMContentLoaded', () => {
  initBoard();
  setupEventListeners();
});

let tasks = [];
let activities = [];
let currentOpenedTaskId = null;

// Initialize Board Tasks
async function initBoard() {
  try {
    const res = await fetch(`${API_BASE}/tasks`);
    if (res.ok) {
      tasks = await res.json();
      renderBoard();
      return;
    }
  } catch (error) {
    console.warn('Backend API offline. Falling back to local storage.', error);
  }

  // Local Storage Fallback
  const storedTasks = localStorage.getItem('tasks');
  if (storedTasks) {
    tasks = JSON.parse(storedTasks);
  } else {
    tasks = [
      { id: 1, title: 'Revise database configuration values', column: 'todo', priority: 'high', date: '2026-06-25', subtasks: [] },
      { id: 2, title: 'Deploy staging build to AWS ECS cluster', column: 'todo', priority: 'medium', date: '2026-06-26', subtasks: [] },
      { id: 3, title: 'Design new landing hero layouts', column: 'in-progress', priority: 'low', date: '2026-06-28', subtasks: [] },
      { id: 4, title: 'Write unit tests for authentication helpers', column: 'done', priority: 'high', date: '2026-06-22', subtasks: [] },
      { id: 5, title: 'Setup CORS policy on API gateways', column: 'done', priority: 'medium', date: '2026-06-23', subtasks: [] },
      { id: 6, title: 'Create Docker Compose file', column: 'in-progress', priority: 'high', date: '2026-06-25', subtasks: [] }
    ];
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  const storedActivities = localStorage.getItem('activities');
  activities = storedActivities ? JSON.parse(storedActivities) : [];

  renderBoard();
}

// Render task cards and columns
function renderBoard() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const priorityFilter = document.getElementById('priority-filter').value;

  const columns = {
    'todo': document.getElementById('tasks-todo'),
    'in-progress': document.getElementById('tasks-in-progress'),
    'in-review': document.getElementById('tasks-in-review'),
    'done': document.getElementById('tasks-done')
  };

  Object.values(columns).forEach(container => container.innerHTML = '');

  const counts = { 'todo': 0, 'in-progress': 0, 'in-review': 0, 'done': 0 };

  tasks.forEach(task => {
    const matchesSearch = task.title.toLowerCase().includes(query) || (task.description && task.description.toLowerCase().includes(query));
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

    if (matchesSearch && matchesPriority) {
      counts[task.column]++;
      const card = createTaskCard(task);
      columns[task.column].appendChild(card);
    }
  });

  document.getElementById('count-todo').textContent = counts['todo'];
  document.getElementById('count-in-progress').textContent = counts['in-progress'];
  document.getElementById('count-in-review').textContent = counts['in-review'];
  document.getElementById('count-done').textContent = counts['done'];

  setupDragAndDrop();
}

function createTaskCard(task) {
  const card = document.createElement('div');
  card.className = 'task-card';
  card.setAttribute('draggable', 'true');
  card.setAttribute('data-id', task.id);

  const totalSub = task.subtasks ? task.subtasks.length : 0;
  const completedSub = task.subtasks ? task.subtasks.filter(s => s.done).length : 0;
  const subText = totalSub > 0 ? `${completedSub}/${totalSub}` : '';

  let tagsHTML = '';
  if (task.tags && task.tags.length > 0) {
    tagsHTML = `<div class="card-tags">` + 
      task.tags.map(t => `<span class="card-tag-chip">${escapeHtml(t)}</span>`).join('') + 
      `</div>`;
  }

  const dueDate = new Date(task.date);
  const today = new Date();
  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  let isUrgent = diffDays <= 1 && task.column !== 'done';
  let dateClass = isUrgent ? 'card-footer-item card-date-alert' : 'card-footer-item';

  card.innerHTML = `
    <div class="task-card-header">
      <span class="badge badge-${task.priority}">${task.priority}</span>
      ${subText ? `
      <div class="card-footer-item" style="font-size:0.7rem; color:var(--text-muted);">
        <svg style="width:12px;height:12px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
        <span>${subText}</span>
      </div>` : ''}
    </div>
    <div class="task-card-title">${escapeHtml(task.title)}</div>
    ${tagsHTML}
    <div class="task-card-footer">
      <div class="${dateClass}">
        <svg style="width:12px;height:12px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span>${task.date}</span>
      </div>
      <div class="card-footer-item">
        <div style="width:18px;height:18px;border-radius:50%;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;">TM</div>
      </div>
    </div>
  `;

  card.addEventListener('click', () => {
    openDetailModal(task.id);
  });

  return card;
}

function setupDragAndDrop() {
  const cards = document.querySelectorAll('.task-card');
  const columns = document.querySelectorAll('.board-column');

  cards.forEach(card => {
    card.addEventListener('dragstart', () => card.classList.add('dragging'));
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });

  columns.forEach(column => {
    column.addEventListener('dragover', (e) => {
      e.preventDefault();
      column.classList.add('drag-over');
    });

    column.addEventListener('dragleave', () => column.classList.remove('drag-over'));

    column.addEventListener('drop', (e) => {
      e.preventDefault();
      column.classList.remove('drag-over');
      
      const draggingCard = document.querySelector('.dragging');
      if (!draggingCard) return;

      const cardId = parseInt(draggingCard.getAttribute('data-id'));
      const targetColumn = column.getAttribute('data-column');

      moveTask(cardId, targetColumn);
    });
  });
}

async function moveTask(cardId, targetColumn) {
  const task = tasks.find(t => t.id === cardId);
  if (task && task.column !== targetColumn) {
    task.column = targetColumn;
    
    try {
      const res = await fetch(`${API_BASE}/tasks/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      if (res.ok) {
        initBoard();
        return;
      }
    } catch (e) {
      console.warn('API error moving task, using local storage fallback', e);
    }
  }

  // Local storage fallback
  let prevColumn = '';
  let taskTitle = '';
  tasks = tasks.map(t => {
    if (t.id === cardId && t.column !== targetColumn) {
      prevColumn = t.column;
      taskTitle = t.title;
      t.column = targetColumn;

      activities.unshift({
        type: targetColumn === 'done' ? 'done' : 'add',
        desc: `Moved task "${taskTitle}" to ${targetColumn}`,
        time: 'Just now'
      });
    }
    return t;
  });

  localStorage.setItem('tasks', JSON.stringify(tasks));
  localStorage.setItem('activities', JSON.stringify(activities.slice(0, 10)));
  renderBoard();
}

function setupEventListeners() {
  document.getElementById('search-input').addEventListener('input', renderBoard);
  document.getElementById('priority-filter').addEventListener('change', renderBoard);

  const createModal = document.getElementById('create-modal');
  document.getElementById('open-create-modal-btn').addEventListener('click', () => {
    createModal.classList.add('active');
    document.getElementById('task-date').valueAsDate = new Date();
  });

  document.getElementById('close-create-btn').addEventListener('click', () => createModal.classList.remove('active'));
  document.getElementById('cancel-create-btn').addEventListener('click', () => createModal.classList.remove('active'));

  document.getElementById('create-task-form').addEventListener('submit', (e) => {
    e.preventDefault();
    createTask();
  });

  const detailModal = document.getElementById('detail-modal');
  document.getElementById('close-detail-btn').addEventListener('click', () => detailModal.classList.remove('active'));
  document.getElementById('close-detail-footer-btn').addEventListener('click', () => detailModal.classList.remove('active'));
  document.getElementById('delete-task-btn').addEventListener('click', deleteTask);

  document.getElementById('add-subtask-btn').addEventListener('click', addSubtask);
  document.getElementById('new-subtask-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSubtask();
    }
  });
}

async function createTask() {
  const title = document.getElementById('task-title').value;
  const priority = document.getElementById('task-priority').value;
  const date = document.getElementById('task-date').value;
  const desc = document.getElementById('task-desc').value;
  const tagsVal = document.getElementById('task-tags').value;
  const tags = tagsVal ? tagsVal.split(',').map(t => t.trim()).filter(t => t !== '') : [];

  const newTask = {
    title,
    priority,
    date,
    description: desc || 'No description provided.',
    tags,
    column: 'todo',
    subtasks: []
  };

  try {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    });
    if (res.ok) {
      document.getElementById('create-task-form').reset();
      document.getElementById('create-modal').classList.remove('active');
      initBoard();
      return;
    }
  } catch (e) {
    console.warn('API error creating task, falling back to local storage', e);
  }

  // Local storage fallback
  newTask.id = Date.now();
  tasks.push(newTask);
  activities.unshift({
    type: 'add',
    desc: `Created task: ${title}`,
    time: 'Just now'
  });

  localStorage.setItem('tasks', JSON.stringify(tasks));
  localStorage.setItem('activities', JSON.stringify(activities.slice(0, 10)));
  
  document.getElementById('create-task-form').reset();
  document.getElementById('create-modal').classList.remove('active');
  renderBoard();
}

function openDetailModal(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  currentOpenedTaskId = taskId;

  const prBadge = document.getElementById('detail-priority-badge');
  prBadge.className = `badge badge-${task.priority}`;
  prBadge.textContent = task.priority;

  document.getElementById('detail-title').textContent = task.title;
  document.getElementById('detail-date').textContent = task.date;
  
  const colNames = { 'todo': 'To Do', 'in-progress': 'In Progress', 'in-review': 'In Review', 'done': 'Done' };
  document.getElementById('detail-column').textContent = colNames[task.column] || task.column;
  document.getElementById('detail-desc').textContent = task.description || task.desc || 'No description provided.';

  const tagsEl = document.getElementById('detail-tags');
  tagsEl.innerHTML = '';
  if (task.tags && task.tags.length > 0) {
    task.tags.forEach(tag => {
      const chip = document.createElement('span');
      chip.className = 'card-tag-chip';
      chip.textContent = tag;
      tagsEl.appendChild(chip);
    });
  } else {
    tagsEl.innerHTML = '<span style="font-size: 0.85rem; color: var(--text-muted);">None</span>';
  }

  renderDetailSubtasks(task);
  document.getElementById('detail-modal').classList.add('active');
}

function renderDetailSubtasks(task) {
  const listEl = document.getElementById('detail-subtasks');
  listEl.innerHTML = '';

  if (!task.subtasks) task.subtasks = [];

  task.subtasks.forEach((sub, idx) => {
    const item = document.createElement('div');
    item.className = sub.done ? 'subtask-item checked' : 'subtask-item';
    
    item.innerHTML = `
      <input type="checkbox" class="subtask-checkbox" ${sub.done ? 'checked' : ''} data-index="${idx}">
      <span>${escapeHtml(sub.title)}</span>
      <button class="subtask-delete-btn" data-index="${idx}">
        <svg style="width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
        </svg>
      </button>
    `;

    item.querySelector('.subtask-checkbox').addEventListener('change', (e) => {
      toggleSubtask(idx, e.target.checked);
    });

    item.querySelector('.subtask-delete-btn').addEventListener('click', () => {
      deleteSubtask(idx);
    });

    listEl.appendChild(item);
  });
}

async function updateTaskOnApi(task) {
  try {
    const res = await fetch(`${API_BASE}/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    if (res.ok) {
      // Re-read task list from backend
      const freshRes = await fetch(`${API_BASE}/tasks`);
      if (freshRes.ok) {
        tasks = await freshRes.json();
        const updatedTask = tasks.find(t => t.id === task.id);
        renderDetailSubtasks(updatedTask);
        renderBoard();
        return true;
      }
    }
  } catch (e) {
    console.warn('API error updating task attributes', e);
  }
  return false;
}

async function toggleSubtask(index, isChecked) {
  const task = tasks.find(t => t.id === currentOpenedTaskId);
  if (task) {
    task.subtasks[index].done = isChecked;
    const success = await updateTaskOnApi(task);
    if (success) return;
  }

  // Local storage fallback
  tasks = tasks.map(t => {
    if (t.id === currentOpenedTaskId) {
      t.subtasks[index].done = isChecked;
    }
    return t;
  });
  localStorage.setItem('tasks', JSON.stringify(tasks));
  renderDetailSubtasks(task);
  renderBoard();
}

async function addSubtask() {
  const input = document.getElementById('new-subtask-input');
  const subtaskTitle = input.value.trim();
  if (!subtaskTitle) return;

  const task = tasks.find(t => t.id === currentOpenedTaskId);
  if (task) {
    if (!task.subtasks) task.subtasks = [];
    task.subtasks.push({ title: subtaskTitle, done: false });
    input.value = '';
    const success = await updateTaskOnApi(task);
    if (success) return;
  }

  // Local storage fallback
  tasks = tasks.map(t => {
    if (t.id === currentOpenedTaskId) {
      if (!t.subtasks) t.subtasks = [];
      t.subtasks.push({ title: subtaskTitle, done: false });
    }
    return t;
  });
  localStorage.setItem('tasks', JSON.stringify(tasks));
  input.value = '';
  renderDetailSubtasks(task);
  renderBoard();
}

async function deleteSubtask(index) {
  const task = tasks.find(t => t.id === currentOpenedTaskId);
  if (task) {
    task.subtasks.splice(index, 1);
    const success = await updateTaskOnApi(task);
    if (success) return;
  }

  // Local storage fallback
  tasks = tasks.map(t => {
    if (t.id === currentOpenedTaskId) {
      t.subtasks.splice(index, 1);
    }
    return t;
  });
  localStorage.setItem('tasks', JSON.stringify(tasks));
  renderDetailSubtasks(task);
  renderBoard();
}

async function deleteTask() {
  if (!confirm('Are you sure you want to delete this task?')) return;

  try {
    const res = await fetch(`${API_BASE}/tasks/${currentOpenedTaskId}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      document.getElementById('detail-modal').classList.remove('active');
      initBoard();
      return;
    }
  } catch (e) {
    console.warn('API error deleting task, using local storage fallback', e);
  }

  // Local storage fallback
  const deletedTask = tasks.find(t => t.id === currentOpenedTaskId);
  tasks = tasks.filter(t => t.id !== currentOpenedTaskId);
  localStorage.setItem('tasks', JSON.stringify(tasks));

  if (deletedTask) {
    activities.unshift({
      type: 'admin',
      desc: `Deleted task: ${deletedTask.title}`,
      time: 'Just now'
    });
    localStorage.setItem('activities', JSON.stringify(activities.slice(0, 10)));
  }

  document.getElementById('detail-modal').classList.remove('active');
  renderBoard();
}

function escapeHtml(text) {
  if (!text) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}
