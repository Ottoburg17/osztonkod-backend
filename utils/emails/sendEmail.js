// utils/emails/sendEmail.js
const nodemailer = require("nodemailer");

module.exports = async ({ to, subject, html }) => {
  console.log("📧 EMAIL CONFIG:", {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ? "OK ✅" : "HIÁNYZIK ❌",
    from: process.env.SMTP_FROM,
  });

  console.log("📨 EMAIL KÜLDÉS:", { to, subject });

  try {
    // ✅ IDE KELL TENNI
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });

    console.log("✅ EMAIL ELKÜLDVE:", info.messageId);
    return info;

  } catch (err) {
    console.error("❌ EMAIL SEND ERROR:", err);
    throw err;
  }
};

