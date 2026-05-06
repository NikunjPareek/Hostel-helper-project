/* =========================================
   Harbor OS - Complaint History Render Logic
========================================= */

const currentUser = authGuard('student');


let activeFilter = "All";

document.addEventListener("DOMContentLoaded", () => {
    fetch("/student/header.html").then(res => res.text()).then(data => {
        document.getElementById("header").innerHTML = data;
    });
    fetch("/student/footer.html").then(res => res.text()).then(data => {
        document.getElementById("footer").innerHTML = data;
    });

    initCustomSelect();
    renderHistory();
});

function initCustomSelect() {
    const wrapper = document.getElementById('statusFilter');
    const trigger = wrapper.querySelector('.custom-select-trigger');
    const selectedText = wrapper.querySelector('.selected-text');
    const options = wrapper.querySelectorAll('.custom-option');

    trigger.addEventListener('click', (e) => {
        wrapper.classList.toggle('open');
        e.stopPropagation();
    });

    options.forEach(option => {
        option.addEventListener('click', (e) => {
            options.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedText.textContent = option.textContent;
            activeFilter = option.dataset.value;
            wrapper.classList.remove('open');
            renderHistory();
            e.stopPropagation();
        });
    });

    document.addEventListener('click', () => {
        wrapper.classList.remove('open');
    });
}

async function renderHistory() {
    const grid = document.getElementById('historyGrid');
    
    let rawComplaints = [];
    try {
        rawComplaints = await apiCall('GET', '/api/complaints/my');
    } catch (err) {
        grid.innerHTML = '<p style="color:#64748b;text-align:center;padding:32px">Could not load complaints. Please try again.</p>';
        return;
    }
    
    // Use API date field
    const filtered = activeFilter === "All" 
        ? rawComplaints 
        : rawComplaints.filter(c => c.status === activeFilter);

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                </div>
                <h2>No Tracked Issues</h2>
                <p>You haven't registered any reports matching this criteria yet. Register a new issue to monitor its resolution.</p>
                <button class="btn-primary" style="margin-top: 8px" onclick="window.location.href='/student/complaint'">Register Issue</button>
            </div>
        `;
        grid.style.display = 'block'; // Remove grid styling for empty state to center it
        return;
    }

    grid.style.display = 'grid';
    grid.innerHTML = filtered.map(complaint => {
        const statusBadgeStyle = 
            complaint.status === 'Resolved' ? 'status-resolved' : 
            complaint.status === 'Pending' ? 'status-pending' : 'status-submitted';
            
        const statusIcon = 
            complaint.status === 'Resolved' ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>` : 
            complaint.status === 'Pending' ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>` : `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>`;

        return `
            <div class="history-card">
                <div class="hc-header">
                    <div>
                        <div class="hc-id">#${complaint.complaintId}</div>
                        <div class="hc-title">${complaint.category}</div>
                    </div>
                    <span class="hc-status ${statusBadgeStyle}">
                        ${statusIcon}
                        ${complaint.status}
                    </span>
                </div>
                <div class="hc-desc">${complaint.description}</div>
                ${renderMediaLinks(complaint.media)}
                <div class="hc-footer">
                    <div class="hc-meta">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                        ${formatDate(complaint.createdAt)}
                    </div>
                    <div class="hc-meta">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>
                        ${complaint.hostel} - ${complaint.room}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderMediaLinks(media = []) {
    if (!media.length) return '';

    return `
        <div class="hc-media-list">
            ${media.map(file => `
                <a href="${file.url}" target="_blank" rel="noopener" class="hc-media-link">
                    ${file.mediaType === 'video' ? 'Video' : 'Photo'}: ${file.originalName}
                </a>
            `).join('')}
        </div>
    `;
}



