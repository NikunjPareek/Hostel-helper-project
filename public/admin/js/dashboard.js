// Admin Dashboard JS — API Edition

// Auth guard — admin only
const currentUser = authGuard('admin');

document.addEventListener("DOMContentLoaded", async function () {

  // ─── Load Dashboard Data ────────────────────────────────────────
  let dashboardData = null;
  try {
    dashboardData = await apiCall('GET', '/api/dashboard');
  } catch (err) {
    console.error('Dashboard load failed:', err);
  }

  // ─── Load Poll Data ─────────────────────────────────────────────
  let pollData = [];
  try {
    pollData = await apiCall('GET', '/api/polls/active');
    if (!Array.isArray(pollData)) pollData = pollData ? [pollData] : [];
  } catch (err) {
    console.error('Poll load failed:', err);
  }

  // ─── Build state from API ───────────────────────────────────────
  const dashboardState = {
    stats: dashboardData ? [
      { id: "total",   label: "Total Complaints", value: dashboardData.stats.total,       icon: "alert",  color: "red" },
      { id: "pending", label: "Pending",           value: dashboardData.stats.submitted,   icon: "clock",  color: "orange" },
      { id: "review",  label: "Under Review",      value: dashboardData.stats.underReview, icon: "search", color: "blue" },
      { id: "resolved",label: "Resolved",          value: dashboardData.stats.resolved,    icon: "check",  color: "green" }
    ] : [
      { id: "total",   label: "Total Complaints", value: 0, icon: "alert",  color: "red" },
      { id: "pending", label: "Pending",           value: 0, icon: "clock",  color: "orange" },
      { id: "review",  label: "Under Review",      value: 0, icon: "search", color: "blue" },
      { id: "resolved",label: "Resolved",          value: 0, icon: "check",  color: "green" }
    ],
    polls: pollData,
    categories: dashboardData ? dashboardData.categories : [],
    miniStats: dashboardData ? [
      { label: "Resolution Rate",     value: dashboardData.stats.resolutionRate + "%", highlight: true },
      { label: "Total Complaints",    value: String(dashboardData.stats.total),         highlight: false },
      { label: "Active Since",        value: "2024",                                    highlight: false }
    ] : [],
    activityLog: dashboardData ? dashboardData.recentActivity.map(a => ({
      id: a.id,
      status: a.status,
      statusColor: a.status === 'Resolved' ? 'green' : a.status === 'Under Review' ? 'blue' : 'yellow',
      category: a.category,
      date: a.date,
      remark: a.remarks || ''
    })) : []
  };

  function getStatIcon(type) {
    switch (type) {
      case "alert": return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>`;
      case "clock": return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
      case "search": return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
      case "check": return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
      default: return "";
    }
  }

  function renderStatsCards() {
    const hook = document.getElementById("statsCards");
    if (!hook) return;
    hook.innerHTML = dashboardState.stats.map(stat => `
      <div class="stat-card ${stat.color}">
        <div class="stat-icon">${getStatIcon(stat.icon)}</div>
        <div class="stat-content">
          <div class="stat-value">${stat.value}</div>
          <div class="stat-label">${escapeHTML(stat.label)}</div>
        </div>
      </div>
    `).join("");
  }

  function renderPollResults() {
    const totalVotesNode = document.getElementById("totalVotes");
    const questionNode = document.getElementById("pollQuestion");
    const pollBarsHook = document.getElementById("pollBars");
    
    if (!pollBarsHook) return;

    if (!dashboardState.polls.length) {
      if (totalVotesNode) totalVotesNode.textContent = "0 active polls";
      if (questionNode) questionNode.textContent = "No active polls";
      pollBarsHook.innerHTML = '<p style="font-size:13px;color:#6b7280;margin:0;">Create a poll to collect student responses.</p>';
      return;
    }

    const totalVotes = dashboardState.polls.reduce((sum, poll) => sum + poll.totalVotes, 0);
    if (totalVotesNode) totalVotesNode.textContent = `${dashboardState.polls.length} active polls`;
    if (questionNode) questionNode.textContent = `${totalVotes} total votes across active polls`;

    let html = "";
    dashboardState.polls.forEach((poll, pollIndex) => {
      html += `
        <div class="poll-result-group">
          <div class="poll-result-title">${escapeHTML(poll.question)}</div>
          <div class="poll-result-meta">${poll.totalVotes} total votes</div>
          ${poll.options.map((res, index) => {
            const percentage = poll.totalVotes > 0 ? Math.round((res.votes / poll.totalVotes) * 100) : 0;
            const colorClass = `color-${(pollIndex + index) % 5}`;
            return `
              <div class="poll-item">
                <div class="poll-item-top">
                  <span class="poll-item-label">${escapeHTML(res.label)}</span>
                  <span class="poll-item-pct">${percentage}% (${res.votes} votes)</span>
                </div>
                <div class="poll-track">
                  <div class="poll-fill ${colorClass}" style="width: 0%" data-target="${percentage}%"></div>
                </div>
              </div>
            `;
          }).join("")}
          </div>
      `;
    });

    pollBarsHook.innerHTML = html;

    setTimeout(() => {
      pollBarsHook.querySelectorAll(".poll-fill").forEach(fillNode => {
        fillNode.style.width = fillNode.getAttribute("data-target");
      });
    }, 100);
  }

  function renderCategories() {
    const hook = document.getElementById("categoryList");
    if (!hook) return;
    hook.innerHTML = dashboardState.categories.map(cat => `
      <div class="row-list-item">
        <span class="row-label">${escapeHTML(cat.label)}</span>
        <span class="row-value">${cat.count}</span>
      </div>
    `).join("");
  }

  function renderMiniStats() {
    const hook = document.getElementById("miniStatsList");
    if (!hook) return;
    hook.innerHTML = dashboardState.miniStats.map(stat => `
      <div class="row-list-item">
        <span class="row-label">${escapeHTML(stat.label)}</span>
        <span class="row-value ${stat.highlight ? 'highlight-green' : ''}">${escapeHTML(stat.value)}</span>
      </div>
    `).join("");
  }

  function renderActivityLog() {
    const hook = document.getElementById("activityList");
    if (!hook) return;
    hook.innerHTML = dashboardState.activityLog.map(act => {
      const remarkHTML = act.remark ? `<span class="activity-remark">"${escapeHTML(act.remark)}"</span>` : '';
      return `
        <div class="activity-item">
          <div class="activity-dot ${act.statusColor}"></div>
          <div class="activity-meta">
            <span class="activity-id">${act.id}</span>
            <span class="activity-status ${act.statusColor}">${escapeHTML(act.status)}</span>
          </div>
          <div class="activity-desc">
            <span class="activity-category">${escapeHTML(act.category)}</span>
            ${remarkHTML}
          </div>
          <div class="activity-date">${escapeHTML(act.date)}</div>
        </div>
      `;
    }).join("");
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // --- Modal & Create Poll Flow ---
  const pollModal = document.getElementById("pollModal");
  const btnOpenPollModal = document.getElementById("btnOpenPollModal");
  const closePollModal = document.getElementById("closePollModal");
  const cancelPollModal = document.getElementById("cancelPollModal");
  const savePollBtn = document.getElementById("savePollBtn");
  const pollOptionsContainer = document.getElementById("pollOptionsContainer");
  const addPollOptionBtn = document.getElementById("addPollOptionBtn");
  
  function openModal() {
    if(pollModal) pollModal.classList.add("active");
  }

  function closeModal() {
    if(pollModal) pollModal.classList.remove("active");
    document.getElementById("newPollQuestion").value = "";
    pollOptionsContainer.innerHTML = `
      <div style="display: flex; gap: 8px; align-items: center;">
        <input type="text" class="poll-option-input" placeholder="Option 1" style="flex: 1; padding: 11px 14px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; font-family: inherit; color: #111827;">
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <input type="text" class="poll-option-input" placeholder="Option 2" style="flex: 1; padding: 11px 14px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; font-family: inherit; color: #111827;">
      </div>
    `;
  }

  function addOptionLine() {
    const count = pollOptionsContainer.querySelectorAll(".poll-option-input").length + 1;
    const div = document.createElement("div");
    div.style.cssText = "display: flex; gap: 8px; align-items: center;";
    div.innerHTML = `
      <input type="text" class="poll-option-input" placeholder="Option ${count}" style="flex: 1; padding: 11px 14px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; font-family: inherit; color: #111827;">
      <button class="remove-option-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;
    div.querySelector(".remove-option-btn").addEventListener("click", () => div.remove());
    pollOptionsContainer.appendChild(div);
  }

  async function saveNewPoll() {
    const qNode = document.getElementById("newPollQuestion");
    const inputs = pollOptionsContainer.querySelectorAll(".poll-option-input");
    
    if(!qNode.value.trim()) {
      showToast("Question cannot be empty", "error");
      return;
    }

    const newOptions = [];
    inputs.forEach(input => {
      if(input.value.trim() !== "") {
        newOptions.push(input.value.trim());
      }
    });

    if(newOptions.length < 2) {
      showToast("Please provide at least two valid options", "error");
      return;
    }

    try {
      await apiCall('POST', '/api/polls', { question: qNode.value.trim(), options: newOptions });
      
      // Reload poll display
      const activePolls = await apiCall('GET', '/api/polls/active');
      dashboardState.polls = Array.isArray(activePolls) ? activePolls : (activePolls ? [activePolls] : []);
      renderPollResults();
      closeModal();
      showToast("Poll published successfully!", "success");
    } catch (err) {
      showToast(err.message || 'Failed to create poll', 'error');
    }
  }

  // Bind Listeners
  if(btnOpenPollModal) btnOpenPollModal.addEventListener("click", openModal);
  if(closePollModal) closePollModal.addEventListener("click", closeModal);
  if(cancelPollModal) cancelPollModal.addEventListener("click", closeModal);
  if(pollModal) pollModal.addEventListener("click", e => { if (e.target === pollModal) closeModal(); });
  if(addPollOptionBtn) addPollOptionBtn.addEventListener("click", addOptionLine);
  if(savePollBtn) savePollBtn.addEventListener("click", saveNewPoll);

  // --- Toast System ---
  const toastContainer = document.getElementById("toastContainer");
  function showToast(message, type = "success") {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type === "error" ? "toast-error" : ""}`;
    const iconHTML = type === "success" 
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

    toast.innerHTML = `<div class="toast-icon">${iconHTML}</div><p class="toast-message">${message}</p>`;
    toastContainer.appendChild(toast);
    
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Init Execution
  renderStatsCards();
  renderPollResults();
  renderCategories();
  renderMiniStats();
  renderActivityLog();

});
