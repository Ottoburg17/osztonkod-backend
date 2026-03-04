const db = require("../config/db");
const sendEmail = require("../utils/emails/sendEmail");
const invoicePaidEmail = require("../utils/emails/invoicePaidEmail");

exports.markInvoicePaid = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Számla + user adat
    const [[invoice]] = await db.query(
      `
      SELECT 
        i.invoice_number,
        i.total_amount,
        i.invoice_pdf_url,
        u.email,
        u.name
      FROM invoices i
      JOIN users u ON u.id = i.user_id
      WHERE i.id = ?
      `,
      [id]
    );

    if (!invoice) {
      return res.status(404).json({
        error: "Számla nem található",
      });
    }

    // 2️⃣ Státusz frissítés
    await db.query(
      `UPDATE invoices SET invoice_status = 'paid' WHERE id = ?`,
      [id]
    );

    // 3️⃣ Email küldés (nem blokkol kritikus hibát)
    try {
      await sendEmail({
        to: invoice.email,
        ...invoicePaidEmail({
          name: invoice.name || "Felhasználó",
          invoiceNumber: invoice.invoice_number,
          amount: invoice.total_amount,
          pdfUrl: invoice.invoice_pdf_url,
        }),
      });
    } catch (emailErr) {
      console.error("⚠️ Fizetve email hiba:", emailErr);
      // SZÁNDÉKOSAN nem dobunk hibát
    }

    res.json({
      success: true,
      message: "Számla fizetettre állítva és email elküldve",
    });
  } catch (err) {
    console.error("Mark invoice paid error:", err);
    res.status(500).json({
      error: "Nem sikerült fizetettre állítani a számlát",
    });
  }
};
