const db = require("../config/db");
const sendEmail = require("../utils/emails/sendEmail");


const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// controllers/subscriptionController.js
const { getOrCreateStripeCustomer } =
  require("../services/stripeCustomerService");


/* ======================================================
   ADMIN: Összes előfizetés lekérése
   GET /api/subscriptions/admin/all
   ====================================================== */
exports.getAllSubscriptions = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        s.id,
        s.user_id,
        u.email,
        s.product_slug,
        s.provider,
        s.status,
        s.started_at AS startedAt,
        s.expires_at AS expiresAt,
        s.cancel_at_period_end AS cancelAtPeriodEnd,
        DATEDIFF(s.expires_at, NOW()) AS daysLeft
      FROM subscriptions s
      JOIN users u ON u.id = s.user_id
      ORDER BY s.started_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("Admin get subscriptions error:", err);
    res.status(500).json({
      error: "Előfizetések lekérése sikertelen",
    });
  }
};

/* ======================================================
   ADMIN: Előfizetés email újraküldése
   POST /api/subscriptions/admin/:id/resend-email
   ====================================================== */
exports.resendSubscriptionEmail = async (req, res) => {
  const { id } = req.params;

  try {
    // 1️⃣ Előfizetés + user email
    const [rows] = await db.query(
      `
      SELECT
        s.id,
        s.product_slug,
        s.status,
        s.started_at,
        s.expires_at,
        s.cancel_at_period_end,
        u.email
      FROM subscriptions s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: "Előfizetés nem található",
      });
    }

    const sub = rows[0];

    // 2️⃣ Email tartalom státusz szerint
    let subject = "";
    let html = "";

    switch (sub.status) {
      case "active":
        subject = "Előfizetésed aktív";
        html = `
          <h2>✅ Előfizetés aktív</h2>
          <p>Az előfizetésed jelenleg <b>aktív</b>.</p>
          <p><b>Termék:</b> ${sub.product_slug}</p>
          <p><b>Kezdete:</b> ${new Date(sub.started_at).toLocaleDateString()}</p>
          ${
            sub.expires_at
              ? `<p><b>Lejárat:</b> ${new Date(
                  sub.expires_at
                ).toLocaleDateString()}</p>`
              : ""
          }
          ${
            sub.cancel_at_period_end
              ? `<p style="color:#b45309">
                   ⚠️ Az előfizetés a jelenlegi ciklus végén megszűnik.
                 </p>`
              : ""
          }
          <p>Köszönjük, hogy velünk vagy 💚</p>
        `;
        break;

      case "cancelled":
        subject = "Előfizetés lemondva";
        html = `
          <h2>❌ Előfizetés lemondva</h2>
          <p>Az előfizetésed lemondásra került.</p>
          <p><b>Termék:</b> ${sub.product_slug}</p>
          ${
            sub.expires_at
              ? `<p>A hozzáférés eddig él:
                   <b>${new Date(sub.expires_at).toLocaleDateString()}</b>
                 </p>`
              : ""
          }
          <p>Ha meggondolnád magad, bármikor újra előfizethetsz.</p>
        `;
        break;

      case "expired":
        subject = "Előfizetés lejárt";
        html = `
          <h2>⌛ Előfizetés lejárt</h2>
          <p>Az előfizetésed lejárt.</p>
          <p><b>Termék:</b> ${sub.product_slug}</p>
          <p>Az újbóli hozzáféréshez kérjük, indíts új előfizetést.</p>
        `;
        break;

      case "pending":
        subject = "Előfizetés feldolgozás alatt";
        html = `
          <h2>⏳ Előfizetés folyamatban</h2>
          <p>Az előfizetésed feldolgozás alatt áll.</p>
          <p><b>Termék:</b> ${sub.product_slug}</p>
          <p>Amint aktiválódik, külön értesítést küldünk.</p>
        `;
        break;

      default:
        subject = "Előfizetés állapota";
        html = `<p>Státusz: <b>${sub.status}</b></p>`;
    }

    // 3️⃣ Email küldés
    await sendEmail({
      to: sub.email,
      subject,
      html,
    });

    res.json({
      success: true,
      message: "Email sikeresen újraküldve",
    });
  } catch (err) {
    console.error("Resend subscription email error:", err);
    res.status(500).json({
      error: "Email újraküldése sikertelen",
    });
  }
};


/* ======================================================
   USER: Stripe Customer Portal megnyitása
   POST /api/subscriptions/stripe/portal
   ====================================================== */
exports.openStripePortal = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1️⃣ AKTÍV STRIPE ELŐFIZETÉS KERESÉSE
    const [[sub]] = await db.query(
      `
      SELECT stripe_subscription_id
      FROM subscriptions
      WHERE user_id = ?
        AND provider = 'stripe'
        AND status = 'active'
      ORDER BY id DESC
      LIMIT 1
      `,
      [userId]
    );

    if (!sub) {
      return res.status(400).json({
        error: "Nincs aktív Stripe előfizetés",
      });
    }

    // 2️⃣ Stripe subscription → customer
    const subscription = await stripe.subscriptions.retrieve(
      sub.stripe_subscription_id
    );

    const customerId = subscription.customer;

    // 3️⃣ Stripe Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL}/account`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe portal error:", err);
    res.status(500).json({
      error: "Stripe Customer Portal létrehozása sikertelen",
    });
  }
};

