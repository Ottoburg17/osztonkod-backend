// utils/emails/sendEmail.js
const nodemailer = require("nodemailer");

console.log("📧 EMAIL CONFIG:", {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  user: process.env.EMAIL_USER,
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

// ✅ SMTP kapcsolat teszt – egyszer
let smtpVerified = false;
if (!smtpVerified) {
  transporter.verify((err) => {
    if (err) {
      console.error("❌ SMTP HIBA:", err);
    } else {
      smtpVerified = true;
      console.log("✅ SMTP OK – email küldhető");
    }
  });
}

module.exports = async ({ to, subject, html }) => {
  console.log("📨 EMAIL KÜLDÉS:", { to, subject });

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });

  console.log("✅ EMAIL ELKÜLDVE:", info.messageId);
  return info;
};


