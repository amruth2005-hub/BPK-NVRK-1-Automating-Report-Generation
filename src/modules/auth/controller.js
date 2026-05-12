const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// --- AUTO-SEEDER: Creates initial users if the database is empty ---
const seedUsers = async () => {
    const count = await User.countDocuments();
    if (count === 0) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        await User.insertMany([
            { user_id: 'TECH-001', name: 'Ammu (Senior Tech)', role: 'tech', password: hashedPassword },
            { user_id: 'DOC-101', name: 'Dr. Gregory House', department: 'Diagnostics', role: 'doctor', password: hashedPassword }
        ]);
        console.log('🌱 Database Seeded: Secure Tech and Doctor accounts created.');
    }
};
seedUsers(); // Run seeder on startup
// -------------------------------------------------------------------

exports.login = async (req, res) => {
    try {
        const { user_id, password } = req.body;

        // 1. Find User in MongoDB
        const user = await User.findOne({ user_id });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        // 2. Cryptographically verify the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        // 3. Sign the JWT with the user's specific role and department
        const payload = {
            id: user.user_id,
            role: user.role,
            name: user.name,
            department: user.department
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

        // 4. Return token AND user data for the Unified UI
        res.status(200).json({
            message: "Authentication successful",
            token: token,
            user: payload
        });

    } catch (err) {
        res.status(500).json({ error: "Internal server error during login." });
    }
};