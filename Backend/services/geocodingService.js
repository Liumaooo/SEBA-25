const axios = require('axios');

/**
 * Converts a postal code and country code into geographic coordinates (latitude and longitude)
 * using the OpenCage Geocoding API.
 * @param {string} postalCode - The postal code to geocode (e.g., "80331").
 * @param {string} [countryCode='DE'] - The two-letter ISO 3166-1 alpha-2 country code (e.g., "DE" for Germany (default)).
 * @returns {Promise<{lon: number, lat: number}|null>} A promise that resolves to an object with lon and lat, or null if not found or an error occurs.
 */
async function getCoordsFromPostalCode(postalCode, countryCode = 'DE') {
    // Fetch the API key from environment variables.
    const GEOCODING_API_KEY = process.env.OPENCAGE_API_KEY;

    // Constructs the API URL for OpenCage Geocoder with postal code and country code:
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(postalCode)}&countrycode=${encodeURIComponent(countryCode)}&key=${GEOCODING_API_KEY}&limit=1`;

    try {
        const response = await axios.get(url);
        const data = response.data;

        // Check if the API returned any results.
        if (data.results && data.results.length > 0) {
            const { lng, lat } = data.results[0].geometry;
            console.log(`Successfully geocoded ${postalCode}, ${countryCode} to: lon=${lng}, lat=${lat}`);
            return { lon: lng, lat: lat };
        } else {
            console.warn(`No coordinates found for postal code: ${postalCode}, country: ${countryCode}`);
            return null;
        }
    } catch (error) {
        // Handle potential errors like network issues or invalid API keys.
        console.error("Error calling OpenCage Geocoding API:", error.response ? error.response.data.status.message : error.message);
        return null;
    }
}

module.exports = { getCoordsFromPostalCode };