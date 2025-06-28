const express = require('express');
const path = require('path');
const router = express.Router();
const supabase = require('../services/supabaseClient');
const { sendWhatsappMessage } = require('../services/whatsapp');

// Serve OTP form
router.get('/otp', (req, res) => {
  const phone = req.query.phone;
  if (!phone) return res.status(400).send('Missing phone');

  // Use simple templating: replace {{phone}} in HTML
  const fs = require('fs');
  let html = fs.readFileSync(path.join(__dirname, '../views/otp.html'), 'utf8');
  html = html.replace('{{phone}}', phone);
  res.send(html);
});

// Handle OTP verification
router.post('/otp-submit', async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).send('Missing phone or OTP');

  // Check OTP
  const { data, error } = await supabase
    .from('owners')
    .select('id')
    .eq('mobile', phone)
    .single();

  if (!data) return res.status(400).send('User not found');

  const ownerId = data.id;

  const { data: otpRecord } = await supabase
    .from('owner_otps')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('otp_code', otp)
    .eq('is_verified', false)
    .single();

  if (!otpRecord) {
    return res.status(400).send('Invalid OTP');
  }

  // Mark OTP verified
  await supabase
    .from('owner_otps')
    .update({ is_verified: true })
    .eq('id', otpRecord.id);

  // Mark owner verified
  await supabase
    .from('owners')
    .update({ is_verified: true })
    .eq('id', ownerId);

  // Notify user on WhatsApp
  await sendWhatsappMessage(phone, '✅ Your OTP was verified successfully! Proceed to payment.');

  res.send('✅ OTP verified! You can close this page.');
});

module.exports = router;
