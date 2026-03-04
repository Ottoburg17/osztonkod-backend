// middleware/requireStruggleBreakerAccess.js

const db = require("../config/db");

module.exports = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Nincs hitelesített felhasználó."
      });
    }

    const userId = req.user.id;

    const [[user]] = await db.query(
      `
      SELECT has_struggle_breaker
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [userId]
    );

   if (!user || (!user.has_struggle_breaker && !req.user.isAdmin))  {
      return res.status(403).json({
        error: "Nincs hozzáférésed a StruggleBreaker programhoz."
      });
    }

    next();

  } catch (err) {
    console.error("StruggleBreaker access middleware error:", err);
    res.status(500).json({
      error: "Jogosultság ellenőrzési hiba."
    });
  }
};
