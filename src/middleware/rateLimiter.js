/**
 * rateLimiter.js — Express rate limiting middleware.
 * Applied selectively to mutation endpoints prone to abuse.
 */
const rateLimit = require('express-rate-limit');

/**
 * Anonymous feedback — strict: 5 submissions per 15 min per IP.
 * Prevents spam flooding of anonymous feedback.
 */
const anonymousLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many anonymous submissions from this IP. Please wait 15 minutes before trying again.'
    }
});

/**
 * Complaint submission — lighter: 10 per 15 min per IP.
 * Students can submit multiple complaints legitimately.
 */
const complaintLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many complaint submissions. Please wait before submitting again.'
    }
});

/**
 * Login — prevent brute force: 10 attempts per 15 min per IP.
 */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many login attempts. Please wait 15 minutes and try again.'
    }
});

module.exports = { anonymousLimiter, complaintLimiter, loginLimiter };
