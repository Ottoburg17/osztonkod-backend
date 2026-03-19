// utils/emails/sendEmail.js
const SibApiV3Sdk = require('@getbrevo/brevo');

const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications['api-key'];

apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

module.exports = async ({ to, subject, html }) => {
  console.log("📨 EMAIL KÜLDÉS (BREVO API):", { to, subject });

  try {
    const data = await apiInstance.sendTransacEmail({
      sender: {
        email: process.env.EMAIL_FROM,
        name: "Ösztönkód"
      },
      to: [{ email: to }],
      subject,
      htmlContent: html
    });

    console.log("✅ EMAIL ELKÜLDVE:", data.messageId);
    return data;

  } catch (err) {
    console.error("❌ BREVO ERROR:", err.response?.body || err);
    throw err;
  }
};