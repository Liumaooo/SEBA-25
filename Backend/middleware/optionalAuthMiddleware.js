// middleware/optionalAuthMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Assuming your User model path

const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (token) {
            // Only attempt to verify if a token is present
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');

            if (user) {
                req.user = user; // Attach user object to the request if token is valid
            } else {
                // Token was valid but user not found (e.g., deleted user)
                console.warn("OptionalAuth: Valid token but user not found in DB for ID:", decoded.id);
            }
        }
        // Always call next(), allowing the request to proceed regardless of token presence/validity
        next();
    } catch (error) {
        // Log the error for debugging purposes but still proceed.
        // This handles cases like malformed tokens, expired tokens, etc.
        console.warn("OptionalAuth: Token verification failed or no token:", error.message);
        next(); // Proceed without attaching req.user
    }
};

module.exports = optionalAuthMiddleware;