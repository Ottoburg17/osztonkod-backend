// controllers/manualInvoiceController.js

const db = require("../config/db");
const sendEmail = require("../utils/emails/sendEmail");
const invoiceReadyEmail = require("../utils/emails/invoiceReadyEmail");


/* ======================================================
   ADMIN – MANUÁLIS SZÁMLA LÉTREHOZÁSA
   ====================================================== */
exports.createManualInvoice = async (req, res) => {
  const pdfUrl = req.file
    ? `/uploads/invoices/${req.file.filename}`
    : null;

  try {
    const {
      user_email,
      invoice_number,
      service_name,
      invoice_date,
      total_amount,
    } = req.body;

    /* ===============================
       1️⃣ Kötelező mezők ellenőrzése
    =============================== */
    if (
      !user_email ||
      !invoice_number ||
      !service_name ||
      !invoice_date ||
      !total_amount
    ) {
      return res.status(400).json({
        error: "Hiányzó kötelező mező",
      });
    }

    /* ===============================
       2️⃣ USER KERESÉS EMAIL ALAPJÁN
    =============================== */
    const [[user]] = await db.query(
      `SELECT id, email, name FROM users WHERE email = ?`,
      [user_email]
    );

    if (!user) {
      return res.status(404).json({
        error: "Nem létező felhasználó email",
      });
    }

    const userId = user.id;

    /* ===============================
       3️⃣ SZÁMLA MENTÉSE
    =============================== */
    await db.query(
      `
      INSERT INTO invoices
      (
        user_id,
        invoice_number,
        service_name,
        invoice_date,
        total_amount,
        currency,
        invoice_pdf_url,
        invoice_status
      )
      VALUES (?, ?, ?, ?, ?, 'HUF', ?, 'issued')
      `,
      [
        userId,
        invoice_number,
        service_name,
        invoice_date,
        total_amount,
        pdfUrl
      ]
    );

    /* ===============================
       4️⃣ EMAIL KÜLDÉS
    =============================== */
    try {
      await sendEmail({
        to: user.email,
        ...invoiceReadyEmail({
          name: user.name || "Felhasználó",
          invoiceNumber: invoice_number,
          pdfUrl,
        }),
      });

      // státusz frissítése
      await db.query(
        `
        UPDATE invoices
        SET invoice_status = 'sent'
        WHERE invoice_number = ?
        `,
        [invoice_number]
      );

    } catch (emailErr) {
      console.error("⚠️ Email küldési hiba:", emailErr);
      // Nem dobunk hibát – a számla már mentve van
    }

    res.json({
      success: true,
      message: "Manuális számla rögzítve és email elküldve",
    });

  } catch (err) {
    console.error("Create manual invoice error:", err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Ez a számlaszám már létezik",
      });
    }

    res.status(500).json({
      error: "Nem sikerült menteni a számlát",
    });
  }
};



/* ======================================================
   USER – SAJÁT SZÁMLÁK LEKÉRÉSE
   ====================================================== */
exports.getUserInvoices = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `
      SELECT
        id,
        invoice_number,
        service_name,
        invoice_date,
        total_amount,
        currency,
        invoice_pdf_url,
        invoice_status
      FROM invoices
      WHERE user_id = ?
      ORDER BY invoice_date DESC
      `,
      [userId]
    );

    res.json(rows);

  } catch (err) {
    console.error("Get user invoices error:", err);
    res.status(500).json({
      error: "Nem sikerült lekérni a számlákat",
    });
  }
};