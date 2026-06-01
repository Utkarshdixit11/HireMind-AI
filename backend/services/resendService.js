const { Resend } = require('resend');

// Initialize Resend with the API key
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Send an email using Resend
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content of the email
 */
const sendEmail = async ({ to, subject, html }) => {
  if (!resend) {
    console.warn('⚠️ RESEND_API_KEY is not set. Falling back to sandbox console logging.');
    console.log(`
==================================================
✉️ [EMAIL SANDBOX]
TO: ${to}
SUBJECT: ${subject}
HTML CONTENT:
--------------------------------------------------
${html}
==================================================
    `);
    return { id: 'sandbox_id', isSandbox: true };
  }

  try {
    // If VITE_API_URL or similar is running locally, we can use onboarding@resend.dev
    // Note: Resend's onboarding@resend.dev only allows sending to the account owner's email.
    const fromAddress = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    
    const { data, error } = await resend.emails.send({
      from: `HireMind AI <${fromAddress}>`,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('❌ Resend API Error details:', error);
      throw new Error(error.message || 'Error sending email via Resend');
    }

    return data;
  } catch (err) {
    console.error('❌ Error executing Resend email send:', err);
    throw err;
  }
};

module.exports = { sendEmail };
