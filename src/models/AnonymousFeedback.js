const mongoose = require('mongoose');

function generateFeedbackId() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = String(Math.floor(Math.random() * 9000) + 1000);
    return `ANO-${date}-${rand}`;
}

const anonymousFeedbackSchema = new mongoose.Schema({
    feedbackId: {
        type: String,
        default: generateFeedbackId,
        unique: true
    },
    category: {
        type: String,
        required: true
    },
    content: {
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
    media: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UploadedMedia'
    }]
}, { timestamps: true });

anonymousFeedbackSchema.index({ status: 1, createdAt: -1 });
anonymousFeedbackSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('AnonymousFeedback', anonymousFeedbackSchema);
