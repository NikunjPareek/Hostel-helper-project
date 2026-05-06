const express = require('express');
const UploadedMedia = require('../models/UploadedMedia');

const router = express.Router();

// GET /api/media/:id/content - streams stored image/video content.
router.get('/:id/content', async (req, res) => {
    try {
        const media = await UploadedMedia.findById(req.params.id).select('data mimeType originalName size');
        if (!media) {
            return res.status(404).json({ error: 'Media not found' });
        }

        res.setHeader('Content-Type', media.mimeType);
        res.setHeader('Content-Length', media.size);
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(media.originalName)}"`);
        res.send(media.data);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
