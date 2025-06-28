require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();

// ✅ Logging environment variables on startup
console.log('✅ Server starting with:');
console.log(`PORT = ${process.env.PORT}`);
console.log(`SUPABASE_URL = ${process.env.SUPABASE_URL}`);
console.log(`RAZORPAY_KEY_ID = ${process.env.RAZORPAY_KEY_ID}`);
console.log(`WHATSAPP_PHONE_ID = ${process.env.WHATSAPP_PHONE_ID}`);
console.log(`BASE_URL = ${process.env.BASE_URL}`);
console.log('✅ Environment loaded.\n');

// ✅ Express Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ Static Public Files
app.use('/public', express.static(path.join(__dirname, 'public')));

// ✅ Routes
app.use('/', require('./routes/webhook'));
app.use('/', require('./routes/register'));
app.use('/', require('./routes/otp'));
app.use('/', require('./routes/payment'));

// ✅ Server Startup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
