// Admin Complaints JS — API Edition

// Auth guard — admin only
const currentUser = authGuard('admin');

document.addEventListener("DOMContentLoaded", function () {
  // Elements
  const tableBody = document.getElementById("complaintsTableBody");
  const filteredCountEl = document.getElementById("filteredCount");
  const totalCountEl = document.getElementById("totalCount");
  const emptyState = document.getElementById("emptyState");

  // Filtering System
  const searchInput = document.getElementById("searchInput");
  const statusFilterWrapper = document.getElementById("statusFilterWrapper");
  const categoryFilterWrapper = document.getElementById("categoryFilterWrapper");
  const monthFilterWrapper = document.getElementById("monthFilterWrapper");
  const statusFilterInput = document.getElementById("statusFilter");
  const categoryFilterInput = document.getElementById("categoryFilter");
  const monthFilterInput = document.getElementById("monthFilter");

  // Modal Elements
  const complaintModal = document.getElementById("complaintModal");
  const closeModalBtn = document.getElementById("closeModal");
  const cancelModalBtn = document.getElementById("cancelModal");
  const saveComplaintBtn = document.getElementById("saveComplaint");
  const modalComplaintId = document.getElementById("modalComplaintId");
  const modalStudent = document.getElementById("modalStudent");
  const modalRoom = document.getElementById("modalRoom");
  const modalCategory = document.getElementById("modalCategory");
  const modalDate = document.getElementById("modalDate");
  const modalDescription = document.getElementById("modalDescription");
  const modalMediaSection = document.getElementById("modalMediaSection");
  const modalMediaList = document.getElementById("modalMediaList");
  const modalRemarks = document.getElementById("modalRemarks");
  const modalStatusWrapper = document.getElementById("modalStatusWrapper");
  const modalStatusInput = document.getElementById("modalStatus");
  const modalStatusText = document.getElementById("modalStatusText");

  // State Array — loaded from API
  let complaintsState = [];
  let currentEditingId = null; // will store MongoDB _id

  // Load all complaints from API
  async function loadComplaints() {
    try {
      complaintsState = await apiCall('GET', '/api/complaints');
      if (totalCountEl) totalCountEl.textContent = complaintsState.length;
      populateMonthFilter();
      populateCategoryFilter();
      initCustomDropdowns();
      renderTable();
    } catch (err) {
      console.error('Load complaints failed:', err);
    }
  }

  // Render Table Engine
  function renderTable() {
    if (!tableBody || !emptyState) return;

    // Filters evaluation
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const statusVal = statusFilterInput ? statusFilterInput.value : "All";
    const catVal = categoryFilterInput ? categoryFilterInput.value : "All";
    const monthVal = monthFilterInput ? monthFilterInput.value : "All";

    const filteredData = complaintsState.filter(item => {
      const matchSearch = searchTerm === "" || 
        (item.studentName || '').toLowerCase().includes(searchTerm) || 
        (item.complaintId || '').toLowerCase().includes(searchTerm) || 
        (item.room || '').toLowerCase().includes(searchTerm);
        
      const matchStatus = statusVal === "All" || item.status === statusVal;
      const matchCat = catVal === "All" || item.category === catVal;
      
      const itemMonth = new Date(item.createdAt).toLocaleString('default', { month: 'long' });
      const matchMonth = monthVal === "All" || itemMonth === monthVal;

      return matchSearch && matchStatus && matchCat && matchMonth;
    });

    // Update Counters
    if (totalCountEl) totalCountEl.textContent = complaintsState.length;
    if (filteredCountEl) filteredCountEl.textContent = filteredData.length;

    // Build DOM
    tableBody.innerHTML = "";

    if (filteredData.length === 0) {
      emptyState.style.display = "flex";
      tableBody.parentElement.style.display = "none";
    } else {
      emptyState.style.display = "none";
      tableBody.parentElement.style.display = "table";

      filteredData.forEach(comp => {
        const badgeClass = comp.status === "Resolved" ? "resolved" : 
                           comp.status === "Under Review" ? "review" : "submitted";
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="td-id">${escapeHTML(comp.complaintId)}</td>
          <td class="td-student">${escapeHTML(comp.studentName)}</td>
          <td>${escapeHTML(comp.room)}</td>
          <td>${escapeHTML(comp.category)}</td>
          <td>${new Date(comp.createdAt).toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'})}</td>
          <td><span class="status-badge ${badgeClass}">${escapeHTML(comp.status)}</span></td>
          <td style="text-align: right;">
            <button class="btn-view" data-id="${comp._id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              View
            </button>
          </td>
        `;
        tableBody.appendChild(tr);
      });

      // Bind dynamic view buttons
      document.querySelectorAll(".btn-view").forEach(btn => {
        btn.addEventListener("click", function() {
          const id = this.getAttribute("data-id");
          openModal(id);
        });
      });
    }
  }

  // Custom Dropdown Framework
  function initCustomDropdowns() {
    const wrappers = document.querySelectorAll(".custom-select-wrapper");
    wrappers.forEach(wrapper => {
      const select = wrapper.querySelector(".custom-select");
      const optionsMenu = wrapper.querySelector(".custom-options");
      const hiddenInput = wrapper.querySelector("input[type='hidden']");
      const selectedText = select.querySelector(".selected-text");
      const options = optionsMenu.querySelectorAll("li");

      select.addEventListener("click", function(e) {
        e.stopPropagation();
        const isOpen = optionsMenu.classList.contains("show");
        
        // Close all others
        document.querySelectorAll(".custom-options").forEach(opt => opt.classList.remove("show"));
        document.querySelectorAll(".custom-select").forEach(sel => sel.classList.remove("open"));

        if (!isOpen) {
          optionsMenu.classList.add("show");
          select.classList.add("open");
        }
      });

      options.forEach(option => {
        option.addEventListener("click", function(e) {
          e.stopPropagation();
          const val = this.getAttribute("data-value");
          const text = this.childNodes[0].textContent.trim();
          
          hiddenInput.value = val;
          selectedText.textContent = text;

          options.forEach(opt => opt.classList.remove("selected"));
          this.classList.add("selected");

          optionsMenu.classList.remove("show");
          select.classList.remove("open");

          // Explicitly trigger render if it's a filter
          if (wrapper.classList.contains("filter-select")) {
            renderTable();
          }
        });
      });
    });

    document.addEventListener("click", function() {
      document.querySelectorAll(".custom-options").forEach(opt => opt.classList.remove("show"));
      document.querySelectorAll(".custom-select").forEach(sel => sel.classList.remove("open"));
    });
  }

  // Populate dynamic Month filter from state
  function populateMonthFilter() {
    const monthList = document.getElementById("monthOptionsList");
    if (!monthList) return;

    monthList.innerHTML = `
      <li data-value="All" class="selected">All Months <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="check-icon" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></li>
    `;
    
    // Extract unique months
    const months = [...new Set(complaintsState.map(c => new Date(c.createdAt).toLocaleString('default', { month: 'long' })))];
    
    months.forEach(m => {
      const li = document.createElement("li");
      li.setAttribute("data-value", m);
      li.innerHTML = `${m} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="check-icon" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
      monthList.appendChild(li);
    });
  }

  function populateCategoryFilter() {
    const categoryList = categoryFilterWrapper ? categoryFilterWrapper.querySelector(".custom-options") : null;
    if (!categoryList) return;

    categoryList.innerHTML = `
      <li data-value="All" class="selected">All Categories <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="check-icon" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></li>
    `;

    const categories = [...new Set(complaintsState.map(c => c.category).filter(Boolean))].sort();
    categories.forEach(category => {
      const li = document.createElement("li");
      li.setAttribute("data-value", category);
      li.innerHTML = `${escapeHTML(category)} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="check-icon" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
      categoryList.appendChild(li);
    });
  }

  // Modal Flow
  function openModal(id) {
    const complaint = complaintsState.find(c => c._id === id);
    if (!complaint) return;
    
    currentEditingId = id;
    
    if (modalComplaintId) modalComplaintId.textContent = complaint.complaintId;
    if (modalStudent)    modalStudent.textContent    = complaint.studentName;
    if (modalRoom)       modalRoom.textContent       = complaint.room;
    if (modalCategory)   modalCategory.textContent   = complaint.category;
    if (modalDate) modalDate.textContent = new Date(complaint.createdAt).toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'});
    if (modalDescription) modalDescription.textContent = complaint.description;
    if (modalRemarks) modalRemarks.value = complaint.remarks || '';

    // Extended identity fields
    const hostelEl   = document.getElementById('modalHostel');
    const blockEl    = document.getElementById('modalBlock');
    const usernameEl = document.getElementById('modalUsername');
    const resolvedEl = document.getElementById('modalResolvedAt');

    if (hostelEl)   hostelEl.textContent   = complaint.hostel   || '—';
    if (blockEl)    blockEl.textContent    = complaint.block    || '—';
    if (usernameEl) usernameEl.textContent = complaint.studentUsername || '—';
    if (resolvedEl) {
      resolvedEl.textContent = complaint.resolvedAt
        ? 'Resolved on ' + new Date(complaint.resolvedAt).toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'})
        : '';
      resolvedEl.style.display = complaint.resolvedAt ? 'block' : 'none';
    }

    renderMedia(complaint.media || []);
    
    // Sync custom dropdown logic for status
    if (modalStatusInput && modalStatusText && modalStatusWrapper) {
      modalStatusInput.value = complaint.status;
      modalStatusText.textContent = complaint.status;
      const options = modalStatusWrapper.querySelectorAll(".custom-options li");
      options.forEach(opt => {
        opt.classList.remove("selected");
        if (opt.getAttribute("data-value") === complaint.status) opt.classList.add("selected");
      });
    }

    if (complaintModal) complaintModal.classList.add("active");
  }

  function renderMedia(media) {
    if (!modalMediaSection || !modalMediaList) return;

    if (!media.length) {
      modalMediaSection.style.display = 'none';
      modalMediaList.innerHTML = '';
      return;
    }

    modalMediaSection.style.display = 'flex';
    modalMediaList.innerHTML = media.map(file => {
      const name = escapeHTML(file.originalName || 'Attachment');
      if (file.mediaType === 'video') {
        return `
          <div class="media-item">
            <video controls preload="none" style="max-width:100%;border-radius:6px">
              <source src="${file.url}" type="${file.mimeType || 'video/mp4'}">
            </video>
            <span>${name}</span>
          </div>`;
      }
      return `
        <div class="media-item">
          <img src="${file.url}" alt="${name}" loading="lazy"
               onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
          <div style="display:none;color:#ef4444;font-size:12px">⚠ Image unavailable</div>
          <span>${name}</span>
        </div>`;
    }).join('');
  }

  function closeModal() {
    if (complaintModal) complaintModal.classList.remove("active");
    currentEditingId = null;
  }

  function saveModalChanges() {
    if (currentEditingId) {
      const status = modalStatusInput ? modalStatusInput.value : null;
      const remarks = modalRemarks ? modalRemarks.value.trim() : '';

      apiCall('PUT', `/api/complaints/${currentEditingId}`, { status, remarks })
        .then(updated => {
          // Update local state
          const idx = complaintsState.findIndex(c => c._id === currentEditingId);
          if (idx > -1) {
            complaintsState[idx].status  = updated.status;
            complaintsState[idx].remarks = updated.remarks;
          }
          closeModal();
          renderTable();
          showToast("Complaint updated successfully", "success");
        })
        .catch(err => {
          showToast(err.message || 'Update failed', 'error');
        });
    }
  }

  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);
  if (saveComplaintBtn) saveComplaintBtn.addEventListener("click", saveModalChanges);
  if (complaintModal) {
    complaintModal.addEventListener("click", function (e) {
      if (e.target === complaintModal) closeModal();
    });
  }

  // Listeners
  if (searchInput) {
    searchInput.addEventListener("input", renderTable); // Live search
  }

  const btnExport = document.getElementById("exportCSV");
  if (btnExport) {
    btnExport.addEventListener("click", () => showToast("Exporting CSV file...", "success"));
  }

  // Toast Component Logic
  const toastContainer = document.getElementById("toastContainer");
  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  function showToast(message, type = "success") {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type === "error" ? "toast-error" : ""}`;
    
    const iconHTML = type === "success" 
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

    toast.innerHTML = `
      <div class="toast-icon">${iconHTML}</div>
      <p class="toast-message">${message}</p>
    `;

    toastContainer.appendChild(toast);
    
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Init\r\n  loadComplaints();
});
