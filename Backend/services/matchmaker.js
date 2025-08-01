function getDistanceInKm(coords1, coords2) {
    if (!coords1 || !coords2) return Infinity;
    const R = 6371; // Radius of the Earth in km
    const dLat = (coords2[1] - coords1[1]) * Math.PI / 180;
    const dLon = (coords2[0] - coords1[0]) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coords1[1] * Math.PI / 180) * Math.cos(coords2[1] * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}


function calculateScores(prefs, userCoords, cats) {
    const maxRadius = prefs.radius || 50; // Use preference radius for scoring or default to 50km

    return cats.map(cat => {
        let score = 0;
        
        // Score distance (closer is better)
        const catCoords = cat.location.coordinates.coordinates;
        const distance = getDistanceInKm(userCoords, catCoords);
        if (distance <= maxRadius) {
            // This gives a score from 0 to 50, where 0km away is 50 points.
            const distanceScore = (1 - (distance / maxRadius)) * 50;
            score += distanceScore;
        } else {
            score -= 5000; // If the cat is outside the max travel radius, it will only be shown after all cats that are located inside the radius (should currently not exist because they are filtered out beforehand)
        }

        // Score shelteronly
        if (prefs.sheltersOnly && cat.sheltersOnly === true) {
            score += 50;
        }

        // Score age
        if (prefs.ageRange && prefs.ageRange.length > 0) {
            const age = cat.ageYears || 0;
            if (
                (prefs.ageRange.includes('kitten') && age <= 1) ||
                (prefs.ageRange.includes('young') && age > 1 && age <= 3) ||
                (prefs.ageRange.includes('adult') && age > 3 && age <= 8) ||
                (prefs.ageRange.includes('senior') && age > 8)
            ) score += 50;
        }

        // Score gender
        if (prefs.gender && prefs.gender === cat.sex) score += 50;

        // Score sterilization
        if (prefs.isCastrated && cat.sterilized) score += 50;

        // Score color
        if (prefs.colour && prefs.colour.length > 0 && prefs.colour.includes(cat.color.toLowerCase())) {
            score += 50;
        }
        
        // Score allergy-friendliness
        if (prefs.allergyFriendly && cat.allergyFriendly) score += 1000;

        // Score fee range
        if (prefs.feeMin !== undefined && prefs.feeMax !== undefined) {
            const fee = cat.fee || 0;
            if (prefs.feeMin <= fee && fee <= prefs.feeMax) score += 2000;
        }

        // Score health
        if (prefs.health && prefs.health === cat.healthStatus) {
            score += 50;
        }

        // Attach distance to cat object for display on the frontend
        const catWithDistance = { ...cat.toObject(), distanceKm: Math.round(distance) };

        return { cat: catWithDistance, score };
    });
}

module.exports = { calculateScores };