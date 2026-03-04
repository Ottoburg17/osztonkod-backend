const rateLimit = require("express-rate-limit");

module.exports = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 perc
  max: 5,                  // 5 kérés / IP
  standardHeaders: true,
  legacyHeaders: false,
});
