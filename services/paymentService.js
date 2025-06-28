const supabase = require('./supabaseClient');
const { sendWhatsappMessage } = require('./whatsapp');

async function markPayment(req, res) {
  const { mobile } = req.body;

  const { data: owner } = await supabase
    .from('owners')
    .select('id')
    .eq('mobile', mobile)
    .single();

  if (!owner) return res.status(404).json({ error: 'User not found' });

  await supabase
    .from('owner_payments')
    .insert({ owner_id: owner.id, payment_status: 'paid', amount: 199 });

  await sendWhatsappMessage(mobile, '✅ Payment successful. You are now registered! Thank you.');

  res.json({ message: 'Payment marked as successful.' });
}

module.exports = { markPayment };
