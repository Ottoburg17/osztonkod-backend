// server.js
// require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();


process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});


/* =====================================
   RENDER PROXY (KÖTELEZŐ RATE LIMITHEZ)
===================================== */
app.set("trust proxy", 1);


/* =====================================
   SECURITY
===================================== */
app.use(helmet());


/* =====================================
   LOGIN RATE LIMIT
===================================== */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 perc
  max: 5, // max 5 próbálkozás
  message: {
    error: "Túl sok bejelentkezési próbálkozás. Próbáld újra 15 perc múlva."
  },
  standardHeaders: true,
  legacyHeaders: false
});


/* ======================================================
   STRIPE WEBHOOKOK – MINDIG JSON ELŐTT
   ====================================================== */

// Egyszeri vásárlás webhook
//  const stripeWebhook = require("./routes/stripeWebhook");
// app.use("/webhooks/stripe", stripeWebhook);







/* ======================================================
   ÁLTALÁNOS MIDDLEWARE
   ====================================================== */


app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true
}));

app.use(express.json());

console.log("🔄 Backend indul...");

/* ======================================================
   ROUTES
   ====================================================== */

// const authRoutes = require("./routes/authRoutes");
// const orderRoutes = require("./routes/orderRoutes");
// const paymentRoutes = require("./routes/paymentRoutes");
//   const contactRoutes = require("./routes/contactRoutes");
//  const subscriptionRoutes = require("./routes/subscriptionRoutes");
//  const struggleBreakerRoutes = require("./routes/struggleBreakerRoutes");

// Public teszt
app.get("/", (req, res) => {
  res.json({ message: "API működik 🚀" });
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");

});

// API routes

//  app.use("/api/auth/login", loginLimiter);
// app.use("/api/auth", authRoutes);
// app.use("/api/orders", orderRoutes);
// app.use("/api/payments", paymentRoutes);
//  app.use("/api", contactRoutes);
//  app.use("/api/dopamine-cycle", require("./routes/dopamineCycle"));
//  app.use("/api/subscriptions", subscriptionRoutes);
//  app.use("/api/user", require("./routes/userProduct"));
//  app.use("/api/struggle-breaker", struggleBreakerRoutes);



// Admin / user
//  app.use("/api/admin", require("./routes/adminInvoices"));
//  app.use("/api/admin", require("./routes/adminStats"));
// app.use("/api/user", require("./routes/userInvoices"));
// app.use("/api/users", require("./routes/userRoutes"));

app.use("/uploads", express.static("uploads"));
/* ======================================================
   CRON
   ====================================================== */


// require("./cron");

/* ======================================================
   ERROR HANDLER
   ====================================================== */

app.use((err, req, res, next) => {
  console.error("🔥 Globális hiba:", err);
  res.status(500).json({ error: "Szerver hiba!" });
});

/* ======================================================
   START
   ====================================================== */
const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log("✅ Server started on port", PORT);
});