const express = require("express");
const Stripe = require("stripe");
const db = require("../config/db");

const sendEmail = require("../utils/emails/sendEmail");
const subscriptionActivatedEmail = require("../utils/emails/subscriptionActivatedEmail");
const subscriptionCancelledEmail = require("../utils/emails/subscriptionCancelledEmail");

const orderConfirmationEmail = require("../utils/emails/orderConfirmation");

const validateHungarianTaxNumber = require("../utils/validateHungarianTaxNumber");

const {sendManualInvoiceDataEmail,} = require("../services/manualInvoiceMailService");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);



router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Stripe signature error:", err.message);
      return res.status(400).send("Invalid signature");
    }

  

    // 🔐 IDEMPOTENCY CHECK ITT
    const eventId = event.id;

    const [existing] = await db.query(
      "SELECT id FROM stripe_events WHERE id = ?",
      [eventId]
    );

    if (existing.length > 0) {
     
      return res.json({ received: true });
    }


    try {
      switch (event.type) {

        /* =====================================================
           💳 EGYSZERI VÁSÁRLÁS – PAYMENT INTENT
           ===================================================== */
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object;
          const orderId = Number(paymentIntent.metadata?.orderId);

          if (!orderId) {
            console.warn("⚠️ payment_intent without orderId metadata");
            break;
          }

          const conn = await db.getConnection();
          try {
            await conn.beginTransaction();

            // 🔒 ORDER LOCK
            const [[order]] = await conn.query(
              `
              SELECT id, user_id, status, total_price
              FROM orders
              WHERE id = ?
              FOR UPDATE
              `,
              [orderId]
            );

            if (!order || order.status === "paid") {
              await conn.commit();
              break;
            }

            // ✅ ORDER → PAID
            await conn.query(
              `
              UPDATE orders
              SET status = 'paid',
                  stripe_payment_intent_id = ?
              WHERE id = ?
              `,
              [paymentIntent.id, orderId]
            );

            // 🛒 TERMÉKEK
            const [products] = await conn.query(
              `
              SELECT
                p.slug,
                p.title,
                oi.quantity AS qty,
                oi.price_snapshot AS price
              FROM order_items oi
              JOIN products p ON p.id = oi.product_id
              WHERE oi.order_id = ?
              `,
              [orderId]
            );

           
           
            // 🔓 HOZZÁFÉRÉSEK
            for (const p of products) {

              // 🎯 STRUGGLE BREAKER – FLAG
              if (p.slug === "struggle-breaker") {
                await conn.query(
                  `
                  UPDATE users
                  SET has_struggle_breaker = TRUE
                  WHERE id = ?
                    AND has_struggle_breaker = FALSE
                  `,
                  [order.user_id]
                );
                continue;
              }

              // 🔁 DOPAMINE CYCLE → CSAK EZ SUBSCRIPTION
              if (p.slug === "dopamine-cycle") {
                await conn.query(
                  `
                  INSERT INTO subscriptions
                  (
                    user_id,
                    product_slug,
                    provider,
                    stripe_payment_intent_id,
                    status,
                    started_at
                  )
                  VALUES (?, ?, 'stripe', ?, 'active', CURDATE())
                  `,
                  [order.user_id, p.slug, paymentIntent.id]
                );
                continue;
              }

              // 🟣 FULL MAP – BUNDLE
              if (p.slug === "full-map") {
                const bundleProducts = [
                  "brainmap",
                  "emotional-brainmap",
                  "perception"
                ];

                for (const slug of bundleProducts) {
                  await conn.query(
                    `
                    INSERT IGNORE INTO user_products
                    (user_id, product_slug, granted_at)
                    VALUES (?, ?, NOW())
                    `,
                    [order.user_id, slug]
                  );
                }

                continue;
              }

              // 🟡 MINDEN MÁS → LIFETIME TERMÉK
              await conn.query(
                `
                INSERT IGNORE INTO user_products
                (user_id, product_slug, granted_at)
                VALUES (?, ?, NOW())
                `,
                [order.user_id, p.slug]
              );
            }





            // 🔐 ORDER SZINTŰ BILLING VALIDÁCIÓ
            const [[userBilling]] = await conn.query(
              `
              SELECT billing_tax_number, billing_is_company
              FROM users
              WHERE id = ?
              `,
              [order.user_id]
            );

            if (userBilling?.billing_is_company) {
              if (
                !userBilling.billing_tax_number ||
                !validateHungarianTaxNumber(userBilling.billing_tax_number)
              ) {
                console.error(
                  "❌ Invalid tax number at order webhook stage:",
                  orderId
                );

                // Ne generáljunk számlát hibás adatokkal
                await conn.commit();
                break;
              }
            }

            // 🧾 SZÁMLA + EMAIL
            await sendManualInvoiceDataEmail({
                type: "order",
                orderId,
              });

            // 👤 FELHASZNÁLÓ
            const [[user]] = await conn.query(
              `SELECT email, name, billing_email
               FROM users
               WHERE id = ?`,
              [order.user_id]
            );

            const invoiceEmail = user.billing_email || user.email;

            if (!invoiceEmail) {
              console.error("❌ Missing billing email at order webhook stage:", orderId);
              await conn.commit();
              break;
            }


            await sendEmail({
              to: invoiceEmail,
              subject: "Sikeres vásárlás",
              html: orderConfirmationEmail({
                name: user.name || user.email,
                products,
                total: products.reduce(
                  (sum, p) => sum + p.price * p.qty,
                  0
                ),
              }),
            });


            await conn.commit();
          } catch (err) {
            await conn.rollback();
            console.error("🔥 Order webhook error:", err);
          } finally {
            conn.release();
          }
          break;
        }

        

        /* =====================================================
          🚀 STRIPE CHECKOUT – SUBSCRIPTION INDULÁS
          ===================================================== */
         case "checkout.session.completed": {
          
        

          const session = event.data.object;

          if (session.mode !== "subscription") break;

          const userId = session.metadata?.userId;
          const productSlug = session.metadata?.product_slug;
          const stripeSubscriptionId = session.subscription;
          const stripeCustomerId = session.customer; // ⭐ EZ AZ ÚJ

          if (!userId || !productSlug || !stripeSubscriptionId) {
            console.error("❌ Missing subscription metadata");
            break;
          }

          // 🛑 DUPLIKÁCIÓ VÉDELEM
          const [[existing]] = await db.query(
            `
            SELECT id FROM subscriptions
            WHERE stripe_subscription_id = ?
            LIMIT 1
            `,
            [stripeSubscriptionId]
          );

          if (existing) break;

         
        // Régi aktív subscription(ök) lezárása UGYANARRA A TERMÉKRE
          await db.query(
            `
            UPDATE subscriptions
            SET status = 'cancelled'
            WHERE user_id = ?
              AND product_slug = ?
              AND status = 'active'
            `,
            [userId, productSlug]
          );

          // Stripe subscription lekérés
          const subscription = await stripe.subscriptions.retrieve(
            stripeSubscriptionId
          );

          const periodEnd = new Date(
            subscription.current_period_end * 1000
          );

          // 1️⃣ SUBSCRIPTION MENTÉS
          await db.query(
            `
            INSERT INTO subscriptions (
              user_id,
              product_slug,
              provider,
              stripe_subscription_id,
              status,
              started_at,
              expires_at
            )
            VALUES (?, ?, 'stripe', ?, 'pending', NOW(), ?)
            ON DUPLICATE KEY UPDATE
              stripe_subscription_id = VALUES(stripe_subscription_id),
              status = 'pending',
              started_at = NOW(),
              expires_at = VALUES(expires_at)
            `,
            [
              userId,
              productSlug,
              stripeSubscriptionId,
              periodEnd,
            ]
          );

          // 2️⃣ ⭐ STRIPE CUSTOMER ID ELMENTÉSE A USERHEZ
          if (stripeCustomerId) {
            await db.query(
              `
              UPDATE users
              SET stripe_customer_id = ?
              WHERE id = ?
              `,
              [stripeCustomerId, userId]
            );
          }

         
          break;
        }



        /* =====================================================
           🔁 ELŐFIZETÉS – SIKERES FIZETÉS
           ===================================================== */
    
        case "invoice.payment_succeeded": 
        case "invoice.paid":
        case "invoice.payment_paid":{

          const invoice = event.data.object;

          console.log("EVENT TYPE:", event.type);
          console.log("Billing reason:", invoice.billing_reason);

          const subscriptionId = invoice.subscription;

          if (!subscriptionId) break;

          const periodEnd = new Date(
            invoice.lines.data[0].period.end * 1000
          );

          // 1️⃣ SUBSCRIPTION FRISSÍTÉS
          await db.query(
            `
            UPDATE subscriptions
            SET status = 'active',
                expires_at = ?, 
                started_at = COALESCE(started_at, NOW())
            WHERE stripe_subscription_id = ?
            `,
            [periodEnd, subscriptionId]
          );

          

          // 2️⃣ USER + BILLING ADATOK
          const [[sub]] = await db.query(
            `
            SELECT 
              s.id,
              s.product_slug,
              u.email,
              u.name,
              u.billing_email,
              u.billing_name,
              u.billing_address,
              u.billing_tax_number,
              u.billing_is_company,
              u.billing_country,
              u.billing_zip,
              u.billing_city
            FROM subscriptions s
            JOIN users u ON u.id = s.user_id
            WHERE s.stripe_subscription_id = ?
            LIMIT 1
            `,
            [subscriptionId]
          );

          if (!sub) break;

          const invoiceEmail = sub.billing_email || sub.email;

            if (!invoiceEmail) {
              console.error("❌ Missing billing email at subscription webhook stage:", subscriptionId);
              break;
            }


          // 🔐 WEBHOOK SZINTŰ BILLING VALIDÁCIÓ
          if (sub.billing_is_company) {
            if (
              !sub.billing_tax_number ||
              !validateHungarianTaxNumber(sub.billing_tax_number)
            ) {
              console.error(
                "❌ Invalid tax number at webhook stage:",
                subscriptionId
              );

              // Nem dobunk 500-at Stripe felé!
              // Csak logoljuk és nem generálunk számlát.
              break;
            }
          }

          await sendManualInvoiceDataEmail({
            type: "subscription",
            stripeSubscriptionId: subscriptionId,
            amount: invoice.amount_paid / 100,
            
          });
          
                  
          // 5️⃣ AKTIVÁLÓ EMAIL CSAK AZ ELSŐ SZÁMLÁNÁL
         if (invoice.billing_reason !== "subscription_cycle") {
            
             const [[row]] = await db.query(
              `
              SELECT u.email, u.name, u.billing_email, s.product_slug
              FROM subscriptions s
              JOIN users u ON u.id = s.user_id
              WHERE s.stripe_subscription_id = ?
              LIMIT 1
              `,
              [subscriptionId]
            );

            if (row) {
              const targetEmail = row.billing_email || row.email;

              await sendEmail({
                to: targetEmail,
                ...subscriptionActivatedEmail({
                  name: row.name || targetEmail,
                  productName: row.product_slug,
                  startDate: new Date().toLocaleDateString("hu-HU"),
                }),
              });
            }

          }

          break;
        }


        /* =====================================================
           ⚠️ Customer.subscription.updated
        ===================================================== */
        

        case "customer.subscription.updated": {
          const subscription = event.data.object;

          // Csak akkor érdekel, ha lemondás történt
          if (!subscription.cancel_at_period_end) break;

          const accessUntil = new Date(
            subscription.current_period_end * 1000
          );

          await db.query(
            `
            UPDATE subscriptions
            SET status = 'cancelled',
                expires_at = ?
            WHERE stripe_subscription_id = ?
               AND status != 'cancelled'
            `,
            [accessUntil, subscription.id]
          );

          break;
        }


        /* =====================================================
           ⚠️ ELŐFIZETÉS – FIZETÉS SIKERTELEN
           ===================================================== */
        case "invoice.payment_failed": {
          const invoice = event.data.object;
          const subscriptionId = invoice.subscription;

          if (!subscriptionId) break;

          await db.query(
            `
            UPDATE subscriptions
            SET status = 'pending'
            WHERE stripe_subscription_id = ?
            `,
            [subscriptionId]
          );

         
          break;
        }

         /* =====================================================
           ⚠️ ELŐFIZETÉS Lemondása
          ===================================================== */


        case "customer.subscription.deleted": {
        const subscription = event.data.object;

        const accessUntil = new Date(
          subscription.current_period_end * 1000
        );

        // 1️⃣ DB frissítés – HELYES DÁTUMMAL
        await db.query(
          `
          UPDATE subscriptions
          SET status = 'cancelled',
              expires_at = ?
          WHERE stripe_subscription_id = ?
          `,
          [accessUntil, subscription.id]
        );

        // 2️⃣ USER + TERMÉK
        const [[row]] = await db.query(
          `
          SELECT u.email, u.name, u.billing_email, s.product_slug
          FROM subscriptions s
          JOIN users u ON u.id = s.user_id
          WHERE s.stripe_subscription_id = ?
          LIMIT 1
          `,
          [subscription.id]
        );

        // 3️⃣ EMAIL
        if (row) {
            
          const targetEmail = row.billing_email || row.email;

          await sendEmail({
            to: targetEmail,
            ...subscriptionCancelledEmail({
              name: row.name || targetEmail,
              productName: row.product_slug,
              accessUntil: accessUntil.toLocaleDateString("hu-HU"),
            }),
          });
          
        }

        break;
        }
      }

       try {
        await db.query(
          "INSERT INTO stripe_events (id) VALUES (?)",
          [eventId]
        );
      } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.json({ received: true });
        }
        throw err;
      }



      res.json({ received: true });
    } catch (err) {
      console.error("🔥 Stripe webhook fatal error:", err);
      res.status(500).send("Webhook failed");
    }
  }
);

module.exports = router;


