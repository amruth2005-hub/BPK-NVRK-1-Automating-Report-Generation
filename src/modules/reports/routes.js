const express = require('express');
const router = express.Router();
const reportsController = require('./controller');

router.post('/generate', reportsController.generateReport);

module.exports = router;