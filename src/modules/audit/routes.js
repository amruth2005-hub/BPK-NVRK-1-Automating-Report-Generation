const express = require('express');
const router = express.Router();
const auditController = require('./controller');
const authMiddleware = require('../../middleware/auth'); // Import the guard!

// We use GET because we are fetching data. We put authMiddleware in the middle!
router.get('/view/:test_id', authMiddleware, auditController.viewReport);

module.exports = router;