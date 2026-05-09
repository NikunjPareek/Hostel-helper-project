const mongoose = require('mongoose');

function text(value, maxLength = 500) {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, maxLength);
}

function requiredText(value, label, maxLength = 500) {
    const cleaned = text(value, maxLength);
    if (!cleaned) {
        const error = new Error(`${label} is required`);
        error.statusCode = 400;
        throw error;
    }
    return cleaned;
}

function escapeRegex(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isObjectId(value) {
    return mongoose.Types.ObjectId.isValid(value);
}

function badRequest(message) {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
}

module.exports = {
    badRequest,
    escapeRegex,
    isObjectId,
    requiredText,
    text
};
