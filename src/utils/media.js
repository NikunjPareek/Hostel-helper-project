const UploadedMedia = require('../models/UploadedMedia');

const MAX_MEDIA_FILES = 3;
const MAX_MEDIA_SIZE = 10 * 1024 * 1024;
const ALLOWED_MEDIA_PREFIXES = ['image/', 'video/'];

function badRequest(message) {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
}

function prepareMediaPayload(files = []) {
    if (!Array.isArray(files)) {
        throw badRequest('Attachments must be an array');
    }

    if (files.length > MAX_MEDIA_FILES) {
        throw badRequest(`You can upload a maximum of ${MAX_MEDIA_FILES} attachments`);
    }

    return files.map((file, index) => {
        const originalName = String(file.name || file.originalName || `attachment-${index + 1}`).trim();
        const dataUrl = String(file.dataUrl || file.data || '');
        const mimeTypeFromPayload = String(file.mimeType || file.type || '').trim();
        const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

        if (!match) {
            throw badRequest(`${originalName} is not a valid media upload`);
        }

        const mimeType = mimeTypeFromPayload || match[1];
        if (!ALLOWED_MEDIA_PREFIXES.some(prefix => mimeType.startsWith(prefix))) {
            throw badRequest(`${originalName} must be an image or video`);
        }

        const data = Buffer.from(match[2], 'base64');
        const size = Number(file.size) || data.length;

        if (data.length === 0) {
            throw badRequest(`${originalName} is empty`);
        }

        if (size > MAX_MEDIA_SIZE || data.length > MAX_MEDIA_SIZE) {
            throw badRequest(`${originalName} exceeds the 10MB limit`);
        }

        return { originalName, mimeType, size: data.length, data };
    });
}

async function savePreparedMedia(preparedFiles, metadata) {
    if (!preparedFiles.length) return [];

    const records = preparedFiles.map(file => ({
        ...file,
        uploadedBy: metadata.uploadedBy || null,
        uploadedByModel: metadata.uploadedByModel || 'Student',
        ownerType: metadata.ownerType,
        ownerId: metadata.ownerId,
        context: metadata.context
    }));

    return UploadedMedia.insertMany(records);
}

function mediaSummary(media) {
    const id = media._id ? media._id.toString() : media.toString();
    const mimeType = media.mimeType || '';

    return {
        _id: id,
        originalName: media.originalName || 'Attachment',
        mimeType,
        mediaType: mimeType.startsWith('video/') ? 'video' : 'image',
        size: media.size || 0,
        url: `/api/media/${id}/content`,
        createdAt: media.createdAt
    };
}

function attachMediaUrls(doc) {
    const plain = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    plain.media = (plain.media || []).map(mediaSummary);
    return plain;
}

module.exports = {
    prepareMediaPayload,
    savePreparedMedia,
    mediaSummary,
    attachMediaUrls
};
