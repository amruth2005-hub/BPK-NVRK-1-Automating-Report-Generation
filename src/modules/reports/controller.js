const TestOrder = require('../models/TestOrder');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');

exports.generateReport = async (req, res) => {
    try {
        const { test_id } = req.body;

        // 1. Fetch the Order and verify state
        const order = await TestOrder.findOne({ test_id });

        if (!order) return res.status(404).json({ error: "Record not found." });
        if (order.status === 'GENERATED') return res.status(409).json({ error: "Report already generated." });
        if (order.status !== 'CHECKPOINTED') return res.status(400).json({ error: `State is ${order.status}, must be CHECKPOINTED.` });

        // 2. Transform the Data (Simulated PDF/JSON Generation)
        const formattedReport = {
            summary: "Diagnostic Panel",
            readings: order.results_data,
            clinical_flag: "Standard Review Required"
        };

        // 3. Save the Generated Report
        const report = new Report({
            test_id: order.test_id,
            patient_name: order.patient_name,
            formatted_data: formattedReport
        });
        await report.save();

        // 4. Update the State
        order.status = 'GENERATED';
        await order.save();

        // 5. Log the Audit Event
        await new AuditLog({
            test_id: order.test_id,
            action: 'REPORT_GENERATION',
            previous_state: 'CHECKPOINTED',
            current_state: 'GENERATED'
        }).save();

        res.status(201).json({ message: "Report Generated Successfully", state: order.status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};