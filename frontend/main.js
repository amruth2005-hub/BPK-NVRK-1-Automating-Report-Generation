// -----------------------------------------------------
// SECURITY GATEWAY & UNIFIED UI RENDERING
// -----------------------------------------------------
if (!localStorage.getItem('lab_token')) {
    window.location.href = 'login.html';
}

const userRole = localStorage.getItem('user_role');

// Optional: Add a logout function if you want
// -----------------------------------------------------
// LOGOUT LOGIC
// -----------------------------------------------------
document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('lab_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    window.location.href = 'login.html';
});

// UI Elements
const consoleOutput = document.getElementById('consoleOutput');
const uiState = document.getElementById('ui-state');
const btnCheckpoint = document.getElementById('btn-checkpoint');
const btnAccess = document.getElementById('btn-access');

let currentTestId = "";
// --- Security Check remains at the top... ---

// -----------------------------------------------------
// 📡 WEBSOCKET TELEMETRY (THE AUTO-PILOT)
// -----------------------------------------------------
const socket = io(); // Connect to backend websocket

socket.on('telemetry', (data) => {
    logToTerminal(data.title, data.msg, data.state, false);

    // Auto-unlock the Doctor Access button when Sprint 3 finishes
    if (data.unlockDoctor) {
        unlockButton(document.getElementById('btn-access'));
    }
});

// -----------------------------------------------------
// GSAP TOAST NOTIFICATION ENGINE
// -----------------------------------------------------
function showToast(title, message, type = 'error') {
    const container = document.getElementById('toast-container');

    // Create the toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<strong>${title}</strong><p>${message}</p>`;

    container.appendChild(toast);

    // GSAP: Slide in from the right
    gsap.fromTo(toast,
        { x: 100, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: "back.out(1.5)" }
    );

    // GSAP: Slide out and remove after 4 seconds
    setTimeout(() => {
        gsap.to(toast, {
            x: 100, opacity: 0, duration: 0.4, ease: "power2.in",
            onComplete: () => toast.remove()
        });
    }, 4000);
}


// -----------------------------------------------------
// GSAP INITIAL LOAD ANIMATIONS
// -----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const userRole = localStorage.getItem('user_role');
    const doctorView = document.getElementById('doctor-view');
    const techView = document.getElementById('tech-view');

    // UI Role-Based Rendering
    if (userRole === 'doctor') {
        if (techView) techView.style.display = 'none';
        if (doctorView) doctorView.style.display = 'block';
        logToTerminal("SYSTEM BOOT", "Welcome Doctor. Waiting for secure access request...", "READY");
    } 
    else if (userRole === 'tech') {
        if (doctorView) doctorView.style.display = 'none';
        if (techView) techView.style.display = 'block';
        logToTerminal("SYSTEM BOOT", "Welcome Technician. Awaiting Sprint 1 trigger...", "READY");
    }

    // Ensure buttons are visible immediately in case of GSAP failure
    gsap.set('.gs-btn', { opacity: 1, visibility: 'visible' });

    const tl = gsap.timeline();

    // Background gradient fade in
    tl.from('.bg-gradient', { opacity: 0, duration: 1.5, ease: 'power2.inOut' })
        // Header slide down
        .from('.gsap-header', { y: -50, opacity: 0, duration: 0.8, ease: 'back.out(1.7)' }, "-=1.0")
        // Panels slide up and fade in
        .from('.gsap-panel-left', { y: 30, opacity: 0, duration: 0.6, ease: 'power2.out' }, "-=0.4")
        .from('.gsap-panel-right', { y: 30, opacity: 0, duration: 0.6, ease: 'power2.out' }, "-=0.4")
        // Inputs and buttons stagger in
        .from('.input-wrapper, .gs-btn', {
            y: 20,
            opacity: 0,
            duration: 0.4,
            stagger: 0.1,
            ease: 'power2.out',
            clearProps: "opacity,transform" // Prevent them from getting stuck invisible
        }, "-=0.2");
});

// -----------------------------------------------------
// GSAP MICRO-INTERACTIONS
// -----------------------------------------------------
const buttons = document.querySelectorAll('.gs-btn');
buttons.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
        if (!btn.disabled) {
            gsap.to(btn, { scale: 1.02, duration: 0.2, ease: 'power1.out' });
        }
    });
    btn.addEventListener('mouseleave', () => {
        if (!btn.disabled) {
            gsap.to(btn, { scale: 1, duration: 0.2, ease: 'power1.out' });
        }
    });
    btn.addEventListener('mousedown', () => {
        if (!btn.disabled) {
            gsap.to(btn, { scale: 0.95, duration: 0.1, ease: 'power1.out' });
        }
    });
    btn.addEventListener('mouseup', () => {
        if (!btn.disabled) {
            gsap.to(btn, { scale: 1.02, duration: 0.1, ease: 'power1.out' });
        }
    });
});

// Unlock button animation
function unlockButton(btn) {
    btn.disabled = false;
    gsap.fromTo(btn,
        { scale: 0.9, opacity: 0.5, filter: "brightness(0.5)" },
        { scale: 1, opacity: 1, filter: "brightness(1)", duration: 0.6, ease: "elastic.out(1, 0.5)" }
    );
}

// -----------------------------------------------------
// TERMINAL LOGIC
// -----------------------------------------------------
function logToTerminal(title, data, state, isError = false) {
    // Update State Indicator
    uiState.innerText = state;
    if (isError || state === 'SYSTEM_FAULT') {
        gsap.to(uiState, { color: '#ef4444', duration: 0.3 }); // Red
    } else {
        gsap.to(uiState, { color: '#fbd38d', duration: 0.3 }); // Yellow/Orange
    }

    const time = new Date().toLocaleTimeString();
    const formattedData = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;

    // Create new log entry element
    const entry = document.createElement('div');
    entry.className = 'log-entry';

    const titleClass = isError ? 'log-error' : 'log-title';

    entry.innerHTML = `
        <div class="${titleClass}">[${time}] > ${title}</div>
        <div class="log-data">${formattedData}</div>
    `;

    // Prepend to console
    consoleOutput.prepend(entry);

    // Animate the new entry sliding down and fading in
    gsap.from(entry, {
        height: 0,
        opacity: 0,
        paddingTop: 0,
        paddingBottom: 0,
        marginBottom: 0,
        duration: 0.4,
        ease: 'power2.out'
    });
}

// -----------------------------------------------------
// KEYBOARD & API INTEGRATION
// -----------------------------------------------------

// Allow user to press Enter to submit
// Allow user to press Enter to submit
const inputs = document.querySelectorAll('#test_id, #patient_name, #glucose, #doc_search_id');
inputs.forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (userRole === 'doctor') {
                btnAccess.click();
            } else {
                btnCheckpoint.click();
            }
        }
    });
});

// Sprint 1: Checkpoint
btnCheckpoint.addEventListener('click', async () => {
    currentTestId = document.getElementById('test_id').value;
    const name = document.getElementById('patient_name').value;
    const glucose = document.getElementById('glucose').value;

    if (!currentTestId || !name || !glucose) {
        logToTerminal("VALIDATION FAILED", "Fill all required fields.", "AWAITING INPUT", true);
        showToast("Validation Error", "Please fill out all patient fields before vaulting.", "error");
        return;
    }

    const payload = {
        test_id: currentTestId,
        patient_name: name,
        results: { glucose: `${glucose} mg/dL`, status: "Pending" }
    };

    try {
        const res = await fetch('/api/v1/continuity/validation-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        const isError = !res.ok;
        logToTerminal("SPRINT 1: CHECKPOINT RESPONSE", data, data.state || (isError ? "SYSTEM_FAULT" : "CHECKPOINTED"), isError);


    } catch (err) {
        logToTerminal("NETWORK ERROR", err.message, "SYSTEM_FAULT", true);
        showToast("System Fault", err.message, "error");
    }
});


// Sprint 4: Secure Access
// Sprint 4: Secure Access
btnAccess.addEventListener('click', async () => {
    // Grab the ID from the Doctor's search box
    const searchId = document.getElementById('doc_search_id').value;
    
    if (!searchId) {
        if (typeof showToast === "function") showToast("Validation Error", "Please enter a Test ID to view.", "error");
        return;
    }

    try {
        const token = localStorage.getItem('lab_token');
        const res = await fetch(`/api/v1/audit/view/${searchId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        const isError = !res.ok;
        
        logToTerminal("SPRINT 4: SECURE DOCTOR ACCESS", data, data.state || (isError ? "ACCESS_DENIED" : "VIEWED"), isError);
        
        if(res.ok && typeof showToast === "function") {
            showToast("Access Granted", "Medical record retrieved securely.", "success");
        }
    } catch (err) { 
        logToTerminal("NETWORK ERROR", err.message, "SYSTEM_FAULT", true); 
        if (typeof showToast === "function") showToast("System Fault", err.message, "error");
    }
});