const express = require('express');
const { protect, adminOnly, studentOnly } = require('../middleware/auth');
const { complaintLimiter } = require('../middleware/rateLimiter');
const Complaint = require('../models/Complaint');
const {
    prepareMediaPayload,
    savePreparedMedia,
    attachMediaUrls
} = require('../utils/media');

const router = express.Router();

const mediaPopulate = {
    path: 'media',
    select: 'originalName mimeType size ownerType ownerId context createdAt'
};

function sendRouteError(res, error, label) {
    console.error(label, error);
    res.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'Server error' });
}

// POST /api/complaints - Student submits a new complaint
router.post('/', protect, studentOnly, complaintLimiter, async (req, res) => {
    const { hostel, block, room, category, description, attachments = [] } = req.body;

    if (!hostel || !block || !room || !category || !description) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const preparedMedia = prepareMediaPayload(attachments);

        const complaint = await Complaint.create({
            studentId: req.user._id,
            studentName: req.user.name,
            studentUsername: req.user.username,
            hostel,
            block,
            room,
            category,
            description
        });

        if (preparedMedia.length) {
            const mediaRecords = await savePreparedMedia(preparedMedia, {
                uploadedBy: req.user._id,
                uploadedByModel: 'Student',
                ownerType: 'Complaint',
                ownerId: complaint._id,
                context: 'complaint'
            });

            complaint.media = mediaRecords.map(media => media._id);
            await complaint.save();
        }

        await complaint.populate(mediaPopulate);
        res.status(201).json(attachMediaUrls(complaint));
    } catch (error) {
        sendRouteError(res, error, 'Submit complaint error:');
    }
});

// GET /api/complaints/my - Student views their own complaints
router.get('/my', protect, studentOnly, async (req, res) => {
    try {
        const complaints = await Complaint.find({ studentId: req.user._id })
            .populate(mediaPopulate)
            .sort({ createdAt: -1 });
        res.json(complaints.map(attachMediaUrls));
    } catch (error) {
        sendRouteError(res, error, 'Student complaints error:');
    }
});

// GET /api/complaints - Admin views all complaints
router.get('/', protect, adminOnly, async (req, res) => {
    try {
        const { status, category, search } = req.query;
        const filter = {};

        if (status && status !== 'All') filter.status = status;
        if (category && category !== 'All') filter.category = category;
        if (search) {
            filter.$or = [
                { studentName: { $regex: search, $options: 'i' } },
                { studentUsername: { $regex: search, $options: 'i' } },
                { complaintId: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
                { room: { $regex: search, $options: 'i' } }
            ];
        }

        const complaints = await Complaint.find(filter)
            .populate(mediaPopulate)
            .sort({ createdAt: -1 });
        res.json(complaints.map(attachMediaUrls));
    } catch (error) {
        sendRouteError(res, error, 'Admin complaints error:');
    }
});

// PUT /api/complaints/:id - Admin updates status and remarks
router.put('/:id', protect, adminOnly, async (req, res) => {
    const { status, remarks } = req.body;

    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }

        if (status) {
            complaint.status = status;
            // Track when complaint is resolved; clear if status reverted
            if (status === 'Resolved' && !complaint.resolvedAt) {
                complaint.resolvedAt = new Date();
            } else if (status !== 'Resolved') {
                complaint.resolvedAt = null;
            }
        }
        if (remarks !== undefined) complaint.remarks = remarks;

        await complaint.save();
        await complaint.populate(mediaPopulate);
        res.json(attachMediaUrls(complaint));
    } catch (error) {
        sendRouteError(res, error, 'Update complaint error:');
    }
});

module.exports = router;
