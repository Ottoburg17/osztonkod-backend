const db = require("../config/db");
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

exports.createStripePaymentIntent = async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: "Hiányzó orderId." });
  }

  const conn = await db.getConnection();

  try {
    // 1️⃣ Rendelés lekérés
    const [orders] = await conn.query(
      `
      SELECT id, total_price, stripe_payment_intent_id
      FROM orders
      WHERE id = ? AND status = 'pending' AND user_id = ?
      `,
      [orderId, req.user.id]
    );

    if (orders.length === 0) {
      throw new Error("Nincs ilyen pending rendelés.");
    }

    const order = orders[0];

    // 2️⃣ 🔒 VÉDELEM: előfizetés kizárása
    const [items] = await conn.query(
      `
      SELECT p.type
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
      `,
      [order.id]
    );

    if (items.some(item => item.type === "subscription")) {
      throw new Error(
        "Előfizetés nem fizethető PaymentIntenttel. Stripe Subscription szükséges."
      );
    }

    // 3️⃣ PaymentIntent újrahasználás
    if (order.stripe_payment_intent_id) {
      const existingPI = await stripe.paymentIntents.retrieve(
        order.stripe_payment_intent_id
      );

      return res.json({
        clientSecret: existingPI.client_secret,
      });
    }

    // 4️⃣ Összeg számítás (egyszeri termékekhez)
    const EUR_RATE = Number(process.env.STRIPE_EUR_RATE || 400);
    const amountInCents = Math.round(
      (Number(order.total_price) / EUR_RATE) * 100
    );

    if (!Number.isFinite(amountInCents) || amountInCents < 50) {
      throw new Error("Az összeg túl alacsony Stripe fizetéshez.");
    }

    // 5️⃣ PaymentIntent létrehozás
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "eur",
      payment_method_types: ["card"],
      metadata: {
        orderId: order.id.toString(),
        userId: req.user.id.toString(),
        provider: "stripe",
      },
    });

    // 6️⃣ Mentés
    await conn.query(
      `
      UPDATE orders
      SET stripe_payment_intent_id = ?
      WHERE id = ?
      `,
      [paymentIntent.id, order.id]
    );

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Stripe create-intent error:", err);
    res.status(400).json({ error: err.message });
  } finally {
    conn.release();
  }
};
