const axios = require('axios');
const supabase = require('./supabaseClient');

const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const BASE_URL = process.env.BASE_URL || 'https://yourdomain.com';

async function sendWhatsappMessage(to, text) {
  console.log('📤 [sendWhatsappMessage] To:', to);
  console.log('📤 [sendWhatsappMessage] Text:', text);

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        },
      }
    );

    console.log('✅ WhatsApp API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ WhatsApp API error:', error.response?.data || error.message);
    throw error;
  }
}


// ✅ GET /webhook verification for WhatsApp
function verifyWebhook(req, res) {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token && mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ WEBHOOK_VERIFIED');
    res.status(200).send(challenge);
  } else {
    console.warn('❌ Webhook verification failed');
    res.sendStatus(403);
  }
}

// ✅ POST /webhook for incoming messages
async function handleIncomingMessage(req, res) {
  try {
    const changes = req.body?.entry?.[0]?.changes?.[0];
    const messages = changes?.value?.messages;

    if (!messages || messages.length === 0) {
      console.log('📥 Ignored non-message event');
      return res.sendStatus(200);
    }

    const message = messages[0];
    const from = message.from;
    const text = message.text?.body?.toLowerCase();

    console.log(`📥 Incoming message from ${from}: ${text}`);

    if (text === 'hi') {
      // Check if user exists in Supabase
      const { data: existing } = await supabase
        .from('owners')
        .select('*')
        .eq('mobile', from)
        .single();

      if (existing) {
        await sendWhatsappMessage(from, '🎉 You are already registered!');
      } else {
        await sendWhatsappMessage(from, `👋 Please register here:\n${BASE_URL}/register?phone=${from}`);
      }
    } else {
      await sendWhatsappMessage(from, `🤖 Sorry, I don't understand: "${text}". Please reply with "Hi" to start registration.`);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Error in handleIncomingMessage:', error);
    res.sendStatus(500);
  }
}

module.exports = {
  verifyWebhook,
  handleIncomingMessage,
  sendWhatsappMessage
};
