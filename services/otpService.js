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
 * Verify user-submitted OTP and respond for frontend animation
 */
async function verifyOTP(req, res, sendWhatsappMessage) {
  const mobile = req.body.mobile || req.body.phone;
  const otp = req.body.otp;


  if (!mobile || !otp) {
    return { success: false, message: 'Missing mobile or OTP' };
  }

  // Find owner by mobile
  const { data: owner, error: ownerError } = await supabase
    .from('owners')
    .select('id')
    .eq('mobile', mobile)
    .single();

  if (ownerError || !owner) {
    return { success: false, message: 'User not found' };
  }

  // Fetch latest OTP
  const { data: otpEntry, error: otpError } = await supabase
    .from('owner_otps')
    .select('*')
    .eq('owner_id', owner.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (otpError || !otpEntry || otpEntry.otp_code !== otp || otpEntry.is_verified) {
    return { success: false, message: 'Invalid or already used OTP' };
  }

  // Mark OTP as verified
  await supabase
    .from('owner_otps')
    .update({ is_verified: true })
    .eq('id', otpEntry.id);

  // Mark owner as verified
  await supabase
    .from('owners')
    .update({ is_verified: true })
    .eq('id', owner.id);

  // Notify via WhatsApp
  await sendWhatsappMessage(
    mobile,
    '✅ OTP verified successfully! You may now proceed to payment:'
  );

  console.log(`✅ OTP verified for ${mobile}`);

  // Inform caller (routes/otp.js) for animation control
  return { success: true };
}

module.exports = {
  generateOTP,
  createAndStoreOTP,
  verifyOTP
};
