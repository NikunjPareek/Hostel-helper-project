// Admin Anonymous Feedback JS — API Edition
const currentUser = authGuard('admin');

document.addEventListener("DOMContentLoaded", function () {
  
  const feedbackGrid = document.getElementById("feedbackGrid");
  const emptyState = document.getElementById("emptyState");

  // Centralized State Management (loaded from API)
  let anonymousState = [];

  // Load feedback from API
  async function loadFeedback() {
    try {
      anonymousState = await apiCall('GET', '/api/feedback');
      renderFeedback();
    } catch (err) {
      console.error('Load feedback failed:', err);
      renderFeedback();
    }
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }


  // Pure function ensuring SVG Icon rendering doesn't fallback to messy characters
  function getCategoryIcon(type) {
    switch(type) {
      case 'Mess': return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg>`;
      case 'WiFi': return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>`;
      case 'Water': return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`;
      case 'Electricity': return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
      case 'Sanitation': return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`;
      default: return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }
  }

  function getStatusIcon(status) {
    switch(status) {
      case 'Resolved': return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
      case 'Under Review': return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
      case 'Submitted': return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`;
      default: return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;
    }
  }

  // Derive CSS class for a status value
  function getStatusClass(status) {
    return `status-${status === "Under Review" ? "review" : status.toLowerCase()}`;
  }

  // Build the status segmented-control HTML for a given node
  function buildStatusControl(node) {
    const statuses = ["Submitted", "Under Review", "Resolved"];
    const activeClass = {
      "Submitted": "active-submitted",
      "Under Review": "active-review",
      "Resolved": "active-resolved"
    };
    return statuses.map(s => `
      <button
        class="status-btn${node.status === s ? ` ${activeClass[s]}` : ""}"
        data-id="${escapeHTML(node._id || node.id)}"
        data-status="${escapeHTML(s)}"
        type="button"
      >${escapeHTML(s)}</button>
    `).join("");
  }

  // Build the admin remarks display block (shown when remarks exist)
  function buildRemarksDisplay(remarks) {
    if (!remarks || remarks.trim() === "") return "";
    return `
      <div class="admin-remarks">
        <span class="remarks-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Admin Response
        </span>
        <p class="remarks-text">"${escapeHTML(remarks)}"</p>
      </div>
    `;
  }

  // Render Component Logic
  function renderFeedback() {
    if (!feedbackGrid || !emptyState) return;

    feedbackGrid.innerHTML = "";

    if (anonymousState.length === 0) {
      emptyState.style.display = "flex";
    } else {
      emptyState.style.display = "none";

      anonymousState.forEach(node => {
        
        const catClass = `cat-${node.category.toLowerCase()}`;
        
        const cardHTML = `
          <div class="feedback-card" data-id="${escapeHTML(node._id || node.id)}">

            <!-- Badges -->
            <div class="card-badges">
              <span class="badge ${catClass}">
                ${getCategoryIcon(node.category)}
                ${escapeHTML(node.category)}
              </span>
              <span class="badge ${getStatusClass(node.status)} js-status-badge">
                ${getStatusIcon(node.status)}
                ${escapeHTML(node.status)}
              </span>
            </div>

            <!-- Content -->
            <div class="card-description">
              <svg class="description-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
              <p class="description-text">${escapeHTML(node.content || node.desc)}</p>
            </div>

            <!-- Admin Remarks Display (live-updated) -->
            <div class="js-remarks-display">
              ${buildRemarksDisplay(node.remarks)}
            </div>

            <!-- ─── Admin Action Section ─────────────────────── -->
            <div class="card-admin-section">

              <!-- Status Control -->
              <div>
                <p class="admin-section-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Update Status
                </p>
                <div class="status-control">
                  ${buildStatusControl(node)}
                </div>
              </div>

              <!-- Response Textarea -->
              <div>
                <p class="admin-section-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  Admin Response
                </p>
                <textarea
                  class="admin-response-textarea"
                  data-id="${escapeHTML(node._id || node.id)}"
                  placeholder="Add admin response…"
                  rows="3"
                >${escapeHTML(node.remarks)}</textarea>
              </div>

              <!-- Action Buttons -->
              <div class="card-action-row">
                <button class="btn-mark-resolved" data-id="${escapeHTML(node._id || node.id)}" type="button">Mark as Resolved</button>
                <button class="btn-save-response" data-id="${escapeHTML(node._id || node.id)}" type="button">Save Response</button>
              </div>

            </div>
            <!-- ─────────────────────────────────────────────── -->

            <!-- Footer Meta -->
            <div class="card-footer">
              <span class="card-id">${escapeHTML(node._id || node.id)}</span>
              <span class="card-date">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                ${node.createdAt ? new Date(node.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : node.date}
              </span>
            </div>

          </div>
        `;

        feedbackGrid.insertAdjacentHTML("beforeend", cardHTML);
      });

      // Attach delegated event listeners after all cards are rendered
      attachCardEvents();
    }
  }

  // ─── Event Delegation ────────────────────────────────────────────────────

  function attachCardEvents() {

    // Status button clicks
    feedbackGrid.querySelectorAll(".status-btn").forEach(btn => {
      btn.addEventListener("click", function () {
        const id = this.dataset.id;
        const newStatus = this.dataset.status;
        const node = anonymousState.find(n => n\._id === id || n\.id === id);
        if (!node) return;

        node.status = newStatus;

        // Update the card DOM without full re-render
        const card = feedbackGrid.querySelector(`.feedback-card[data-id="${id}"]`);
        if (!card) return;

        // Update status badge
        const badge = card.querySelector(".js-status-badge");
        if (badge) {
          badge.className = `badge ${getStatusClass(newStatus)} js-status-badge`;
          badge.innerHTML = `${getStatusIcon(newStatus)} ${escapeHTML(newStatus)}`;
        }

        // Update segmented control active states
        const activeClass = {
          "Submitted": "active-submitted",
          "Under Review": "active-review",
          "Resolved": "active-resolved"
        };
        card.querySelectorAll(".status-btn").forEach(b => {
          b.classList.remove("active-submitted", "active-review", "active-resolved");
          if (b.dataset.status === newStatus) {
            b.classList.add(activeClass[newStatus]);
          }
        });

        // If resolved, also update the Mark as Resolved button state
        const resolveBtn = card.querySelector(".btn-mark-resolved");
        if (resolveBtn) {
          resolveBtn.disabled = newStatus === "Resolved";
          resolveBtn.classList.toggle("btn-resolved-done", newStatus === "Resolved");
        }
      });
    });

    // Save Response button clicks
    feedbackGrid.querySelectorAll(".btn-save-response").forEach(btn => {
      btn.addEventListener("click", function () {
        const id = this.dataset.id;
        const node = anonymousState.find(n => n\._id === id || n\.id === id);
        if (!node) return;

        const card = feedbackGrid.querySelector(`.feedback-card[data-id="${id}"]`);
        if (!card) return;

        const textarea = card.querySelector(`.admin-response-textarea[data-id="${id}"]`);
        const newRemarks = textarea ? textarea.value.trim() : "";

        node.remarks = newRemarks;

        // Update the remarks display block in-card without re-rendering
        const remarksDisplay = card.querySelector(".js-remarks-display");
        if (remarksDisplay) {
          remarksDisplay.innerHTML = buildRemarksDisplay(newRemarks);
        }

        // Provide brief visual feedback on the button
        this.textContent = "Saved ✓";
        this.classList.add("btn-save-done");
        setTimeout(() => {
          this.textContent = "Save Response";
          this.classList.remove("btn-save-done");
        }, 1800);
      });
    });

    // Mark as Resolved button clicks
    feedbackGrid.querySelectorAll(".btn-mark-resolved").forEach(btn => {
      btn.addEventListener("click", function () {
        const id = this.dataset.id;
        const node = anonymousState.find(n => n\._id === id || n\.id === id);
        if (!node) return;

        node.status = "Resolved";

        const card = feedbackGrid.querySelector(`.feedback-card[data-id="${id}"]`);
        if (!card) return;

        // Update status badge
        const badge = card.querySelector(".js-status-badge");
        if (badge) {
          badge.className = `badge status-resolved js-status-badge`;
          badge.innerHTML = `${getStatusIcon("Resolved")} Resolved`;
        }

        // Update segmented control
        card.querySelectorAll(".status-btn").forEach(b => {
          b.classList.remove("active-submitted", "active-review", "active-resolved");
          if (b.dataset.status === "Resolved") b.classList.add("active-resolved");
        });

        // Disable this button
        this.disabled = true;
        this.classList.add("btn-resolved-done");
        this.textContent = "Resolved ✓";
      });
    });
  }

  // Trigger initial draw
  loadFeedback();
});

