/* =========================================
   Harbor OS   Complaint Engine
   Tasks: Submit intercept Â· Modal receipt Â· PDF Â· Dependent dropdowns Â· Form reset
========================================= */


const currentUser = authGuard('student');
let selectedComplaintFiles = [];


document.addEventListener("DOMContentLoaded", () => {
    loadStudentHeader();

    fetch("/student/footer.html")
        .then(res => res.text())
        .then(data => { document.getElementById("footer").innerHTML = data; });

    initCustomSelects();     // Category select only
    initHostelDropdowns();   // Dependent: Type â†’ Block
    initFileDropzone();
    initFormEngine();
    initModalBindings();
});


const BLOCK_MAP = {
    boys: ["BH-1", "BH-2", "BH-3"],
    girls: ["GH-1", "GH-2", "GH-3"]
};

function initHostelDropdowns() {
    const typeWrapper = document.getElementById("hostelTypeSelect");
    const blockWrapper = document.getElementById("hostelBlockSelect");
    const blockOptions = document.getElementById("blockOptions");
    const typeInput = document.getElementById("hostelTypeInput");
    const blockInput = document.getElementById("hostelBlockInput");

    if (!typeWrapper || !blockWrapper) return;

    const typeTrigger = typeWrapper.querySelector(".custom-select-trigger");
    const typeText = typeWrapper.querySelector(".selected-text");
    const typeOpts = typeWrapper.querySelectorAll(".custom-option");
    const blockTrigger = blockWrapper.querySelector(".custom-select-trigger");
    const blockText = blockWrapper.querySelector(".selected-text");

    // Open/close type dropdown
    typeTrigger.addEventListener("click", (e) => {
        blockWrapper.classList.remove("open");
        typeWrapper.classList.toggle("open");
        e.stopPropagation();
    });

    // On type selection â†’ inject block options
    typeOpts.forEach(opt => {
        opt.addEventListener("click", (e) => {
            typeOpts.forEach(o => o.classList.remove("selected"));
            opt.classList.add("selected");
            typeText.textContent = opt.textContent;
            typeText.style.color = "#191c1e";
            typeText.style.fontWeight = "600";
            typeInput.value = opt.dataset.value;
            typeWrapper.classList.remove("open");

            // Reset block
            blockInput.value = "";
            blockText.textContent = "Select block";
            blockText.style.color = "";
            blockText.style.fontWeight = "";
            blockOptions.innerHTML = "";
            blockWrapper.classList.remove("open");

            // Inject new block options
            const blocks = BLOCK_MAP[opt.dataset.value] || [];
            blocks.forEach(b => {
                const div = document.createElement("div");
                div.className = "custom-option";
                div.dataset.value = b;
                div.textContent = b;
                div.addEventListener("click", (ev) => {
                    blockOptions.querySelectorAll(".custom-option").forEach(o => o.classList.remove("selected"));
                    div.classList.add("selected");
                    blockText.textContent = b;
                    blockText.style.color = "#191c1e";
                    blockText.style.fontWeight = "600";
                    blockInput.value = b;
                    blockWrapper.classList.remove("open");
                    ev.stopPropagation();
                });
                blockOptions.appendChild(div);
            });
            e.stopPropagation();
        });
    });

    // Open/close block dropdown (only if type already selected)
    blockTrigger.addEventListener("click", (e) => {
        if (!typeInput.value) {
            showToast("Please select hostel type first.", "error");
            return;
        }
        typeWrapper.classList.remove("open");
        blockWrapper.classList.toggle("open");
        e.stopPropagation();
    });

    // Global close
    document.addEventListener("click", () => {
        typeWrapper.classList.remove("open");
        blockWrapper.classList.remove("open");
    });
}


function initCustomSelects() {
    const wrappers = document.querySelectorAll(".custom-select-wrapper:not(#hostelTypeSelect):not(#hostelBlockSelect)");

    wrappers.forEach(wrapper => {
        const trigger = wrapper.querySelector(".custom-select-trigger");
        const selectedTx = wrapper.querySelector(".selected-text");
        const options = wrapper.querySelectorAll(".custom-option");
        const hiddenInput = wrapper.nextElementSibling;

        trigger.addEventListener("click", (e) => {
            wrappers.forEach(w => { if (w !== wrapper) w.classList.remove("open"); });
            wrapper.classList.toggle("open");
            e.stopPropagation();
        });

        options.forEach(option => {
            option.addEventListener("click", (e) => {
                options.forEach(op => op.classList.remove("selected"));
                option.classList.add("selected");
                selectedTx.textContent = option.textContent;
                selectedTx.style.color = "#191c1e";
                selectedTx.style.fontWeight = "600";
                hiddenInput.value = option.dataset.value;
                wrapper.classList.remove("open");
                e.stopPropagation();
            });
        });
    });

    document.addEventListener("click", () => {
        wrappers.forEach(w => w.classList.remove("open"));
    });
}


function initFileDropzone() {
    const dropzone = document.getElementById("fileDropzone");
    const fileInput = document.getElementById("fileInput");
    const previewList = document.getElementById("filePreviewList");

    dropzone.addEventListener("dragover", e => { e.preventDefault(); dropzone.classList.add("dragover"); });
    dropzone.addEventListener("dragleave", e => { e.preventDefault(); dropzone.classList.remove("dragover"); });
    dropzone.addEventListener("drop", e => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        handleFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener("change", e => {
        handleFiles(e.target.files);
        fileInput.value = "";
    });

    function handleFiles(files) {
        if (selectedComplaintFiles.length + files.length > 3) {
            showToast("You can only upload a maximum of 3 attachments.", "error");
            return;
        }
        Array.from(files).forEach(file => {
            if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
                showToast(`${file.name} must be an image or video.`, "error");
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                showToast(`${file.name} exceeds 10MB limit.`, "error");
                return;
            }
            selectedComplaintFiles.push(file);
        });
        renderPreviews();
    }

    function renderPreviews() {
        previewList.innerHTML = "";
        selectedComplaintFiles.forEach((file, index) => {
            const tag = document.createElement("div");
            tag.className = "file-tag";
            tag.innerHTML = `
                <span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px; vertical-align:text-bottom"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                    ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)
                </span>
                <span class="remove-file" data-index="${index}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </span>`;
            previewList.appendChild(tag);
        });
        document.querySelectorAll(".remove-file").forEach(btn => {
            btn.addEventListener("click", (e) => {
                selectedComplaintFiles.splice(e.currentTarget.dataset.index, 1);
                renderPreviews();
                e.stopPropagation();
            });
        });
    }
}


function initFormEngine() {
    const form = document.getElementById("complaintForm");
    const clearBtn = document.getElementById("clearBtn");

    clearBtn.addEventListener("click", () => resetForm());

    form.addEventListener("submit", async function (e) {
        e.preventDefault(); // INTERCEPT   no redirect

        const category = document.getElementById("categoryInput").value;
        const description = document.getElementById("descriptionInput").value;
        const hostelType = document.getElementById("hostelTypeInput").value;
        const hostelBlock = document.getElementById("hostelBlockInput").value;
        const roomNo = document.getElementById("roomInput").value;

        // Validation
        if (!category) { showToast("Please select an issue category.", "error"); return; }
        if (description.trim().length < 20) { showToast("Description must be at least 20 characters.", "error"); return; }
        if (!hostelType) { showToast("Please select your hostel type.", "error"); return; }
        if (!hostelBlock) { showToast("Please select your hostel block.", "error"); return; }
        if (!roomNo.trim()) { showToast("Please enter your room number.", "error"); return; }

        // Build complaint payload
        const hostelLabel = (hostelType === "boys" ? "Boy's Hostel" : "Girl's Hostel") + " / " + hostelBlock;

        // Show loading state
        const submitBtn = form.querySelector('[type="submit"]');
        if (submitBtn) { submitBtn.textContent = 'Submitting...'; submitBtn.disabled = true; }

        try {
            const attachments = await filesToAttachmentPayload(selectedComplaintFiles);
            const complaint = await apiCall('POST', '/api/complaints', {
                hostel: hostelLabel,
                block: hostelBlock,
                room: roomNo,
                category: category,
                description: description,
                attachments
            });

            if (submitBtn) { submitBtn.textContent = 'Submit Issue'; submitBtn.disabled = false; }

            // Build modal-compatible payload from API response
            const payload = {
                id: complaint.complaintId,
                type: complaint.category,
                student: complaint.studentName,
                hostel: complaint.hostel,
                room: complaint.room,
                description: complaint.description,
                date: new Date(complaint.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                time: new Date(complaint.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                status: complaint.status
            };

            // TASK 2: Open success modal
            openSuccessModal(payload);
        } catch (err) {
            if (submitBtn) { submitBtn.textContent = 'Submit Issue'; submitBtn.disabled = false; }
            showToast(err.message || 'Failed to submit complaint. Please try again.', 'error');
        }
    });
}

function filesToAttachmentPayload(files) {
    return Promise.all(files.map(file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({
            name: file.name,
            mimeType: file.type,
            size: file.size,
            dataUrl: reader.result
        });
        reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
        reader.readAsDataURL(file);
    })));
}


function openSuccessModal(payload) {
    document.getElementById("receiptId").textContent = payload.id;
    document.getElementById("receiptCategory").textContent = payload.type;
    document.getElementById("receiptDate").textContent = `${payload.date} at ${payload.time}`;
    document.getElementById("receiptHostel").textContent = payload.hostel;
    document.getElementById("receiptRoom").textContent = payload.room;
    document.getElementById("receiptDesc").textContent = payload.description;
    document.getElementById("receiptStudent").textContent = payload.student;

    const modal = document.getElementById("successModal");
    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    // Store payload reference for PDF generation
    modal._payload = payload;
}

function closeSuccessModal() {
    const modal = document.getElementById("successModal");
    modal.classList.remove("active");
    document.body.style.overflow = "";
    modal._payload = null;
}


function initModalBindings() {
    // Print Receipt â†’ PDF download
    document.getElementById("modalPrintBtn").addEventListener("click", () => {
        const modal = document.getElementById("successModal");
        if (modal._payload) generateReceiptPDF(modal._payload);
    });

    // Submit Another â†’ close modal + reset form
    document.getElementById("modalAnotherBtn").addEventListener("click", () => {
        closeSuccessModal();
        resetForm();
    });

    // View All Complaints â†’ navigate
    document.getElementById("modalViewAllBtn").addEventListener("click", () => {
        window.location.href = "/student/complaint-history";
    });

    // Close on overlay click
    document.getElementById("successModal").addEventListener("click", (e) => {
        if (e.target === e.currentTarget) closeSuccessModal();
    });
}


function resetForm() {
    const form = document.getElementById("complaintForm");
    form.reset();

    // Clear hidden inputs
    ["categoryInput", "hostelTypeInput", "hostelBlockInput"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });

    // Reset selected-text spans
    document.querySelectorAll(".selected-text").forEach(el => {
        el.textContent = el.closest("#hostelBlockSelect")
            ? "Select block"
            : el.closest("#hostelTypeSelect")
                ? "Select hostel type"
                : "Select issue category";
        el.style.color = "";
        el.style.fontWeight = "";
    });

    // Remove .selected states
    document.querySelectorAll(".custom-option").forEach(el => el.classList.remove("selected"));

    // Clear block options (reset dependent dropdown)
    const blockOptions = document.getElementById("blockOptions");
    if (blockOptions) blockOptions.innerHTML = "";

    // Clear file previews
    selectedComplaintFiles = [];
    const preview = document.getElementById("filePreviewList");
    if (preview) preview.innerHTML = "";
}


async function generateReceiptPDF(payload) {
    if (!window.jspdf) {
        showToast("PDF library not loaded. Please check your connection.", "error");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const margin = 20;
    const pageW = 210;
    const contentW = pageW - margin * 2;
    let y = margin;

    // â”€â”€ Logo
    try {
        const logoUrl = "../assets/jecrc+jmch logo.png";
        const logoData = await loadImageAsBase64(logoUrl);
        doc.addImage(logoData, "PNG", margin, y, 40, 14);
    } catch (_) { /* skip logo if unavailable */ }


    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(128, 0, 0);
    doc.text("JECRC Hostel   Complaint Receipt", pageW / 2, y + 8, { align: "center" });

    y += 22;


    doc.setDrawColor(224, 224, 224);
    doc.line(margin, y, pageW - margin, y);
    y += 8;
    const fields = [
        ["Reference ID", payload.id],
        ["Category", payload.type],
        ["Status", payload.status],
        ["Submitted On", `${payload.date} at ${payload.time}`],
        ["Hostel / Block", payload.hostel],
        ["Room Number", payload.room],
        ["Submitted By", payload.student],
    ];

    doc.setFontSize(11);
    fields.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 100, 100);
        doc.text(label + ":", margin, y);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(25, 28, 30);
        doc.text(String(value), margin + 45, y);
        y += 8;
    });

    y += 4;
    doc.setDrawColor(224, 224, 224);
    doc.line(margin, y, pageW - margin, y);
    y += 8;


    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text("Description:", margin, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(25, 28, 30);
    doc.setFontSize(10);
    const descLines = doc.splitTextToSize(payload.description, contentW);
    doc.text(descLines, margin, y);
    y += descLines.length * 6 + 8;


    doc.setDrawColor(224, 224, 224);
    doc.line(margin, y, pageW - margin, y);
    y += 6;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
        "This is an auto-generated receipt. Please retain for your records.",
        pageW / 2, y, { align: "center" }
    );

    doc.save(`${payload.id}_receipt.pdf`);
}


function loadImageAsBase64(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            canvas.getContext("2d").drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = reject;
        img.src = url;
    });
}


function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    const icon = type === "success"
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "fadeOut 0.3s forwards";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ── Auth Logout ─────────────────────────────────────────────────────────────
// Auth Logout — handled directly by shared handleLogout() in api.js
