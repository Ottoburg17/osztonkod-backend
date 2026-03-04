const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Stripe = require("stripe");
const db = require("../config/db");

const paymentController = require("../controllers/paymentController");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// --------------------------------------------------
// STRIPE – EGYSZERI FIZETÉS
// --------------------------------------------------
router.post(
  "/stripe/create-intent",
  auth,
  paymentController.createStripePaymentIntent
);

// --------------------------------------------------
// STRIPE – ELŐFIZETÉS (DOPAMINE-CYCLE)
// --------------------------------------------------
router.post("/stripe/subscribe/dopamine", auth, async (req, res) => {
  try {
    // 1️⃣ Lekérjük a user Stripe customer ID-ját
    const [[user]] = await db.query(
      "SELECT stripe_customer_id FROM users WHERE id = ?",
      [req.user.id]
    );

    // 2️⃣ Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      // 🔑 KRITIKUS: meglévő customer-t használjuk, ha van
      ...(user?.stripe_customer_id
        ? { customer: user.stripe_customer_id }
        : { customer_email: req.user.email }),

      line_items: [
        {
          price: process.env.STRIPE_DOPAMINE_SUB_PRICE_ID,
          quantity: 1,
        },
      ],

      // 🔒 FONTOS: egységes slug
      metadata: {
        userId: req.user.id.toString(),
        product_slug: "dopamine-cycle",
      },

      success_url: `${process.env.FRONTEND_URL}/dashboard?sub=success`,
      cancel_url: `${process.env.FRONTEND_URL}/services?sub=cancel`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("❌ Stripe subscription error:", err);
    res.status(500).json({ error: "Stripe subscription failed" });
  }
});

module.exports = router;
