const db = require("../config/db");
const sendEmail = require("../utils/emails/sendEmail");

const reminder7dEmail = require("../utils/emails/subscriptionReminder7dEmail");
const reminder1dEmail = require("../utils/emails/subscriptionReminder1dEmail");

async function runSubscriptionReminder() {
  console.log("⏰ Subscription reminder cron indul");

  // -------------------------
  // 7 NAPOS
  // -------------------------
  const [sevenDays] = await db.query(`
    SELECT
      s.id,
      s.expires_at,
      s.product_slug,
      u.email,
      u.name
    FROM subscriptions s
    JOIN users u ON u.id = s.user_id
    WHERE
      s.status = 'active'
      AND s.expires_at = DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      AND s.reminder_7d_sent = 0
  `);

  for (const sub of sevenDays) {
    try {
      await sendEmail({
        to: sub.email,
        ...reminder7dEmail({
          name: sub.name || "Felhasználó",
          product: sub.product_slug,
          expiresAt: sub.expires_at,
        }),
      });

      await db.query(
        `UPDATE subscriptions SET reminder_7d_sent = 1 WHERE id = ?`,
        [sub.id]
      );

      console.log("📧 7 napos emlékeztető elküldve:", sub.email);
    } catch (err) {
      console.error("❌ 7 napos email hiba:", err);
    }
  }

  // -------------------------
  // 1 NAPOS
  // -------------------------
  const [oneDay] = await db.query(`
    SELECT
      s.id,
      s.expires_at,
      s.product_slug,
      u.email,
      u.name
    FROM subscriptions s
    JOIN users u ON u.id = s.user_id
    WHERE
      s.status = 'active'
      AND s.expires_at = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
      AND s.reminder_1d_sent = 0
  `);

  for (const sub of oneDay) {
    try {
      await sendEmail({
        to: sub.email,
        ...reminder1dEmail({
          name: sub.name || "Felhasználó",
          product: sub.product_slug,
          expiresAt: sub.expires_at,
        }),
      });


      await db.query(
        `UPDATE subscriptions SET reminder_1d_sent = 1 WHERE id = ?`,
        [sub.id]
      );

      console.log("📧 1 napos emlékeztető elküldve:", sub.email);
    } catch (err) {
      console.error("❌ 1 napos email hiba:", err);
    }
  }
}

module.exports = runSubscriptionReminder;
