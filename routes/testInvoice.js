/*
const express = require("express");
const router = express.Router();
const { createInvoice } = require("../services/invoiceService");

router.get("/test-invoice", async (req, res) => {
  try {
    const invoice = await createInvoice({
      customerName: "Teszt Elek",
      email: "teszt@email.hu",
      productName: "TESZT előfizetés",
      net: 100,
    });

    res.json({
      success: true,
      invoice,
    });
  } catch (err) {
    console.error("TESZT SZÁMLA HIBA:", err);
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
const express = require("express");
*/
