const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json());

// ✅ Log important environment variables at startup
console.log('✅ Server starting with the following configuration:');
console.log(`PORT = ${process.env.PORT}`);
console.log(`SUPABASE_URL = ${process.env.SUPABASE_URL}`);
console.log(`SUPABASE_KEY = ${process.env.SUPABASE_KEY}`);
console.log(`RAZORPAY_KEY_ID = ${process.env.RAZORPAY_KEY_ID}`);
console.log(`RAZORPAY_SECRET = ${process.env.RAZORPAY_SECRET}`);
console.log(`WHATSAPP_TOKEN = ${process.env.WHATSAPP_TOKEN}`);
console.log(`WHATSAPP_PHONE_ID = ${process.env.WHATSAPP_PHONE_ID}`);
console.log(`WHATSAPP_VERIFY_TOKEN = ${process.env.WHATSAPP_VERIFY_TOKEN}`);
console.log('✅ Configuration loaded successfully.\n');

// ✅ GET for webhook verification
app.get('/webhook', (req, res) => {
  console.log('📥 [GET] /webhook called');
  console.log('👉 Query Params:', req.query);

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      console.warn('❌ Verification failed: Invalid token');
      res.sendStatus(403);
    }
  } else {
    console.warn('⚠️ Missing mode or token in query');
    res.sendStatus(400);
  }
});

// ✅ POST for incoming messages
app.post('/webhook', (req, res) => {
  console.log('📥 [POST] /webhook called');
  console.log('👉 Body:', JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

// ✅ Start server on port from .env
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
