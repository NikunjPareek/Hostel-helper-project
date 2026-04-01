/* ===========================
   STUDENT DASHBOARD LOGIC
   Centralized State & Rendering
=========================================== */

const studentState = {
    complaintStats: {
        total: 0,
        pending: 0,
        resolved: 0
    },
    announcements: [
        { id: 1, title: 'Mess menu updated', desc: 'The mess menu has been updated in accordance to the feedback received from students.', date: '15 Jan 2025' },
        { id: 2, title: 'Water Supply Maintenance', desc: 'There will be a water supply maintenance on 15th February 2025 from 10:00 AM to 2:00 PM.', date: '11 Apr 2025' },
        { id: 3, title: 'WiFi Upgrade', desc: 'The hostel WiFi network is being upgraded to provide better connectivity. Expect intermittent outages on 20th March 2025.', date: '05 Mar 2025' },
        { id: 4, title: 'Hostel Inspection', desc: 'A routine hostel inspection will be conducted on 25th March 2025. Please ensure your rooms are tidy and adhere to hostel rules.', date: '10 Mar 2025' }
    ],
    polls: [
        { id: 1, title: 'Mess food quality', desc: 'Quality and taste of food served in mess', status: null },
        { id: 2, title: 'Water supply problem', desc: 'Irregular water supply or low pressure', status: null },
        { id: 3, title: 'Electricity issue', desc: 'Power cuts, voltage fluctuations', status: null },
        { id: 4, title: 'Room cleanliness', desc: 'Cleaning staff service and hygiene', status: null }
    ]
};

/* ===========================
   GLOBAL INIT
=========================================== */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Auth check
    if (localStorage.getItem("studentLoggedIn") !== "true") {
        window.location.href = "../Login/login.html";
        return;
    }

    // 2. Load globally isolated header/footer
    fetch("header.html")
        .then(res => res.text())
        .then(data => {
            document.getElementById("header").innerHTML = data;
        });

    fetch("footer.html")
        .then(res => res.text())
        .then(data => document.getElementById("footer").innerHTML = data);

    // 3. Compute stats from central memory
    const memory = JSON.parse(localStorage.getItem("complaints")) || [];
    studentState.complaintStats.total = memory.length;
    studentState.complaintStats.resolved = memory.filter(c => c.status === "Resolved").length;
    studentState.complaintStats.pending = studentState.complaintStats.total - studentState.complaintStats.resolved;

    // 4. Load Poll constraints
    studentState.polls.forEach(poll => {
        const memoryStatus = localStorage.getItem(`poll_${poll.id}`);
        if(memoryStatus) poll.status = memoryStatus;
    });

    // 5. Render Architecture
    renderStats();
    renderAnnouncements();
    renderPolls();
});

/* ===========================
   RENDER FUNCTIONS
=========================================== */

function renderStats() {
    const grid = document.getElementById("statsGrid");
    const s = studentState.complaintStats;

    grid.innerHTML = `
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon total">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                </div>
                Total Issues
            </div>
            <div class="stat-value">${s.total}</div>
            <div class="stat-sub">Lifetime registered</div>
        </div>
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon pending">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                Pending Action
            </div>
            <div class="stat-value">${s.pending}</div>
            <div class="stat-sub">Awaiting technical review</div>
        </div>
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon resolved">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                </div>
                Resolved
            </div>
            <div class="stat-value">${s.resolved}</div>
            <div class="stat-sub">Successfully closed cases</div>
        </div>
    `;
}

function renderAnnouncements() {
    const container = document.getElementById("announcementsList");
    container.innerHTML = studentState.announcements.map(anc => `
        <div class="announcement-card">
            <div class="anc-header">
                <span class="anc-title">${anc.title}</span>
                <span class="anc-date">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                    ${anc.date}
                </span>
            </div>
            <p class="anc-desc">${anc.desc}</p>
        </div>
    `).join('');
}

function renderPolls() {
    const container = document.getElementById("pollsContainer");
    container.innerHTML = studentState.polls.map(poll => `
        <div class="poll-item">
            <h3>${poll.title}</h3>
            <p>${poll.desc}</p>
            <div class="poll-actions">
                <button class="btn-poll ${poll.status === 'facing' ? 'active-facing' : ''}" onclick="votePoll(${poll.id}, 'facing')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Facing Issue
                </button>
                <button class="btn-poll ${poll.status === 'resolved' ? 'active-resolved' : ''}" onclick="votePoll(${poll.id}, 'resolved')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                    Resolved
                </button>
            </div>
        </div>
    `).join('');
}

window.votePoll = function(id, status) {
    const poll = studentState.polls.find(p => p.id === id);
    if(poll) {
        poll.status = status;
        localStorage.setItem(`poll_${id}`, status);
        renderPolls();
    }
};

function handleStudentLogout() {
    localStorage.removeItem("studentLoggedIn");
    localStorage.removeItem("loggedInAs");
    window.location.href = "../Login/login.html";
}
