const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const Complaint = require('../models/Complaint');

const router = express.Router();

// GET /api/dashboard — Admin dashboard stats
router.get('/', protect, adminOnly, async (req, res) => {
    try {
        const timeframe = parseInt(req.query.timeframe) || 7;
        const now = new Date();
        const currentPeriodStart = new Date(now.getTime() - timeframe * 24 * 60 * 60 * 1000);
        const previousPeriodStart = new Date(currentPeriodStart.getTime() - timeframe * 24 * 60 * 60 * 1000);

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

        // --- NEW: Overview Summary calculation ---
        const allRelevantComplaints = await Complaint.find({ createdAt: { $gte: previousPeriodStart } });
        
        // Helper to bucket data by day
        const processMetric = (filterFn) => {
            let currentCount = 0;
            let previousCount = 0;
            let trendPoints = new Array(timeframe).fill(0);

            allRelevantComplaints.forEach(c => {
                if (!filterFn(c)) return;
                
                const createdTime = new Date(c.createdAt || c.updatedAt).getTime();
                if (createdTime >= currentPeriodStart.getTime()) {
                    currentCount++;
                    // Calculate which day in the trend point array (0 is oldest, timeframe-1 is newest)
                    const dayIndex = Math.floor((createdTime - currentPeriodStart.getTime()) / (24 * 60 * 60 * 1000));
                    if (dayIndex >= 0 && dayIndex < timeframe) {
                        trendPoints[dayIndex]++;
                    }
                } else if (createdTime >= previousPeriodStart.getTime() && createdTime < currentPeriodStart.getTime()) {
                    previousCount++;
                }
            });

            let changePercentage = 0;
            if (previousCount === 0) {
                changePercentage = currentCount > 0 ? 100 : 0;
            } else {
                changePercentage = Math.round(((currentCount - previousCount) / previousCount) * 100);
            }

            return {
                current: currentCount,
                change_percentage: changePercentage,
                trend_points: trendPoints
            };
        };

        const summary = {
            total_complaints: processMetric(c => true),
            pending: processMetric(c => c.status === 'Submitted'),
            under_review: processMetric(c => c.status === 'Under Review'),
            resolved: processMetric(c => c.status === 'Resolved')
        };

        res.json({
            stats: { total, submitted, underReview, resolved, resolutionRate }, // Retained for backward compatibility
            summary,
            last_updated: new Date().toISOString(),
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
