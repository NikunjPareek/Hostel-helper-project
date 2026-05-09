const express = require('express');
const UploadedMedia = require('../models/UploadedMedia');
const Complaint = require('../models/Complaint');
const { protect } = require('../middleware/auth');
const { isObjectId } = require('../utils/validation');

const router = express.Router();

async function canAccessMedia(media, user) {
    if (user.role === 'admin') return true;

    if (media.uploadedBy && media.uploadedBy.toString() === user._id.toString()) {
        return true;
    }

    if (media.ownerType === 'Complaint') {
        return Boolean(await Complaint.exists({ _id: media.ownerId, studentId: user._id }));
    }

    return false;
}

// GET /api/media/:id/content - streams stored image/video content.
router.get('/:id/content', protect, async (req, res) => {
    try {
        if (!isObjectId(req.params.id)) {
            return res.status(404).json({ error: 'Media not found' });
        }

        const media = await UploadedMedia.findById(req.params.id).select('data mimeType originalName size uploadedBy ownerType ownerId');
        if (!media) {
            return res.status(404).json({ error: 'Media not found' });
        }

        if (!await canAccessMedia(media, req.user)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.setHeader('Content-Type', media.mimeType);
        res.setHeader('Content-Length', media.size);
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(media.originalName)}"`);
        res.setHeader('Cache-Control', 'private, max-age=300');
        res.send(media.data);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
