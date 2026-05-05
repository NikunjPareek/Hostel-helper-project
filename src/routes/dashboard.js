const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const Complaint = require('../models/Complaint');

const router = express.Router();

// GET /api/dashboard — Admin dashboard stats
router.get('/', protect, adminOnly, async (req, res) => {
    try {
        const [total, submitted, underReview, resolved] = await Promise.all([
            Complaint.countDocuments(),
            Complaint.countDocuments({ status: 'Submitted' }),
            Complaint.countDocuments({ status: 'Under Review' }),
            Complaint.countDocuments({ status: 'Resolved' })
        ]);

        // Category breakdown
        const categoryAgg = await Complaint.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Recent 5 complaints for activity log
        const recent = await Complaint.find()
            .sort({ updatedAt: -1 })
            .limit(5)
            .select('complaintId studentName category status remarks updatedAt');

        // Resolution rate
        const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

        res.json({
            stats: { total, submitted, underReview, resolved, resolutionRate },
            categories: categoryAgg.map(c => ({ label: c._id, count: c.count })),
            recentActivity: recent.map(c => ({
                id: c.complaintId,
                student: c.studentName,
                category: c.category,
                status: c.status,
                remarks: c.remarks,
                date: new Date(c.updatedAt).toLocaleDateString('en-GB')
            }))
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
