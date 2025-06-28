const express = require('express');
const path = require('path');
const router = express.Router();
const supabase = require('../services/supabaseClient');
const { sendOTP } = require('../services/otpService');

router.get('/register', (req, res) => {
  const phone = req.query.phone;
  res.render('register', { phone });
});

router.post('/register-submit', async (req, res) => {
  try {
    const { mobile, owner_name, business_name, location, food_type, country } = req.body;

    // Check if owner exists
    let { data: owner } = await supabase
      .from('owners')
      .select('*')
      .eq('mobile', mobile)
      .single();

    if (!owner) {
      // Insert new owner
      const { data } = await supabase
        .from('owners')
        .insert([{ mobile, owner_name, business_name, location, food_type, country }])
        .select()
        .single();

      owner = data;
    }

    // ✅ Call sendOTP (this handles generate/save/send WhatsApp)
    await sendOTP(owner.id, mobile);

    // ✅ Render OTP page for input
    res.render('otp', { phone: mobile });

  } catch (err) {
    console.error(err);
    res.status(500).send('Registration failed');
  }
});

module.exports = router;
