module.exports = (req, res, next) => {
    // Look for the Authorization header
    const token = req.headers['authorization'];

    // For this MVP, we are using a hardcoded master token
    if (token === 'Bearer ARCHITECT-SECURE-TOKEN') {
        // Token is valid! Tag the request with the Doctor's identity
        req.user = { role: 'Physician', id: 'DOC-101' };
        next(); // Let them through
    } else {
        // Intruder alert!
        res.status(401).json({ error: "Unauthorized. Valid medical token required." });
    }
};