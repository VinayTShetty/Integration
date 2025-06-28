require('dotenv').config();
const express = require('express');
const path = require('path');
const otpRoutes = require('./routes/otp');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log environment
console.log('✅ Server starting with:');
console.log(`PORT = ${process.env.PORT}`);
console.log(`SUPABASE_URL = ${process.env.SUPABASE_URL}`);
console.log(`RAZORPAY_KEY_ID = ${process.env.RAZORPAY_KEY_ID}`);
console.log(`WHATSAPP_PHONE_ID = ${process.env.WHATSAPP_PHONE_ID}`);

// Serve static public files
app.use('/public', express.static(path.join(__dirname, 'public')));

// Load routes
app.use('/', require('./routes/webhook'));
app.use('/', require('./routes/register'));
app.use('/', require('./routes/otp'));
app.use('/', require('./routes/payment'));
app.use('/', otpRoutes);

// Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server listening on port ${PORT}`));
