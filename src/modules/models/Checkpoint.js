const mongoose = require('mongoose');

const CheckpointSchema = new mongoose.Schema({
    test_id: { type: String, required: true, unique: true, ref: 'TestOrder' },
    payload: { type: Object, required: true },
    vaulted_at: { type: Date, default: Date.now },
    integrity_hash: { type: String, default: 'SHA-256-PENDING' }
});

module.exports = mongoose.model('Checkpoint', CheckpointSchema);