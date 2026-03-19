// utils/emails/sendEmail.js

const Brevo = require('@getbrevo/brevo');

const apiInstance = new Brevo.TransactionalEmailsApi();

apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

module.exports = async ({ to, subject, html }) => {
  console.log("📨 EMAIL KÜLDÉS (BREVO API):", { to, subject });

  try {
    const result = await apiInstance.sendTransacEmail({
      sender: {
        email: process.env.EMAIL_FROM,
        name: "Ösztönkód",
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    });

    console.log("✅ EMAIL ELKÜLDVE:", result);
    return result;

  } catch (err) {
    console.error("❌ BREVO ERROR:", err.response?.body || err);
    throw err;
  }
};