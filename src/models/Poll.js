const mongoose = require('mongoose');

const pollOptionSchema = new mongoose.Schema({
    label: { type: String, required: true },
    votes: { type: Number, default: 0 }
});

const pollSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true
    },
    options: [pollOptionSchema],
    createdBy: {
        type: String,
        required: true
    },
    createdByAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date,
        default: null
    },
    // Store user IDs who have voted to prevent duplicate votes
    votedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }]
}, { timestamps: true });

pollSchema.index({ isActive: 1, createdAt: -1 });
pollSchema.index({ createdByAdmin: 1, createdAt: -1 });

module.exports = mongoose.model('Poll', pollSchema);
