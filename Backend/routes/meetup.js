const express = require("express");
const router = express.Router();
const Meetup = require("../models/Meetup");
const authMiddleware = require('../middleware/authMiddleware'); 
const User = require("../models/User"); 
const { getCoordsFromPostalCode } = require('../services/geocodingService');

// Helper function to check meetup organizer permission
const isMeetupOrganizer = (meetup, userId) => {
    // Ensure meetup.organizer is an ObjectId before calling toString()
    return meetup.organizer && meetup.organizer.toString() === userId.toString();
};

// GET: Call all meetups
router.get("/", async(req, res, next) => {
    try {
        const { lat, lon } = req.query;
        let query = {};
        let sortStage = { date: 1 }; // Default: newest first

        if (lat && lon) {
            query.coordinates = {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lon), parseFloat(lat)]
                    },
                    $maxDistance: 500000 // Set default back to 500km, 50km is often too small
                }
            };
            sortStage = null; // $near implies its own sorting
        }

        let meetupsQuery = Meetup.find(query);

        if (sortStage) {
            meetupsQuery = meetupsQuery.sort(sortStage);
        }

        const meetups = await meetupsQuery.populate("organizer", "name");
        res.json(meetups); // MongoDB now returns already sorted meetups
    } catch (err) {
        next(err);
    }
});

// GET: Call single Meetup through ID
// GET / api / meetups / :id
router.get("/:id", async(req,res,next) => {
    try{
        const meetup = await Meetup.findById(req.params.id).populate("organizer", "name");
        if (!meetup){
            return res.status(404).json({error: "Meetup not found"});
        }
        res.json(meetup);
    } catch (err) {
        next(err);
    }
});

// POST: Create a new Meetup
// POST / api / meetups
// Required: title, description, date, location, organizer, tags (optional), isUserMeetup (optional)
router.post("/", authMiddleware, async(req, res, next) => {
    try{
        const {title, description, date, location, tags, link, isUserMeetup, postalCode, countryCode} = req.body;
        const organizerId = req.user.id;
        if (!title || !date || !location || !postalCode) {
            return res.status(400).json({ message: 'Title, Date, Location, and Postal Code are required.' });
        }

        const organizer = await User.findById(organizerId);
        if (!organizer) {
            return res.status(404).json({ message: 'Organizer not found.' });
        }

        const coords = await getCoordsFromPostalCode(postalCode, countryCode || 'DE');
        if (!coords) {
            return res.status(400).json({ message: 'Could not geocode the provided postal code and country.' });
        }

        const newMeetup = new Meetup({
            title,
            description,
            date: new Date(date),
            location,
            postalCode,
            countryCode,
            coordinates: { // save geo coordinates
                type: 'Point',
                coordinates: [coords.lon, coords.lat] // IMPORTANT: [longitude, latitude]
            },
            organizer: organizerId,
            link: link || '', 
            tags: tags || [],
            isUserMeetup: isUserMeetup || false
        });

        const savedMeetup = await newMeetup.save();
        await savedMeetup.populate("organizer", "name");
        res.status(201).json(savedMeetup);
    } catch (err) {
        next(err);
    }
})

// PUT: Update a Meetup (NEW ROUTE)
router.put("/:id", authMiddleware, async (req, res, next) => {
    try {
        const meetupId = req.params.id;
        const userId = req.user.id; // Authenticated user

        const meetup = await Meetup.findById(meetupId);
        if (!meetup) {
            return res.status(404).json({ message: "Meetup not found" });
        }

        // Authorization check: Only the organizer can edit
        if (!isMeetupOrganizer(meetup, userId)) {
            return res.status(403).json({ message: "You are not authorized to edit this meetup." });
        }

        // Update fields
        const { title, description, date, location, link, tags, isUserMeetup, postalCode, countryCode } = req.body; 
        
        meetup.title = title !== undefined ? title : meetup.title; // undefined-check to allow empty strings
        meetup.description = description !== undefined ? description : meetup.description;
        meetup.date = date ? new Date(date) : meetup.date;
        meetup.location = location !== undefined ? location : meetup.location;
        meetup.link = link !== undefined ? link : meetup.link;
        if (tags !== undefined) meetup.tags = tags;
        if (isUserMeetup !== undefined) meetup.isUserMeetup = isUserMeetup;

        const newPostalCode = postalCode !== undefined ? postalCode : meetup.postalCode;
        const newCountryCode = countryCode !== undefined ? countryCode : meetup.countryCode;

        meetup.postalCode = newPostalCode;
        meetup.countryCode = newCountryCode;

        // Update geocoding if postalCode OR countryCode have changed
        // OR if either parameter is sent in the request body
        // and they differ from the currently stored values.
        // The logic with extracting from `meetup.location` is error-prone and should be avoided.
        // Instead, use the `postalCode` and `countryCode` fields in the schema directly.
        const shouldRecode = (
            (newPostalCode !== meetup.postalCode) || // Check if value has changed
            (newCountryCode !== meetup.countryCode)   // Check if value has changed
        );

        // Add this line to ensure coordinates are regenerated if they were missing before (e.g., for old meetups without geo data)
        const coordinatesMissing = !meetup.coordinates || !meetup.coordinates.coordinates || meetup.coordinates.coordinates.length === 0;

        if (shouldRecode || coordinatesMissing) { // Also re-geocode if coordinates are missing
            if (newPostalCode) { // Only geocode if a postal code is present
                const coords = await getCoordsFromPostalCode(newPostalCode, newCountryCode);
                if (coords) {
                    meetup.coordinates = {
                        type: 'Point',
                        coordinates: [coords.lon, coords.lat]
                    };
                } else {
                    // If geocoding fails, it's important to decide whether the request should fail
                    return res.status(400).json({ message: 'Could not geocode the provided postal code and country for update.' });
                }
            } else {
                 return res.status(400).json({ message: 'Postal code is required for geocoding update.' });
            }
        }

        const updatedMeetup = await meetup.save();
        // Populate, so frontend-response has organization name 
        await updatedMeetup.populate("organizer", "name");
        res.json(updatedMeetup);
    } catch (err) {
        next(err);
    }
});

// DELETE: Delete meetup
// DELETE / api / meetups / :id
router.delete("/:id", authMiddleware, async (req, res, next) => {
    try{
        const meetupId = req.params.id;
        const userId = req.user.id; // Authenticated user

        const meetup = await Meetup.findById(meetupId);
        if (!meetup){
            return res.status(404).json({message: "Meetup not found"}); // Changed from 'error' to 'message'
        }

        // Auth Check: only organizer can delete meetup
        if (!isMeetupOrganizer(meetup, userId)) { // This check is key
            return res.status(403).json({ message: "You are not authorized to delete this meetup." });
        }
        await Meetup.findByIdAndDelete(meetupId);
        res.status(204).send()

    } catch (err) {
        next(err);
    }
});

module.exports = router; 

