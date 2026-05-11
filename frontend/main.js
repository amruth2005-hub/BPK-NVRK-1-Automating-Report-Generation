// -----------------------------------------------------
// SECURITY GATEWAY
// -----------------------------------------------------
if (!localStorage.getItem('lab_token')) {
    window.location.href = 'login.html'; // Kick out unauthenticated users
}

// Optional: Add a logout function if you want
function logout() {
    localStorage.removeItem('lab_token');
    localStorage.removeItem('tech_id');
    window.location.href = 'login.html';
}

// UI Elements
const consoleOutput = document.getElementById('consoleOutput');
const uiState = document.getElementById('ui-state');
const btnCheckpoint = document.getElementById('btn-checkpoint');
const btnGenerate = document.getElementById('btn-generate');
const btnRoute = document.getElementById('btn-route');
const btnAccess = document.getElementById('btn-access');

let currentTestId = "";

// -----------------------------------------------------
// GSAP INITIAL LOAD ANIMATIONS
// -----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
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
const inputs = document.querySelectorAll('#test_id, #patient_name, #glucose');
inputs.forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            btnCheckpoint.click();
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

        if (res.status === 201) unlockButton(btnGenerate); // Unlock next step
    } catch (err) { 
        logToTerminal("NETWORK ERROR", err.message, "SYSTEM_FAULT", true); 
    }
});

// Sprint 2: Generate Report
btnGenerate.addEventListener('click', async () => {
    try {
        const res = await fetch('/api/v1/reports/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test_id: currentTestId })
        });
        const data = await res.json();
        
        const isError = !res.ok;
        logToTerminal("SPRINT 2: REPORT GENERATED", data, data.state || (isError ? "SYSTEM_FAULT" : "GENERATED"), isError);

        if (res.status === 201) unlockButton(btnRoute); // Unlock next step
    } catch (err) { 
        logToTerminal("NETWORK ERROR", err.message, "SYSTEM_FAULT", true); 
    }
});

// Sprint 3: Route Priority
btnRoute.addEventListener('click', async () => {
    try {
        const res = await fetch('/api/v1/priority/route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test_id: currentTestId })
        });
        const data = await res.json();
        
        const isError = !res.ok;
        logToTerminal("SPRINT 3: TRIAGE & ROUTE", data, data.state || (isError ? "SYSTEM_FAULT" : "ROUTED"), isError);

        if (res.status === 200) unlockButton(btnAccess); // Unlock next step
    } catch (err) { 
        logToTerminal("NETWORK ERROR", err.message, "SYSTEM_FAULT", true); 
    }
});

// Sprint 4: Secure Access
btnAccess.addEventListener('click', async () => {
    try {
        const res = await fetch(`/api/v1/audit/view/${currentTestId}`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ARCHITECT-SECURE-TOKEN' }
        });
        const data = await res.json();
        
        const isError = !res.ok;
        logToTerminal("SPRINT 4: SECURE DOCTOR ACCESS", data, data.state || (isError ? "SYSTEM_FAULT" : "VIEWED"), isError);
    } catch (err) { 
        logToTerminal("NETWORK ERROR", err.message, "SYSTEM_FAULT", true); 
    }
});