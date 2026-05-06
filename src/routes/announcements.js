const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const Announcement = require('../models/Announcement');

const router = express.Router();

// GET /api/announcements — All authenticated users can view
router.get('/', protect, async (req, res) => {
    try {
        const announcements = await Announcement.find({ isActive: true }).sort({ createdAt: -1 });
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/announcements — Admin creates announcement
router.post('/', protect, adminOnly, async (req, res) => {
    const { title, description, category = 'General', priority = 'Normal' } = req.body;

    if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
    }

    try {
        const announcement = await Announcement.create({
            title: title.trim(),
            description: description.trim(),
            category: category || 'General',
            priority: priority || 'Normal',
            createdBy: req.user.name,
            createdByAdmin: req.user._id
        });
        res.status(201).json(announcement);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/announcements/:id — Admin deletes announcement
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
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
