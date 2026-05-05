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
    }
    // Intentionally no student reference — anonymous by design
}, { timestamps: true });

module.exports = mongoose.model('AnonymousFeedback', anonymousFeedbackSchema);
