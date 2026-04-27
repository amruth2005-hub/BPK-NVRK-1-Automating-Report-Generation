const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    test_id: { type: String, required: true },
    action: { type: String, required: true },
    previous_state: String,
    current_state: String,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);