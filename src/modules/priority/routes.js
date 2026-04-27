const express = require('express');
const router = express.Router();
const priorityController = require('./controller');

// Endpoint to trigger the priority router
router.post('/route', priorityController.routeReport);

module.exports = router;