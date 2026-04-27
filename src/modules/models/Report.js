const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    test_id: { type: String, required: true, unique: true, ref: 'TestOrder' },
    patient_name: { type: String, required: true },
    formatted_data: { type: Object, required: true },
    metadata: {
        generated_by: { type: String, default: 'System_Transformer' },
        disclaimer: { type: String, default: 'Automated diagnostic report. Pending physician review.' }
    },
    generated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema);