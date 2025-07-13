// services/whatsapp.js

const axios = require('axios');
const supabase = require('./supabaseClient');

const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const BASE_URL = process.env.BASE_URL || 'https://yourdomain.com';

/**
 * ✅ Send a WhatsApp text message
 */
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

/**
 * ✅ GET /webhook - WhatsApp verification
 */
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

/**
 * ✅ POST /webhook - Main logic for handling incoming messages
 */
async function handleIncomingMessage(req, res) {
  try {
    const changes = req.body?.entry?.[0]?.changes?.[0];
    const messages = changes?.value?.messages;

    if (!messages || messages.length === 0) {
      return res.sendStatus(200);
    }

    const message = messages[0];
    const from = message.from;
    const messageId = message.id;
    const text = message.text?.body?.trim().toLowerCase();

    console.log(`📥 Incoming message from ${from}: ${text}`);

    // 1️⃣ Deduplication check
    const { data: existing } = await supabase
      .from('processed_messages')
      .select('id')
      .eq('message_id', messageId)
      .single();

    if (existing) {
      console.log('⚠️ Duplicate message ignored:', messageId);
      return res.sendStatus(200);
    }

    // 2️⃣ Store message ID
    await supabase
      .from('processed_messages')
      .insert({ message_id: messageId, sender: from });

    // 3️⃣ Business logic
    if (text === 'hi') {
      const { data: owner } = await supabase
        .from('owners')
        .select('*')
        .eq('mobile', from)
        .single();

      if (!owner) {
        await sendWhatsappMessage(
          from,
          `👋 Welcome! Register here:\n${BASE_URL}/register?phone=${from}`
        );
        return res.sendStatus(200);
      }

      if (!owner.is_verified) {
        await supabase.from('owner_otps').delete().eq('owner_id', owner.id);
        await supabase.from('owners').delete().eq('id', owner.id);

        await sendWhatsappMessage(
          from,
          `⚠️ Your previous registration was not completed. Register again:\n${BASE_URL}/register?phone=${from}`
        );
        return res.sendStatus(200);
      }

      if (!owner.payment_done) {
        await sendWhatsappMessage(
          from,
          `💰 Your registration is verified! Complete payment here:\n${BASE_URL}/pay?mobile=${from}`
        );
        return res.sendStatus(200);
      }

      await sendWhatsappMessage(
        from,
        `🎉 You are already fully registered and paid. Thank you!`
      );

      return res.sendStatus(200);
    }

    await sendWhatsappMessage(
      from,
      `🤖 Sorry, I don't understand: "${text}". Reply "Hi" to start.`
    );

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
