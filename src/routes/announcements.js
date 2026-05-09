const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const Announcement = require('../models/Announcement');
const { isObjectId, requiredText, text } = require('../utils/validation');

const router = express.Router();

// GET /api/announcements — All authenticated users can view
router.get('/', protect, async (req, res) => {
    try {
        const announcements = await Announcement.find({ isActive: true }).sort({ createdAt: -1 });
        res.json(announcements);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'Server error' });
    }
});

// POST /api/announcements — Admin creates announcement
router.post('/', protect, adminOnly, async (req, res) => {
    try {
        const title = requiredText(req.body.title, 'Title', 140);
        const description = requiredText(req.body.description, 'Description', 3000);
        const category = text(req.body.category, 80) || 'General';
        const priority = text(req.body.priority, 40) || 'Normal';

        const announcement = await Announcement.create({
            title,
            description,
            category,
            priority,
            createdBy: req.user.name,
            createdByAdmin: req.user._id
        });
        res.status(201).json(announcement);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'Server error' });
    }
});

// DELETE /api/announcements/:id — Admin deletes announcement
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        if (!isObjectId(req.params.id)) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        const announcement = await Announcement.findByIdAndDelete(req.params.id);
        if (!announcement) {
            return res.status(404).json({ error: 'Announcement not found' });
        }
        res.json({ message: 'Announcement deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
