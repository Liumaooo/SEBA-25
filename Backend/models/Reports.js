const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportedCat: { // Optional, wenn ein spezifisches Katzenprofil gemeldet wird
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cat',
        required: false
    },
    reason: {
        type: String,
        enum: [
            'Inappropriate Content',
            'Scam/Fraud Attempt',
            'Misleading Information',
            'Harassment/Abuse',
            'Other'
        ],
        required: true
    },
    details: {
        type: String,
        maxlength: 1000,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);