// Admin Anonymous Feedback JS
document.addEventListener("DOMContentLoaded", function () {
  
  const feedbackGrid = document.getElementById("feedbackGrid");
  const emptyState = document.getElementById("emptyState");

  // Centralized State Management
  const anonymousState = [
    { 
      id: "FBK-001", category: "WiFi", status: "Submitted", date: "Nov 14, 2023", 
      desc: "The WiFi drops consistently around 10 PM every single night. It makes it impossible to submit assignments on time.",
      remarks: ""
    },
    { 
      id: "FBK-002", category: "Mess", status: "Under Review", date: "Nov 12, 2023", 
      desc: "Breakfast timings are too short. If classes run late, there is nothing left by 9:15 AM.",
      remarks: "Discussing extension of timing with the mess committee."
    },
    { 
      id: "FBK-003", category: "Sanitation", status: "Resolved", date: "Nov 05, 2023", 
      desc: "The garbage bins in the common area are overflowing and haven't been cleared for two days.",
      remarks: "Cleaning schedule adjusted. Supervisor notified."
    },
    { 
      id: "FBK-004", category: "General", status: "Submitted", date: "Nov 18, 2023", 
      desc: "We need more study tables in the common room. Currently there are only 4 for 50 students.",
      remarks: ""
    },
    { 
      id: "FBK-005", category: "Water", status: "Resolved", date: "Oct 22, 2023", 
      desc: "Drinking water cooler on 3rd floor is dispensing warm water.",
      remarks: "Compressor replaced. Cooler functioning normally."
    }
  ];

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
        const statusClass = `status-${node.status === "Under Review" ? "review" : node.status.toLowerCase()}`;
        
        let remarksHtml = "";
        if (node.remarks && node.remarks.trim() !== "") {
          remarksHtml = `
            <div class="admin-remarks">
              <span class="remarks-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Admin Response
              </span>
              <p class="remarks-text">"${escapeHTML(node.remarks)}"</p>
            </div>
          `;
        }

        const cardHTML = `
          <div class="feedback-card">
            <!-- Badges -->
            <div class="card-badges">
              <span class="badge ${catClass}">
                ${getCategoryIcon(node.category)}
                ${escapeHTML(node.category)}
              </span>
              <span class="badge ${statusClass}">
                ${getStatusIcon(node.status)}
                ${escapeHTML(node.status)}
              </span>
            </div>

            <!-- Content -->
            <div class="card-description">
              <svg class="description-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
              <p class="description-text">${escapeHTML(node.desc)}</p>
            </div>

            <!-- Remarks Injection -->
            ${remarksHtml}

            <!-- Footer Meta -->
            <div class="card-footer">
              <span class="card-id">${escapeHTML(node.id)}</span>
              <span class="card-date">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                ${escapeHTML(node.date)}
              </span>
            </div>
          </div>
        `;

        feedbackGrid.insertAdjacentHTML("beforeend", cardHTML);
      });
    }
  }

  // Trigger initial draw
  renderFeedback();
});
