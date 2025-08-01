const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Cat = require('../models/Cat');
const { calculateScores } = require('../services/matchmaker');

router.get('/:userId', async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user || !user.preferences || !user.location?.coordinates) {
            return res.status(404).json({ error: 'User, preferences, or location not found.' });
        }

        const prefs = user.preferences;
        const userCoords = user.location.coordinates.coordinates; // [lon, lat]
        
        // Use a default radius if not provided, otherwise convert km to meters for MongoDB
        const searchRadiusMeters = (prefs.radius || 50) * 1000;

        // 1. Pre-filter by location using a geospatial query
        const localCats = await Cat.find({
            'location.coordinates': {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: userCoords
                    },
                    $maxDistance: searchRadiusMeters
                }
            }
        }).populate('sellerId', 'name avatar');

        if (localCats.length === 0) {
            return res.json([]);
        }

        // 2. Score the filtered cats based on all preferences
        const scoredCats = calculateScores(prefs, userCoords, localCats)
            .sort((a, b) => b.score - a.score)
            .map(item => item.cat); // Return only the cat object, sorted by score

        res.json(scoredCats);

    } catch (err) {
        next(err);
    }
});

module.exports = router;