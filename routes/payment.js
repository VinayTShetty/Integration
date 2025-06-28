const express = require('express');
const path = require('path');
const router = express.Router();
const { markPayment } = require('../services/paymentService');

// ✅ Serve the payment page with mobile number
router.get('/pay', (req, res) => {
  const mobile = req.query.mobile;
  if (!mobile) return res.status(400).send('Missing mobile');

  // Renders views/payment.ejs and passes mobile
  res.render('payment', { mobile });
});

// ✅ Simple Payment Success page
router.get('/success', (req, res) => {
  res.send('✅ Payment successful! Thank you.');
});

// ✅ Dummy endpoint to simulate server-side payment success update
router.post('/payment-success', markPayment);

module.exports = router;
