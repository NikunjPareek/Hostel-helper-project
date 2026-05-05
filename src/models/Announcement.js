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
    createdBy: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
