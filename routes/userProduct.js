const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const db = require("../config/db");

// 🔹 LIFETIME TERMÉKEK
router.get("/my-products", auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT product_slug
      FROM user_products
      WHERE user_id = ?
      `,
      [req.user.id]
    );

    res.json({ products: rows });

  } catch (err) {
    console.error("🔥 my-products error:", err);
    res.status(500).json({ message: "Szerver hiba." });
  }
});

module.exports = router;