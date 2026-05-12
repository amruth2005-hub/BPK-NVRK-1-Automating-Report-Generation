module.exports = (requiredRole) => {
    return (req, res, next) => {
        // req.user is injected by our auth.js middleware right before this runs
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized: No user context found." });
        }

        if (req.user.role !== requiredRole) {
            return res.status(403).json({
                error: `Forbidden: Your clearance level (${req.user.role}) is insufficient. Requires: ${requiredRole}.`
            });
        }

        next(); // Clearance granted!
    };
};