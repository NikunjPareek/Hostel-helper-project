// Admin Complaints JS

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
  const modalRemarks = document.getElementById("modalRemarks");
  const modalStatusWrapper = document.getElementById("modalStatusWrapper");
  const modalStatusInput = document.getElementById("modalStatus");
  const modalStatusText = document.getElementById("modalStatusText");

  // State Array
  let complaintsState = [
    { id: "CMP-001", student: "Aarav Patel", room: "A-101", category: "WiFi", date: "Nov 12, 2023", status: "Submitted", desc: "The WiFi access point on the first floor is completely down since yesterday evening.", remarks: "" },
    { id: "CMP-002", student: "Riya Sharma", room: "B-205", category: "Water", date: "Nov 10, 2023", status: "Under Review", desc: "No hot water coming from the showers in the B block second floor.", remarks: "Plumber informed and scheduled to check at 2PM." },
    { id: "CMP-003", student: "Karan Singh", room: "C-302", category: "Mess", date: "Nov 08, 2023", status: "Resolved", desc: "Food quality was very poor during dinner last night. Found an insect in the dal.", remarks: "Issue discussed rigorously with contractor. Refund issued and strict hygiene warnings applied." },
    { id: "CMP-004", student: "Ananya Gupta", room: "A-122", category: "Electricity", date: "Nov 15, 2023", status: "Submitted", desc: "Ceiling fan making a very loud screeching noise and vibrating heavily.", remarks: "" },
    { id: "CMP-005", student: "Arjun Verma", room: "D-401", category: "Sanitation", date: "Oct 28, 2023", status: "Resolved", desc: "Corridor dusting not done for 3 days.", remarks: "Cleaning staff assigned." }
  ];

  let currentEditingId = null;

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
        item.student.toLowerCase().includes(searchTerm) || 
        item.id.toLowerCase().includes(searchTerm) || 
        item.room.toLowerCase().includes(searchTerm);
        
      const matchStatus = statusVal === "All" || item.status === statusVal;
      const matchCat = catVal === "All" || item.category === catVal;
      
      const itemMonth = new Date(item.date).toLocaleString('default', { month: 'long' });
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
          <td class="td-id">${comp.id}</td>
          <td class="td-student">${comp.student}</td>
          <td>${comp.room}</td>
          <td>${comp.category}</td>
          <td>${comp.date}</td>
          <td><span class="status-badge ${badgeClass}">${comp.status}</span></td>
          <td style="text-align: right;">
            <button class="btn-view" data-id="${comp.id}">
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
    
    // Extract unique months
    const months = [...new Set(complaintsState.map(c => new Date(c.date).toLocaleString('default', { month: 'long' })))];
    
    months.forEach(m => {
      const li = document.createElement("li");
      li.setAttribute("data-value", m);
      li.innerHTML = `${m} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="check-icon" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
      monthList.appendChild(li);
    });
  }

  // Modal Flow
  function openModal(id) {
    const complaint = complaintsState.find(c => c.id === id);
    if (!complaint) return;
    
    currentEditingId = id;
    
    if (modalComplaintId) modalComplaintId.textContent = complaint.id;
    if (modalStudent) modalStudent.textContent = complaint.student;
    if (modalRoom) modalRoom.textContent = complaint.room;
    if (modalCategory) modalCategory.textContent = complaint.category;
    if (modalDate) modalDate.textContent = complaint.date;
    if (modalDescription) modalDescription.textContent = complaint.desc;
    if (modalRemarks) modalRemarks.value = complaint.remarks;
    
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

  function closeModal() {
    if (complaintModal) complaintModal.classList.remove("active");
    currentEditingId = null;
  }

  function saveModalChanges() {
    if (currentEditingId) {
      const idx = complaintsState.findIndex(c => c.id === currentEditingId);
      if (idx > -1) {
        complaintsState[idx].status = modalStatusInput.value;
        complaintsState[idx].remarks = modalRemarks.value.trim();
        
        closeModal();
        renderTable();
        showToast("Complaint updated successfully", "success");
      }
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

  // Init
  populateMonthFilter();
  initCustomDropdowns();
  renderTable();
});