const express = require('express');
const mongoose = require('mongoose');
const { protect, adminOnly, studentOnly } = require('../middleware/auth');
const Poll = require('../models/Poll');
const PollResponse = require('../models/PollResponse');

const router = express.Router();

function pollTotalVotes(poll) {
    return poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
}

function serializePoll(poll, responseByPollId = new Map()) {
    const id = poll._id.toString();
    const response = responseByPollId.get(id);

    return {
        _id: poll._id,
        question: poll.question,
        options: poll.options,
        totalVotes: pollTotalVotes(poll),
        userVoted: Boolean(response),
        userVote: response ? {
            optionId: response.optionId,
            optionIndex: response.optionIndex,
            optionLabel: response.optionLabel
        } : null,
        isActive: poll.isActive,
        createdBy: poll.createdBy,
        createdAt: poll.createdAt,
        expiresAt: poll.expiresAt
    };
}

async function getResponseMapForUser(polls, user) {
    if (!user || user.role !== 'student' || polls.length === 0) {
        return new Map();
    }

    const pollIds = polls.map(poll => poll._id);
    const responses = await PollResponse.find({
        pollId: { $in: pollIds },
        studentId: user._id
    });

    const responseMap = new Map(responses.map(response => [response.pollId.toString(), response]));

    // Preserve voted state for polls created before poll_responses existed.
    polls.forEach(poll => {
        const pollId = poll._id.toString();
        if (!responseMap.has(pollId) && poll.votedBy.some(id => id.toString() === user._id.toString())) {
            responseMap.set(pollId, {
                optionId: null,
                optionIndex: null,
                optionLabel: 'Recorded'
            });
        }
    });

    return responseMap;
}

// GET /api/polls/active - Get all active/current polls
router.get('/active', protect, async (req, res) => {
    try {
        const now = new Date();
        const polls = await Poll.find({
            isActive: true,
            $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
        }).sort({ createdAt: -1 });

        const responseMap = await getResponseMapForUser(polls, req.user);
        res.json(polls.map(poll => serializePoll(poll, responseMap)));
    } catch (error) {
        console.error('Active polls error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/polls - Admin can view all polls
router.get('/', protect, adminOnly, async (req, res) => {
    try {
        const polls = await Poll.find().sort({ createdAt: -1 });
        res.json(polls.map(poll => serializePoll(poll)));
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/polls - Admin creates a new active poll without disabling older polls
router.post('/', protect, adminOnly, async (req, res) => {
    const { question, options, expiresAt = null } = req.body;
    const cleanOptions = Array.isArray(options)
        ? options.map(option => String(option).trim()).filter(Boolean)
        : [];

    if (!question || cleanOptions.length < 2) {
        return res.status(400).json({ error: 'Question and at least 2 options are required' });
    }

    try {
        const poll = await Poll.create({
            question: question.trim(),
            options: cleanOptions.map(label => ({ label, votes: 0 })),
            createdBy: req.user.name,
            createdByAdmin: req.user._id,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            isActive: true
        });

        res.status(201).json(serializePoll(poll));
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/polls/:id - Admin updates active state
router.put('/:id', protect, adminOnly, async (req, res) => {
    const { isActive, expiresAt } = req.body;

    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ error: 'Poll not found' });

        if (typeof isActive === 'boolean') poll.isActive = isActive;
        if (expiresAt !== undefined) poll.expiresAt = expiresAt ? new Date(expiresAt) : null;

        await poll.save();
        res.json(serializePoll(poll));
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/polls/:id/vote - Student votes on a poll
router.post('/:id/vote', protect, studentOnly, async (req, res) => {
    const optionIndex = Number(req.body.optionIndex);

    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ error: 'Poll not found' });
        if (!poll.isActive) return res.status(400).json({ error: 'Poll is no longer active' });
        if (poll.expiresAt && poll.expiresAt <= new Date()) {
            return res.status(400).json({ error: 'Poll is no longer active' });
        }

        if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= poll.options.length) {
            return res.status(400).json({ error: 'Invalid option' });
        }

        const alreadyVoted = await PollResponse.exists({
            pollId: poll._id,
            studentId: req.user._id
        });

        if (alreadyVoted || poll.votedBy.some(id => id.toString() === req.user._id.toString())) {
            return res.status(400).json({ error: 'You have already voted on this poll' });
        }

        const selectedOption = poll.options[optionIndex];
        const response = await PollResponse.create({
            pollId: poll._id,
            studentId: req.user._id,
            optionId: selectedOption._id || new mongoose.Types.ObjectId(),
            optionIndex,
            optionLabel: selectedOption.label
        });

        poll.options[optionIndex].votes += 1;
        poll.votedBy.push(req.user._id);
        await poll.save();

        const responseMap = new Map([[poll._id.toString(), response]]);
        res.json({ message: 'Vote recorded', poll: serializePoll(poll, responseMap) });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'You have already voted on this poll' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
