const mongoose = require('mongoose');

const CatSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    status: {type: String, enum: ["draft", "published"], default:"draft"},
    sex: { type: String, enum: ['m', 'f', "other"], required: true },
    ageYears: { type: Number, required: true, min: 0 },
    color: { type: String, required: true, trim: true },
    breed: { type: String, trim: true },
    description: { type: String, trim: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vaccinated: { type: Boolean, default: false },
    sterilized: { type: Boolean, default: false },
    allergyFriendly: { type: Boolean, default: false },
    healthStatus: { type: String, enum: ['healthy', 'minor_issues', 'needs_care'], default: 'healthy' },
    photoUrl: { type: String },
    adoptionFee: { type: Number, min: 0, default: 0 },
    location: {
        postalCode: { type: String, required: true },
        countryCode: { type: String, required: true },
        coordinates: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true } // Format: [longitude, latitude]
        }
    }
}, { timestamps: true });

CatSchema.index({ "location.coordinates": '2dsphere' });

module.exports = mongoose.model('Cat', CatSchema);