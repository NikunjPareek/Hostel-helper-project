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
    isActive: {
        type: Boolean,
        default: true
    },
    // Store user IDs who have voted to prevent duplicate votes
    votedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

module.exports = mongoose.model('Poll', pollSchema);
