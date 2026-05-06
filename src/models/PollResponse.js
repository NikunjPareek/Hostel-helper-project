const mongoose = require('mongoose');

const pollResponseSchema = new mongoose.Schema({
    pollId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Poll',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    optionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    optionIndex: {
        type: Number,
        required: true,
        min: 0
    },
    optionLabel: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true,
    collection: 'poll_responses'
});

pollResponseSchema.index({ pollId: 1, studentId: 1 }, { unique: true });
pollResponseSchema.index({ studentId: 1, createdAt: -1 });

module.exports = mongoose.model('PollResponse', pollResponseSchema);
