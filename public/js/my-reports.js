/**
 * ====================================================================
 * Road Hazard Reporting & Tracking System
 * My Reports Controller (Vanilla JavaScript)
 * ====================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
  const currentUser = await window.initAuth({ requireAuth: true });
  if (!currentUser) return;

  const tableBody = document.getElementById('my-reports-body');
  const emptyState = document.getElementById('my-reports-empty');
  const countDisplay = document.getElementById('my-reports-count');

  // Edit Modal Elements
  const editModal = document.getElementById('edit-report-modal');
  const editForm = document.getElementById('edit-report-form');
  const closeEditModalBtn = document.getElementById('close-edit-modal');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  const editReportIdInput = document.getElementById('edit-report-id');
  const editRoadName = document.getElementById('edit-road-name');
  const editLandmark = document.getElementById('edit-landmark');
  const editDescription = document.getElementById('edit-description');

  async function loadMyReports() {
    tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem;">Loading your hazard reports...</td></tr>`;

    try {
      const reports = await window.db.hazards.getByUserId(currentUser.id);

      if (countDisplay) {
        countDisplay.textContent = `You have submitted ${reports.length} report${reports.length === 1 ? '' : 's'}`;
      }

      if (reports.length === 0) {
        tableBody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
      }

      emptyState.style.display = 'none';
      tableBody.innerHTML = reports.map(r => {
        const canModify = r.status === 'Reported';

        return `
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
            <td style="font-size: 0.85rem; color: var(--color-primary); font-weight: 500;">
              ${escapeHtml(r.assigned_dept_name !== 'Unassigned' ? r.assigned_dept_name : r.suggested_dept_name)}
            </td>
            <td style="font-size: 0.8rem; color: var(--text-muted); white-space: nowrap;">
              ${formatDate(r.created_at)}
            </td>
            <td>
              <div style="display: flex; gap: 0.35rem; align-items: center;">
                <a href="/report-details.html?id=${encodeURIComponent(r.id)}" class="btn btn-outline-primary btn-sm" style="padding: 0.25rem 0.5rem;" title="View Details & Status">
                  Track
                </a>
                ${canModify ? `
                  <button class="btn btn-outline btn-sm edit-btn" data-id="${r.id}" style="padding: 0.25rem 0.5rem;" title="Edit Report">
                    ✏️
                  </button>
                  <button class="btn btn-danger btn-sm delete-btn" data-id="${r.id}" style="padding: 0.25rem 0.5rem;" title="Delete Report">
                    🗑️
                  </button>
                ` : `
                  <span style="font-size: 0.7rem; color: var(--text-light); margin-left: 4px;" title="Reports in verification or progress cannot be edited/deleted">Locked</span>
                `}
              </div>
            </td>
          </tr>
        `;
      }).join('');

      attachActionEvents(reports);
    } catch (err) {
      console.error('Error loading my reports:', err);
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #dc2626; padding: 2rem;">Error: ${err.message}</td></tr>`;
    }
  }

  function attachActionEvents(reports) {
    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (!confirm('Are you sure you want to delete this hazard report? This action cannot be undone.')) {
          return;
        }

        try {
          await window.db.hazards.delete(id);
          showToast('Hazard report deleted successfully.', 'success');
          loadMyReports();
        } catch (err) {
          showToast('Failed to delete report: ' + err.message, 'error');
        }
      });
    });

    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const report = reports.find(r => r.id === id);
        if (!report) return;

        editReportIdInput.value = report.id;
        editRoadName.value = report.road_name;
        editLandmark.value = report.landmark || '';
        editDescription.value = report.description;

        editModal.classList.add('active');
      });
    });
  }

  // Close Edit Modal
  function closeEditModal() {
    editModal?.classList.remove('active');
  }

  closeEditModalBtn?.addEventListener('click', closeEditModal);
  cancelEditBtn?.addEventListener('click', closeEditModal);

  // Submit Edit
  editForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = editReportIdInput.value;
    const roadName = editRoadName.value.trim();
    const landmark = editLandmark.value.trim();
    const description = editDescription.value.trim();

    if (!roadName || !description) {
      showToast('Please fill in road name and description.', 'error');
      return;
    }

    try {
      await window.db.hazards.update(id, {
        road_name: roadName,
        landmark: landmark,
        description: description
      });

      showToast('Hazard report updated successfully!', 'success');
      closeEditModal();
      loadMyReports();
    } catch (err) {
      showToast('Update failed: ' + err.message, 'error');
    }
  });

  loadMyReports();
});
