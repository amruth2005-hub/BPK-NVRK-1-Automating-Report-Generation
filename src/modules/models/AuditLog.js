const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    test_id: { type: String, required: true },
    action: { type: String, required: true },
    previous_state: String,
    current_state: String,
    timestamp: { type: Date, default: Date.now },
    // --- NEW ENTERPRISE COMPLIANCE FIELDS ---
    ip_address: { type: String, default: 'Internal System' },
    user_agent: { type: String, default: 'Automated Engine' }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);