const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8080/api'
  : 'https://task-manager-backend-mwe1.onrender.com/api';

document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initDashboardData();
});

// Clock Logic
function initClock() {
  const timeEl = document.getElementById('live-time');
  const dateEl = document.getElementById('live-date');
  const greetingEl = document.getElementById('greeting-msg');

  function update() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    timeEl.textContent = `${hours}:${minutes}:${seconds}`;

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('en-US', options);

    if (hours < 12) {
      greetingEl.textContent = 'Good Morning, Team Member';
    } else if (hours < 18) {
      greetingEl.textContent = 'Good Afternoon, Team Member';
    } else {
      greetingEl.textContent = 'Good Evening, Team Member';
    }
  }

  update();
  setInterval(update, 1000);
}

// Data Load Logic
let tasks = [];
let activities = [];

async function initDashboardData() {
  try {
    // Try to load from Spring Boot Backend API
    const statsRes = await fetch(`${API_BASE}/analytics/summary`);
    const activitiesRes = await fetch(`${API_BASE}/analytics/activities`);
    const tasksRes = await fetch(`${API_BASE}/tasks`);

    if (statsRes.ok && activitiesRes.ok && tasksRes.ok) {
      const stats = await statsRes.json();
      activities = await activitiesRes.json();
      tasks = await tasksRes.json();
      
      // Map properties from API response to match page elements
      document.getElementById('total-tasks-stat').textContent = stats.totalTasks;
      document.getElementById('progress-tasks-stat').textContent = stats.inProgress;
      document.getElementById('completed-tasks-stat').textContent = stats.completed;

      // Transform backend activity logs times (since they are LocalDateTime)
      activities = activities.map(act => {
        let timeStr = 'Just now';
        if (act.timestamp) {
          const actDate = new Date(act.timestamp);
          const diffMs = new Date() - actDate;
          const diffMins = Math.floor(diffMs / 60000);
          if (diffMins > 60) {
            const diffHours = Math.floor(diffMins / 60);
            timeStr = diffHours > 24 ? actDate.toLocaleDateString() : `${diffHours} hours ago`;
          } else if (diffMins > 0) {
            timeStr = `${diffMins} mins ago`;
          }
        }
        return { type: act.type, desc: act.desc, time: timeStr };
      });

      renderChecklist();
      renderActivities();
      renderProductivityChart();
      return;
    }
  } catch (error) {
    console.warn('Backend API offline. Falling back to local storage mock.', error);
  }

  // Local Storage Fallback
  loadFromLocalStorage();
}

function loadFromLocalStorage() {
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
  if (storedActivities) {
    activities = JSON.parse(storedActivities);
  } else {
    activities = [
      { type: 'done', desc: 'Completed task: Write unit tests for authentication helpers', time: '2 hours ago' },
      { type: 'add', desc: 'Added new task: Revise database configuration values', time: '4 hours ago' },
      { type: 'admin', desc: 'Role updated: Jane Doe set to Project Contributor', time: 'Yesterday' },
      { type: 'done', desc: 'Completed task: Setup CORS policy on API gateways', time: 'Yesterday' }
    ];
    localStorage.setItem('activities', JSON.stringify(activities));
  }

  renderStats();
  renderChecklist();
  renderActivities();
  renderProductivityChart();
}

function renderStats() {
  const total = tasks.length;
  const inProgress = tasks.filter(t => t.column === 'in-progress' || t.column === 'todo').length;
  const completed = tasks.filter(t => t.column === 'done').length;

  document.getElementById('total-tasks-stat').textContent = total;
  document.getElementById('progress-tasks-stat').textContent = inProgress;
  document.getElementById('completed-tasks-stat').textContent = completed;
}

function renderChecklist() {
  const listEl = document.getElementById('dashboard-checklist');
  listEl.innerHTML = '';

  const activeTasks = tasks.filter(t => t.column !== 'done').slice(0, 3);

  if (activeTasks.length === 0) {
    listEl.innerHTML = '<div class="checklist-text" style="color:var(--text-muted);">No urgent actions left! Well done.</div>';
    return;
  }

  activeTasks.forEach(task => {
    const item = document.createElement('div');
    item.className = 'checklist-item';
    
    const dueDate = new Date(task.date);
    const today = new Date();
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    let dueStr = `${diffDays}d left`;
    if (diffDays === 0) dueStr = 'Today';
    if (diffDays < 0) dueStr = 'Overdue';

    item.innerHTML = `
      <input type="checkbox" class="checklist-checkbox" data-id="${task.id}">
      <div class="checklist-text">${task.title}</div>
      <div class="checklist-due">${dueStr}</div>
    `;

    const checkbox = item.querySelector('.checklist-checkbox');
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        setTimeout(() => {
          completeTask(task.id);
        }, 500);
      }
    });

    listEl.appendChild(item);
  });
}

async function completeTask(taskId) {
  // Try sending PUT update to API
  const task = tasks.find(t => t.id === parseInt(taskId));
  if (task) {
    task.column = 'done';
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      if (res.ok) {
        initDashboardData(); // Refresh all stats & logs from API
        return;
      }
    } catch (e) {
      console.warn('API error completing task, falling back to local storage', e);
    }
  }

  // Local storage fallback
  tasks = tasks.map(t => {
    if (t.id === parseInt(taskId)) {
      t.column = 'done';
      activities.unshift({
        type: 'done',
        desc: `Completed task: ${t.title}`,
        time: 'Just now'
      });
    }
    return t;
  });

  localStorage.setItem('tasks', JSON.stringify(tasks));
  localStorage.setItem('activities', JSON.stringify(activities.slice(0, 10)));
  
  renderStats();
  renderChecklist();
  renderActivities();
  renderProductivityChart();
}

function renderActivities() {
  const feedEl = document.getElementById('dashboard-activities');
  feedEl.innerHTML = '';

  activities.forEach(act => {
    const item = document.createElement('div');
    item.className = 'activity-item';
    
    let markerClass = 'marker-add';
    if (act.type === 'done') markerClass = 'marker-done';
    if (act.type === 'admin') markerClass = 'marker-admin';

    item.innerHTML = `
      <div class="activity-marker ${markerClass}"></div>
      <div class="activity-content">
        <div class="activity-desc">${act.desc}</div>
        <div class="activity-time">${act.time}</div>
      </div>
    `;
    feedEl.appendChild(item);
  });
}

function renderProductivityChart() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const completedTodayCount = tasks.filter(t => t.column === 'done').length;
  const values = [3, 5, 2, 7, 4, 1, Math.max(1, completedTodayCount - 3)];

  const svgWidth = 600;
  const svgHeight = 240;
  const paddingX = 50;
  const paddingY = 30;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;
  const stepX = chartWidth / (days.length - 1);
  const maxValue = 10;
  
  const getY = (val) => svgHeight - paddingY - (val / maxValue) * chartHeight;
  const getX = (idx) => paddingX + idx * stepX;

  let linePathD = '';
  let areaPathD = `M ${getX(0)} ${svgHeight - paddingY}`;

  values.forEach((val, idx) => {
    const x = getX(idx);
    const y = getY(val);
    if (idx === 0) {
      linePathD += `M ${x} ${y}`;
    } else {
      linePathD += ` L ${x} ${y}`;
    }
    areaPathD += ` L ${x} ${y}`;
  });
  
  areaPathD += ` L ${getX(values.length - 1)} ${svgHeight - paddingY} Z`;

  document.getElementById('chart-line').setAttribute('d', linePathD);
  document.getElementById('chart-area').setAttribute('d', areaPathD);

  const pointsGroup = document.getElementById('chart-points');
  pointsGroup.innerHTML = '';
  
  const labelsGroup = document.getElementById('chart-labels-x');
  labelsGroup.innerHTML = '';

  const tooltipEl = document.getElementById('chart-tooltip');
  const hoverLineEl = document.getElementById('hover-line');

  values.forEach((val, idx) => {
    const x = getX(idx);
    const y = getY(val);

    const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txt.setAttribute('x', x);
    txt.setAttribute('y', svgHeight - 10);
    txt.setAttribute('class', 'chart-label-x');
    txt.textContent = days[idx];
    labelsGroup.appendChild(txt);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', 5);
    circle.setAttribute('class', 'chart-point');
    circle.setAttribute('stroke', idx % 2 === 0 ? 'var(--primary)' : 'var(--secondary)');
    
    circle.addEventListener('mouseenter', () => {
      circle.setAttribute('r', 8);
      circle.style.strokeWidth = '4px';

      const pctX = (x / svgWidth) * 100;
      const pctY = (y / svgHeight) * 100;
      
      tooltipEl.style.left = `${pctX}%`;
      tooltipEl.style.top = `${pctY}%`;
      tooltipEl.style.display = 'block';
      tooltipEl.querySelector('.tooltip-day').textContent = getFullDayName(days[idx]);
      tooltipEl.querySelector('.tooltip-val').textContent = `${val} Tasks Done`;

      hoverLineEl.setAttribute('x1', x);
      hoverLineEl.setAttribute('x2', x);
      hoverLineEl.style.display = 'block';
    });

    circle.addEventListener('mouseleave', () => {
      circle.setAttribute('r', 5);
      circle.style.strokeWidth = '3px';
      tooltipEl.style.display = 'none';
      hoverLineEl.style.display = 'none';
    });

    pointsGroup.appendChild(circle);
  });
}

function getFullDayName(day) {
  const map = { 'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday', 'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday' };
  return map[day] || day;
}
