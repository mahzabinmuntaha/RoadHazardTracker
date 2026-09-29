/**
 * ====================================================================
 * Road Hazard Reporting & Tracking System
 * User Dashboard Controller (Vanilla JavaScript)
 * ====================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
  const currentUser = await window.initAuth({ requireAuth: true });
  if (!currentUser) return;

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('denied') === 'admin') {
    if (window.showToast) {
      window.showToast('Access denied: Administrator credentials required for the Municipal Admin Console.', 'error');
    }
  }

  // Set greeting
  const greetingEl = document.getElementById('user-greeting');
  if (greetingEl) {
    greetingEl.textContent = `Welcome back, ${currentUser.full_name}!`;
  }

  // Load stats
  async function loadDashboardData() {
    try {
      const stats = await window.db.hazards.getStats(currentUser.id);
      
      document.getElementById('stat-total').textContent = stats.total;
      document.getElementById('stat-reported').textContent = stats.reported;
      document.getElementById('stat-in-progress').textContent = stats.inProgress;
      document.getElementById('stat-resolved').textContent = stats.resolved;

      // Load user's recent reports
      const myReports = await window.db.hazards.getByUserId(currentUser.id);
      const recentContainer = document.getElementById('recent-reports-body');
      const emptyState = document.getElementById('recent-empty');

      if (!recentContainer) return;

      if (myReports.length === 0) {
        recentContainer.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
      }

      if (emptyState) emptyState.style.display = 'none';

      // Show top 5 recent
      const recent5 = myReports.slice(0, 5);
      recentContainer.innerHTML = recent5.map(r => `
        <tr>
          <td style="font-family: monospace; font-size: 0.8rem; font-weight: 600;">
            #${escapeHtml(r.id.substring(0, 8))}
          </td>
          <td style="font-weight: 600; color: var(--text-main);">
            ${escapeHtml(r.hazard_type)}
          </td>
          <td>
            <div style="font-weight: 500;">${escapeHtml(r.area)}</div>
            <div style="font-size: 0.775rem; color: var(--text-muted);">${escapeHtml(r.road_name)}</div>
          </td>
          <td>${renderSeverityBadge(r.severity)}</td>
          <td>${renderStatusBadge(r.status)}</td>
          <td style="font-size: 0.8rem; color: var(--text-muted); white-space: nowrap;">
            ${formatDate(r.created_at)}
          </td>
          <td>
            <a href="/report-details.html?id=${encodeURIComponent(r.id)}" class="btn btn-outline-primary btn-sm" style="padding: 0.25rem 0.6rem;">
              Track &rarr;
            </a>
          </td>
        </tr>
      `).join('');

    } catch (err) {
      console.error('Error loading dashboard:', err);
      showToast('Could not load dashboard data: ' + err.message, 'error');
    }
  }

  loadDashboardData();
});
