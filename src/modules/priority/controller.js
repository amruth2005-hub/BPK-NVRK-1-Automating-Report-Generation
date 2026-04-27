const TestOrder = require('../models/TestOrder');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');

exports.routeReport = async (req, res) => {
    try {
        const { test_id } = req.body;

        // 1. Validate State
        const order = await TestOrder.findOne({ test_id });
        if (!order) return res.status(404).json({ error: "Record not found." });
        if (order.status === 'DELIVERED') return res.status(409).json({ error: "Report already delivered." });
        if (order.status !== 'GENERATED') return res.status(400).json({ error: `State is ${order.status}, must be GENERATED.` });

        // 2. Fetch the Formatted Report
        const report = await Report.findOne({ test_id });
        if (!report) return res.status(404).json({ error: "Report document missing." });

        // 3. The Triage Engine (Analyze Data for Urgency)
        // We extract the number from the string (e.g., "95 mg/dL" -> 95)
        const rawGlucose = report.formatted_data.readings.glucose;
        const glucoseValue = parseInt(rawGlucose);

        let priorityLevel = 'ROUTINE';
        let routingMethod = 'Standard Electronic Queue';

        if (glucoseValue < 70 || glucoseValue > 140) {
            priorityLevel = 'URGENT';
            routingMethod = 'Emergency SMS & Pager Dispatch';
        }

        // 4. Update the Order State
        order.status = 'DELIVERED';
        await order.save();

        // 5. Audit Logging
        await new AuditLog({
            test_id: order.test_id,
            action: `ROUTED_${priorityLevel}`,
            previous_state: 'GENERATED',
            current_state: 'DELIVERED'
        }).save();

        res.status(200).json({
            message: "Report successfully routed.",
            priority: priorityLevel,
            delivery_method: routingMethod,
            state: order.status
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};