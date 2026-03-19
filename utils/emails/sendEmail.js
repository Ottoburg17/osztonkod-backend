// utils/emails/sendEmail.js
const nodemailer = require("nodemailer");

console.log("📧 EMAIL CONFIG:", {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS ? "OK ✅" : "HIÁNYZIK ❌",
  from: process.env.EMAIL_FROM,
});

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: Number(process.env.EMAIL_PORT) === 465, // 🔑 fontos
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});



module.exports = async ({ to, subject, html }) => {
  console.log("📨 EMAIL KÜLDÉS:", { to, subject });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
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


