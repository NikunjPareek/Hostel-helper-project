// Admin Dashboard JS — API Edition

// Auth guard — admin only
let currentUser = null;

document.addEventListener("DOMContentLoaded", async function () {
  currentUser = await authGuard('admin');
  if (!currentUser) return;

  // ─── Load Dashboard Data ────────────────────────────────────────
  let dashboardData = null;
  let currentTimeframe = 7;

  async function fetchOverviewData() {
    const hook = document.getElementById("overviewCards");
    if (hook) {
      hook.innerHTML = Array(4).fill(`
        <div class="overview-card loading-skeleton">
          <div class="overview-card-header">
            <div class="overview-icon-container skeleton-block"></div>
            <div class="skeleton-block skeleton-trend"></div>
          </div>
          <div class="skeleton-block skeleton-value"></div>
          <div class="skeleton-block skeleton-label"></div>
        </div>
      `).join("");
    }

    try {
      dashboardData = await apiCall('GET', `/api/dashboard?timeframe=${currentTimeframe}`);
    } catch (err) {
      console.error('Dashboard load failed:', err);
    }
  }

  await fetchOverviewData();

  const timeframeSelect = document.getElementById('timeframeSelect');
  if (timeframeSelect) {
    timeframeSelect.addEventListener('change', async (e) => {
      currentTimeframe = parseInt(e.target.value) || 7;
      await fetchOverviewData();
      updateDashboardState();
      renderOverviewCards();
    });
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
  const dashboardState = {};
  
  function updateDashboardState() {
    dashboardState.summary = dashboardData?.summary || {
      total_complaints: { current: 0, change_percentage: 0, trend_points: [] },
      pending: { current: 0, change_percentage: 0, trend_points: [] },
      under_review: { current: 0, change_percentage: 0, trend_points: [] },
      resolved: { current: 0, change_percentage: 0, trend_points: [] }
    };
    
    dashboardState.last_updated = dashboardData?.last_updated || new Date().toISOString();

    // Original state definitions (Preserved exactly as before for other components)
    dashboardState.polls = pollData;
    dashboardState.categories = dashboardData ? dashboardData.categories : [];
    dashboardState.miniStats = dashboardData ? [
      { label: "Resolution Rate",     value: dashboardData.stats.resolutionRate + "%", highlight: true },
      { label: "Total Complaints",    value: String(dashboardData.stats.total),         highlight: false },
      { label: "Active Since",        value: "2024",                                    highlight: false }
    ] : [];
    dashboardState.activityLog = dashboardData ? dashboardData.recentActivity.map(a => ({
      id: a.id,
      status: a.status,
      statusColor: a.status === 'Resolved' ? 'green' : a.status === 'Under Review' ? 'blue' : 'yellow',
      category: a.category,
      date: a.date,
      remark: a.remarks || ''
    })) : [];
  }
  
  updateDashboardState();

  function getOverviewIcon(type) {
    switch (type) {
      case "total": return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`;
      case "pending": return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
      case "review": return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
      case "resolved": return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
      default: return "";
    }
  }

  function generateSparkline(dataPoints) {
    if (!dataPoints || dataPoints.length === 0) return '';
    const max = Math.max(...dataPoints, 1);
    const min = 0;
    const width = 100;
    const height = 30;
    
    // Flat baseline if all values are 0
    if (Math.max(...dataPoints) === 0) {
      return `<path d="M0,${height} L${width},${height}" class="overview-sparkline-path" />`;
    }

    const points = dataPoints.map((val, idx) => {
      const x = (idx / (dataPoints.length - 1)) * width;
      const y = height - ((val - min) / (max - min)) * height;
      return `${x},${y}`;
    });

    // Smooth curve rendering
    const d = `M${points[0]} ` + points.slice(1).map((p, i) => {
      const [px, py] = points[i].split(',');
      const [cx, cy] = p.split(',');
      const cpX = (parseFloat(px) + parseFloat(cx)) / 2;
      return `C${cpX},${py} ${cpX},${cy} ${cx},${cy}`;
    }).join(' ');

    return `<path d="${d}" class="overview-sparkline-path" />`;
  }

  function getTrendIndicator(percentage) {
    if (percentage > 0) {
      return `<span class="overview-trend up"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>${percentage}%</span>`;
    } else if (percentage < 0) {
      return `<span class="overview-trend down"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>${Math.abs(percentage)}%</span>`;
    }
    return `<span class="overview-trend flat"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>0%</span>`;
  }

  function renderOverviewCards() {
    const hook = document.getElementById("overviewCards");
    if (!hook) return;

    const summary = dashboardState.summary;
    const cards = [
      { id: "total", label: "Total Complaints", data: summary.total_complaints, color: "red" },
      { id: "pending", label: "Pending", data: summary.pending, color: "orange" },
      { id: "review", label: "Under Review", data: summary.under_review, color: "blue" },
      { id: "resolved", label: "Resolved", data: summary.resolved, color: "green" }
    ];

    hook.innerHTML = cards.map(c => `
      <div class="overview-card ${c.color}">
        <div class="overview-card-header">
          <div class="overview-icon-container">
            ${getOverviewIcon(c.id)}
          </div>
          ${getTrendIndicator(c.data.change_percentage)}
        </div>
        <div class="overview-card-body">
          <div class="overview-value">${c.data.current}</div>
          <div class="overview-label">${escapeHTML(c.label)}</div>
        </div>
        <div class="overview-sparkline">
          <svg viewBox="0 0 100 35" preserveAspectRatio="none">
            ${generateSparkline(c.data.trend_points)}
          </svg>
        </div>
      </div>
    `).join("");

    const lastUpdatedText = document.getElementById("lastUpdatedText");
    if (lastUpdatedText && dashboardState.last_updated) {
      const date = new Date(dashboardState.last_updated);
      const now = new Date();
      const diffMs = now - date;
      if (diffMs < 60000) lastUpdatedText.textContent = "Updated just now";
      else lastUpdatedText.textContent = `Updated ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }
  }

  let currentPollIndex = 0;

  function handlePollNav(direction) {
    if (!dashboardState.polls || dashboardState.polls.length <= 1) return;
    if (direction === 'prev') {
      currentPollIndex = (currentPollIndex - 1 + dashboardState.polls.length) % dashboardState.polls.length;
    } else {
      currentPollIndex = (currentPollIndex + 1) % dashboardState.polls.length;
    }
    renderPollResults();
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

    const pollNavControls = document.getElementById("pollNavControls");
    if (pollNavControls) {
      pollNavControls.style.display = dashboardState.polls.length > 1 ? "flex" : "none";
    }

    if (currentPollIndex >= dashboardState.polls.length) {
      currentPollIndex = Math.max(0, dashboardState.polls.length - 1);
    }

    const poll = dashboardState.polls[currentPollIndex];
    const pollIndex = currentPollIndex;

    let html = `
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
  
  const prevPollBtn = document.getElementById("prevPollBtn");
  const nextPollBtn = document.getElementById("nextPollBtn");
  if(prevPollBtn) prevPollBtn.addEventListener("click", () => handlePollNav('prev'));
  if(nextPollBtn) nextPollBtn.addEventListener("click", () => handlePollNav('next'));

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
  // Init Execution
  renderOverviewCards();
  renderPollResults();
  renderCategories();
  renderMiniStats();
  renderActivityLog();

});
