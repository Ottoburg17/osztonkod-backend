const express = require("express");
const router = express.Router();
const sendEmail = require("../utils/emails/sendEmail");

router.post("/send-email", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Hiányzó adatok." });
    }

    await sendEmail({
      to: process.env.EMAIL_USER,
      subject: "Új kapcsolatfelvételi üzenet",
      html: `
        <h3>Új üzenet érkezett</h3>
        <p><strong>Név:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Üzenet:</strong></p>
        <p>${message}</p>
      `,
    });

    res.json({ message: "Üzenet elküldve!" });
  } catch (err) {
    console.error("CONTACT EMAIL ERROR:", err);
    res.status(500).json({ error: "Email küldési hiba." });
  }
});

module.exports = router;
