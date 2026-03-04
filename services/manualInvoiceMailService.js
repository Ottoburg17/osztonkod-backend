const db = require("../config/db");
const sendInvoiceEmail = require("../utils/emails/sendInvoiceEmail");

/**
 * Admin értesítés manuális számla kiállításhoz
 * @param {Object} params
 * @param {"order" | "subscription"} params.type
 * @param {number} [params.orderId]
 * @param {string} [params.stripeSubscriptionId]
 * @param {number} [params.amount] – subscription esetén
 */

exports.sendManualInvoiceDataEmail = async ({
  type, // "order" | "subscription"
  orderId,
  stripeSubscriptionId,
  amount,
}) => {
  let row;

  /* =====================================================
     🧾 EGYSZERI VÁSÁRLÁS
     ===================================================== */
  if (type === "order") {
    [[row]] = await db.query(
      `
      SELECT
        o.id AS ref,
        o.total_price,

        p.title AS product_title,

        u.email AS user_email,
        u.name AS user_name,
        u.billing_email,

        u.billing_name,
        u.billing_country,
        u.billing_zip,
        u.billing_city,
        u.billing_address,
        u.billing_tax_number,
        u.billing_is_company,
        u.billing_company_name

      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN products p ON p.id = oi.product_id
      JOIN users u ON u.id = o.user_id

      WHERE o.id = ?
      LIMIT 1
      `,
      [orderId]
    );
  }

  /* =====================================================
     🔁 ELŐFIZETÉS
     ===================================================== */
  if (type === "subscription") {
    [[row]] = await db.query(
      `
      SELECT
        s.id AS ref,
        s.product_slug,

        u.email AS user_email,
        u.name AS user_name,
        u.billing_email,

        u.billing_name,
        u.billing_country,
        u.billing_zip,
        u.billing_city,
        u.billing_address,
        u.billing_tax_number,
        u.billing_is_company,
        u.billing_company_name
      FROM subscriptions s
      JOIN users u ON u.id = s.user_id
      WHERE s.stripe_subscription_id = ?
      LIMIT 1
      `,
      [stripeSubscriptionId]
    );
  }

  if (!row) return;

  /* =====================================================
     📧 ADMIN EMAIL – MANUÁLIS SZÁMLÁZÁSHOZ
     ===================================================== */
  await sendInvoiceEmail({
    to: process.env.ADMIN_EMAIL, // mindig az admin kapja

    reference: type === "order" ? `ORDER-${row.ref}` : `SUB-${row.ref}`,

    productName:
      type === "order"
        ? row.product_title
        : row.product_slug,

    amount: type === "order" ? row.total_price : amount,

    // 👤 ügyfél
    customerName: row.billing_name || row.user_name,
    customerEmail: row.billing_email || row.user_email,



    // 🧾 számlázási adatok
    billingName: row.billing_is_company
      ? row.billing_company_name
      : row.billing_name,

    billingCountry: row.billing_country,
    billingZip: row.billing_zip,
    billingCity: row.billing_city,
    billingAddress: row.billing_address,
    billingTaxNumber: row.billing_tax_number || null,
  });
};
