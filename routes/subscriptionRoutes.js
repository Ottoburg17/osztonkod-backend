const express = require("express");
const router = express.Router();


const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const db = require("../config/db");

const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const {
  getOrCreateStripeCustomer,
} = require("../services/stripeCustomerService");


const {
  getAllSubscriptions,
  resendSubscriptionEmail,
  openStripePortal,
} = require("../controllers/subscriptionController");


router.get("/me", auth, async (req, res) => {
  try {
    const [[sub]] = await db.query(
      `
      SELECT
        product_slug,
        provider,
        status,
        started_at,
        expires_at,
        cancel_at_period_end
      FROM subscriptions
      WHERE user_id = ?
      ORDER BY started_at DESC
      LIMIT 1
      `,
      [req.user.id]
    );

    res.json({ subscription: sub || null });
  } catch (err) {
    console.error("Get current subscription error:", err);
    res.status(500).json({ subscription: null });
  }
});


router.get("/has-access/:slug", auth, async (req, res) => {
  const { slug } = req.params;

  try {
    // ✅ ADMIN OVERRIDE
    if (req.user?.isAdmin) {
      return res.json({ hasAccess: true });
    }

    const [rows] = await db.query(
      `
      SELECT id
      FROM subscriptions
      WHERE user_id = ?
        AND product_slug = ?
        AND status IN ('active', 'trialing', 'pending')
        AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1
      `,
      [req.user.id, slug]
    );

    res.json({ hasAccess: rows.length > 0 });
  } catch (err) {
    console.error("Subscription access check error:", err);
    res.status(500).json({ hasAccess: false });
  }
});


router.get("/my", auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
        product_slug,
        provider,
        status,
        started_at,
        expires_at,
        invoice_pdf
      FROM subscriptions
      WHERE user_id = ?
      ORDER BY started_at DESC
      `,
      [req.user.id]
    );

    res.json({ subscriptions: rows });
  } catch (err) {
    console.error("Get subscriptions error:", err);
    res.status(500).json({ error: "Subscription lekérés hiba" });
  }
});


router.post("/stripe/start", auth, async (req, res) => {
  try {
    // 🔥 EZ A LÉNYEG
    const stripeCustomerId = await getOrCreateStripeCustomer(req.user.id);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId, // ✅ mindig UGYANAZ a customer
      line_items: [
        {
          price: process.env.STRIPE_DOPAMINE_SUB_PRICE_ID,
          quantity: 1,
        },
      ],
      metadata: {
        userId: req.user.id.toString(),
        product_slug: "dopamine-cycle",
      },
     success_url: `${process.env.FRONTEND_URL}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
     cancel_url: `${process.env.FRONTEND_URL}/stripe/cancel`,


    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe subscription start error:", err);
    res.status(500).json({ error: "Stripe előfizetés hiba" });
  }
});




router.post("/stripe/cancel", auth, async (req, res) => {
  try {
    const [[sub]] = await db.query(
      `
      SELECT stripe_subscription_id
      FROM subscriptions
      WHERE user_id = ?
        AND provider = 'stripe'
        AND status = 'active'
      LIMIT 1
      `,
      [req.user.id]
    );

    if (!sub) {
      return res.status(404).json({
        error: "Nincs aktív Stripe előfizetés",
      });
    }

    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    await db.query(
      `
      UPDATE subscriptions
      SET cancel_at_period_end = 1
      WHERE stripe_subscription_id = ?
      `,
      [sub.stripe_subscription_id]
    );

    res.json({
      success: true,
      message:
        "Előfizetés lemondva. A hozzáférés a jelenlegi időszak végéig él.",
    });
  } catch (err) {
    console.error("Stripe cancel error:", err);
    res.status(500).json({
      error: "Stripe előfizetés lemondása sikertelen",
    });
  }
});






router.get("/invoice/:slug", auth, async (req, res) => {
  const { slug } = req.params;

  const [[sub]] = await db.query(
    `
    SELECT invoice_pdf
    FROM subscriptions
    WHERE user_id = ?
      AND product_slug = ?
      AND invoice_pdf IS NOT NULL
    ORDER BY started_at DESC
    LIMIT 1
    `,
    [req.user.id, slug]
  );

  if (!sub) {
    return res.status(404).json({
      error: "Nincs elérhető számla",
    });
  }

  res.json({ url: sub.invoice_pdf });
});


router.get("/admin/all", auth, admin, getAllSubscriptions);
router.post(
  "/admin/:id/resend-email",
  auth,
  admin,
  resendSubscriptionEmail
);

// 🔁 Stripe Customer Portal
router.post(
  "/stripe/portal",
  auth,
  openStripePortal
);




module.exports = router;
