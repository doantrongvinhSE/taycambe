const express = require('express');
const sepayController = require('../controllers/sepayController');

const router = express.Router();

router.post('/sepay-payments', sepayController.handlePaymentWebhook);

module.exports = router;
