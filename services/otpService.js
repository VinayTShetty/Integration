const supabase = require('./supabaseClient');
const { sendWhatsappMessage } = require('./whatsapp');

/**
 * Generates a 6-digit OTP as a string.
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sends OTP via WhatsApp WITHOUT extra verification link.
 */
async function sendOTP(ownerId, mobile) {
  const otp = generateOTP();

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

  // ✅ Just send OTP instruction
  await sendWhatsappMessage(
    mobile,
    `✅ Your OTP is ${otp}. Please enter this on the registration website to complete verification.`
  );

  console.log(`✅ OTP sent to ${mobile}: ${otp}`);
}

/**
 * Verifies submitted OTP from user.
 */
async function verifyOTP(req, res) {
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

  // Validate OTP
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

  // Mark OTP and owner as verified
  await supabase
    .from('owner_otps')
    .update({ is_verified: true })
    .eq('id', otpEntry.id);

  await supabase
    .from('owners')
    .update({ is_verified: true })
    .eq('id', owner.id);

  await sendWhatsappMessage(
    mobile,
    '✅ OTP verified successfully! You may now proceed to payment.'
  );

  console.log(`✅ OTP verified for ${mobile}`);

  // ✅ Instead of JSON, redirect to /pay page
  res.redirect(`/pay?mobile=${mobile}`);
}


module.exports = {
  sendOTP,
  verifyOTP
};
