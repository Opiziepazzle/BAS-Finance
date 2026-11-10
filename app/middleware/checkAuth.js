const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Extract token from authorization header (Bearer token)
    const token = req.headers['authorization']?.split(' ')[1] || req.query.token;

    if (!token) {
        return res.status(401).json({ 
            error: 'Authentication failed', 
            message: 'Access denied. No token provided.' 
        });
    }

    jwt.verify(token, process.env.JWT_KEY || 'secret_key', (err, decoded) => {
        if (err) {
            return res.status(401).json({ 
                error: 'Authentication failed', 
                message: 'Invalid or expired token.' 
            });
        }
        req.userData = decoded;
        next();
    });
};
