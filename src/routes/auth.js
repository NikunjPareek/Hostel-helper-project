const express = require('express');
const jwt = require('jsonwebtoken');
const { loginLimiter } = require('../middleware/rateLimiter');
const User = require('../models/User');
const Student = require('../models/Student');
const Admin = require('../models/Admin');

const router = express.Router();

// Generate JWT
function generateToken(user, accountModel) {
    return jwt.sign(
        { id: user._id, role: user.role, accountModel },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ error: 'Username, password, and role are required' });
    }

    try {
        const AccountModel = role === 'admin' ? Admin : role === 'student' ? Student : null;
        if (!AccountModel) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        let accountModel = role === 'admin' ? 'Admin' : 'Student';
        let user = await AccountModel.findOne({ username });

        // Backward-compatible fallback for older databases seeded into users.
        if (!user) {
            user = await User.findOne({ username, role });
            accountModel = 'User';
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({
            token: generateToken(user, accountModel),
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                role: user.role,
                studentId: user.studentId || null,
                hostelType: user.hostelType || null,
                block: user.block || null,
                room: user.room || null,
                email: user.email || null,
                phone: user.phone || null,
                parentPhone: user.parentPhone || null,
                course: user.course || null,
                batch: user.batch || null,
                address: user.address || null
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
