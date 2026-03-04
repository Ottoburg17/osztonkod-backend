const Stripe = require("stripe");
const db = require("../config/db");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

exports.getOrCreateStripeCustomer = async (userId) => {
  // 1️⃣ User lekérése
  const [[user]] = await db.query(
    `
    SELECT id, email, stripe_customer_id
    FROM users
    WHERE id = ?
    LIMIT 1
    `,
    [userId]
  );

  if (!user) {
    throw new Error("User not found");
  }

  // 2️⃣ Ha már van Stripe customer → vissza
  if (user.stripe_customer_id) {
    return user.stripe_customer_id;
  }

  // 3️⃣ Új Stripe customer
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: {
      userId: user.id.toString(),
    },
  });

  // 4️⃣ Mentés DB-be
  await db.query(
    `
    UPDATE users
    SET stripe_customer_id = ?
    WHERE id = ?
    `,
    [customer.id, user.id]
  );

  return customer.id;
};
