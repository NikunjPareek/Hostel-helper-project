const express = require('express');
const { protect, adminOnly, studentOnly } = require('../middleware/auth');
const Poll = require('../models/Poll');

const router = express.Router();

// GET /api/polls/active — Get the most recent active poll
router.get('/active', protect, async (req, res) => {
    try {
        const poll = await Poll.findOne({ isActive: true }).sort({ createdAt: -1 });
        if (!poll) {
            return res.json(null);
        }

        // Calculate totals & check if current user voted
        const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
        const userVoted = poll.votedBy.some(id => id.toString() === req.user._id.toString());

        res.json({
            _id: poll._id,
            question: poll.question,
            options: poll.options,
            totalVotes,
            userVoted,
            createdAt: poll.createdAt
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/polls — Admin creates a new poll (deactivates previous)
router.post('/', protect, adminOnly, async (req, res) => {
    const { question, options } = req.body;

    if (!question || !options || options.length < 2) {
        return res.status(400).json({ error: 'Question and at least 2 options are required' });
    }

    try {
        // Deactivate all existing active polls
        await Poll.updateMany({ isActive: true }, { isActive: false });

        const poll = await Poll.create({
            question,
            options: options.map(label => ({ label, votes: 0 })),
            createdBy: req.user.name,
            isActive: true
        });

        res.status(201).json(poll);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/polls/:id/vote — Student votes on a poll
router.post('/:id/vote', protect, studentOnly, async (req, res) => {
    const { optionIndex } = req.body;

    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ error: 'Poll not found' });
        if (!poll.isActive) return res.status(400).json({ error: 'Poll is no longer active' });

        // Check if already voted
        if (poll.votedBy.some(id => id.toString() === req.user._id.toString())) {
            return res.status(400).json({ error: 'You have already voted on this poll' });
        }

        if (optionIndex === undefined || optionIndex < 0 || optionIndex >= poll.options.length) {
            return res.status(400).json({ error: 'Invalid option' });
        }

        poll.options[optionIndex].votes += 1;
        poll.votedBy.push(req.user._id);
        await poll.save();

        const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
        res.json({ message: 'Vote recorded', options: poll.options, totalVotes });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
