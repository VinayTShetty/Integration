const express = require('express');
const path = require('path');
const router = express.Router();
const { markPayment } = require('../services/paymentService');

router.get('/pay', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/payment.html'));
});

// Dummy endpoint to simulate payment success
router.post('/payment-success', markPayment);

module.exports = router;
