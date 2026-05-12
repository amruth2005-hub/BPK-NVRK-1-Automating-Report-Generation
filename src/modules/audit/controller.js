const TestOrder = require('../models/TestOrder');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');

exports.viewReport = async (req, res) => {
    try {
        // We get the test_id from the URL this time
        const { test_id } = req.params;
        const user = req.user; // Identity injected by our auth middleware

        // 1. Fetch the Order and verify state
        const order = await TestOrder.findOne({ test_id });
        if (!order) return res.status(404).json({ error: "Record not found." });

        // You can't view a report that hasn't been generated/delivered yet!
        if (order.status !== 'DELIVERED' && order.status !== 'ACCESSED') {
            return res.status(403).json({ error: `Report not ready. Current state: ${order.status}` });
        }

        // 2. Fetch the actual report data
        const report = await Report.findOne({ test_id });

        // 3. State Transition (Only if it's the FIRST time being opened)
        let previousState = order.status;
        if (order.status === 'DELIVERED') {
            order.status = 'ACCESSED';
            await order.save();
        }

        // 4. Secure Audit Logging (HIPAA style with Network Tracing)
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const clientAgent = req.headers['user-agent'];

        await new AuditLog({
            test_id: order.test_id,
            action: `REPORT_VIEWED_BY_${user.id}`,
            previous_state: previousState,
            current_state: order.status,
            ip_address: clientIp,       // Captures the Doctor's IP
            user_agent: clientAgent     // Captures the Doctor's Browser/Device
        }).save();

        // 5. Deliver the Data
        res.status(200).json({
            message: "Secure Access Granted",
            doctor_id: user.id,
            state: order.status,
            medical_data: report.formatted_data
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};