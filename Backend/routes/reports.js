const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); 
const Report = require('../models/Reports'); // A new Mongoose model for Reports
const emailService = require('../services/emailService'); // Import email service

// POST /api/reports/profile
router.post('/profile', authMiddleware, async (req, res) => {
    try {
        const { reporterId, reportedUserId, reportedCatId, reason, details, timestamp } = req.body;

        // Ensures that the reporting user matches the authenticated user
        if (req.user.id !== reporterId) {
            return res.status(403).json({ error: 'Unauthorized reporter ID.' });
        }

        const newReport = new Report({
            reporter: reporterId,
            reportedUser: reportedUserId,
            reportedCat: reportedCatId,
            reason: reason,
            details: details,
            timestamp: timestamp,
            status: 'pending' // Initial status of the report
        });

        await newReport.save();

        // Send report email to admin
        await emailService.sendReportEmail({
            reporterId,
            reportedUserId,
            reportedCatId,
            reason,
            details,
            timestamp
        });

        res.status(201).json({ message: 'Profile reported successfully.', reportId: newReport._id });

    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(500).json({ error: 'Server error while submitting report.' });
    }
});

module.exports = router;