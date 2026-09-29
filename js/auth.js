/**
 * ====================================================================
 * Road Hazard Reporting & Tracking System
 * Authentication & Common UI Manager (Vanilla JavaScript)
 * ====================================================================
 */

// Toast notification helper
window.showToast = function(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `
    <span>${icon}</span>
    <div>${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

// Check authentication status and configure page access
window.initAuth = async function(options = { requireAuth: false, requireAdmin: false }) {
  const user = await window.db.auth.getSessionUser();
  const currentPath = window.location.pathname;

  // Access control guards - immediate strict redirection without flash of content
  if (options.requireAuth && !user) {
    window.location.replace('/login.html?redirect=' + encodeURIComponent(currentPath));
    return null;
  }

  if (options.requireAdmin) {
    if (!user) {
      window.location.replace('/login.html?admin=true&redirect=' + encodeURIComponent(currentPath));
      return null;
    }
    if (user.role !== 'admin') {
      window.location.replace('/dashboard.html?denied=admin');
      return null;
    }
  }

  // Update navbar items based on auth state
  renderNavbarAuth(user);

  return user;
};

// Update Navbar elements dynamically across all pages
function renderNavbarAuth(user) {
  const authContainer = document.getElementById('nav-auth-container');
  const userBadge = document.getElementById('nav-user-badge');

  if (!authContainer) return;

  if (user) {
    const isAdmin = user.role === 'admin';
    const firstInitial = (user.full_name || 'U').trim().charAt(0).toUpperCase();
    const firstName = escapeHtml(user.full_name.split(' ')[0]);

    authContainer.innerHTML = `
      <div class="nav-auth-wrapper">
        <div class="nav-user-chip">
          <span class="user-avatar-dot">${firstInitial}</span>
          <span style="font-weight: 600; font-size: 0.825rem; color: var(--text-main);">${firstName}</span>
          <span class="badge ${isAdmin ? 'badge-sev-high' : 'badge-status-verified'}" style="font-size: 0.65rem; padding: 2px 6px;">
            ${isAdmin ? 'Admin' : 'Citizen'}
          </span>
        </div>
        ${isAdmin 
          ? `<a href="/admin/dashboard.html" class="btn btn-primary btn-sm" style="padding: 0.35rem 0.75rem;">
               🛡️ Admin Console
             </a>` 
          : `<a href="/dashboard.html" class="btn btn-outline-primary btn-sm" style="padding: 0.35rem 0.75rem;">
               Dashboard
             </a>`
        }
        <button id="logout-btn" class="btn btn-ghost btn-sm" style="padding: 0.35rem 0.65rem;" title="Sign out">Logout</button>
      </div>
    `;

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      await window.db.auth.signOut();
      showToast('Logged out successfully.', 'success');
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 500);
    });
  } else {
    authContainer.innerHTML = `
      <div class="nav-auth-wrapper">
        <a href="/login.html" class="nav-auth-link">Login</a>
        <a href="/register.html" class="btn btn-primary btn-sm" style="padding: 0.4rem 0.85rem;">Register</a>
        <span class="nav-divider"></span>
        <a href="/login.html?admin=true&redirect=%2Fadmin%2Fdashboard.html" class="nav-admin-badge" title="Municipal Administrator Access">
          <span>🛡️</span>
          <span class="admin-text">Admin</span>
        </a>
      </div>
    `;
  }
}

// Global escape HTML utility
window.escapeHtml = function(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Date formatter helper
window.formatDate = function(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format Status Badge
window.renderStatusBadge = function(status) {
  let cssClass = 'badge-status-reported';
  const s = status ? status.toLowerCase() : 'reported';
  if (s === 'verified') cssClass = 'badge-status-verified';
  else if (s === 'assigned') cssClass = 'badge-status-assigned';
  else if (s === 'in progress') cssClass = 'badge-status-in-progress';
  else if (s === 'resolved') cssClass = 'badge-status-resolved';
  else if (s === 'rejected') cssClass = 'badge-status-rejected';

  return `<span class="badge ${cssClass}">● ${escapeHtml(status || 'Reported')}</span>`;
};

// Format Severity Badge
window.renderSeverityBadge = function(severity) {
  let cssClass = 'badge-sev-medium';
  const s = severity ? severity.toLowerCase() : 'medium';
  if (s === 'low') cssClass = 'badge-sev-low';
  else if (s === 'high') cssClass = 'badge-sev-high';

  return `<span class="badge ${cssClass}">${escapeHtml(severity || 'Medium')}</span>`;
};

// Setup mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('open');
    });
  }
});
