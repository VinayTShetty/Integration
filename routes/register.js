const express = require('express');
const path = require('path');
const router = express.Router();
const supabase = require('../services/supabaseClient');
const { createAndStoreOTP } = require('../services/otpService');
const { sendWhatsappMessage } = require('../services/whatsapp');

router.get('/register', (req, res) => {
  const phone = req.query.phone;
  res.render('register', { phone });
});

router.post('/register-submit', async (req, res) => {
  try {
    const { mobile, owner_name, business_name, location, food_type, country } = req.body;

    if (!mobile) {
      return res.status(400).send('Missing mobile number');
    }

    // Check if owner exists
    let { data: owner, error } = await supabase
      .from('owners')
      .select('*')
      .eq('mobile', mobile)
      .single();

    if (!owner) {
      // Insert new owner
      const { data, error: insertError } = await supabase
        .from('owners')
        .insert([
          {
            mobile,
            owner_name,
            business_name,
            location,
            food_type,
            country,
            is_verified: false,
            payment_done: false
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Failed to insert owner:', insertError);
        return res.status(500).send('Error creating owner');
      }

      owner = data;
    }

    // Always generate NEW OTP
    const otp = await createAndStoreOTP(owner.id);

    // ✅ WhatsApp message WITHOUT link
    const message = `✅ Thank you for registering!\nYour OTP is ${otp}.`;

    await sendWhatsappMessage(mobile, message);

    console.log(`✅ OTP sent to ${mobile}: ${otp}`);

    // ✅ Render OTP input page
    res.render('otp', { phone: mobile });

  } catch (err) {
    console.error('❌ Error in /register-submit:', err);
    res.status(500).send('Registration failed');
  }
});

module.exports = router;
