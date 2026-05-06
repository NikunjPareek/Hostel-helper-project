const mongoose = require('mongoose');

const uploadedMediaSchema = new mongoose.Schema({
    originalName: {
        type: String,
        required: true,
        trim: true
    },
    mimeType: {
        type: String,
        required: true,
        trim: true
    },
    size: {
        type: Number,
        required: true
    },
    data: {
        type: Buffer,
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'uploadedByModel',
        default: null
    },
    uploadedByModel: {
        type: String,
        enum: ['Student', 'Admin'],
        default: 'Student'
    },
    ownerType: {
        type: String,
        enum: ['Complaint', 'AnonymousFeedback'],
        required: true
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    context: {
        type: String,
        enum: ['complaint', 'anonymous_feedback'],
        required: true
    }
}, {
    timestamps: true,
    collection: 'uploaded_media'
});

uploadedMediaSchema.index({ ownerType: 1, ownerId: 1 });
uploadedMediaSchema.index({ uploadedBy: 1, createdAt: -1 });

module.exports = mongoose.model('UploadedMedia', uploadedMediaSchema);
