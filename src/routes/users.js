const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/me — Current user profile
router.get('/me', protect, (req, res) => {
    res.json({
        id: req.user._id,
        username: req.user.username,
        name: req.user.name,
        role: req.user.role,
        studentId: req.user.studentId,
        hostelType: req.user.hostelType,
        block: req.user.block,
        room: req.user.room,
        email: req.user.email,
        phone: req.user.phone
    });
});

module.exports = router;
