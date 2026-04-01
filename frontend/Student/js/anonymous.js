/* =========================================
   Harbor OS - Anonymous Routing Logic
========================================= */

if (localStorage.getItem("studentLoggedIn") !== "true") {
    window.location.href = "../Login/login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    fetch("header.html").then(res => res.text()).then(data => {
        document.getElementById("header").innerHTML = data;
    });
    fetch("footer.html").then(res => res.text()).then(data => {
        document.getElementById("footer").innerHTML = data;
    });
    
    initCustomSelects();
    initFileDropzone();
    initAnonymousEngine();
});

function initCustomSelects() {
    const wrappers = document.querySelectorAll('.custom-select-wrapper');
    wrappers.forEach(wrapper => {
        const trigger = wrapper.querySelector('.custom-select-trigger');
        const selectedText = wrapper.querySelector('.selected-text');
        const options = wrapper.querySelectorAll('.custom-option');
        const hiddenInput = wrapper.nextElementSibling;
        trigger.addEventListener('click', (e) => {
            wrappers.forEach(w => { if(w !== wrapper) w.classList.remove('open') });
            wrapper.classList.toggle('open');
            e.stopPropagation();
        });
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                options.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                selectedText.textContent = option.textContent;
                selectedText.style.color = "#191c1e";
                selectedText.style.fontWeight = "600";
                hiddenInput.value = option.dataset.value;
                wrapper.classList.remove('open');
                e.stopPropagation();
            });
        });
    });
    document.addEventListener('click', () => {
        wrappers.forEach(wrapper => wrapper.classList.remove('open'));
    });
}

function initFileDropzone() {
    const dropzone = document.getElementById('fileDropzone');
    const fileInput = document.getElementById('fileInput');
    const previewList = document.getElementById('filePreviewList');
    let currentFiles = [];

    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', e => { e.preventDefault(); dropzone.classList.remove('dragover'); });
    dropzone.addEventListener('drop', e => { e.preventDefault(); dropzone.classList.remove('dragover'); handleFiles(e.dataTransfer.files); });
    fileInput.addEventListener('change', e => { handleFiles(e.target.files); fileInput.value = ""; });

    function handleFiles(files) {
        if (currentFiles.length + files.length > 3) {
            showToast('You can only upload a maximum of 3 attachments.', 'error');
            return;
        }
        Array.from(files).forEach(file => {
            if (file.size > 10 * 1024 * 1024) { showToast(`${file.name} exceeds 10MB limit.`, 'error'); return; }
            currentFiles.push(file);
        });
        renderPreviews();
    }

    function renderPreviews() {
        previewList.innerHTML = '';
        currentFiles.forEach((file, index) => {
            const tag = document.createElement('div');
            tag.className = 'file-tag';
            tag.innerHTML = `
                <span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px; vertical-align:text-bottom"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                    ${file.name}
                </span>
                <span class="remove-file" data-index="${index}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </span>
            `;
            previewList.appendChild(tag);
        });
        document.querySelectorAll('.remove-file').forEach(btn => {
            btn.addEventListener('click', (e) => { currentFiles.splice(e.currentTarget.dataset.index, 1); renderPreviews(); e.stopPropagation(); });
        });
    }
}

function initAnonymousEngine() {
    const form = document.getElementById("anonymousForm");
    const clearBtn = document.getElementById("clearBtn");

    clearBtn.addEventListener('click', () => {
        form.reset();
        document.getElementById('categoryInput').value = "";
        document.getElementById('filePreviewList').innerHTML = "";
        document.querySelectorAll('.selected-text').forEach(el => { el.textContent = "Select category"; el.style.color = "#40484c"; el.style.fontWeight = "400"; });
        document.querySelectorAll('.custom-option').forEach(el => el.classList.remove('selected'));
    });

    form.addEventListener("submit", function(e) {
        e.preventDefault();
        const category = document.getElementById("categoryInput").value;
        const description = document.getElementById("descriptionInput").value;

        if (!category) { showToast("Please select an issue category.", "error"); return; }
        if (description.trim().length < 20) { showToast("Description must be at least 20 characters.", "error"); return; }

        let complaints = JSON.parse(localStorage.getItem("anonymousState")) || [];
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const id = `ANO-${dateStr}-${String(Math.floor(Math.random()*10000)).padStart(4, '0')}`;

        const payload = {
            id: id,
            category: category,
            content: description,
            date: new Date().toLocaleDateString('en-GB'),
            status: 'Submitted'
        };

        complaints.unshift(payload);
        localStorage.setItem("anonymousState", JSON.stringify(complaints));

        showToast("Anonymous report submitted securely.", "success");
        setTimeout(() => { window.location.href = "home.html"; }, 1500);
    });
}

function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' 
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.animation = "fadeOut 0.3s forwards"; setTimeout(() => toast.remove(), 300); }, 4000);
}

function handleStudentLogout() {
    localStorage.removeItem("studentLoggedIn");
    localStorage.removeItem("loggedInAs");
    window.location.href = "../Login/login.html";
}
