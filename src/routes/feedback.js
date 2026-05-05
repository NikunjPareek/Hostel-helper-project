const express = require('express');
const { protect, adminOnly, studentOnly } = require('../middleware/auth');
const AnonymousFeedback = require('../models/AnonymousFeedback');

const router = express.Router();

// POST /api/feedback — Student submits anonymous feedback
router.post('/', protect, studentOnly, async (req, res) => {
    const { category, content } = req.body;

    if (!category || !content) {
        return res.status(400).json({ error: 'Category and content are required' });
    }

    if (content.trim().length < 20) {
        return res.status(400).json({ error: 'Description must be at least 20 characters' });
    }

    try {
        const feedback = await AnonymousFeedback.create({ category, content });
        res.status(201).json({ message: 'Feedback submitted anonymously', feedbackId: feedback.feedbackId });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/feedback — Admin views all anonymous feedback
router.get('/', protect, adminOnly, async (req, res) => {
    try {
        const feedback = await AnonymousFeedback.find().sort({ createdAt: -1 });
        res.json(feedback);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
