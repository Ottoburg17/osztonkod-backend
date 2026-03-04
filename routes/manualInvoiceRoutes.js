const express = require("express");
const router = express.Router();

const manualInvoiceController = require("../controllers/manualInvoiceController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// ADMIN – manuális számla rögzítés
router.post(
  "/admin/manual-invoice",
  adminMiddleware,
  manualInvoiceController.createManualInvoice
);

// USER – saját számlák lekérdezése
router.get(
  "/user/invoices",
  authMiddleware,
  manualInvoiceController.getUserInvoices
);

module.exports = router;
