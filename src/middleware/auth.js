const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // 1. Look for the Authorization header
    const authHeader = req.headers['authorization'];

    // 2. Extract the token (Format is usually "Bearer eyJhbGci...")
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Access Denied. No token provided." });
    }

    // 3. Verify the token using our secret key
    try {
        const verifiedData = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Attach the verified user data to the request so controllers can use it
        req.user = verifiedData;
        next(); // Let them through!
    } catch (err) {
        res.status(403).json({ error: "Invalid or expired token." });
    }
};