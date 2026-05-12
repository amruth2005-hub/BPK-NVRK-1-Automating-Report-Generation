const TestOrder = require('../models/TestOrder');
const Checkpoint = require('../models/Checkpoint');

// Import the logic from our other sprints to run them in the background
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');

exports.receiveValidationEvent = async (req, res) => {
    try {
        const { test_id, patient_name, results } = req.body;
        const io = req.app.get('socketio'); // Grab the websocket

        // 1. Idempotency Check
        const existingOrder = await TestOrder.findOne({ test_id });
        if (existingOrder) {
            return res.status(409).json({ error: "Duplicate entry detected.", state: existingOrder.status });
        }

        // 2. Initial Save (INITIATED)
        const order = new TestOrder({ test_id, patient_name, results_data: results, status: 'INITIATED' });
        await order.save();

        // 3. Vault Data (CHECKPOINTED)
        const checkpoint = new Checkpoint({ test_id, payload: results });
        await checkpoint.save();

        order.status = 'CHECKPOINTED';
        await order.save();

        // Respond to the UI immediately so the user isn't waiting
        res.status(201).json({ message: "Data successfully vaulted.", state: order.status });

        // ==========================================
        // 🚀 THE AUTO-PILOT BACKGROUND PROCESS 
        // ==========================================
        setTimeout(async () => {
            // STEP A: Generate Report (Sprint 2 automation)
            io.emit('telemetry', { title: "SYSTEM UPDATE", msg: "Initializing Report Engine...", state: "PROCESSING" });

            const formattedReport = { summary: "Diagnostic Panel", readings: order.results_data, clinical_flag: "Auto-Generated" };
            await new Report({ test_id: order.test_id, patient_name: order.patient_name, formatted_data: formattedReport }).save();
            order.status = 'GENERATED';
            await order.save();
            await new AuditLog({ test_id: order.test_id, action: 'AUTO_GENERATION', previous_state: 'CHECKPOINTED', current_state: 'GENERATED' }).save();

            io.emit('telemetry', { title: "SPRINT 2 COMPLETE", msg: "Report safely generated.", state: "GENERATED" });

            // Wait 2 seconds for dramatic UI effect, then do Sprint 3
            setTimeout(async () => {
                io.emit('telemetry', { title: "SYSTEM UPDATE", msg: "Analyzing clinical data for triage...", state: "PROCESSING" });

                // Remove the '|| 95' fallback!
                const rawGlucose = parseInt(formattedReport.readings.glucose);
                let priorityLevel = 'ROUTINE';
                let systemFlag = 'OK';

                // 1. Check for Data Corruption / Missing Data first!
                if (isNaN(rawGlucose)) {
                    priorityLevel = 'CRITICAL';
                    systemFlag = 'DATA_CORRUPTION_ERROR: MANUAL REVIEW REQUIRED';
                }
                // 2. Check for Impossible Physical Values (Sensor Glitch)
                else if (rawGlucose < 0 || rawGlucose > 1500) {
                    priorityLevel = 'CRITICAL';
                    systemFlag = 'HARDWARE_MALFUNCTION_DETECTED';
                }
                // 3. Check for Medical "Panic Values" (Immediate Life Threat)
                else if (rawGlucose < 54 || rawGlucose > 400) {
                    priorityLevel = 'CRITICAL';
                    systemFlag = 'PANIC_VALUE: PAGING DOCTOR IMMEDIATELY';
                }
                // 4. Check for Standard Medical Urgency
                else if (rawGlucose < 70 || rawGlucose > 140) {
                    priorityLevel = 'URGENT';
                    systemFlag = 'ABNORMAL_RESULT: REQUIRES REVIEW';
                }
                // 5. If it passes all checks, it remains ROUTINE

                order.status = 'DELIVERED';
                await order.save();
                await new AuditLog({ test_id: order.test_id, action: `AUTO_ROUTED_${priorityLevel}`, previous_state: 'GENERATED', current_state: 'DELIVERED' }).save();

                io.emit('telemetry', {
                    title: "SPRINT 3 COMPLETE",
                    msg: `Report routed with priority: ${priorityLevel}`,
                    state: "DELIVERED",
                    unlockDoctor: true // Tells the UI to unlock the final button
                });

            }, 2000);
        }, 2000);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};