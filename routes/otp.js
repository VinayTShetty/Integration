// routes/otp.js

const express = require('express');
const router = express.Router();

const { verifyOTP } = require('../services/otpService');
const { sendWhatsappMessage } = require('../services/whatsapp');

// Renders the OTP input form
router.get('/otp', (req, res) => {
  const phone = req.query.phone;
  if (!phone) return res.status(400).send('Missing phone number');
  res.render('otp', { phone });
});

// Verifies the OTP and returns appropriate HTTP status for frontend animations
router.post('/verify-otp', async (req, res) => {
  try {
    const result = await verifyOTP(req, res, sendWhatsappMessage);

    if (result?.success) {
      return res.sendStatus(200); // ✅ OTP correct
    } else {
      return res.status(401).send('❌ Invalid OTP'); // ❌ OTP wrong
    }
  } catch (error) {
    console.error('❌ Error in /verify-otp:', error);
    return res.sendStatus(500); // ⚠️ Server error
  }
});

module.exports = router;
