const bcrypt = require('bcryptjs');
const OTP = require('../models/OTP');
const { sendEmail } = require('./resendService');

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const COOLDOWN_MS = 60 * 1000; // 1 minute resend cooldown
const MAX_ATTEMPTS = 5;

/**
 * Generate a secure 6-digit numeric OTP.
 * @returns {string}
 */
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

/**
 * Delete previous OTPs, hash the new OTP, and store it in the database.
 * @param {string} email
 * @param {string} otp
 * @returns {Promise<Object>}
 */
const storeOtp = async (email, otp) => {
  const emailLower = email.toLowerCase();
  
  // 1. Delete previous OTPs for this email
  await OTP.deleteMany({ email: emailLower });

  // 2. Hash the OTP using bcrypt
  const hashedOtp = await bcrypt.hash(otp, 10);

  // 3. Create the new OTP record in the database
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  const otpRecord = await OTP.create({
    email: emailLower,
    otp: hashedOtp,
    attempts: 0,
    expiresAt,
  });

  return otpRecord;
};

/**
 * Check if the last OTP sent for this email is within the resend cooldown window.
 * @param {string} email
 * @returns {Promise<boolean>}
 */
const isOtpInCooldown = async (email) => {
  const emailLower = email.toLowerCase();
  const lastOtp = await OTP.findOne({ email: emailLower });
  if (!lastOtp) return false;

  const timePassed = Date.now() - new Date(lastOtp.createdAt).getTime();
  return timePassed < COOLDOWN_MS;
};

/**
 * Verify a user's input OTP. Handles expiration, maximum attempts, and hashes comparison.
 * @param {string} email
 * @param {string} inputOtp
 * @returns {Promise<{valid: boolean, reason?: string}>}
 */
const verifyOtp = async (email, inputOtp) => {
  const emailLower = email.toLowerCase();
  const otpRecord = await OTP.findOne({ email: emailLower });

  if (!otpRecord) {
    return { valid: false, reason: 'No verification session found. Please request a new code.' };
  }

  // Check expiration
  if (new Date() > new Date(otpRecord.expiresAt)) {
    await OTP.deleteOne({ _id: otpRecord._id });
    return { valid: false, reason: 'Verification code has expired. Please request a new one.' };
  }

  // Check max attempts
  if (otpRecord.attempts >= MAX_ATTEMPTS) {
    await OTP.deleteOne({ _id: otpRecord._id });
    return { valid: false, reason: 'Too many failed verification attempts. Please request a new OTP.' };
  }

  // Compare input OTP with hashed OTP
  const isMatch = await bcrypt.compare(String(inputOtp).trim(), otpRecord.otp);
  if (!isMatch) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    
    const remaining = MAX_ATTEMPTS - otpRecord.attempts;
    if (remaining <= 0) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return { valid: false, reason: 'Too many failed verification attempts. This OTP has been invalidated.' };
    }
    return { valid: false, reason: `Incorrect code. ${remaining} attempt(s) remaining.` };
  }

  // Valid OTP: delete OTP record and return success
  await OTP.deleteOne({ _id: otpRecord._id });
  return { valid: true };
};

/**
 * Send an OTP verification email to the user using the Resend service.
 * @param {string} email
 * @param {string} otp
 * @returns {Promise<Object>}
 */
const sendOtpEmail = async (email, otp) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify your Email - HireMind AI</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #0a0b10; margin: 0; padding: 0; color: #e2e8f0; }
        .wrapper { max-width: 500px; margin: 40px auto; background: #13141f;
          border: 1px solid rgba(255,255,255,0.06); border-radius: 24px; overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
        .header { background: linear-gradient(135deg, #1e1b4b 0%, #0a0b10 100%);
          padding: 36px 40px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .logo { font-size: 1.6rem; font-weight: 800; color: #ffffff; letter-spacing: -0.03em; }
        .logo span { color: #6366f1; }
        .body { padding: 40px; }
        .greeting { font-size: 1.15rem; color: #ffffff; margin-bottom: 12px; font-weight: 600; letter-spacing: -0.01em; }
        .desc { font-size: 0.9rem; color: #94a3b8; margin-bottom: 32px; line-height: 1.6; }
        .otp-box { background: rgba(99, 102, 241, 0.06); border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 16px; padding: 26px 20px; text-align: center; margin-bottom: 28px; }
        .otp-label { font-size: 0.72rem; color: #94a3b8; text-transform: uppercase;
          letter-spacing: 0.12em; margin-bottom: 10px; font-weight: 600; }
        .otp-code { font-size: 2.8rem; font-weight: 700; letter-spacing: 0.3em;
          color: #818cf8; font-family: 'Courier New', Courier, monospace; margin-left: 0.3em; }
        .expiry { font-size: 0.8rem; color: #f87171; text-align: center; margin-bottom: 24px; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 4px; }
        .warning { background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.15);
          border-radius: 12px; padding: 14px 18px; font-size: 0.8rem;
          color: #fbbf24; line-height: 1.55; }
        .footer { background: rgba(0,0,0,0.25); padding: 22px 40px; text-align: center;
          font-size: 0.72rem; color: #475569; border-top: 1px solid rgba(255,255,255,0.06); }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <div class="logo">HireMind <span>AI</span></div>
        </div>
        <div class="body">
          <p class="greeting">Verify your email address</p>
          <p class="desc">
            Thank you for starting your registration with HireMind AI. Please use the following 6-digit verification code to complete your signup process. 
            This code is strictly active for <strong>5 minutes</strong>.
          </p>
          <div class="otp-box">
            <div class="otp-label">One-Time Code</div>
            <div class="otp-code">${otp}</div>
          </div>
          <div class="expiry">
            ⏱ <span>This code expires in 5 minutes</span>
          </div>
          <div class="warning">
            🔒 <strong>Security Warning:</strong> Keep this code confidential. If you didn't initiate this request, you can safely ignore this email.
          </div>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} HireMind AI · Powered by Resend
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `${otp} is your HireMind AI verification code`,
    html,
  });
};

module.exports = {
  generateOtp,
  storeOtp,
  verifyOtp,
  sendOtpEmail,
  isOtpInCooldown,
};
