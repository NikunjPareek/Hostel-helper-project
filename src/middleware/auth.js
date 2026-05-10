const User = require('../models/User');
const Student = require('../models/Student');
const Admin = require('../models/Admin');

function getAccountModel(sessionAuth) {
    if (sessionAuth.accountModel === 'Admin') return Admin;
    if (sessionAuth.accountModel === 'Student') return Student;
    if (sessionAuth.accountModel === 'User') return User;
    if (sessionAuth.role === 'admin') return Admin;
    if (sessionAuth.role === 'student') return Student;
    return User;
}

// Verify server session and attach user to request
const protect = async (req, res, next) => {
    const sessionAuth = req.session && req.session.auth;

    if (!sessionAuth || !sessionAuth.userId) {
        return res.status(401).json({ error: 'Not authorized, no active session' });
    }

    try {
        const AccountModel = getAccountModel(sessionAuth);
        req.user = await AccountModel.findById(sessionAuth.userId).select('-password');

        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (!req.user.role && sessionAuth.role) {
            req.user.role = sessionAuth.role;
        }

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired session' });
    }
};

// Admin only
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ error: 'Access denied: admin only' });
};

// Student only
const studentOnly = (req, res, next) => {
    if (req.user && req.user.role === 'student') {
        return next();
    }
    return res.status(403).json({ error: 'Access denied: student only' });
};

module.exports = { protect, adminOnly, studentOnly };
