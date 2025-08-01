const mongoose = require("mongoose");

const MeetupSchema = new mongoose.Schema({
    title: {type: String, required: true, trim: true},
    description: {type: String, required: true, trim: true},
    date:{type: Date, required: true},
    location: {type: String, required: true, trim: true},
    postalCode: {type: String, required: true, trim: true},
    countryCode: {type: String, default: 'DE', trim: true},
    coordinates: {
        type: {
            type: String, // needs to be 'Point' for 2dsphere Index
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
        }
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId, // Muss ObjectId sein
        ref: 'User',                         // Verweis auf das User-Modell
        required: true
    },
    link: {type: String, trim: true, default: ''},
    tags: {type: [String], default: []},
    isUserMeetup: {type: Boolean, default: false}
}, {
    timestamps: true
});

MeetupSchema.index({ "coordinates": '2dsphere' });

module.exports = mongoose.model("Meetup", MeetupSchema);