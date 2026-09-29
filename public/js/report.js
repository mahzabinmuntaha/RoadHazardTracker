/**
 * ====================================================================
 * Road Hazard Reporting & Tracking System
 * Hazard Report Creation Controller (Vanilla JavaScript)
 * ====================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Check active user session without forcing abrupt redirect so we can display the Auth Gate
  let currentUser = await window.initAuth({ requireAuth: false });

  const gateCard = document.getElementById('auth-gate-card');
  const formCard = document.getElementById('report-form-card');
  const citizenNameEl = document.getElementById('auth-citizen-name');
  const citizenEmailEl = document.getElementById('auth-citizen-email');
  const citizenAvatarEl = document.getElementById('auth-citizen-avatar');

  const form = document.getElementById('report-form');
  const areaSelect = document.getElementById('hazard-area');
  const typeSelect = document.getElementById('hazard-type');
  const suggestionBox = document.getElementById('department-suggestion-box');
  const suggestedDeptName = document.getElementById('suggested-dept-name');
  const suggestedDeptDesc = document.getElementById('suggested-dept-desc');
  const suggestedDeptIdInput = document.getElementById('suggested-dept-id');

  const fileInput = document.getElementById('hazard-image-file');
  const dropzone = document.getElementById('image-dropzone');
  const previewContainer = document.getElementById('image-preview-container');
  const previewImg = document.getElementById('preview-img');
  const removeImageBtn = document.getElementById('remove-image-btn');

  let selectedFile = null;

  function renderUserBanner() {
    if (citizenNameEl && currentUser) {
      citizenNameEl.textContent = currentUser.full_name || 'Verified Citizen';
    }
    if (citizenEmailEl && currentUser) {
      citizenEmailEl.textContent = currentUser.email || '';
    }
    if (citizenAvatarEl && currentUser) {
      citizenAvatarEl.textContent = (currentUser.full_name || 'U').trim().charAt(0).toUpperCase();
    }
  }

  function updateViewForAuth() {
    if (currentUser) {
      if (gateCard) gateCard.style.display = 'none';
      if (formCard) formCard.style.display = 'block';
      renderUserBanner();
    } else {
      if (gateCard) gateCard.style.display = 'block';
      if (formCard) formCard.style.display = 'none';
    }
  }

  // Initial display setup
  updateViewForAuth();

  // Real-time Department Suggestion Lookup
  async function updateDepartmentSuggestion() {
    const area = areaSelect.value;
    const type = typeSelect.value;

    if (!area || !type) {
      suggestionBox.classList.remove('ready');
      suggestedDeptName.textContent = 'Select area & hazard type';
      suggestedDeptDesc.textContent = 'The system will automatically match and suggest the responsible civic department.';
      suggestedDeptIdInput.value = '';
      return;
    }

    // Lookup in database
    const suggestedDept = await window.db.mappings.getSuggested(area, type);

    if (suggestedDept) {
      suggestionBox.classList.add('ready');
      suggestedDeptName.innerHTML = `Suggested: <strong>${escapeHtml(suggestedDept.department_name)}</strong>`;
      suggestedDeptDesc.textContent = suggestedDept.description || 'Assigned automatically based on district zoning and hazard category.';
      suggestedDeptIdInput.value = suggestedDept.id;
    } else {
      suggestionBox.classList.remove('ready');
      suggestedDeptName.textContent = 'General Infrastructure Review';
      suggestedDeptDesc.textContent = 'No automatic mapping found for this combination. System admin will manually triage upon verification.';
      suggestedDeptIdInput.value = '';
    }
  }

  areaSelect?.addEventListener('change', updateDepartmentSuggestion);
  typeSelect?.addEventListener('change', updateDepartmentSuggestion);

  // File Upload & Preview
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--color-primary)';
      dropzone.style.backgroundColor = 'var(--color-primary-light)';
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.style.borderColor = '';
      dropzone.style.backgroundColor = '';
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '';
      dropzone.style.backgroundColor = '';
      if (e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
      }
    });

    removeImageBtn?.addEventListener('click', () => {
      selectedFile = null;
      fileInput.value = '';
      previewContainer.style.display = 'none';
      dropzone.style.display = 'block';
    });
  }

  function handleFileSelect(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP).', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds 5MB limit.', 'error');
      return;
    }

    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      previewContainer.style.display = 'inline-block';
      dropzone.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  // Form Submission
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Security check: Must be authenticated
    if (!currentUser || !currentUser.id) {
      showToast('Authentication required. Please log in or register before submitting.', 'error');
      updateViewForAuth();
      return;
    }

    const hazardType = typeSelect.value;
    const area = areaSelect.value;
    const roadName = document.getElementById('road-name').value.trim();
    const landmark = document.getElementById('landmark').value.trim();
    const severity = document.querySelector('input[name="severity"]:checked')?.value || 'Medium';
    const description = document.getElementById('description').value.trim();
    const suggestedDeptId = suggestedDeptIdInput.value || null;

    // Validation
    if (!hazardType) {
      showToast('Please select a hazard type.', 'error');
      return;
    }
    if (!area) {
      showToast('Please select an area or sector.', 'error');
      return;
    }
    if (!roadName) {
      showToast('Please enter the road name or street location.', 'error');
      return;
    }
    if (!description || description.length < 10) {
      showToast('Please provide a detailed description (at least 10 characters).', 'error');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Submitting Report...';

    try {
      const created = await window.db.hazards.create({
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        user_email: currentUser.email || '',
        hazard_type: hazardType,
        area: area,
        road_name: roadName,
        landmark: landmark,
        severity: severity,
        description: description,
        suggested_department_id: suggestedDeptId
      }, selectedFile);

      showToast('Hazard report submitted successfully!', 'success');
      setTimeout(() => {
        window.location.href = `/report-details.html?id=${created.id}`;
      }, 1000);
    } catch (err) {
      console.error('Error submitting report:', err);
      showToast('Error submitting report: ' + err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
});
