const supabase = require('./supabaseClient');
const { sendWhatsappMessage } = require('./whatsapp');

/**
 * Generates a 6-digit OTP as string.
 */
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sends OTP via WhatsApp message with verification link.
 */
async function sendOTP(ownerId, mobile) {
  const otp = generateOtp();

  // Store OTP in DB
  const { error: insertError } = await supabase
    .from('owner_otps')
    .insert([
      { owner_id: ownerId, otp_code: otp }
    ]);

  if (insertError) {
    console.error('❌ Failed to save OTP:', insertError);
    throw new Error('Could not save OTP');
  }

  // Build verification link
  const BASE_URL = process.env.BASE_URL;
  const verifyLink = `${BASE_URL}/otp?phone=${mobile}`;

  // Send WhatsApp message
  await sendWhatsappMessage(
    mobile,
    `✅ Your OTP is ${otp}. Please verify here: ${verifyLink}`
  );

  console.log(`✅ OTP sent to ${mobile}: ${otp}`);
}

/**
 * Verifies submitted OTP from user.
 */
async function verifyOTP(req, res) {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    return res.status(400).json({ error: 'Missing mobile or OTP' });
  }

  // Look up owner
  const { data: owner, error: ownerError } = await supabase
    .from('owners')
    .select('id')
    .eq('mobile', mobile)
    .single();

  if (ownerError || !owner) {
    console.error('❌ Owner not found:', ownerError);
    return res.status(404).json({ error: 'User not found' });
  }

  // Get latest OTP entry
  const { data: otpEntry, error: otpError } = await supabase
    .from('owner_otps')
    .select('*')
    .eq('owner_id', owner.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (otpError || !otpEntry) {
    console.error('❌ OTP entry not found:', otpError);
    return res.status(400).json({ error: 'OTP not found. Please request again.' });
  }

  // Check match
  if (otpEntry.otp_code !== otp || otpEntry.is_verified) {
    return res.status(400).json({ error: 'Invalid or already used OTP' });
  }

  // Mark OTP verified
  await supabase
    .from('owner_otps')
    .update({ is_verified: true })
    .eq('id', otpEntry.id);

  // Mark owner as verified
  await supabase
    .from('owners')
    .update({ is_verified: true })
    .eq('id', owner.id);

  // Send confirmation on WhatsApp
  await sendWhatsappMessage(
    mobile,
    '✅ OTP verified successfully! You may now proceed to payment.'
  );

  console.log(`✅ OTP verified for ${mobile}`);

  // Respond
  res.json({
    message: 'OTP Verified. Proceed to payment.',
    payment_link: `/pay?mobile=${mobile}`
  });
}

module.exports = { sendOTP, verifyOTP };
