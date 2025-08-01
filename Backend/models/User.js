const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const PreferenceSchema = new mongoose.Schema({
    radius: { type: Number, min: 0 },
    sheltersOnly: { type: Boolean },
    ageRange: { type: [String], enum: ['kitten', 'young', 'adult', 'senior'] },
    gender: { type: String, enum: ['m', 'f', "other"] },
    isCastrated: { type: Boolean },
    colour: { type: [String] },
    allergyFriendly: { type: Boolean },
    feeMin: { type: Number, min: 0 },
    feeMax: { type: Number, min: 0 },
    health: { type: String, enum: ['healthy', 'minor_issues', 'needs_care'] }
}, { _id: false });

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    userType: { type: String, enum: ['buyer', 'seller'], required: true },
    isVerified: { // To track if email is confirmed
        type: Boolean,
        default: false
    },
    verificationCode: { // Stores the 2FA code
        type: String,
        default: null
    },
    verificationCodeExpires: { // Stores expiration time for the code
        type: Date,
        default: null
    },

    address: {type:String, required: false},
    descriptionUser: {type: String, required: false},
    location: {
        postalCode: String,
        countryCode: String,
        coordinates: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { // <-- This entire block is crucial
                type: [Number]
            }
        }
    },
    preferences: PreferenceSchema,
    watchlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cat' }],
    currentSubscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserSubscription",
        default: null // User might have no purchased subscription while using our service
    }, avatar: { type: String },
        //add review
        ratings: [
        {
            reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            rating: { type: Number, min: 1, max: 5, required: true },
            createdAt: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

//Password encryption
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

//Password comparison
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
