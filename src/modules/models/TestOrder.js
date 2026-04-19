const mongoose = require('mongoose');

const TestOrderSchema = new mongoose.Schema({
    test_id: { type: String, required: true, unique: true },
    patient_name: { type: String, required: true },
    status: {
        type: String,
        enum: ['INITIATED', 'VALIDATED', 'CHECKPOINTED', 'GENERATED', 'DELIVERED', 'ACCESSED'],
        default: 'INITIATED'
    },
    results_data: Object,
    updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TestOrder', TestOrderSchema);