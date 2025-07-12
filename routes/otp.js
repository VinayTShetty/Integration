const express = require('express');
const router = express.Router();

const { verifyOTP } = require('../services/otpService');
const { sendWhatsappMessage } = require('../services/whatsapp');

router.get('/otp', (req, res) => {
  const phone = req.query.phone;
  if (!phone) return res.status(400).send('Missing phone number');
  res.render('otp', { phone });
});

router.post('/verify-otp', (req, res) => verifyOTP(req, res, sendWhatsappMessage));

module.exports = router;
