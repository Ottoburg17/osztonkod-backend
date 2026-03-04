const express = require("express");
const router = express.Router();
const db = require("../config/db");

const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

/* ======================================================
   ADMIN DASHBOARD STATISZTIKA
   GET /api/admin/stats
   ====================================================== */
router.get("/stats", auth, admin, async (req, res) => {
  try {
    // 1️⃣ Aktív előfizetések + MRR
    const [[active]] = await db.query(`
      SELECT
        COUNT(*) AS activeCount,
        COALESCE(SUM(
          CASE
            WHEN p.billing_type = 'subscription'
              THEN p.price_monthly
            ELSE 0
          END
        ), 0) AS mrr
      FROM subscriptions s
      JOIN products p ON p.slug = s.product_slug
      WHERE s.status = 'active'
    `);

    // 2️⃣ Lejár 1 napon belül
    const [[exp1]] = await db.query(`
      SELECT COUNT(*) AS count
      FROM subscriptions
      WHERE status = 'active'
        AND expires_at = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
    `);

    // 3️⃣ Lejár 7 napon belül
    const [[exp7]] = await db.query(`
      SELECT COUNT(*) AS count
      FROM subscriptions
      WHERE status = 'active'
        AND expires_at = DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    `);

    /* ======================================================
   📦 LIFETIME STATS
    ====================================================== */

    // Lifetime vásárlások száma
    const [[lifetimeCount]] = await db.query(`
      SELECT COUNT(*) AS count
      FROM user_products
    `);

    // Lifetime bevétel (egyszeri, nem subscription)
    const [[lifetimeRevenue]] = await db.query(`
      SELECT COALESCE(SUM(o.total_price), 0) AS total
      FROM orders o
      WHERE o.status = 'paid'
        AND o.id NOT IN (
          SELECT DISTINCT s.stripe_payment_intent_id
          FROM subscriptions s
          WHERE s.stripe_payment_intent_id IS NOT NULL
        )
    `);

    // StruggleBreaker flag count
    const [[struggleCount]] = await db.query(`
      SELECT COUNT(*) AS count
      FROM users
      WHERE has_struggle_breaker = TRUE
    `);

    res.json({
      activeSubscriptions: active.activeCount,
      mrr: Number(active.mrr),
      expiring1d: exp1.count,
      expiring7d: exp7.count,

      lifetimeSales: lifetimeCount.count,
      lifetimeRevenue: Number(lifetimeRevenue.total),
      struggleBreakerUsers: struggleCount.count,
    });
  } catch (err) {
    console.error("❌ Admin stats error:", err);
    res.status(500).json({
      error: "Statisztika lekérés sikertelen",
    });
  }
});

module.exports = router;
