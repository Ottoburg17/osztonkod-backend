require("dotenv").config();
const db = require("../config/db");
const sendEmail = require("../utils/emails/sendEmail");
const subscriptionExpiredEmail =
  require("../utils/emails/subscriptionExpiredEmail");

async function runSubscriptionExpire() {
  console.log("⏰ Subscription expiry CRON started");

  try {
    const [rows] = await db.query(`
      SELECT
        s.id,
        s.user_id,
        u.email,
        s.product_slug,
        s.expires_at
      FROM subscriptions s
      JOIN users u ON u.id = s.user_id
      WHERE
        s.status IN ('active','cancelled')
        AND s.expires_at IS NOT NULL
        AND s.expires_at <= NOW()
    `);

    if (rows.length === 0) {
      console.log("✅ No expired subscriptions");
      return;
    }

    for (const sub of rows) {
      try {
        await db.query(
          `UPDATE subscriptions SET status = 'expired' WHERE id = ?`,
          [sub.id]
        );

        await sendEmail({
          to: sub.email,
          ...subscriptionExpiredEmail({
            name: sub.eamil,
            product: sub.product_slug,
            expiresAt: sub.expires_at,
          }),
        });

        console.log(
          `⛔ Subscription expired + email sent: ${sub.email}`
        );
      } catch (innerErr) {
        console.error(
          "❌ Subscription expire processing error:",
          innerErr
        );
      }
    }
  } catch (err) {
    console.error("🔥 SubscriptionExpire cron error:", err);
  }
}

if (require.main === module) {
  runSubscriptionExpire()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = runSubscriptionExpire;
