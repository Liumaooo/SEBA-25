const jwt = require('jsonwebtoken');
const SECRET = '123456'; // same secret you used in login route

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    // Check if token exists and is in "Bearer <token>" format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization token missing or invalid' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify token and attach user ID to req.user
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded
        next(); // Token is valid, proceed to route handler
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = authMiddleware;
