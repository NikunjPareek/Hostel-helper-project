/* ===========================
   STUDENT DASHBOARD   API Edition
=========================================== */

// Auth guard   must be student
let currentUser = null;

document.addEventListener("DOMContentLoaded", async () => {
    currentUser = await authGuard('student');
    if (!currentUser) return;

    // Load header/footer
    loadStudentHeader();
    fetch("/student/footer.html").then(r => r.text()).then(d => document.getElementById("footer").innerHTML = d);

    // Set user name in header if element exists
    setTimeout(() => {
        const nameEl = document.querySelector('.student-name, .user-name, #studentName');
        if (nameEl && currentUser) nameEl.textContent = currentUser.name;
    }, 500);

    // Load data in parallel
    await Promise.all([
        loadStats(),
        loadAnnouncements(),
        loadPoll()
    ]);
});

async function loadStats() {
    try {
        const complaints = await apiCall('GET', '/api/complaints/my');
        const total = complaints.length;
        const resolved = complaints.filter(c => c.status === 'Resolved').length;
        const pending = total - resolved;

        renderStats({ total, pending, resolved });
    } catch (err) {
        renderStats({ total: 0, pending: 0, resolved: 0 });
    }
}

function renderStats(s) {
    const grid = document.getElementById("statsGrid");
    if (!grid) return;

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


async function loadAnnouncements() {
    try {
        const announcements = await apiCall('GET', '/api/announcements');
        renderAnnouncements(announcements);
    } catch (err) {
        renderAnnouncements([]);
    }
}

function renderAnnouncements(list) {
    const container = document.getElementById("announcementsList");
    if (!container) return;

    if (list.length === 0) {
        container.innerHTML = '<p style="color:#64748b;padding:16px;">No announcements yet.</p>';
        return;
    }

    container.innerHTML = list.map((anc, index) => `
        <div class="announcement-card" data-announcement-index="${index}">
            <div class="anc-header">
                <span class="anc-title">${anc.title}</span>
                <span class="anc-date">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                    ${formatDate(anc.createdAt)}
                </span>
            </div>
            <p class="anc-desc">${anc.description}</p>
            <button type="button" class="anc-read-more" hidden>Read More</button>
        </div>
    `).join('');

    bindAnnouncementPreviews(container, list);
}

function bindAnnouncementPreviews(container, announcements) {
    const applyPreviewState = () => {
        container.querySelectorAll('.announcement-card').forEach(card => {
            const description = card.querySelector('.anc-desc');
            const readMore = card.querySelector('.anc-read-more');
            const index = Number(card.getAttribute('data-announcement-index'));
            const announcement = announcements[index];
            if (!description || !readMore || !announcement || card.classList.contains('is-expandable')) return;

            const styles = window.getComputedStyle(description);
            const lineHeight = parseFloat(styles.lineHeight) || (parseFloat(styles.fontSize) * 1.6);
            const isClipped = description.scrollHeight > (lineHeight * 2) + 1;
            if (!isClipped) return;

            card.classList.add('is-expandable');
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', `Read full announcement: ${announcement.title || 'Announcement'}`);
            readMore.hidden = false;

            const open = () => openAnnouncementModal(announcement);
            card.addEventListener('click', open);
            card.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    open();
                }
            });
        });
    };

    requestAnimationFrame(applyPreviewState);
    setTimeout(applyPreviewState, 150);
}

function ensureAnnouncementModal() {
    let modal = document.getElementById('studentAnnouncementModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'studentAnnouncementModal';
    modal.className = 'announcement-modal-overlay';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
        <div class="announcement-modal" role="dialog" aria-modal="true" aria-labelledby="announcementModalTitle">
            <button type="button" class="announcement-modal-close" aria-label="Close announcement">&times;</button>
            <div class="announcement-modal-date" id="announcementModalDate"></div>
            <h3 class="announcement-modal-title" id="announcementModalTitle"></h3>
            <p class="announcement-modal-text" id="announcementModalText"></p>
        </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', event => {
        if (event.target === modal || event.target.closest('.announcement-modal-close')) {
            closeAnnouncementModal();
        }
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && modal.classList.contains('active')) {
            closeAnnouncementModal();
        }
    });

    return modal;
}

function openAnnouncementModal(announcement) {
    const modal = ensureAnnouncementModal();
    modal.querySelector('#announcementModalTitle').textContent = announcement.title || 'Announcement';
    modal.querySelector('#announcementModalDate').textContent = formatDate(announcement.createdAt);
    modal.querySelector('#announcementModalText').textContent = announcement.description || '';
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.announcement-modal-close').focus();
}

function closeAnnouncementModal() {
    const modal = document.getElementById('studentAnnouncementModal');
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}


async function loadPoll() {
    try {
        const polls = await apiCall('GET', '/api/polls/active');
        renderPolls(Array.isArray(polls) ? polls : (polls ? [polls] : []));
    } catch (err) {
        renderPolls([]);
    }
}

function renderPolls(polls) {
    const container = document.getElementById("pollsContainer");
    if (!container) return;

    if (!polls.length) {
        container.innerHTML = '<p style="color:#64748b;padding:16px;">No active polls at the moment.</p>';
        return;
    }

    container.innerHTML = polls.map(poll => `
        <div class="poll-item">
            <h3>${escapeHTML(poll.question)}</h3>
            <p style="font-size:13px;color:#64748b;margin-bottom:12px;">${poll.totalVotes} total votes</p>
            <div class="poll-actions" id="pollActions">
                ${poll.options.map((opt, i) => `
                    <button class="btn-poll ${poll.userVoted ? 'voted-disabled' : ''}" 
                            onclick="votePoll('${poll._id}', ${i})"
                            ${poll.userVoted ? 'disabled' : ''}>
                        ${escapeHTML(opt.label)}
                        ${poll.userVoted ? `<span style="font-size:11px;margin-left:4px;">(${opt.votes})</span>` : ''}
                    </button>
                `).join('')}
            </div>
            ${poll.userVoted ? '<p style="font-size:12px;color:#10b981;margin-top:8px;">You have already voted</p>' : ''}
        </div>
    `).join('');
}

window.votePoll = async function (pollId, optionIndex) {
    if (!pollId) return;

    try {
        await apiCall('POST', `/api/polls/${pollId}/vote`, { optionIndex });
        showToast('Vote recorded!', 'success');

        // Refresh polls so counts and voted states are current.
        await loadPoll();
    } catch (err) {
        showToast(err.message || 'Could not cast vote', 'error');
    }
};

function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
}

function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = "fadeOut 0.3s forwards";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
