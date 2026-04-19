const TestOrder = require('../models/TestOrder');

exports.processValidation = async (req, res) => {
    try {
        const { test_id, patient_name, results } = req.body;

        // Idempotency: Check if already checkpointed
        let order = await TestOrder.findOne({ test_id });
        if (order && order.status !== 'INITIATED') {
            return res.status(409).json({ error: "Record already checkpointed." });
        }

        if (!order) {
            order = new TestOrder({ test_id, patient_name });
        }

        // Atomic update to CHECKPOINTED
        order.results_data = results;
        order.status = 'CHECKPOINTED';
        order.updated_at = Date.now();

        await order.save();

        res.status(201).json({ message: "Checkpoint Successful", state: order.status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};