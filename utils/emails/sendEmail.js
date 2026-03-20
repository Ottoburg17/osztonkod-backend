// utils/emails/sendEmail.js

const axios = require("axios");

module.exports = async ({ to, subject, html }) => {
  console.log("📨 EMAIL KÜLDÉS (BREVO API):", { to, subject });

  try {
    const res = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          email: process.env.EMAIL_FROM,
          name: "Ösztönkód",
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ EMAIL ELKÜLDVE:", res.data);
    return res.data;

  } catch (err) {
    console.error("❌ BREVO ERROR:", err.response?.data || err.message);
    throw err;
  }
};


