function errorHandler(err, req, res, next) {
    console.error(err); // Log the error for debugging purposes

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
    }

    // Mongoose cast error
    if (err.name === 'CastError') {
        return res.status(400).json({ error: `Invalid ${err.path}: ${err.value}` });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        return res.status(409).json({ error: 'A record with this value already exists.' });
    }

    // Default to a generic server error
    res.status(500).json({ 
    error: err.message || 'Something went wrong on the server.',
    stack: err.stack 
});

}

module.exports = errorHandler;