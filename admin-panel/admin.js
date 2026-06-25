const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8080/api'
  : 'https://task-manager-backend-mwe1.onrender.com/api';

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initUserDirectory();
  initAnalytics();
  initSettings();
});

function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const panes = document.querySelectorAll('.tab-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetId = `tab-${tab.getAttribute('data-tab')}`;
      document.getElementById(targetId).classList.add('active');
      
      if (tab.getAttribute('data-tab') === 'analytics') {
        renderAllocationChart();
      }
    });
  });
}

// 2. User Directory Roster Logic
let users = [];

async function initUserDirectory() {
  try {
    const res = await fetch(`${API_BASE}/users`);
    if (res.ok) {
      users = await res.json();
      renderUserTable();
      setupUserModalListeners();
      return;
    }
  } catch (error) {
    console.warn('Backend API offline. Using local storage roster.', error);
  }

  // Local storage fallback
  const storedUsers = localStorage.getItem('users');
  if (storedUsers) {
    users = JSON.parse(storedUsers);
  } else {
    users = [
      { id: 1, name: 'Alex Rivera', email: 'alex.rivera@enterprise.com', dept: 'Engineering', role: 'Admin', active: true },
      { id: 2, name: 'Jane Doe', email: 'jane.doe@enterprise.com', dept: 'Design', role: 'Contributor', active: true },
      { id: 3, name: 'Devon Carter', email: 'devon.carter@enterprise.com', dept: 'Product', role: 'Manager', active: true },
      { id: 4, name: 'Sophia Chen', email: 'sophia.chen@enterprise.com', dept: 'Marketing', role: 'Contributor', active: false }
    ];
    localStorage.setItem('users', JSON.stringify(users));
  }

  renderUserTable();
  setupUserModalListeners();
}

function setupUserModalListeners() {
  const modal = document.getElementById('user-modal');
  
  // Clean event listeners to avoid duplicates
  const openBtn = document.getElementById('open-user-modal-btn');
  const closeBtn = document.getElementById('close-user-modal-btn');
  const cancelBtn = document.getElementById('cancel-user-btn');
  const form = document.getElementById('create-user-form');

  // Replace buttons to clear previous listeners
  const newOpenBtn = openBtn.cloneNode(true);
  openBtn.parentNode.replaceChild(newOpenBtn, openBtn);
  newOpenBtn.addEventListener('click', () => modal.classList.add('active'));

  const newCloseBtn = closeBtn.cloneNode(true);
  closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
  newCloseBtn.addEventListener('click', () => modal.classList.remove('active'));

  const newCancelBtn = cancelBtn.cloneNode(true);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
  newCancelBtn.addEventListener('click', () => modal.classList.remove('active'));

  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);
  newForm.addEventListener('submit', (e) => {
    e.preventDefault();
    createUser();
  });
}

function renderUserTable() {
  const tbody = document.getElementById('users-table-body');
  tbody.innerHTML = '';

  users.forEach(user => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="user-profile-cell">
          <div class="user-avatar">${getInitials(user.name)}</div>
          <div class="user-info-text">
            <span class="user-name">${escapeHtml(user.name)}</span>
            <span class="user-email">${escapeHtml(user.email)}</span>
          </div>
        </div>
      </td>
      <td><span style="font-size:0.9rem;">${user.dept}</span></td>
      <td><span class="role-badge">${user.role}</span></td>
      <td>
        <div class="status-indicator">
          <span class="status-dot ${user.active ? 'active' : 'inactive'}"></span>
          <span>${user.active ? 'Active' : 'Disabled'}</span>
        </div>
      </td>
      <td>
        <div class="actions-cell">
          <button class="action-btn" title="Toggle Status" onclick="toggleUserStatus(${user.id})">
            <svg style="width:16px;height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
            </svg>
          </button>
          <button class="action-btn btn-delete" title="Delete User" onclick="deleteUser(${user.id})">
            <svg style="width:16px;height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
            </svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

async function createUser() {
  const name = document.getElementById('user-name').value;
  const email = document.getElementById('user-email').value;
  const dept = document.getElementById('user-dept').value;
  const role = document.getElementById('user-role').value;

  const newUser = { name, email, dept, role, active: true };

  try {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });
    if (res.ok) {
      document.getElementById('user-modal').classList.remove('active');
      initUserDirectory();
      return;
    }
  } catch (e) {
    console.warn('API error creating user, falling back to local storage', e);
  }

  // Local storage fallback
  newUser.id = Date.now();
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
  logAdminActivity(`Added roster user: ${name}`);

  document.getElementById('user-modal').classList.remove('active');
  renderUserTable();
}

window.toggleUserStatus = async function(id) {
  try {
    const res = await fetch(`${API_BASE}/users/${id}/toggle`, {
      method: 'PUT'
    });
    if (res.ok) {
      initUserDirectory();
      return;
    }
  } catch (e) {
    console.warn('API error toggling user status, falling back to local storage', e);
  }

  // Local storage fallback
  users = users.map(user => {
    if (user.id === id) {
      user.active = !user.active;
      logAdminActivity(`Toggled status for user: ${user.name}`);
    }
    return user;
  });
  localStorage.setItem('users', JSON.stringify(users));
  renderUserTable();
};

window.deleteUser = async function(id) {
  const targetUser = users.find(u => u.id === id);
  if (!targetUser) return;
  if (!confirm(`Are you sure you want to remove user "${targetUser.name}"?`)) return;

  try {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      initUserDirectory();
      return;
    }
  } catch (e) {
    console.warn('API error deleting user, falling back to local storage', e);
  }

  // Local storage fallback
  users = users.filter(u => u.id !== id);
  localStorage.setItem('users', JSON.stringify(users));
  logAdminActivity(`Deleted user account: ${targetUser.name}`);
  renderUserTable();
};

function logAdminActivity(desc) {
  const storedActivities = localStorage.getItem('activities');
  let acts = storedActivities ? JSON.parse(storedActivities) : [];
  acts.unshift({ type: 'admin', desc, time: 'Just now' });
  localStorage.setItem('activities', JSON.stringify(acts.slice(0, 10)));
}

// 3. Analytics Charting & Performance Monitors
function initAnalytics() {
  renderAllocationChart();
  
  setInterval(() => {
    const dbVal = Math.floor(25 + Math.random() * 40);
    const dbFill = (dbVal / 100) * 100;
    document.getElementById('metric-db-val').textContent = `${dbVal} ms`;
    document.getElementById('metric-db-fill').style.width = `${dbFill}%`;

    const cpuVal = Math.floor(12 + Math.random() * 33);
    document.getElementById('metric-cpu-val').textContent = `${cpuVal}%`;
    document.getElementById('metric-cpu-fill').style.width = `${cpuVal}%`;

    const connVal = Math.floor(78 + Math.random() * 10);
    document.getElementById('metric-conn-val').textContent = `${connVal}%`;
    document.getElementById('metric-conn-fill').style.width = `${connVal}%`;
  }, 3000);
}

function renderAllocationChart() {
  const depts = ['Engineering', 'Design', 'Marketing', 'Product'];
  const allocation = [14, 8, 4, 9];
  
  const svgWidth = 500;
  const svgHeight = 250;
  const paddingX = 60;
  const paddingY = 40;
  const chartWidth = svgWidth - paddingX - 40;
  const chartHeight = svgHeight - paddingY - 20;
  const barWidth = 45;
  const gap = (chartWidth - barWidth * depts.length) / (depts.length + 1);
  const maxAlloc = 20;

  const barChartGroup = document.getElementById('bar-chart-content');
  if (!barChartGroup) return;
  barChartGroup.innerHTML = '';

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <linearGradient id="bar-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#06b6d4" />
      <stop offset="100%" stop-color="#7c3aed" />
    </linearGradient>
  `;
  barChartGroup.appendChild(defs);

  depts.forEach((dept, idx) => {
    const val = allocation[idx];
    const x = paddingX + gap + idx * (barWidth + gap);
    const h = (val / maxAlloc) * chartHeight;
    const y = svgHeight - paddingY - h;

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', barWidth);
    rect.setAttribute('height', h);
    rect.setAttribute('class', 'analytics-bar');
    rect.setAttribute('rx', 4);
    barChartGroup.appendChild(rect);

    const valTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    valTxt.setAttribute('x', x + barWidth / 2);
    valTxt.setAttribute('y', y - 6);
    valTxt.setAttribute('fill', '#fff');
    valTxt.setAttribute('font-size', '10px');
    valTxt.setAttribute('font-weight', '600');
    valTxt.setAttribute('text-anchor', 'middle');
    valTxt.textContent = val;
    barChartGroup.appendChild(valTxt);

    const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    lbl.setAttribute('x', x + barWidth / 2);
    lbl.setAttribute('y', svgHeight - 20);
    lbl.setAttribute('fill', 'var(--text-muted)');
    lbl.setAttribute('font-size', '11px');
    lbl.setAttribute('text-anchor', 'middle');
    lbl.textContent = dept;
    barChartGroup.appendChild(lbl);
  });
}

// 4. Global Settings Logic
async function initSettings() {
  const form = document.getElementById('settings-form');
  
  // Try loading settings from API
  try {
    const res = await fetch(`${API_BASE}/settings`);
    if (res.ok) {
      const settings = await res.json();
      const maintenanceSetting = settings.find(s => s.id === 'maintenance');
      const allowCreateSetting = settings.find(s => s.id === 'allow-create');
      const archiveDaysSetting = settings.find(s => s.id === 'archive-days');

      if (maintenanceSetting) document.getElementById('setting-maintenance').checked = (maintenanceSetting.value === 'true');
      if (allowCreateSetting) document.getElementById('setting-allow-create').checked = (allowCreateSetting.value === 'true');
      if (archiveDaysSetting) document.getElementById('setting-archive-days').value = archiveDaysSetting.value;
      
      setupSettingsSubmit(true);
      return;
    }
  } catch (e) {
    console.warn('API error loading settings, using local storage fallback', e);
  }

  // Local storage fallback
  const maintenance = localStorage.getItem('setting-maintenance') === 'true';
  const allowCreate = localStorage.getItem('setting-allow-create') !== 'false';
  const archiveDays = localStorage.getItem('setting-archive-days') || '90';

  document.getElementById('setting-maintenance').checked = maintenance;
  document.getElementById('setting-allow-create').checked = allowCreate;
  document.getElementById('setting-archive-days').value = archiveDays;

  setupSettingsSubmit(false);
}

function setupSettingsSubmit(useApi) {
  const form = document.getElementById('settings-form');
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const isMaintenance = document.getElementById('setting-maintenance').checked;
    const isAllowCreate = document.getElementById('setting-allow-create').checked;
    const days = document.getElementById('setting-archive-days').value;

    if (useApi) {
      const payload = [
        { id: 'maintenance', value: String(isMaintenance) },
        { id: 'allow-create', value: String(isAllowCreate) },
        { id: 'archive-days', value: String(days) }
      ];
      try {
        const res = await fetch(`${API_BASE}/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          alert('Global settings successfully saved to Spring Boot Backend.');
          return;
        }
      } catch (err) {
        console.warn('API error saving settings, falling back to local storage', err);
      }
    }

    // Local storage fallback
    localStorage.setItem('setting-maintenance', isMaintenance);
    localStorage.setItem('setting-allow-create', isAllowCreate);
    localStorage.setItem('setting-archive-days', days);

    logAdminActivity(`Modified administration console parameters`);
    alert('Global settings successfully saved to Local Storage.');
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}
