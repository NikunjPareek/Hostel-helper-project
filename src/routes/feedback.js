const express = require('express');
const { protect, adminOnly, studentOnly } = require('../middleware/auth');
const { anonymousLimiter } = require('../middleware/rateLimiter');
const AnonymousFeedback = require('../models/AnonymousFeedback');
const {
    prepareMediaPayload,
    savePreparedMedia,
    attachMediaUrls
} = require('../utils/media');

const router = express.Router();

const mediaPopulate = {
    path: 'media',
    select: 'originalName mimeType size ownerType ownerId context createdAt'
};

function sendRouteError(res, error, label) {
    console.error(label, error);
    res.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'Server error' });
}

// POST /api/feedback - Student submits anonymous feedback
router.post('/', protect, studentOnly, anonymousLimiter, async (req, res) => {
    const { category, content, attachments = [] } = req.body;

    if (!category || !content) {
        return res.status(400).json({ error: 'Category and content are required' });
    }

    if (content.trim().length < 20) {
        return res.status(400).json({ error: 'Description must be at least 20 characters' });
    }

    try {
        const preparedMedia = prepareMediaPayload(attachments);
        const feedback = await AnonymousFeedback.create({ category, content });

        if (preparedMedia.length) {
            const mediaRecords = await savePreparedMedia(preparedMedia, {
                uploadedBy: null,
                uploadedByModel: 'Student',
                ownerType: 'AnonymousFeedback',
                ownerId: feedback._id,
                context: 'anonymous_feedback'
            });

            feedback.media = mediaRecords.map(media => media._id);
            await feedback.save();
        }

        await feedback.populate(mediaPopulate);
        res.status(201).json({
            message: 'Feedback submitted anonymously',
            feedbackId: feedback.feedbackId,
            feedback: attachMediaUrls(feedback)
        });
    } catch (error) {
        sendRouteError(res, error, 'Submit feedback error:');
    }
});

// GET /api/feedback - Admin views all anonymous feedback
router.get('/', protect, adminOnly, async (req, res) => {
    try {
        const feedback = await AnonymousFeedback.find()
            .populate(mediaPopulate)
            .sort({ createdAt: -1 });
        res.json(feedback.map(attachMediaUrls));
    } catch (error) {
        sendRouteError(res, error, 'Admin feedback error:');
    }
});

// PUT /api/feedback/:id - Admin updates status and remarks
router.put('/:id', protect, adminOnly, async (req, res) => {
    const { status, remarks } = req.body;

    try {
        const feedback = await AnonymousFeedback.findById(req.params.id);
        if (!feedback) {
            return res.status(404).json({ error: 'Feedback not found' });
        }

        if (status) feedback.status = status;
        if (remarks !== undefined) feedback.remarks = remarks;

        await feedback.save();
        await feedback.populate(mediaPopulate);
        res.json(attachMediaUrls(feedback));
    } catch (error) {
        sendRouteError(res, error, 'Update feedback error:');
    }
});

module.exports = router;
