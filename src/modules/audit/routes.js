const express = require('express');
const router = express.Router();
const auditController = require('./controller');
const authMiddleware = require('../../middleware/auth'); // Import the guard!

const rbacMiddleware = require('../../middleware/rbac'); // Import our new RBAC guard

// 1. Check if token is valid (authMiddleware)
// 2. Check if user is a doctor (rbacMiddleware('doctor'))
// 3. Deliver the report (auditController.viewReport)
router.get('/view/:test_id', authMiddleware, rbacMiddleware('doctor'), auditController.viewReport);

module.exports = router;