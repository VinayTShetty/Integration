const supabase = require('./supabaseClient');

/**
 * Generate a 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create and store a new OTP in DB
 */
async function createAndStoreOTP(ownerId) {
  const otp = generateOTP();

  // Invalidate old OTPs
  await supabase
    .from('owner_otps')
    .delete()
    .eq('owner_id', ownerId);

  // Insert new OTP
  const { error } = await supabase
    .from('owner_otps')
    .insert([{ owner_id: ownerId, otp_code: otp }]);

  if (error) {
    console.error('❌ Failed to save OTP:', error);
    throw new Error('Could not save OTP');
  }

  return otp;
}

/**
 * Verify user submitted OTP
 */
async function verifyOTP(req, res, sendWhatsappMessage) {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    return res.status(400).send('Missing mobile or OTP');
  }

  // Find owner
  const { data: owner } = await supabase
    .from('owners')
    .select('id')
    .eq('mobile', mobile)
    .single();

  if (!owner) {
    return res.status(404).send('User not found');
  }

  // Find latest OTP
  const { data: otpEntry } = await supabase
    .from('owner_otps')
    .select('*')
    .eq('owner_id', owner.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!otpEntry || otpEntry.otp_code !== otp || otpEntry.is_verified) {
    return res.status(400).send('Invalid or already used OTP');
  }

  // Mark OTP verified
  await supabase
    .from('owner_otps')
    .update({ is_verified: true })
    .eq('id', otpEntry.id);

  // Mark owner verified
  await supabase
    .from('owners')
    .update({ is_verified: true })
    .eq('id', owner.id);

  // Notify user via WhatsApp
  await sendWhatsappMessage(
    mobile,
    '✅ OTP verified successfully! You may now proceed to payment.'
  );

  console.log(`✅ OTP verified for ${mobile}`);

  res.redirect(`/pay?mobile=${mobile}`);
}

module.exports = {
  generateOTP,
  createAndStoreOTP,
  verifyOTP
};
