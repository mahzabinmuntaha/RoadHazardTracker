/**
 * ====================================================================
 * Road Hazard Reporting & Tracking System
 * Admin Management Controller (Vanilla JavaScript)
 * ====================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Enforce admin privileges
  const adminUser = await window.initAuth({ requireAuth: true, requireAdmin: true });
  if (!adminUser) return;

  const currentPath = window.location.pathname;

  // Initialize specific admin page module
  if (currentPath.includes('departments.html')) {
    initDepartmentsManager();
  } else if (currentPath.includes('reports.html')) {
    initAdminReportsManager();
  } else {
    initAdminDashboard();
  }

  // ------------------------------------------------------------------
  // 1. Admin Dashboard Page & Global Monitoring
  // ------------------------------------------------------------------
  async function initAdminDashboard() {
    // A. Setup Tab Navigation
    const tabBtns = document.querySelectorAll('.admin-tab-btn');
    const tabContents = document.querySelectorAll('.admin-tab-content');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');

        tabBtns.forEach(b => {
          b.classList.remove('active');
          b.style.color = 'var(--text-muted)';
          b.style.borderBottom = 'none';
          b.style.fontWeight = '600';
        });

        btn.classList.add('active');
        btn.style.color = 'var(--color-primary)';
        btn.style.borderBottom = '3px solid var(--color-primary)';
        btn.style.fontWeight = '700';

        tabContents.forEach(tc => {
          if (tc.id === targetId) {
            tc.style.display = 'block';
          } else {
            tc.style.display = 'none';
          }
        });
      });
    });

    // B. Setup Theme & Color Customizer
    setupThemeCustomizer();

    // C. Setup System Maintenance & Backup Tools
    setupSystemTools();

    // D. Load Stats, Reports, Users & Activity
    await refreshDashboardData();
  }

  // Helper: Theme Customizer Controller
  function setupThemeCustomizer() {
    const presetsGrid = document.getElementById('theme-presets-grid');
    const customPrimaryInput = document.getElementById('custom-primary');
    const customAccentInput = document.getElementById('custom-accent');
    const primaryHexLabel = document.getElementById('custom-primary-hex');
    const accentHexLabel = document.getElementById('custom-accent-hex');
    const applyCustomBtn = document.getElementById('apply-custom-theme-btn');
    const resetThemeBtn = document.getElementById('theme-reset-btn');
    const activeThemePill = document.getElementById('active-theme-pill');
    const themeActiveLabel = document.getElementById('theme-active-label');

    if (!window.themeManager) return;

    function renderPresets() {
      const presets = window.themeManager.getPresets();
      const current = window.themeManager.getCurrentTheme();

      if (activeThemePill) {
        activeThemePill.textContent = `Theme: ${current.name || 'Custom'}`;
      }
      if (themeActiveLabel) {
        themeActiveLabel.textContent = `Active Palette: ${current.name || 'Custom Admin Palette'}`;
      }

      if (customPrimaryInput && current.primary) {
        customPrimaryInput.value = current.primary;
        if (primaryHexLabel) primaryHexLabel.textContent = current.primary;
      }
      if (customAccentInput && current.accent) {
        customAccentInput.value = current.accent;
        if (accentHexLabel) accentHexLabel.textContent = current.accent;
      }

      if (!presetsGrid) return;

      presetsGrid.innerHTML = Object.values(presets).map(p => {
        const isActive = (current.id === p.id) || (!current.isCustom && current.primary === p.primary);
        return `
          <div class="theme-preset-card" data-id="${p.id}" style="
            border: 2px solid ${isActive ? 'var(--color-primary)' : 'var(--border-color)'};
            border-radius: var(--radius-md);
            padding: 0.9rem;
            background: ${isActive ? 'var(--color-primary-light)' : '#ffffff'};
            cursor: pointer;
            transition: var(--transition);
            box-shadow: ${isActive ? '0 0 0 2px var(--color-primary-glow)' : 'var(--shadow-sm)'};
          ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-weight: 700; font-size: 0.85rem; color: var(--text-main);">${escapeHtml(p.name)}</span>
              <span class="badge" style="font-size: 0.65rem; background: ${p.primary}; color: #ffffff;">${p.badge}</span>
            </div>
            <p style="font-size: 0.775rem; color: var(--text-muted); margin-bottom: 0.75rem; line-height: 1.4;">${escapeHtml(p.description)}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 0.4rem;">
                <div style="width: 24px; height: 24px; border-radius: 50%; background: ${p.primary}; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);" title="Primary"></div>
                <div style="width: 24px; height: 24px; border-radius: 50%; background: ${p.accent}; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);" title="Accent"></div>
              </div>
              <button type="button" class="btn ${isActive ? 'btn-primary' : 'btn-outline'} btn-sm" style="padding: 0.2rem 0.6rem; font-size: 0.75rem;">
                ${isActive ? '✓ Applied' : 'Apply Theme'}
              </button>
            </div>
          </div>
        `;
      }).join('');

      // Add click listeners to preset cards
      presetsGrid.querySelectorAll('.theme-preset-card').forEach(card => {
        card.addEventListener('click', () => {
          const presetId = card.getAttribute('data-id');
          const applied = window.themeManager.applyPreset(presetId);
          if (applied) {
            showToast(`Theme applied: ${applied.name}`, 'success');
            renderPresets();
          }
        });
      });
    }

    // Hex input color sync
    customPrimaryInput?.addEventListener('input', (e) => {
      if (primaryHexLabel) primaryHexLabel.textContent = e.target.value;
    });

    customAccentInput?.addEventListener('input', (e) => {
      if (accentHexLabel) accentHexLabel.textContent = e.target.value;
    });

    // Apply custom palette
    applyCustomBtn?.addEventListener('click', () => {
      const pColor = customPrimaryInput ? customPrimaryInput.value : '#0f766e';
      const aColor = customAccentInput ? customAccentInput.value : '#f59e0b';
      const applied = window.themeManager.applyCustom(pColor, aColor, 'Custom Administrator Theme');
      if (applied) {
        showToast('Custom palette applied successfully across the system!', 'success');
        renderPresets();
      }
    });

    // Reset to default theme
    resetThemeBtn?.addEventListener('click', () => {
      if (confirm('Reset portal theme to standard Dhaka Civic Emerald & Amber?')) {
        window.themeManager.resetToDefault();
        showToast('Theme reset to official default.', 'success');
        renderPresets();
      }
    });

    renderPresets();
  }

  // Helper: Refresh Dashboard Data (Stats, Reports, Users, Activity)
  async function refreshDashboardData() {
    try {
      const stats = await window.db.hazards.getStats();

      // Populate stat cards
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val !== undefined ? val : 0;
      };

      setVal('stat-total', stats.total);
      setVal('stat-reported', stats.reported);
      setVal('stat-verified', stats.verified);
      setVal('stat-assigned', stats.assigned);
      setVal('stat-in-progress', stats.inProgress);
      setVal('stat-resolved', stats.resolved);
      setVal('stat-rejected', stats.rejected);

      // 1. Render Reports Table
      const reports = await window.db.hazards.getAll();
      const tabCountReports = document.getElementById('tab-count-reports');
      if (tabCountReports) tabCountReports.textContent = reports.length;

      const recentBody = document.getElementById('admin-recent-body');
      if (recentBody) {
        if (reports.length === 0) {
          recentBody.innerHTML = `
            <tr>
              <td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">📭</div>
                <strong>No hazard reports submitted yet.</strong>
                <p style="font-size: 0.825rem; margin-top: 0.25rem;">New citizen submissions will appear here instantly for verification.</p>
              </td>
            </tr>
          `;
        } else {
          recentBody.innerHTML = reports.map(r => `
            <tr>
              <td style="font-family: monospace; font-weight: 600; font-size: 0.8rem;">#${escapeHtml(r.id)}</td>
              <td style="font-weight: 600;">
                ${escapeHtml(r.hazard_type)}
                <div style="font-size: 0.725rem; color: var(--color-primary); font-weight: 500; margin-top: 2px;">
                  👤 ${escapeHtml(r.user_name || 'Citizen')}
                </div>
              </td>
              <td><strong>${escapeHtml(r.area)}</strong><br/><span style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(r.road_name)}</span></td>
              <td>${renderSeverityBadge(r.severity)}</td>
              <td>${renderStatusBadge(r.status)}</td>
              <td style="font-size: 0.85rem; color: var(--color-primary); font-weight: 500;">${escapeHtml(r.assigned_dept_name !== 'Unassigned' ? r.assigned_dept_name : r.suggested_dept_name)}</td>
              <td style="font-size: 0.8rem; color: var(--text-muted);">${formatDate(r.created_at)}</td>
              <td>
                <div style="display: flex; gap: 0.35rem;">
                  <a href="/report-details.html?id=${encodeURIComponent(r.id)}" class="btn btn-outline btn-sm" style="padding: 0.2rem 0.4rem; font-size: 0.75rem;" title="View Details">
                    👁️
                  </a>
                  <a href="/admin/reports.html?highlight=${encodeURIComponent(r.id)}" class="btn btn-outline-primary btn-sm" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">
                    Manage &rarr;
                  </a>
                </div>
              </td>
            </tr>
          `).join('');
        }
      }

      // 2. Render Users Directory
      if (window.db.users) {
        const users = await window.db.users.getAll();
        const tabCountUsers = document.getElementById('tab-count-users');
        const usersBadgeCount = document.getElementById('users-badge-count');
        if (tabCountUsers) tabCountUsers.textContent = users.length;
        if (usersBadgeCount) usersBadgeCount.textContent = `${users.length} Registered Accounts`;

        const usersBody = document.getElementById('admin-users-table-body');
        if (usersBody) {
          usersBody.innerHTML = users.map(u => {
            const isAdmin = u.role === 'admin';
            return `
              <tr>
                <td><strong>${escapeHtml(u.full_name)}</strong></td>
                <td style="font-family: monospace; font-size: 0.85rem;">${escapeHtml(u.email)}</td>
                <td>
                  <span class="badge ${isAdmin ? 'badge-sev-high' : 'badge-status-verified'}">
                    ${isAdmin ? '🛡️ Administrator' : '👤 Citizen'}
                  </span>
                </td>
                <td style="font-weight: 600; text-align: center;">${u.reports_count || 0}</td>
                <td style="font-size: 0.8rem; color: var(--text-muted);">${formatDate(u.created_at)}</td>
                <td>
                  <button class="btn ${isAdmin ? 'btn-outline' : 'btn-primary'} btn-sm toggle-user-role-btn" data-id="${u.id}" data-role="${u.role}" style="padding: 0.2rem 0.6rem; font-size: 0.75rem;">
                    ${isAdmin ? 'Revert to Citizen' : 'Make Admin'}
                  </button>
                </td>
              </tr>
            `;
          }).join('');

          // Bind role toggle buttons
          usersBody.querySelectorAll('.toggle-user-role-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              const userId = e.currentTarget.getAttribute('data-id');
              const currentRole = e.currentTarget.getAttribute('data-role');
              const newRole = currentRole === 'admin' ? 'Citizen' : 'Administrator';
              
              if (!confirm(`Change account role to ${newRole}?`)) return;

              try {
                await window.db.users.toggleRole(userId);
                showToast(`User role updated to ${newRole}!`, 'success');
                await refreshDashboardData();
              } catch (err) {
                showToast('Failed to update user role: ' + err.message, 'error');
              }
            });
          });
        }
      }

      // 3. Render Activity Log
      if (window.db.system) {
        const activities = await window.db.system.getAllActivity();
        const activityContainer = document.getElementById('admin-activity-stream');
        if (activityContainer) {
          if (activities.length === 0) {
            activityContainer.innerHTML = `
              <div style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">📜</div>
                No activity logs recorded yet.
              </div>
            `;
          } else {
            activityContainer.innerHTML = activities.slice(0, 15).map(act => `
              <div style="display: flex; gap: 1rem; align-items: flex-start; padding: 0.75rem; background: var(--bg-body); border-radius: var(--radius-sm); border-left: 3px solid var(--color-primary);">
                <div style="font-size: 1.25rem;">📌</div>
                <div style="flex: 1;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                    <div>
                      <strong>${escapeHtml(act.changed_by || 'Citizen')}</strong> changed hazard 
                      <strong style="color: var(--color-primary);">#${escapeHtml(act.hazard_id)}</strong> 
                      (${escapeHtml(act.hazard_type || 'Road Incident')}) to 
                      ${renderStatusBadge(act.status)}
                    </div>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${formatDate(act.changed_at)}</span>
                  </div>
                  <div style="font-size: 0.825rem; color: var(--text-muted);">${escapeHtml(act.note || 'No note recorded')}</div>
                </div>
              </div>
            `).join('');
          }
        }
      }

    } catch (err) {
      console.error('Error loading admin dashboard stats:', err);
      showToast('Error loading stats: ' + err.message, 'error');
    }
  }

  // Helper: System Tools & Backup Handlers
  function setupSystemTools() {
    const exportBtn = document.getElementById('export-backup-btn');
    const sysExportBtn = document.getElementById('sys-export-btn');
    const clearHazardsBtn = document.getElementById('sys-clear-hazards-btn');
    const refreshActivityBtn = document.getElementById('refresh-activity-btn');

    async function handleExport() {
      try {
        const data = await window.db.system.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `roadhazard_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Complete system backup JSON exported!', 'success');
      } catch (err) {
        showToast('Export failed: ' + err.message, 'error');
      }
    }

    exportBtn?.addEventListener('click', handleExport);
    sysExportBtn?.addEventListener('click', handleExport);

    refreshActivityBtn?.addEventListener('click', async () => {
      await refreshDashboardData();
      showToast('Activity stream refreshed.', 'info');
    });

    clearHazardsBtn?.addEventListener('click', async () => {
      const confirmText = prompt('WARNING: Type "RESET" to confirm clearing all hazard reports and history:');
      if (confirmText !== 'RESET') {
        if (confirmText !== null) showToast('Reset cancelled. Confirmation mismatch.', 'warning');
        return;
      }

      try {
        await window.db.system.clearAllHazards();
        showToast('All hazard reports have been cleared.', 'success');
        await refreshDashboardData();
      } catch (err) {
        showToast('Reset failed: ' + err.message, 'error');
      }
    });
  }

  // ------------------------------------------------------------------
  // 2. Admin Reports Management Page
  // ------------------------------------------------------------------
  async function initAdminReportsManager() {
    const searchInput = document.getElementById('admin-search');
    const statusFilter = document.getElementById('admin-filter-status');
    const areaFilter = document.getElementById('admin-filter-area');
    const tableBody = document.getElementById('admin-reports-table-body');
    const countDisplay = document.getElementById('admin-reports-count');

    // Modal elements
    const manageModal = document.getElementById('admin-manage-modal');
    const modalCloseBtn = document.getElementById('close-manage-modal');
    const modalCancelBtn = document.getElementById('cancel-manage-modal');
    const manageForm = document.getElementById('admin-manage-form');

    const modalReportId = document.getElementById('modal-report-id');
    const modalStatusSelect = document.getElementById('modal-status-select');
    const modalDeptSelect = document.getElementById('modal-dept-select');
    const modalNoteInput = document.getElementById('modal-note-input');
    const modalSuggestedDisplay = document.getElementById('modal-suggested-display');

    let allDepts = [];

    async function loadDepts() {
      allDepts = await window.db.departments.getAll();
      modalDeptSelect.innerHTML = `<option value="">-- Select Responsible Department --</option>` +
        allDepts.map(d => `<option value="${d.id}">${escapeHtml(d.department_name)}</option>`).join('');
    }

    async function loadAdminReports() {
      tableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 2rem;">Loading reports...</td></tr>`;

      try {
        const filters = {
          search: searchInput?.value || '',
          status: statusFilter?.value || 'all',
          area: areaFilter?.value || 'all'
        };

        const reports = await window.db.hazards.getAll(filters);

        if (countDisplay) {
          countDisplay.textContent = `Total ${reports.length} report${reports.length === 1 ? '' : 's'}`;
        }

        if (reports.length === 0) {
          tableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">No reports match the current filter.</td></tr>`;
          return;
        }

        tableBody.innerHTML = reports.map(r => `
          <tr>
            <td style="font-family: monospace; font-size: 0.8rem; font-weight: 600;">
              #${escapeHtml(r.id.substring(0, 8))}
            </td>
            <td>
              <div style="font-weight: 700; color: var(--text-main);">${escapeHtml(r.hazard_type)}</div>
              <div style="font-size: 0.775rem; color: var(--text-muted); max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${escapeHtml(r.description)}
              </div>
            </td>
            <td>
              <div style="font-weight: 600;">${escapeHtml(r.area)}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(r.road_name)}</div>
            </td>
            <td>
              <div style="font-weight: 600; color: var(--color-primary); font-size: 0.85rem;">
                👤 ${escapeHtml(r.user_name || 'Citizen')}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">
                ${escapeHtml(r.user_email || 'citizen@example.com')}
              </div>
            </td>
            <td>${renderSeverityBadge(r.severity)}</td>
            <td>${renderStatusBadge(r.status)}</td>
            <td>
              <div style="font-size: 0.85rem; font-weight: 600; color: ${r.assigned_dept_name !== 'Unassigned' ? 'var(--status-resolved)' : 'var(--text-muted)'};">
                ${escapeHtml(r.assigned_dept_name)}
              </div>
              <div style="font-size: 0.725rem; color: var(--text-light);">
                Suggested: ${escapeHtml(r.suggested_dept_name)}
              </div>
            </td>
            <td style="font-size: 0.8rem; color: var(--text-muted); white-space: nowrap;">
              ${formatDate(r.created_at)}
            </td>
            <td>
              <div style="display: flex; gap: 0.35rem;">
                <button class="btn btn-primary btn-sm manage-btn" data-id="${r.id}" style="padding: 0.3rem 0.6rem;">
                  Manage
                </button>
                <a href="/report-details.html?id=${r.id}" class="btn btn-outline btn-sm" style="padding: 0.3rem 0.5rem;" title="View Full Tracker">
                  👁️
                </a>
                <button class="btn btn-danger btn-sm delete-report-btn" data-id="${r.id}" style="padding: 0.3rem 0.5rem;" title="Delete Inappropriate/Duplicate Report">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        `).join('');

        attachRowEvents(reports);
      } catch (err) {
        console.error('Error loading admin reports:', err);
        tableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #dc2626; padding: 2rem;">Error: ${err.message}</td></tr>`;
      }
    }

    function attachRowEvents(reports) {
      // Manage Modal trigger
      document.querySelectorAll('.manage-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          const report = reports.find(r => r.id === id);
          if (!report) return;

          modalReportId.value = report.id;
          modalStatusSelect.value = report.status;
          modalDeptSelect.value = report.assigned_department_id || report.suggested_department_id || '';
          modalNoteInput.value = report.admin_note || '';
          modalSuggestedDisplay.textContent = `Auto-Suggested Dept: ${report.suggested_dept_name}`;

          const modalReporterName = document.getElementById('modal-reporter-name');
          if (modalReporterName) {
            modalReporterName.textContent = `${report.user_name || 'Citizen'} (${report.user_email || 'citizen@example.com'}) [Citizen ID: ${report.user_id || 'u-user1'}]`;
          }

          manageModal.classList.add('active');
        });
      });

      // Delete Report trigger
      document.querySelectorAll('.delete-report-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          if (!confirm('Admin Confirmation: Delete this report permanently? Use only for inappropriate or duplicate entries.')) {
            return;
          }

          try {
            await window.db.hazards.delete(id);
            showToast('Report deleted by administrator.', 'success');
            loadAdminReports();
          } catch (err) {
            showToast('Delete failed: ' + err.message, 'error');
          }
        });
      });
    }

    function closeManageModal() {
      manageModal?.classList.remove('active');
    }

    modalCloseBtn?.addEventListener('click', closeManageModal);
    modalCancelBtn?.addEventListener('click', closeManageModal);

    // Save Status & Assignment
    manageForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = modalReportId.value;
      const newStatus = modalStatusSelect.value;
      const deptId = modalDeptSelect.value || null;
      const note = modalNoteInput.value.trim();

      const submitBtn = manageForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      try {
        await window.db.hazards.updateStatus(id, newStatus, note, deptId, adminUser.full_name);
        showToast(`Report #${id.substring(0,8)} updated to ${newStatus}!`, 'success');
        closeManageModal();
        loadAdminReports();
      } catch (err) {
        showToast('Update failed: ' + err.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Apply Updates';
      }
    });

    searchInput?.addEventListener('input', debounce(loadAdminReports, 300));
    statusFilter?.addEventListener('change', loadAdminReports);
    areaFilter?.addEventListener('change', loadAdminReports);

    await loadDepts();
    await loadAdminReports();
  }

  // ------------------------------------------------------------------
  // 3. Admin Departments & Mappings Management Page
  // ------------------------------------------------------------------
  async function initDepartmentsManager() {
    const deptsTableBody = document.getElementById('admin-depts-table-body');
    const mappingsTableBody = document.getElementById('admin-mappings-table-body');
    const newDeptForm = document.getElementById('new-dept-form');
    const newMappingForm = document.getElementById('new-mapping-form');
    const mappingDeptSelect = document.getElementById('mapping-department-id');

    async function refreshAll() {
      const departments = await window.db.departments.getAll();
      const mappings = await window.db.mappings.getAll();

      // Populate Department Table
      deptsTableBody.innerHTML = departments.map(d => `
        <tr>
          <td style="font-weight: 700; color: var(--text-main);">${escapeHtml(d.department_name)}</td>
          <td style="font-size: 0.85rem; color: var(--text-muted);">${escapeHtml(d.description || 'No description')}</td>
          <td>
            <button class="btn btn-danger btn-sm delete-dept-btn" data-id="${d.id}" style="padding: 0.2rem 0.5rem;">
              Delete
            </button>
          </td>
        </tr>
      `).join('');

      // Populate Mapping Department Dropdown
      mappingDeptSelect.innerHTML = `<option value="">-- Choose Department --</option>` +
        departments.map(d => `<option value="${d.id}">${escapeHtml(d.department_name)}</option>`).join('');

      // Populate Mappings Table
      mappingsTableBody.innerHTML = mappings.map(m => `
        <tr>
          <td style="font-weight: 600;">${escapeHtml(m.area)}</td>
          <td style="font-weight: 500; color: var(--text-main);">${escapeHtml(m.hazard_type)}</td>
          <td style="color: var(--color-primary); font-weight: 600;">${escapeHtml(m.department_name)}</td>
          <td>
            <button class="btn btn-danger btn-sm delete-map-btn" data-id="${m.id}" style="padding: 0.2rem 0.5rem;">
              Remove
            </button>
          </td>
        </tr>
      `).join('');

      // Attach Delete Listeners
      document.querySelectorAll('.delete-dept-btn').forEach(b => {
        b.addEventListener('click', async (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          if (!confirm('Delete this department? Associated mappings may be removed.')) return;
          try {
            await window.db.departments.delete(id);
            showToast('Department removed.', 'success');
            refreshAll();
          } catch (err) {
            showToast('Failed: ' + err.message, 'error');
          }
        });
      });

      document.querySelectorAll('.delete-map-btn').forEach(b => {
        b.addEventListener('click', async (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          if (!confirm('Remove this Area + Hazard Type routing mapping?')) return;
          try {
            await window.db.mappings.delete(id);
            showToast('Mapping rule removed.', 'success');
            refreshAll();
          } catch (err) {
            showToast('Failed: ' + err.message, 'error');
          }
        });
      });
    }

    // Add New Department Form
    newDeptForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('new-dept-name').value.trim();
      const desc = document.getElementById('new-dept-desc').value.trim();

      if (!name) {
        showToast('Department name is required.', 'error');
        return;
      }

      try {
        await window.db.departments.create(name, desc);
        showToast('New civic department added!', 'success');
        newDeptForm.reset();
        refreshAll();
      } catch (err) {
        showToast('Failed to add department: ' + err.message, 'error');
      }
    });

    // Add New Mapping Form
    newMappingForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const area = document.getElementById('mapping-area').value;
      const type = document.getElementById('mapping-hazard-type').value;
      const deptId = mappingDeptSelect.value;

      if (!area || !type || !deptId) {
        showToast('Please select Area, Hazard Type, and Department.', 'error');
        return;
      }

      try {
        await window.db.mappings.create(area, type, deptId);
        showToast('Department mapping rule created!', 'success');
        newMappingForm.reset();
        refreshAll();
      } catch (err) {
        showToast('Failed to save mapping: ' + err.message, 'error');
      }
    });

    refreshAll();
  }

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
});
