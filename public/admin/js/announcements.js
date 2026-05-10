// Admin Announcements JS — API Edition
let currentUser = null;

document.addEventListener("DOMContentLoaded", async function () {
  currentUser = await authGuard('admin');
  if (!currentUser) return;

  // Elements
  const newBtn = document.getElementById("newAnnouncementBtn");
  const modal = document.getElementById("announcementModal");
  const closeBtn = document.getElementById("closeAnnouncementModal");
  const cancelBtn = document.getElementById("cancelAnnouncementBtn");
  const form = document.getElementById("announcementForm");
  const list = document.getElementById("announcementsList");
  const emptyState = document.getElementById("emptyState");
  const toastContainer = document.getElementById("toastContainer");

  let announcements = [];

  // Load announcements from API
  async function loadAnnouncements() {
    try {
      announcements = await apiCall('GET', '/api/announcements');
      // Normalize field names for rendering
      renderAnnouncements();
    } catch (err) {
      console.error('Load announcements failed:', err);
    }
  }

  // Toast System
  function showToast(message, type = "success") {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type === "error" ? "toast-error" : ""}`;
    
    const iconHTML = type === "success" 
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

    toast.innerHTML = `
      <div class="toast-icon">${iconHTML}</div>
      <p class="toast-message">${escapeHTML(message)}</p>
    `;

    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add("show"), 10);

    // Auto dismiss
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Custom Dropdown Logic
  function initCustomDropdowns() {
    const wrappers = document.querySelectorAll(".custom-select-wrapper");
    
    wrappers.forEach(wrapper => {
      const select = wrapper.querySelector(".custom-select");
      const optionsMenu = wrapper.querySelector(".custom-options");
      const hiddenInput = wrapper.querySelector("input[type='hidden']");
      const selectedText = select.querySelector(".selected-text");
      const options = optionsMenu.querySelectorAll("li");

      select.addEventListener("click", function() {
        const isOpen = optionsMenu.classList.contains("show");
        
        // Close others
        document.querySelectorAll(".custom-options").forEach(opt => opt.classList.remove("show"));
        document.querySelectorAll(".custom-select").forEach(sel => sel.classList.remove("open"));

        if (!isOpen) {
          optionsMenu.classList.add("show");
          select.classList.add("open");
        }
      });

      options.forEach(option => {
        option.addEventListener("click", function() {
          const val = this.getAttribute("data-value");
          const text = this.childNodes[0].textContent.trim();
          
          hiddenInput.value = val;
          selectedText.textContent = text;

          options.forEach(opt => opt.classList.remove("selected"));
          this.classList.add("selected");

          optionsMenu.classList.remove("show");
          select.classList.remove("open");
        });
      });
    });

    document.addEventListener("click", function(e) {
      if (!e.target.closest(".custom-select-wrapper")) {
        document.querySelectorAll(".custom-options").forEach(opt => opt.classList.remove("show"));
        document.querySelectorAll(".custom-select").forEach(sel => sel.classList.remove("open"));
      }
    });
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // Rendering
  function renderAnnouncements() {
    if (!list || !emptyState) return;

    list.innerHTML = "";

    if (announcements.length === 0) {
      emptyState.style.display = "block";
    } else {
      emptyState.style.display = "none";
      
      announcements.forEach((annob, index) => {
        const priorityBadge = annob.priority === "High" 
          ? `<span class="badge priority-high">
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
                 <line x1="12" y1="9" x2="12" y2="13"></line>
                 <line x1="12" y1="17" x2="12.01" y2="17"></line>
               </svg> High Priority
             </span>`
          : "";
          
        const categoryBadge = `
          <span class="badge category">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg> ${escapeHTML(annob.category)}
          </span>`;

        const cardHTML = `
          <div class="announcement-card" data-index="${index}">
            <div class="card-header-row">
              <div class="announcement-badges">
                ${priorityBadge}
                ${categoryBadge}
              </div>
              <button class="btn-delete" title="Delete Announcement" aria-label="Delete">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                </svg>
              </button>
            </div>
            <h3 class="announcement-title">${escapeHTML(annob.title)}</h3>
            <div class="announcement-content">
              <p class="announcement-text">${escapeHTML(annob.description)}</p>
            </div>
            <div class="announcement-footer">
              <div class="footer-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>${escapeHTML(annob.createdAt ? new Date(annob.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : annob.date)}</span>
              </div>
              <span class="footer-separator">•</span>
              <div class="footer-item">
                <span>Posted by Admin</span>
              </div>
            </div>
          </div>
        `;
        list.insertAdjacentHTML("beforeend", cardHTML);
      });
      
      document.querySelectorAll(".btn-delete").forEach((btn) => {
        btn.addEventListener("click", function () {
          const card = this.closest(".announcement-card");
          if(card) {
            const idx = parseInt(card.getAttribute("data-index"), 10);
            openDeleteModal(idx);
          }
        });
      });
    }
  }

  // Modal Open
  if (newBtn && modal) {
    newBtn.addEventListener("click", function () {
      modal.classList.add("active");
    });
  }

  // Modal Close
  function closeAnnouncementModal() {
    if (modal) {
      modal.classList.remove("active");
      if (form) {
        form.reset();
        
        // Reset custom dropdowns specifically
        const catWrap = document.getElementById("categorySelectWrapper");
        if (catWrap) {
          const defLi = catWrap.querySelector("li[data-value='General']");
          if (defLi) defLi.click();
        }
        const prioWrap = document.getElementById("prioritySelectWrapper");
        if (prioWrap) {
          const defLi = prioWrap.querySelector("li[data-value='Normal']");
          if (defLi) defLi.click();
        }
      }
    }
  }

  if (closeBtn) closeBtn.addEventListener("click", closeAnnouncementModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeAnnouncementModal);
  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeAnnouncementModal();
    });
  }

  // Form Submission
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      
      const title = document.getElementById("announcementTitle").value;
      const category = document.getElementById("announcementCategory").value;
      const priority = document.getElementById("announcementPriority").value;
      const content = document.getElementById("announcementContent").value;

      if (!title.trim() || !content.trim()) return;

      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) { submitBtn.textContent = 'Posting...'; submitBtn.disabled = true; }

      apiCall('POST', '/api/announcements', {
        title: title.trim(),
        category: category,
        priority: priority,
        description: content.trim()
      }).then(newAnnouncement => {
        if (submitBtn) { submitBtn.textContent = 'Post Announcement'; submitBtn.disabled = false; }
        announcements.unshift(newAnnouncement);
        renderAnnouncements();
        closeAnnouncementModal();
        showToast("Announcement posted successfully!", "success");
      }).catch(err => {
        if (submitBtn) { submitBtn.textContent = 'Post Announcement'; submitBtn.disabled = false; }
        showToast(err.message || 'Failed to post announcement', 'error');
      });
    });
  }

  // Delete Modal Flow
  const deleteModal = document.getElementById("deleteModal");
  const closeDeleteBtn = document.getElementById("closeDeleteModal");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  let deleteIndex = -1;
  
  function openDeleteModal(index) {
    deleteIndex = index;
    if (deleteModal) deleteModal.classList.add("active");
  }

  function closeDelete() {
    if (deleteModal) deleteModal.classList.remove("active");
    deleteIndex = -1;
  }

  if (closeDeleteBtn) closeDeleteBtn.addEventListener("click", closeDelete);
  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", closeDelete);
  if (deleteModal) {
    deleteModal.addEventListener("click", function (e) {
      if (e.target === deleteModal) closeDelete();
    });
  }
  
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", function() {
      if (deleteIndex > -1) {
        const announcement = announcements[deleteIndex];
        if (!announcement) { closeDelete(); return; }

        const announcementId = announcement._id || announcement.id;
        apiCall('DELETE', `/api/announcements/${announcementId}`)
          .then(() => {
            announcements.splice(deleteIndex, 1);
            renderAnnouncements();
            closeDelete();
            showToast("Announcement deleted successfully.", "success");
          })
          .catch(err => {
            showToast(err.message || 'Delete failed', 'error');
          });
      }
    });
  }

  // Initialization
  initCustomDropdowns();
  loadAnnouncements();
});
