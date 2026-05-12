require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const startArchiver = require('./utils/archiver');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

connectDB();
startArchiver();

// Global Socket accessible to our routes
app.set('socketio', io);

io.on('connection', (socket) => {
    console.log('📡 UI Dashboard connected to telemetry stream.');
});

// Route Registration
app.use('/api/v1/auth', require('./modules/auth/routes'));
app.use('/api/v1/continuity', require('./modules/continuity/routes'));
app.use('/api/v1/reports', require('./modules/reports/routes'));
app.use('/api/v1/priority', require('./modules/priority/routes'));
app.use('/api/v1/audit', require('./modules/audit/routes'));

// ==========================================
// 🛡️ BULLETPROOF UI FALLBACK ROUTE
// ==========================================
// This tells Render: "If someone visits the website, give them the login page!"
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

const PORT = process.env.PORT || 3000;

// IMPORTANT: Change app.listen to server.listen
server.listen(PORT, () => {
    console.log(`🚀 Senior Architect: System live on port ${PORT}`);
    console.log(`📡 Telemetry Socket initialized.`);
});