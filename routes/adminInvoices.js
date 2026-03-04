const express = require("express");
const router = express.Router();
const db = require("../config/db");

const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

const manualInvoiceController = require("../controllers/manualInvoiceController");
const {
  markInvoicePaid,
} = require("../controllers/adminInvoiceStatusController");


const multer = require("multer");
const path = require("path");
const fs = require("fs");


const uploadDir = path.join(__dirname, "../uploads/invoices");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}


const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });


/* ======================================================
   ADMIN – SZÁMLÁZÁSRA VÁRÓ ELŐFIZETÉSEK
   GET /api/admin/invoices/pending
   ====================================================== */
router.get("/invoices/pending", auth, admin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        s.id AS subscription_id,
        s.product_slug,
        s.started_at,
        s.expires_at,
        s.invoice_status,

        u.id AS user_id,
        u.email,
        u.billing_name,
        u.billing_country,
        u.billing_zip,
        u.billing_city,
        u.billing_address,
        u.billing_tax_number,
        u.billing_is_company

      FROM subscriptions s
      JOIN users u ON u.id = s.user_id
      WHERE
        s.status = 'active'
        AND s.invoice_status = 'pending'
      ORDER BY s.started_at ASC
    `);

    res.json({
      count: rows.length,
      items: rows,
    });
  } catch (err) {
    console.error("Admin invoice list error:", err);
    res.status(500).json({
      error: "Nem sikerült lekérni a számlázási listát",
    });
  }
});

/* ======================================================
   ADMIN – SZÁMLA KIÁLLÍTVA JELÖLÉS (subscription)
   POST /api/admin/invoices/:id/mark-issued
   ====================================================== */
router.post("/invoices/:id/mark-issued", auth, admin, async (req, res) => {
  const { id } = req.params;
  const { invoice_number } = req.body;

  if (!invoice_number) {
    return res.status(400).json({
      error: "invoice_number kötelező",
    });
  }

  try {
    const [result] = await db.query(
      `
      UPDATE subscriptions
      SET
        invoice_status = 'invoiced',
        invoice_number = ?
      WHERE id = ?
      `,
      [invoice_number, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Előfizetés nem található",
      });
    }

    res.json({
      success: true,
      message: "Előfizetés számlázottra állítva",
    });
  } catch (err) {
    console.error("Mark invoice issued error:", err);
    res.status(500).json({
      error: "Nem sikerült frissíteni a számlázási státuszt",
    });
  }
});

/* ======================================================
   ADMIN – MANUÁLIS SZÁMLA RÖGZÍTÉS
   POST /api/admin/manual-invoice
   ====================================================== */
router.post(
  "/manual-invoice",
  auth,
  admin,
  upload.single("pdf"),
  manualInvoiceController.createManualInvoice
);


/* ======================================================
   ADMIN – SZÁMLA FIZETETTRE ÁLLÍTÁS
   POST /api/admin/invoices/:id/mark-paid
   ====================================================== */
router.post(
  "/invoices/:id/mark-paid",
  auth,
  admin,
  markInvoicePaid
);


/* ======================================================
   ADMIN – SZÁMLÁK LISTÁZÁSA (issued / paid)
   GET /api/admin/invoices?status=issued|paid
   ====================================================== */
router.get("/invoices", auth, admin, async (req, res) => {
  const { status } = req.query;

  try {
    let where = "";
    const params = [];

    if (status && ["issued", "paid"].includes(status)) {
      where = "WHERE i.invoice_status = ?";
      params.push(status);
    }

    const [rows] = await db.query(
      `
      SELECT
        i.id,
        i.invoice_number,
        i.invoice_date,
        i.total_amount,
        i.currency,
        i.invoice_status,
        i.invoice_pdf_url,
        u.email,
        u.name
      FROM invoices i
      JOIN users u ON u.id = i.user_id
      ${where}
      ORDER BY i.invoice_date DESC
      `,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error("Admin invoice list error:", err);
    res.status(500).json({
      error: "Nem sikerült lekérni a számlákat",
    });
  }
});


module.exports = router;
