const express = require('express');
const router = express.Router();
const continuityController = require('./controller');

router.post('/validation-event', continuityController.processValidation);

module.exports = router;