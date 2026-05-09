const express = require('express');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { loginLimiter } = require('../middleware/rateLimiter');
const User = require('../models/User');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const { text } = require('../utils/validation');

const router = express.Router();

// Generate JWT
function generateToken(user, accountModel) {
    return jwt.sign(
        { id: user._id, role: user.role, accountModel },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
    );
}

function sessionCookieOptions() {
    return {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: 'strict',
        maxAge: env.SESSION_MAX_AGE_MS,
        path: '/'
    };
}

function serializeUser(user) {
    return {
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
    };
}

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.clearCookie(env.SESSION_COOKIE_NAME, { path: '/' });
    res.json({ message: 'Logged out' });
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
    const username = text(req.body.username, 80);
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const role = text(req.body.role, 20);

    if (!username || !password || !role) {
        return res.status(400).json({ error: 'Username, password, and role are required' });
    }
    if (!['admin', 'student'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }
    if (password.length > 256) {
        return res.status(400).json({ error: 'Password is too long' });
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

        const token = generateToken(user, accountModel);
        const expiresAt = new Date(Date.now() + env.SESSION_MAX_AGE_MS).toISOString();
        res.cookie(env.SESSION_COOKIE_NAME, token, sessionCookieOptions());

        res.json({
            expiresAt,
            user: serializeUser(user)
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
