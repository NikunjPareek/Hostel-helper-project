const express = require('express');
const { protect, studentOnly } = require('../middleware/auth');
const Student = require('../models/Student');
const { text } = require('../utils/validation');

const router = express.Router();

// Editable fields — students can update these only
const EDITABLE_FIELDS = ['email', 'phone', 'parentPhone', 'course', 'batch', 'address'];

// GET /api/users/me — Current user profile (all roles)
router.get('/me', protect, (req, res) => {
    const u = req.user;
    res.json({
        id: u._id,
        username: u.username,
        name: u.name,
        role: u.role,
        studentId: u.studentId || null,
        hostelType: u.hostelType || null,
        block: u.block || null,
        room: u.room || null,
        email: u.email || null,
        phone: u.phone || null,
        parentPhone: u.parentPhone || null,
        course: u.course || null,
        batch: u.batch || null,
        address: u.address || null
    });
});

// PUT /api/users/me — Student updates their editable profile fields
router.put('/me', protect, studentOnly, async (req, res) => {
    try {
        const updates = {};

        EDITABLE_FIELDS.forEach(field => {
            if (req.body[field] !== undefined) {
                const value = text(req.body[field], field === 'address' ? 500 : 120);
                updates[field] = value !== '' ? value : null;
            }
        });

        const student = await Student.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: false }
        ).select('-password');

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json({
            id: student._id,
            username: student.username,
            name: student.name,
            role: student.role,
            studentId: student.studentId || null,
            hostelType: student.hostelType || null,
            block: student.block || null,
            room: student.room || null,
            email: student.email || null,
            phone: student.phone || null,
            parentPhone: student.parentPhone || null,
            course: student.course || null,
            batch: student.batch || null,
            address: student.address || null
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
