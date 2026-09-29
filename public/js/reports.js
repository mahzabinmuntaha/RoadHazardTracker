/**
 * ====================================================================
 * Road Hazard Reporting & Tracking System
 * All Reports Explorer Controller (Vanilla JavaScript)
 * ====================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
  await window.initAuth({ requireAuth: false });

  const searchInput = document.getElementById('search-input');
  const typeFilter = document.getElementById('filter-type');
  const areaFilter = document.getElementById('filter-area');
  const severityFilter = document.getElementById('filter-severity');
  const statusFilter = document.getElementById('filter-status');
  const resetBtn = document.getElementById('reset-filters-btn');

  const countDisplay = document.getElementById('reports-count-display');
  const cardsContainer = document.getElementById('reports-cards-container');
  const tableContainer = document.getElementById('reports-table-container');
  const tableBody = document.getElementById('reports-table-body');
  const emptyState = document.getElementById('empty-state');

  const viewCardsBtn = document.getElementById('view-cards-btn');
  const viewTableBtn = document.getElementById('view-table-btn');

  let currentView = 'cards'; // 'cards' or 'table'

  // View toggle
  viewCardsBtn?.addEventListener('click', () => {
    currentView = 'cards';
    viewCardsBtn.classList.add('btn-primary');
    viewCardsBtn.classList.remove('btn-outline');
    viewTableBtn.classList.add('btn-outline');
    viewTableBtn.classList.remove('btn-primary');
    cardsContainer.style.display = 'grid';
    tableContainer.style.display = 'none';
  });

  viewTableBtn?.addEventListener('click', () => {
    currentView = 'table';
    viewTableBtn.classList.add('btn-primary');
    viewTableBtn.classList.remove('btn-outline');
    viewCardsBtn.classList.add('btn-outline');
    viewCardsBtn.classList.remove('btn-primary');
    cardsContainer.style.display = 'none';
    tableContainer.style.display = 'block';
  });

  // Load and Render Reports
  async function loadReports() {
    const filters = {
      search: searchInput ? searchInput.value : '',
      hazard_type: typeFilter ? typeFilter.value : 'all',
      area: areaFilter ? areaFilter.value : 'all',
      severity: severityFilter ? severityFilter.value : 'all',
      status: statusFilter ? statusFilter.value : 'all'
    };

    cardsContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">Loading hazards from database...</div>`;
    if (tableBody) tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem;">Loading hazards...</td></tr>`;

    try {
      const reports = await window.db.hazards.getAll(filters);

      if (countDisplay) {
        countDisplay.textContent = `Showing ${reports.length} hazard report${reports.length === 1 ? '' : 's'}`;
      }

      if (reports.length === 0) {
        cardsContainer.style.display = 'none';
        tableContainer.style.display = 'none';
        emptyState.style.display = 'block';
        return;
      }

      emptyState.style.display = 'none';
      if (currentView === 'cards') {
        cardsContainer.style.display = 'grid';
        tableContainer.style.display = 'none';
      } else {
        cardsContainer.style.display = 'none';
        tableContainer.style.display = 'block';
      }

      renderCards(reports);
      renderTable(reports);
    } catch (err) {
      console.error('Error fetching reports:', err);
      cardsContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #dc2626; padding: 2rem;">Failed to load reports: ${err.message}</div>`;
    }
  }

  // Render Grid Cards
  function renderCards(reports) {
    cardsContainer.innerHTML = reports.map(r => {
      const imgHtml = r.image_url 
        ? `<img src="${escapeHtml(r.image_url)}" alt="${escapeHtml(r.hazard_type)}" loading="lazy" />`
        : `<div class="report-card-placeholder"><span>📷</span><span>No photo attached</span></div>`;

      return `
        <article class="report-card">
          <div class="report-card-image">
            ${imgHtml}
            <span style="position: absolute; top: 10px; right: 10px;">
              ${renderSeverityBadge(r.severity)}
            </span>
          </div>
          <div class="report-card-body">
            <div class="report-card-meta">
              <span style="font-size: 0.75rem; color: var(--text-light); font-weight: 600;">#${escapeHtml(r.id.substring(0, 8))}</span>
              ${renderStatusBadge(r.status)}
            </div>
            <h3 class="report-card-title">${escapeHtml(r.hazard_type)}</h3>
            <div class="report-card-location">
              <span>📍</span>
              <strong>${escapeHtml(r.area)}</strong> &bull; ${escapeHtml(r.road_name)}
            </div>
            <p class="report-card-desc">${escapeHtml(r.description)}</p>
            <div class="report-card-dept">
              <span class="dept-label">Responsible Department</span>
              <span class="dept-val">${escapeHtml(r.assigned_dept_name !== 'Unassigned' ? r.assigned_dept_name : r.suggested_dept_name)}</span>
            </div>
          </div>
          <div class="report-card-footer">
            <span style="font-size: 0.75rem; color: var(--text-muted);">${formatDate(r.created_at)}</span>
            <a href="/report-details.html?id=${encodeURIComponent(r.id)}" class="btn btn-outline-primary btn-sm">
              View Tracking &rarr;
            </a>
          </div>
        </article>
      `;
    }).join('');
  }

  // Render Data Table
  function renderTable(reports) {
    if (!tableBody) return;
    tableBody.innerHTML = reports.map(r => `
      <tr>
        <td style="font-weight: 600; font-family: monospace; font-size: 0.8rem; color: var(--text-muted);">
          #${escapeHtml(r.id.substring(0, 8))}
        </td>
        <td style="font-weight: 600; color: var(--text-main);">
          ${escapeHtml(r.hazard_type)}
        </td>
        <td>
          <div style="font-weight: 600;">${escapeHtml(r.area)}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(r.road_name)}</div>
        </td>
        <td>${renderSeverityBadge(r.severity)}</td>
        <td>${renderStatusBadge(r.status)}</td>
        <td style="font-size: 0.85rem; color: var(--color-primary); font-weight: 500;">
          ${escapeHtml(r.assigned_dept_name !== 'Unassigned' ? r.assigned_dept_name : r.suggested_dept_name)}
        </td>
        <td style="font-size: 0.8rem; color: var(--text-muted); white-space: nowrap;">
          ${formatDate(r.created_at)}
        </td>
        <td>
          <a href="/report-details.html?id=${encodeURIComponent(r.id)}" class="btn btn-outline-primary btn-sm" style="padding: 0.25rem 0.6rem;">
            Details
          </a>
        </td>
      </tr>
    `).join('');
  }

  // Event Listeners for Filters
  searchInput?.addEventListener('input', debounce(loadReports, 300));
  typeFilter?.addEventListener('change', loadReports);
  areaFilter?.addEventListener('change', loadReports);
  severityFilter?.addEventListener('change', loadReports);
  statusFilter?.addEventListener('change', loadReports);

  resetBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (typeFilter) typeFilter.value = 'all';
    if (areaFilter) areaFilter.value = 'all';
    if (severityFilter) severityFilter.value = 'all';
    if (statusFilter) statusFilter.value = 'all';
    loadReports();
  });

  // Simple debounce helper
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Initial Load
  loadReports();
});
