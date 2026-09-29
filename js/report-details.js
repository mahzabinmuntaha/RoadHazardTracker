/**
 * ====================================================================
 * Road Hazard Reporting & Tracking System
 * Report Details & Visual Status Tracker (Vanilla JavaScript)
 * ====================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
  const currentUser = await window.initAuth({ requireAuth: false });
  const isAdmin = currentUser && currentUser.role === 'admin';

  // Get report ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const reportId = urlParams.get('id');

  if (!reportId) {
    showToast('No hazard report ID specified.', 'error');
    setTimeout(() => window.location.href = '/reports.html', 1500);
    return;
  }

  // Load Report Data
  async function loadReportDetails() {
    let hazard = null;
    let history = [];
    let allDepts = [];

    const cleanId = String(reportId || '').replace(/^#/, '').trim();

    try {
      hazard = await window.db.hazards.getById(cleanId);
    } catch (dbErr) {
      console.error('Database fetch error for reportId:', cleanId, dbErr);
      document.getElementById('report-details-container').innerHTML = `
        <div class="card" style="text-align: center; padding: 3rem; max-width: 600px; margin: 2rem auto;">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">🔍</div>
          <h2 style="color: #dc2626; margin-bottom: 0.5rem;">Report Not Found</h2>
          <p style="color: var(--text-muted); margin-bottom: 1.5rem; line-height: 1.6;">
            The hazard report <strong>#${escapeHtml(cleanId)}</strong> could not be found in the current database.
          </p>
          <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
            <a href="/reports.html" class="btn btn-primary">Browse All Reports</a>
            <a href="/report.html" class="btn btn-outline">Submit New Report</a>
          </div>
        </div>
      `;
      return;
    }

    try {
      history = await window.db.hazards.getStatusHistory(hazard.id || cleanId);
    } catch (hErr) {
      console.warn('Could not load status history:', hErr);
      history = [];
    }

    try {
      allDepts = await window.db.departments.getAll();
    } catch (dErr) {
      console.warn('Could not load departments:', dErr);
      allDepts = [];
    }

    try {
      renderDetails(hazard);
      renderVisualTracker(hazard.status);
      renderStatusHistory(history);

      if (isAdmin) {
        setupAdminPanel(hazard, allDepts);
      }
    } catch (renderErr) {
      console.error('Error rendering report details UI:', renderErr);
      showToast('Warning: An issue occurred while displaying some details.', 'warning');
    }
  }

  // Render Core Details
  function renderDetails(h) {
    if (!h) return;
    document.title = `${h.hazard_type || 'Hazard Report'} - #${h.id}`;
    
    const setSafeText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = (val !== undefined && val !== null) ? val : '';
    };

    const setSafeHtml = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = val || '';
    };

    setSafeText('detail-id', `#${h.id}`);
    setSafeText('detail-type', h.hazard_type || 'Road Hazard');
    setSafeText('detail-area', h.area || 'General Area');
    setSafeText('detail-road', h.road_name || 'Location details');
    setSafeText('detail-landmark', h.landmark || 'None specified');
    setSafeText('detail-description', h.description || '');
    
    setSafeHtml('detail-severity-badge', renderSeverityBadge(h.severity));
    setSafeHtml('detail-status-badge', renderStatusBadge(h.status));

    setSafeText('detail-suggested-dept', h.suggested_dept_name || 'General Infrastructure Review');
    setSafeText('detail-assigned-dept', h.assigned_dept_name || 'Pending Admin Assignment');
    
    setSafeText('detail-created-at', formatDate(h.created_at));
    setSafeText('detail-updated-at', formatDate(h.updated_at || h.created_at));

    // Reporter Privacy Enforcement (Only Municipal Admin can view citizen identity)
    const reporterNameEl = document.getElementById('detail-reporter-name');
    const reporterBadgeEl = document.getElementById('detail-reporter-badge');
    const reporterIconEl = document.getElementById('detail-reporter-icon');
    const reporterWrapperEl = document.getElementById('detail-reporter-wrapper');

    const isOwnReport = currentUser && h.user_id && currentUser.id === h.user_id;

    if (isAdmin) {
      // Authorized Administrator View
      if (reporterIconEl) reporterIconEl.textContent = '🛡️';
      if (reporterNameEl) {
        const emailSpan = h.user_email ? ` <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-muted);">&lt;${escapeHtml(h.user_email)}&gt;</span>` : '';
        reporterNameEl.innerHTML = `${escapeHtml(h.user_name || 'Verified Citizen')}${emailSpan}`;
        reporterNameEl.style.color = 'var(--color-primary)';
      }
      if (reporterBadgeEl) {
        reporterBadgeEl.innerHTML = `<span style="font-size: 0.725rem; color: #1e3a8a; background: #dbeafe; font-weight: 600; padding: 3px 8px; border-radius: 9999px; border: 1px solid #bfdbfe;">🛡️ Admin Only View</span>`;
      }
      if (reporterWrapperEl) {
        reporterWrapperEl.style.background = '#eff6ff';
        reporterWrapperEl.style.borderColor = '#bfdbfe';
      }
    } else if (isOwnReport) {
      // Citizen viewing their own submission
      if (reporterIconEl) reporterIconEl.textContent = '👤';
      if (reporterNameEl) {
        reporterNameEl.textContent = `Submitted by You (${currentUser.full_name})`;
        reporterNameEl.style.color = 'var(--color-primary)';
      }
      if (reporterBadgeEl) {
        reporterBadgeEl.innerHTML = `<span style="font-size: 0.725rem; color: #047857; background: #d1fae5; font-weight: 600; padding: 3px 8px; border-radius: 9999px;">Your Submission</span>`;
      }
    } else {
      // Public / Other citizens view - STRICTLY ANONYMIZED
      if (reporterIconEl) reporterIconEl.textContent = '🔒';
      if (reporterNameEl) {
        reporterNameEl.textContent = 'Confidential Citizen / Resident';
        reporterNameEl.style.color = 'var(--text-muted)';
      }
      if (reporterBadgeEl) {
        reporterBadgeEl.innerHTML = `<span style="font-size: 0.725rem; color: #475569; background: #e2e8f0; font-weight: 500; padding: 3px 8px; border-radius: 9999px;" title="Reporter identity is protected and only accessible to authorized Municipal Admins">Identity Protected 🔒</span>`;
      }
    }

    // Admin note display
    const adminNoteContainer = document.getElementById('admin-note-box');
    const adminNoteText = document.getElementById('detail-admin-note');
    if (adminNoteContainer) {
      if (h.admin_note) {
        adminNoteContainer.style.display = 'block';
        if (adminNoteText) adminNoteText.textContent = h.admin_note;
      } else {
        adminNoteContainer.style.display = 'none';
      }
    }

    // Image display
    const imageContainer = document.getElementById('detail-image-box');
    const imageEl = document.getElementById('detail-image');
    if (imageContainer && imageEl) {
      if (h.image_url) {
        imageContainer.style.display = 'block';
        imageEl.src = h.image_url;
        imageEl.alt = h.hazard_type || 'Hazard Evidence';
      } else {
        imageContainer.style.display = 'none';
      }
    }
  }

  // Render 5-Step Visual Status Tracker
  // Steps: Reported -> Verified -> Assigned -> In Progress -> Resolved (or Rejected)
  function renderVisualTracker(currentStatus) {
    const steps = [
      { key: 'Reported', label: '1. Reported', icon: '📝' },
      { key: 'Verified', label: '2. Verified', icon: '🔍' },
      { key: 'Assigned', label: '3. Assigned', icon: '🏢' },
      { key: 'In Progress', label: '4. In Progress', icon: '🛠️' },
      { key: 'Resolved', label: '5. Resolved', icon: '✅' }
    ];

    const isRejected = currentStatus === 'Rejected';
    const statusOrder = ['Reported', 'Verified', 'Assigned', 'In Progress', 'Resolved'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    const container = document.getElementById('visual-tracker-steps');
    if (!container) return;

    if (isRejected) {
      container.innerHTML = `
        <div class="status-step rejected" style="width: 100%;">
          <div class="step-circle">❌</div>
          <div class="step-label">Report Marked as Rejected</div>
          <p style="font-size: 0.8rem; color: var(--status-rejected); margin-top: 4px;">
            This report was reviewed by administrators and flagged as duplicate, out of scope, or invalid.
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = steps.map((step, idx) => {
      let stateClass = '';
      let circleContent = step.icon;

      if (idx < currentIndex) {
        stateClass = 'completed';
        circleContent = '✓';
      } else if (idx === currentIndex) {
        stateClass = 'active';
        circleContent = '●';
      } else {
        circleContent = (idx + 1).toString();
      }

      return `
        <div class="status-step ${stateClass}">
          <div class="step-circle">${circleContent}</div>
          <div class="step-label">${escapeHtml(step.label)}</div>
        </div>
      `;
    }).join('');
  }

  // Render Status History Timeline
  function renderStatusHistory(historyList) {
    const timelineEl = document.getElementById('status-history-timeline');
    if (!timelineEl) return;

    if (!historyList || historyList.length === 0) {
      timelineEl.innerHTML = `<div style="color: var(--text-muted); font-size: 0.875rem;">No status history recorded yet.</div>`;
      return;
    }

    timelineEl.innerHTML = historyList.map(item => {
      let displayBy = '';
      if (isAdmin) {
        // Admin sees the exact person who performed the update
        displayBy = `Updated by: <strong>${escapeHtml(item.changed_by || 'Citizen')}</strong> <span style="font-size: 0.7rem; color: #1e40af; background: #dbeafe; padding: 1px 5px; border-radius: 3px; font-weight: 600;">Admin View</span>`;
      } else {
        // Public / Citizen view: hide submitter's name
        const isCitizenUpdate = item.is_citizen_submission || (item.changed_by && (item.changed_by.toLowerCase().includes('citizen') || item.status === 'Reported'));
        if (isCitizenUpdate) {
          displayBy = `Updated by: <strong style="color: var(--text-muted);">Resident / Submitter 🔒</strong> <span style="font-size: 0.7rem; color: var(--text-muted);">(Confidential)</span>`;
        } else {
          displayBy = `Updated by: <strong>Municipal Authority Official</strong>`;
        }
      }

      return `
        <div class="history-item">
          <div class="history-dot"></div>
          <div class="history-content">
            <div class="history-header">
              <div class="history-status">${renderStatusBadge(item.status)}</div>
              <div class="history-date">${formatDate(item.changed_at)}</div>
            </div>
            <div class="history-by">${displayBy}</div>
            ${item.note ? `<div class="history-note">"${escapeHtml(item.note)}"</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // Admin Quick Action Panel setup
  function setupAdminPanel(hazard, departments) {
    const adminPanel = document.getElementById('admin-quick-action-panel');
    if (!adminPanel) return;

    adminPanel.style.display = 'block';

    const statusSelect = document.getElementById('admin-status-select');
    const deptSelect = document.getElementById('admin-dept-select');
    const noteInput = document.getElementById('admin-note-input');
    const updateBtn = document.getElementById('admin-update-btn');

    // Populate department options
    deptSelect.innerHTML = `<option value="">-- Leave Unchanged / Auto --</option>` +
      departments.map(d => `
        <option value="${d.id}" ${d.id === (hazard.assigned_department_id || hazard.suggested_department_id) ? 'selected' : ''}>
          ${escapeHtml(d.department_name)}
        </option>
      `).join('');

    statusSelect.value = hazard.status;
    noteInput.value = hazard.admin_note || '';

    updateBtn.addEventListener('click', async () => {
      const newStatus = statusSelect.value;
      const assignedDept = deptSelect.value || hazard.assigned_department_id;
      const note = noteInput.value.trim();

      updateBtn.disabled = true;
      updateBtn.textContent = 'Updating...';

      try {
        await window.db.hazards.updateStatus(
          hazard.id,
          newStatus,
          note,
          assignedDept,
          currentUser.full_name
        );
        showToast('Hazard report updated successfully!', 'success');
        setTimeout(() => loadReportDetails(), 600);
      } catch (err) {
        showToast('Error updating report: ' + err.message, 'error');
      } finally {
        updateBtn.disabled = false;
        updateBtn.textContent = 'Save Changes';
      }
    });
  }

  loadReportDetails();
});
