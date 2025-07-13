const supabase = require('./supabaseClient');
const { sendWhatsappMessage } = require('./whatsapp');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET
});

/**
 * Create Razorpay Order
 */
async function createOrder(req, res) {
  try {
    const amount = parseInt(req.query.amount || '500', 10);
    if (!amount) return res.status(400).json({ error: 'Amount required' });

    const options = {
      amount: amount * 100, // INR to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);
    console.log('✅ Razorpay Order Created:', order);
    res.json(order);
  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
}

/**
 * Mark payment as successful
 */
async function markPayment(req, res) {
  const { mobile, razorpay_payment_id, razorpay_order_id } = req.body;

  if (!mobile || !razorpay_payment_id || !razorpay_order_id) {
    return res.status(400).json({ error: 'Missing payment details' });
  }

  // Look up owner
  const { data: owner, error } = await supabase
    .from('owners')
    .select('id')
    .eq('mobile', mobile)
    .single();

  if (!owner) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Insert payment record
  const { error: insertError } = await supabase
    .from('owner_payments')
    .insert({
      owner_id: owner.id,
      payment_status: 'paid',
      razorpay_order_id,
      razorpay_payment_id,
      amount: 500
    });

  if (insertError) {
    console.error('❌ Error inserting payment:', insertError);
    return res.status(500).json({ error: 'Failed to record payment' });
  }

  // Mark owner as payment_done
  await supabase
    .from('owners')
    .update({ payment_done: true })
    .eq('id', owner.id);

  // Notify user on WhatsApp
  await sendWhatsappMessage(
    mobile,
    '✅ Payment successful. You are now registered! Thank you.'
  );

  res.json({ message: 'Payment marked as successful.' });
}

module.exports = { createOrder, markPayment };
