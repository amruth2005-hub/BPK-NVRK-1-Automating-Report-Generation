require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

const app = express();

// Body Parser Middleware
app.use(express.json());

// Initialize Database
connectDB();

// Route Registration
// Note: Ensure src/modules/continuity/routes.js exists!
app.use('/api/v1/continuity', require('./modules/continuity/routes'));
app.use('/api/v1/reports', require('./modules/reports/routes'));
app.use('/api/v1/priority', require('./modules/priority/routes'));
app.use('/api/v1/audit', require('./modules/audit/routes'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Senior Architect: System live on port ${PORT}`);
    console.log(`📡 Awaiting Sprint 1 Validation Events...`);
});
