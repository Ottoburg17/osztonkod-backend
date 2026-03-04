const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const manualInvoiceController = require("../controllers/manualInvoiceController");

router.get(
  "/invoices",
  authMiddleware,
  manualInvoiceController.getUserInvoices
);

module.exports = router;


