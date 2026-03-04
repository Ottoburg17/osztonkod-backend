const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;

  // Nincs header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Nincs token, hozzáférés megtagadva." });
  }

  // Token levágása
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
   

    // decoded = { userId, email, iat, exp }
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      isAdmin: decoded.isAdmin,
    };

    next();
  } catch (err) {
    console.error("JWT verify error:", err);
    return res.status(401).json({ error: "Érvénytelen vagy lejárt token." });
  }
};
