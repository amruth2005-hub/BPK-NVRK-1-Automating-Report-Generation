const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    user_id: { type: String, required: true, unique: true }, // e.g., TECH-001 or DOC-101
    name: { type: String, required: true },
    department: { type: String, default: 'General' }, // Specific to Doctors
    role: { type: String, enum: ['tech', 'doctor'], required: true },
    password: { type: String, required: true } // This will store the bcrypt hash, NOT plain text
});

module.exports = mongoose.model('User', UserSchema);