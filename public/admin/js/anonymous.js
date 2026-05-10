// Admin Anonymous Feedback JS - API Edition
let currentUser = null;

document.addEventListener("DOMContentLoaded", async function () {
  currentUser = await authGuard('admin');
  if (!currentUser) return;

  const feedbackGrid = document.getElementById("feedbackGrid");
  const emptyState = document.getElementById("emptyState");

  let anonymousState = [];

  async function loadFeedback() {
    try {
      anonymousState = await apiCall('GET', '/api/feedback');
    } catch (err) {
      console.error('Load feedback failed:', err);
      anonymousState = [];
    }

    renderFeedback();
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  function safeClassToken(str) {
    return String(str || "general").toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
  }

  function getCategoryIcon(type) {
    switch(type) {
      case 'Mess': return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg>`;
      case 'WiFi': return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>`;
      case 'Water': return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`;
      case 'Electricity': return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
      default: return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }
  }

  function getStatusIcon(status) {
    switch(status) {
      case 'Resolved': return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
      case 'Under Review': return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
      default: return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`;
    }
  }

  function getStatusClass(status) {
    return `status-${status === "Under Review" ? "review" : String(status || "submitted").toLowerCase()}`;
  }

  function buildStatusControl(node) {
    const statuses = ["Submitted", "Under Review", "Resolved"];
    const activeClass = {
      "Submitted": "active-submitted",
      "Under Review": "active-review",
      "Resolved": "active-resolved"
    };

    return statuses.map(status => `
      <button
        class="status-btn${node.status === status ? ` ${activeClass[status]}` : ""}"
        data-id="${escapeHTML(node._id)}"
        data-status="${escapeHTML(status)}"
        type="button"
      >${escapeHTML(status)}</button>
    `).join("");
  }

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

  function buildMedia(media = []) {
    if (!media.length) return '';

    const items = media.map(file => {
      const name = escapeHTML(file.originalName || 'Attachment');
      if (file.mediaType === 'video') {
        return `
          <div class="feedback-media-item">
            <video controls preload="none" style="max-width:100%;border-radius:8px;display:block">
              <source src="${file.url}" type="${file.mimeType || 'video/mp4'}">
            </video>
            <div class="feedback-media-name">${name}</div>
          </div>`;
      }
      return `
        <div class="feedback-media-item">
          <img src="${file.url}"
               alt="${name}"
               loading="lazy"
               style="max-width:100%;border-radius:8px;display:block"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="media-error" style="display:none;align-items:center;gap:6px;color:#ef4444;font-size:13px">
            ⚠ Image unavailable
          </div>
          <div class="feedback-media-name">${name}</div>
        </div>`;
    }).join('');

    return `<div class="feedback-media-grid">${items}</div>`;
  }

  function renderFeedback() {
    if (!feedbackGrid || !emptyState) return;

    feedbackGrid.innerHTML = "";

    if (anonymousState.length === 0) {
      emptyState.style.display = "flex";
      return;
    }

    emptyState.style.display = "none";

    anonymousState.forEach(node => {
      const catClass = `cat-${safeClassToken(node.category)}`;
      const cardHTML = `
        <div class="feedback-card" data-id="${escapeHTML(node._id)}">
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

          <div class="card-description">
            <svg class="description-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            <p class="description-text">${escapeHTML(node.content)}</p>
          </div>

          ${buildMedia(node.media)}

          <div class="js-remarks-display">
            ${buildRemarksDisplay(node.remarks)}
          </div>

          <div class="card-admin-section">
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

            <div>
              <p class="admin-section-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Admin Response
              </p>
              <textarea
                class="admin-response-textarea"
                data-id="${escapeHTML(node._id)}"
                placeholder="Add admin response..."
                rows="3"
              >${escapeHTML(node.remarks)}</textarea>
            </div>

            <div class="card-action-row">
              <button class="btn-mark-resolved${node.status === "Resolved" ? " btn-resolved-done" : ""}" data-id="${escapeHTML(node._id)}" type="button" ${node.status === "Resolved" ? "disabled" : ""}>${node.status === "Resolved" ? "Resolved" : "Mark as Resolved"}</button>
              <button class="btn-save-response" data-id="${escapeHTML(node._id)}" type="button">Save Response</button>
            </div>
          </div>

          <div class="card-footer">
            <span class="card-id">${escapeHTML(node.feedbackId || node._id)}</span>
            <span class="card-date">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              ${node.createdAt ? new Date(node.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : ""}
            </span>
          </div>
        </div>
      `;

      feedbackGrid.insertAdjacentHTML("beforeend", cardHTML);
    });

    attachCardEvents();
  }

  async function updateFeedback(id, changes) {
    const updated = await apiCall('PUT', `/api/feedback/${id}`, changes);
    const index = anonymousState.findIndex(item => item._id === id);
    if (index > -1) anonymousState[index] = updated;
    return updated;
  }

  function attachCardEvents() {
    feedbackGrid.querySelectorAll(".status-btn").forEach(btn => {
      btn.addEventListener("click", async function () {
        const id = this.dataset.id;
        const node = anonymousState.find(item => item._id === id);
        if (!node) return;

        try {
          await updateFeedback(id, { status: this.dataset.status, remarks: node.remarks || "" });
          renderFeedback();
        } catch (err) {
          alert(err.message || "Could not update status");
        }
      });
    });

    feedbackGrid.querySelectorAll(".btn-save-response").forEach(btn => {
      btn.addEventListener("click", async function () {
        const id = this.dataset.id;
        const node = anonymousState.find(item => item._id === id);
        const card = feedbackGrid.querySelector(`.feedback-card[data-id="${id}"]`);
        const textarea = card ? card.querySelector(`.admin-response-textarea[data-id="${id}"]`) : null;
        if (!node || !textarea) return;

        try {
          await updateFeedback(id, { status: node.status, remarks: textarea.value.trim() });
          this.textContent = "Saved";
          this.classList.add("btn-save-done");
          setTimeout(renderFeedback, 700);
        } catch (err) {
          alert(err.message || "Could not save response");
        }
      });
    });

    feedbackGrid.querySelectorAll(".btn-mark-resolved").forEach(btn => {
      btn.addEventListener("click", async function () {
        const id = this.dataset.id;
        const node = anonymousState.find(item => item._id === id);
        const card = feedbackGrid.querySelector(`.feedback-card[data-id="${id}"]`);
        const textarea = card ? card.querySelector(`.admin-response-textarea[data-id="${id}"]`) : null;
        if (!node) return;

        try {
          await updateFeedback(id, {
            status: "Resolved",
            remarks: textarea ? textarea.value.trim() : node.remarks || ""
          });
          renderFeedback();
        } catch (err) {
          alert(err.message || "Could not mark as resolved");
        }
      });
    });
  }

  loadFeedback();
});
