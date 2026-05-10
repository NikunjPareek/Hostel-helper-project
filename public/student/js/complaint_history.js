/* =========================================================
   complaint_history.js — Enhanced My Complaints Page
   - Status summary cards (Total / Pending / Under Review / Resolved)
   - Per-complaint card with timeline progress, media previews,
     resolvedAt timestamp, and admin remarks
   - Client-side filter by status + text search
========================================================= */

let currentUser = null;

// ─── State ─────────────────────────────────────────────────────
let allComplaints = [];
let activeFilter  = 'All';
let searchQuery   = '';

// ─── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    currentUser = await authGuard('student');
    if (!currentUser) return;

    // Load header / footer fragments
    loadStudentHeader();
    fetch('/student/footer.html').then(r => r.text()).then(html => {
        document.getElementById('footer').innerHTML = html;
    });

    initFilters();
    await loadComplaints();
});

// ─── Data load ─────────────────────────────────────────────────
async function loadComplaints() {
    showSkeleton();
    try {
        allComplaints = await apiCall('GET', '/api/complaints/my') || [];
        renderSummaryCards();
        renderList();
    } catch (err) {
        document.getElementById('historyGrid').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠</div>
                <h2>Could not load complaints</h2>
                <p>${err.message || 'Please refresh the page and try again.'}</p>
            </div>`;
    }
}

// ─── Summary cards ─────────────────────────────────────────────
function renderSummaryCards() {
    const counts = {
        total: allComplaints.length,
        submitted: allComplaints.filter(c => c.status === 'Submitted').length,
        underReview: allComplaints.filter(c => c.status === 'Under Review').length,
        resolved: allComplaints.filter(c => c.status === 'Resolved').length
    };

    const container = document.getElementById('summaryCards');
    if (!container) return;

    container.innerHTML = `
        <div class="summary-card summary-total"    onclick="setFilter('All')">
            <div class="sc-count">${counts.total}</div>
            <div class="sc-label">Total</div>
        </div>
        <div class="summary-card summary-submitted" onclick="setFilter('Submitted')">
            <div class="sc-count">${counts.submitted}</div>
            <div class="sc-label">Submitted</div>
        </div>
        <div class="summary-card summary-review"   onclick="setFilter('Under Review')">
            <div class="sc-count">${counts.underReview}</div>
            <div class="sc-label">Under Review</div>
        </div>
        <div class="summary-card summary-resolved" onclick="setFilter('Resolved')">
            <div class="sc-count">${counts.resolved}</div>
            <div class="sc-label">Resolved</div>
        </div>
    `;
}

// ─── Filters ───────────────────────────────────────────────────
function initFilters() {
    // Status pills
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });

    // Search input
    const searchInput = document.getElementById('complaintSearch');
    if (searchInput) {
        searchInput.addEventListener('input', e => {
            searchQuery = e.target.value.trim().toLowerCase();
            renderList();
        });
    }
}

function setFilter(status) {
    activeFilter = status;
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === status);
    });
    renderList();
}

// ─── List render ───────────────────────────────────────────────
function renderList() {
    const grid = document.getElementById('historyGrid');

    let filtered = allComplaints;

    if (activeFilter !== 'All') {
        filtered = filtered.filter(c => c.status === activeFilter);
    }

    if (searchQuery) {
        filtered = filtered.filter(c =>
            (c.complaintId || '').toLowerCase().includes(searchQuery) ||
            (c.category   || '').toLowerCase().includes(searchQuery) ||
            (c.description|| '').toLowerCase().includes(searchQuery)
        );
    }

    if (!filtered.length) {
        grid.style.display = 'block';
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                </div>
                <h2>No complaints found</h2>
                <p>${activeFilter !== 'All'
                    ? `No <strong>${activeFilter}</strong> complaints.`
                    : "You haven't registered any complaints yet."}</p>
                <button class="btn-primary" onclick="window.location.href='/student/complaint'">
                    Register a Complaint
                </button>
            </div>`;
        return;
    }

    grid.style.display = 'grid';
    grid.innerHTML = filtered.map(buildCard).join('');
}

// ─── Card builder ───────────────────────────────────────────────
function buildCard(c) {
    const statusClass = {
        'Submitted':   'status-submitted',
        'Under Review':'status-review',
        'Resolved':    'status-resolved'
    }[c.status] || 'status-submitted';

    const timelineSteps = ['Submitted', 'Under Review', 'Resolved'];
    const stepIndex     = timelineSteps.indexOf(c.status);

    const timeline = timelineSteps.map((step, i) => {
        const done    = i <= stepIndex;
        const current = i === stepIndex;
        return `
            <div class="tl-step ${done ? 'tl-done' : ''} ${current ? 'tl-current' : ''}">
                <div class="tl-dot"></div>
                <span class="tl-label">${step}</span>
            </div>
            ${i < timelineSteps.length - 1 ? '<div class="tl-line ' + (i < stepIndex ? 'tl-line-done' : '') + '"></div>' : ''}
        `;
    }).join('');

    const remarks = c.remarks
        ? `<div class="hc-remarks">
               <div class="hc-remarks-label">Admin Remarks</div>
               <div class="hc-remarks-text">${escapeHtml(c.remarks)}</div>
           </div>`
        : '';

    const resolvedLine = c.resolvedAt
        ? `<div class="hc-meta hc-resolved">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2">
                   <polyline points="20 6 9 17 4 12"/>
               </svg>
               Resolved ${formatDateTime(c.resolvedAt)}
           </div>`
        : '';

    return `
        <div class="history-card" id="complaint-${c._id}">
            <div class="hc-header">
                <div>
                    <div class="hc-id">#${c.complaintId}</div>
                    <div class="hc-title">${escapeHtml(c.category)}</div>
                </div>
                <span class="hc-status ${statusClass}">${c.status}</span>
            </div>

            <div class="hc-timeline">${timeline}</div>

            <div class="hc-desc">${escapeHtml(c.description)}</div>

            ${buildMediaPreview(c.media)}

            ${remarks}

            <div class="hc-footer">
                <div class="hc-meta">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" stroke-width="2">
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                        <line x1="16" x2="16" y1="2" y2="6"/>
                        <line x1="8"  x2="8"  y1="2" y2="6"/>
                        <line x1="3"  x2="21" y1="10" y2="10"/>
                    </svg>
                    Submitted ${formatDateTime(c.createdAt)}
                </div>
                ${resolvedLine}
                <div class="hc-meta">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/>
                        <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/>
                        <path d="M12 3v6"/>
                    </svg>
                    ${escapeHtml(c.hostel || '')} — Room ${escapeHtml(c.room || '')}
                </div>
            </div>
        </div>
    `;
}

// ─── Media preview ──────────────────────────────────────────────
function buildMediaPreview(media = []) {
    if (!media || !media.length) return '';

    const items = media.map(file => {
        if (file.mediaType === 'video') {
            return `
                <div class="media-thumb media-thumb-video">
                    <video controls preload="none" style="max-width:100%;border-radius:8px">
                        <source src="${file.url}" type="${file.mimeType}">
                    </video>
                    <div class="media-name">${escapeHtml(file.originalName)}</div>
                </div>`;
        }
        return `
            <div class="media-thumb">
                <img src="${file.url}"
                     alt="${escapeHtml(file.originalName)}"
                     loading="lazy"
                     onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                <div class="media-error" style="display:none">⚠ Image unavailable</div>
                <div class="media-name">${escapeHtml(file.originalName)}</div>
            </div>`;
    }).join('');

    return `<div class="hc-media-grid">${items}</div>`;
}

// ─── Skeleton loader ────────────────────────────────────────────
function showSkeleton() {
    const grid = document.getElementById('historyGrid');
    grid.style.display = 'grid';
    grid.innerHTML = Array.from({ length: 3 }).map(() => `
        <div class="skeleton-card">
            <div class="skeleton-line skeleton-title"></div>
            <div class="skeleton-line skeleton-body"></div>
            <div class="skeleton-line skeleton-body short"></div>
        </div>`).join('');
}

// ─── Utilities ──────────────────────────────────────────────────
function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}
