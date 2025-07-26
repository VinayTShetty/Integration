// routes/register.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../services/supabaseClient');
const { createAndStoreOTP } = require('../services/otpService');
const { sendWhatsappMessage } = require('../services/whatsapp');
const path = require('path');

// Use multer to store file in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// GET /register
router.get('/register', (req, res) => {
  const phone = req.query.phone;
  res.render('register', { phone });
});

// POST /register-submit
router.post('/register-submit', upload.single('logo'), async (req, res) => {
  try {
    const {
      mobile,
      owner_name,
      business_name,
      location,
      country,
      service_selected
    } = req.body;

    if (!mobile || !owner_name || !business_name || !location || !country || !service_selected) {
      return res.status(400).send('❌ Missing required fields.');
    }

    // Check if owner exists
    let { data: owner, error } = await supabase
      .from('owners')
      .select('*')
      .eq('mobile', mobile)
      .single();

    let logoUrl = '';

    // If new file is uploaded
    if (req.file) {
      const fileExt = path.extname(req.file.originalname);
      const fileName = `owner_logos/${mobile}_${Date.now()}${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        console.error('❌ Logo upload failed:', uploadError);
        return res.status(500).send('Logo upload failed');
      }

      // Get public URL
      const { data: urlData } = supabase
        .storage
        .from('logos')
        .getPublicUrl(fileName);

      logoUrl = urlData.publicUrl;
    }

    // Insert owner if doesn't exist
    if (!owner) {
      const { data: insertData, error: insertError } = await supabase
        .from('owners')
        .insert([
          {
            mobile,
            owner_name,
            business_name,
            location,
            country,
            service_selected,
            is_verified: false,
            payment_done: false,
            logo: logoUrl
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Failed to insert owner:', insertError);
        return res.status(500).send('Error creating owner');
      }

      owner = insertData;
    }

    // Always generate NEW OTP
    const otp = await createAndStoreOTP(owner.id);

    const message = `✅ Thank you for registering for ${service_selected}!\nYour OTP is ${otp}.`;

    await sendWhatsappMessage(mobile, message);

    console.log(`✅ OTP sent to ${mobile}: ${otp}`);

    res.render('otp', { phone: mobile });

  } catch (err) {
    console.error('❌ Error in /register-submit:', err);
    res.status(500).send('Registration failed');
  }
});

module.exports = router;
