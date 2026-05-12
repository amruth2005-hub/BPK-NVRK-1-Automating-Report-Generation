const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
    patient_id: { type: String, required: true, unique: true }, // e.g., PAT-1001
    name: { type: String, required: true },
    is_diabetic: { type: Boolean, default: false }, // Medical history for smarter triage
    registered_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Patient', PatientSchema);