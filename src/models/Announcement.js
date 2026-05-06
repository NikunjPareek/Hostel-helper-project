const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        default: 'General',
        trim: true
    },
    priority: {
        type: String,
        enum: ['Low', 'Normal', 'High'],
        default: 'Normal'
    },
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
    }
}, { timestamps: true });

announcementSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
