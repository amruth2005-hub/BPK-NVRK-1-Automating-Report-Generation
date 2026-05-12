const express = require('express');
const router = express.Router();
const continuityController = require('./controller');

router.post('/validation-event', continuityController.receiveValidationEvent);

module.exports = router;