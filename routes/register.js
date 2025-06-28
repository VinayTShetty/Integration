const express = require('express');
const path = require('path');
const router = express.Router();
const supabase = require('../services/supabaseClient');
const { sendOTP } = require('../services/otpService');

router.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/register.html'));
});

router.post('/register-submit', async (req, res) => {
  try {
    const { mobile, owner_name, business_name, location, food_type, country } = req.body;

    // Check if owner exists
    let { data: owner, error } = await supabase
      .from('owners')
      .select('*')
      .eq('mobile', mobile)
      .single();

    if (!owner) {
      // Insert new owner
      const { data, error } = await supabase
        .from('owners')
        .insert([{ mobile, owner_name, business_name, location, food_type, country }])
        .select()
        .single();

      owner = data;
    }

    await sendOTP(owner.id, mobile);

    res.json({ message: 'Registration received. OTP sent on WhatsApp.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

module.exports = router;
