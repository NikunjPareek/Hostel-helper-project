const mongoose = require('mongoose');

// Auto-generate complaint ID like "CMP-20240505-0001"
function generateComplaintId() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = String(Math.floor(Math.random() * 9000) + 1000);
    return `CMP-${date}-${rand}`;
}

const complaintSchema = new mongoose.Schema({
    complaintId: {
        type: String,
        default: generateComplaintId,
        unique: true
    },
    // Student who submitted (null if anonymous handled separately)
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    studentName: {
        type: String,
        required: true
    },
    studentUsername: {
        type: String,
        required: true
    },
    hostel: {
        type: String,
        required: true
    },
    block: {
        type: String,
        required: true
    },
    room: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Submitted', 'Under Review', 'Resolved'],
        default: 'Submitted'
    },
    remarks: {
        type: String,
        default: ''
    },
    resolvedAt: {
        type: Date,
        default: null
    },
    media: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UploadedMedia'
    }]
}, { timestamps: true });

complaintSchema.index({ studentId: 1, createdAt: -1 });
complaintSchema.index({ status: 1, createdAt: -1 });
complaintSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
