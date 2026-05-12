const TestOrder = require('../models/TestOrder');
const Checkpoint = require('../models/Checkpoint');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');
const Patient = require('../models/Patient');

exports.receiveValidationEvent = async (req, res) => {
    try {
        const { test_id, patient_name, results } = req.body;
        const io = req.app.get('socketio'); // Grab the websocket

        // 1. Idempotency Check
        const existingOrder = await TestOrder.findOne({ test_id });
        if (existingOrder) {
            return res.status(409).json({ error: "Duplicate entry detected.", state: existingOrder.status });
        }

        // ==========================================
        // 🏥 NEW: PATIENT MASTER INDEX (PMI) LOGIC
        // ==========================================
        // Generate a unique ID (e.g., PAT-AMMU)
        const generatedPatientId = `PAT-${patient_name.toUpperCase().replace(/\s/g, '')}`;

        let patientRecord = await Patient.findOne({ patient_id: generatedPatientId });
        if (!patientRecord) {
            patientRecord = new Patient({ patient_id: generatedPatientId, name: patient_name });
            await patientRecord.save();
        }

        // 2. Initial Save (Using the verified Patient Record)
        const order = new TestOrder({ test_id, patient_name: patientRecord.name, results_data: results, status: 'INITIATED' });
        await order.save();

        // 3. Vault Data (CHECKPOINTED)
        const checkpoint = new Checkpoint({ test_id, payload: results });
        await checkpoint.save();

        order.status = 'CHECKPOINTED';
        await order.save();

        // Respond to the UI immediately
        res.status(201).json({ message: "Data successfully vaulted.", state: order.status });

        // ==========================================
        // 🚀 THE AUTO-PILOT BACKGROUND PROCESS 
        // ==========================================
        setTimeout(async () => {
            io.emit('telemetry', { title: "SYSTEM UPDATE", msg: "Initializing Report Engine...", state: "PROCESSING" });

            const formattedReport = { summary: "Diagnostic Panel", readings: order.results_data, clinical_flag: "Auto-Generated" };
            await new Report({ test_id: order.test_id, patient_name: order.patient_name, formatted_data: formattedReport }).save();
            order.status = 'GENERATED';
            await order.save();
            await new AuditLog({ test_id: order.test_id, action: 'AUTO_GENERATION', previous_state: 'CHECKPOINTED', current_state: 'GENERATED' }).save();

            io.emit('telemetry', { title: "SPRINT 2 COMPLETE", msg: "Report safely generated.", state: "GENERATED" });

            setTimeout(async () => {
                io.emit('telemetry', { title: "SYSTEM UPDATE", msg: "Analyzing clinical data for triage...", state: "PROCESSING" });

                const rawGlucose = parseInt(formattedReport.readings.glucose);
                let priorityLevel = 'ROUTINE';
                let systemFlag = 'OK';

                if (isNaN(rawGlucose)) {
                    priorityLevel = 'CRITICAL';
                    systemFlag = 'DATA_CORRUPTION_ERROR';
                } else if (rawGlucose < 0 || rawGlucose > 1500) {
                    priorityLevel = 'CRITICAL';
                    systemFlag = 'HARDWARE_MALFUNCTION';
                } else if (rawGlucose < 54 || rawGlucose > 400) {
                    priorityLevel = 'CRITICAL';
                    systemFlag = 'PANIC_VALUE';
                } else if (rawGlucose < 70 || rawGlucose > 140) {
                    priorityLevel = 'URGENT';
                    systemFlag = 'ABNORMAL_RESULT';
                }

                // --- MOCK OUT-OF-BAND TWILIO PAGING ---
                if (priorityLevel === 'CRITICAL') {
                    console.log(`\n🚨 [TWILIO SMS DISPATCHED] Paging On-Call Doctor! Alert: ${systemFlag} for Patient ${patientRecord.patient_id}\n`);
                }

                order.status = 'DELIVERED';
                await order.save();
                await new AuditLog({ test_id: order.test_id, action: `AUTO_ROUTED_${priorityLevel}`, previous_state: 'GENERATED', current_state: 'DELIVERED' }).save();

                io.emit('telemetry', {
                    title: "SPRINT 3 COMPLETE",
                    msg: `Routed priority: ${priorityLevel} | Flag: ${systemFlag}`,
                    state: "DELIVERED",
                    unlockDoctor: true
                });

            }, 2000);
        }, 2000);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};