const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const { parseCookies } = require('../utils/cookies');

function getAccountModel(decoded) {
    if (decoded.accountModel === 'Admin') return Admin;
    if (decoded.accountModel === 'Student') return Student;
    if (decoded.accountModel === 'User') return User;
    if (decoded.role === 'admin') return Admin;
    if (decoded.role === 'student') return Student;
    return User;
}

// Verify JWT and attach user to request
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    } else {
        token = parseCookies(req.headers.cookie)[env.SESSION_COOKIE_NAME];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, env.JWT_SECRET);
            const AccountModel = getAccountModel(decoded);
            req.user = await AccountModel.findById(decoded.id).select('-password');

            // Older tokens did not include the account collection. Try both role
            // collections before treating the token as invalid.
            if (!req.user && decoded.role === 'student') {
                req.user = await Student.findById(decoded.id).select('-password');
            }
            if (!req.user && decoded.role === 'admin') {
                req.user = await Admin.findById(decoded.id).select('-password');
            }
            if (!req.user) {
                req.user = await User.findById(decoded.id).select('-password');
            }

            if (!req.user) {
                return res.status(401).json({ error: 'User not found' });
            }

            if (!req.user.role && decoded.role) {
                req.user.role = decoded.role;
            }

            next();
        } catch (error) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'Not authorized, no token provided' });
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
