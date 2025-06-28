const express = require('express');
const router = express.Router();
const { verifyOTP } = require('../services/otpService');

/**
 * ✅ GET /otp
 * Renders the OTP input form.
 * Expects ?phone= param in URL.
 */
router.get('/otp', (req, res) => {
  const phone = req.query.phone;
  if (!phone) {
    return res.status(400).send('Missing phone number');
  }
  // Renders views/otp.ejs with phone value
  res.render('otp', { phone });
});

/**
 * ✅ POST /verify-otp
 * Handles OTP verification form submission.
 * Delegates to otpService.verifyOTP(req, res)
 */
router.post('/verify-otp', async (req, res) => {
  await verifyOTP(req, res);
});


module.exports = router;
