const express = require('express');
const router = express.Router();
const { createOrder, markPayment } = require('../services/paymentService');

// Create Razorpay order (server-side)
router.get('/create-order', createOrder);

// Mark payment as successful (client-callback)
router.post('/payment-success', markPayment);

// Razorpay checkout page
router.get('/pay', (req, res) => {
  const mobile = req.query.mobile;
  if (!mobile) return res.status(400).send('Missing mobile number');
  res.render('payment', { mobile });
});

// Static thank-you page
router.get('/success', (req, res) => {
  res.send('✅ Payment successful! Thank you.');
});

module.exports = router;
