const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../config/db");
const sendEmail = require("../utils/emails/sendEmail");
const getFrontendUrl = require("../utils/getFrontendUrl");
const hashToken = require("../utils/hashToken");



// --------------------
// JWT token
// --------------------
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      isAdmin: user.is_admin === 1,
      emailVerified: user.email_verified === 1,
      has_struggle_breaker: user.has_struggle_breaker    
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

console.log("🧪 AUTH CONTROLLER LOADED");

// --------------------
// REGISZTRÁCIÓ (EMAIL VERIFY)
// --------------------
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Minden mezőt ki kell tölteni!" });
  }

  try {
    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "Ez az email már létezik!" });
    }

    const hashed = await bcrypt.hash(password, 10);

    // 1️⃣ user létrehozás
    const [result] = await db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashed]
    );

    const userId = result.insertId;

    // 2️⃣ email verification token
    

    const rawToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const hashedToken = hashToken(rawToken);


    await db.query(
      `
      UPDATE users
      SET email_verification_token = ?, email_verification_expires = ?
      WHERE id = ?
      `,
      [hashedToken, expires, userId]
    );



    // 3️⃣ email küldés
    const verifyLink =
      `${process.env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(rawToken)}`;

    console.log("🧪 VERIFY LINK:", verifyLink);
    console.log("🧪 RAW TOKEN:", rawToken);

    // ✅ 1. ELŐBB válasz
    res.status(201).json({
      message: "Sikeres regisztráció! Ellenőrizd az emailed.",
    });

    // ✅ 2. EMAIL háttérben (NINCS await)
    sendEmail({
      to: email,
      subject: "Email cím megerősítése – Ösztönkód",
      html: `
        <div style="font-family: Arial, sans-serif">
          <h2>Szia ${name}!</h2>
          <p>Kérjük, erősítsd meg az email címed:</p>

          <a href="${verifyLink}"
            style="
              display:inline-block;
              padding:12px 20px;
              background:#059669;
              color:#ffffff;
              text-decoration:none;
              border-radius:6px;
            ">
            Email megerősítése
          </a>

          <p style="margin-top:16px;">
            Ha a gomb nem működik, másold be ezt a linket:
          </p>

          <p style="word-break: break-all;">
            <a href="${verifyLink}">${verifyLink}</a>
          </p>
        </div>
      `,
    }).catch(err => {
      console.error("EMAIL ERROR:", err);
    });

    } catch (err) {
  console.error("Register error:", err);
  res.status(500).json({ error: "Szerver hiba (register)" });
 }
};



  



// --------------------
// LOGIN
// --------------------
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Hiányzó email vagy jelszó!" });
  }

  try {
    const [userRows] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (userRows.length === 0) {
      return res.status(400).json({ error: "Nincs ilyen felhasználó!" });
    }

    const user = userRows[0];

    // 1️⃣ jelszó ellenőrzés
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Hibás jelszó!" });
    }

    // 2️⃣ EMAIL ELLENŐRZÉS
    if (!user.email_verified) {
      return res.status(403).json({
        error: "Kérjük, erősítsd meg az email címed.",
      });
    }

    // 3️⃣ token generálás
    const token = generateToken(user);

    res.json({
      message: "Sikeres bejelentkezés!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.is_admin === 1,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Szerver hiba (login)" });
  }
};





// --------------------
// PROFIL
// --------------------
exports.getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, is_admin FROM users WHERE id = ?",
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Felhasználó nem található." });
    }

    res.json({
      id: rows[0].id,
      name: rows[0].name,
      email: rows[0].email,
      isAdmin: rows[0].is_admin === 1,
    });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ error: "Szerver hiba (profile)" });
  }
};

// --------------------
// UPDATE PROFILE
// --------------------
exports.updateProfile = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Név kötelező." });
  }

  try {
    await db.query(
      "UPDATE users SET name = ? WHERE id = ?",
      [name, req.user.id]
    );

    res.json({ message: "Profil frissítve." });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Szerver hiba." });
  }
};


// --------------------
// CHANGE PASSWORD (LOGGED IN)
// --------------------
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Hiányzó adat." });
  }

  try {
    const [users] = await db.query(
      "SELECT password FROM users WHERE id = ?",
      [req.user.id]
    );

    const user = users[0];

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ error: "Hibás jelenlegi jelszó." });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashed, req.user.id]
    );

    res.json({ message: "Jelszó sikeresen módosítva." });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Szerver hiba." });
  }
};






// --------------------
// FORGOT PASSWORD
// --------------------
exports.forgotPassword = async (req, res) => {
  console.log("FORGOT PASSWORD CONTROLLER FUT");
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email kötelező." });
  }

  try {
    const [users] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    // Biztonság: nem áruljuk el, létezik-e
    if (users.length === 0) {
      return res.json({
        message: "Ha létezik a fiók, emailt küldtünk.",
      });
    }

   const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = hashToken(rawToken);
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 óra
    
    await db.query(
      `
      UPDATE users
      SET reset_token = ?, reset_token_expires = ?
      WHERE email = ?
      `,
      [hashedToken, expires, email]
    );

    // 🔧 DEV MÓDBAN: ideiglenes log

   const resetLink =
  `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;



    console.log("EMAIL KÜLDÉS ELŐTT");



   // ❌ await törlés

      sendEmail({
        to: email,
        subject: "Jelszó visszaállítása – Ösztönkód",
        html: `
          <div style="font-family: Arial, sans-serif">
            <h2>Jelszó visszaállítás</h2>
            <p>Kattints az alábbi gombra az új jelszó beállításához:</p>

            <a href="${resetLink}"
              style="
                display:inline-block;
                padding:12px 20px;
                background:#059669;
                color:#ffffff;
                text-decoration:none;
                border-radius:6px;
              ">
              Új jelszó beállítása
            </a>

            <p style="margin-top:20px; font-size:12px; color:#666">
              Ha nem te kérted, hagyd figyelmen kívül.
            </p>
          </div>
        `,
      })
      .then(() => {
        console.log("✅ EMAIL ELKÜLDVE");
      })
      .catch(err => {
        console.error("❌ EMAIL ERROR:", err);
      });

      // ✅ AZONNAL válasz
      return res.json({
        message: "Ha létezik a fiók, emailt küldtünk.",
      });
     } catch (err) {
  console.error("Forgot password error:", err);
  return res.status(500).json({ error: "Szerver hiba." });
}
};
    



// --------------------
// RESET PASSWORD
// --------------------
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: "Hiányzó adat." });
  }

  try {
    
    const hashedToken = hashToken(token);

    const [users] = await db.query(
      `
      SELECT id
      FROM users
      WHERE reset_token = ?
        AND reset_token_expires > NOW()
      `,
      [hashedToken]
    );

    if (users.length === 0) {
      return res
        .status(400)
        .json({ error: "Érvénytelen vagy lejárt token." });
    }

    const hashed = await bcrypt.hash(password, 10);

    await db.query(
      `
      UPDATE users
      SET password = ?, reset_token = NULL, reset_token_expires = NULL
      WHERE id = ?
      `,
      [hashed, users[0].id]
    );

    res.json({ message: "Jelszó sikeresen frissítve." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Szerver hiba." });
  }
};

// --------------------
// DELETE ACCOUNT (LOGGED IN)
// --------------------
exports.deleteAccount = async (req, res) => {
  try {
    await db.query(
      "DELETE FROM users WHERE id = ?",
      [req.user.id]
    );

    res.json({ message: "Fiók sikeresen törölve." });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ error: "Szerver hiba." });
  }
};



// --------------------
// EMAIL VERIFY
// --------------------
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.json({
      status: "invalid",
      message: "A megerősítő link érvénytelen.",
    });
  }

  try {
    
    const hashedToken = hashToken(token);

    const [users] = await db.query(
      `
      SELECT id, email, is_admin, email_verified, email_verification_expires,
       has_struggle_breaker
      FROM users
      WHERE email_verification_token = ?
      `,
      [hashedToken]
    );

    // 🔁 Token már felhasználva vagy nem létezik
    if (users.length === 0) {
      return res.json({
        status: "already_verified",
        message: "Az email cím már megerősítésre került.",
      });
    }

    const user = users[0];

    // ⏰ Lejárt token
    if (new Date(user.email_verification_expires) < new Date()) {
      return res.json({
        status: "expired",
        message: "A megerősítő link lejárt. Kérj újat.",
      });
    }

   
    // ✅ Verify
    await db.query(
      `
      UPDATE users
      SET email_verified = 1,
          email_verification_token = NULL,
          email_verification_expires = NULL
      WHERE id = ?
      `,
      [user.id]
    );

    // 🔐 AUTOMATIKUS LOGIN TOKEN
    const loginToken = generateToken({
      id: user.id,
      email: user.email,
      is_admin: user.is_admin,
      email_verified: 1,
      has_struggle_breaker: user.has_struggle_breaker
    });

    return res.json({
      status: "verified",
      message: "Email sikeresen megerősítve.",
      token: loginToken,
    });


  } catch (err) {
    console.error("Verify email error:", err);
    return res.json({
      status: "error",
      message: "Ideiglenes hiba történt.",
    });
  }
};




// --------------------
// RESEND EMAIL VERIFICATION
// --------------------
exports.resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.json({
      message: "Ha létezik a fiók, elküldtük az emailt.",
    });
  }

  try {
    const [users] = await db.query(
      `
      SELECT id, name, email_verified
      FROM users
      WHERE email = ?
      `,
      [email]
    );

    // 🔐 Biztonság: nem áruljuk el
    if (users.length === 0) {
      return res.json({
        message: "Ha létezik a fiók, elküldtük az emailt.",
      });
    }

    const user = users[0];

    // ✅ Már megerősített
    if (user.email_verified) {
      return res.json({
        message: "Ez az email cím már meg van erősítve.",
      });
    }

    // 🔁 Új token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = hashToken(rawToken);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.query(
      `
      UPDATE users
      SET email_verification_token = ?,
          email_verification_expires = ?
      WHERE id = ?
      `,
      [hashedToken, expires, user.id]
    );

     const verifyLink =
  `${process.env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(rawToken)}`;



   
     sendEmail({
      to: email,
      subject: "Email megerősítése – Ösztönkód",
      html: `
        <div style="font-family: Arial, sans-serif">
          <h2>Szia ${user.name}!</h2>
          <p>Itt az új megerősítő linked:</p>

          <a href="${verifyLink}"
            style="
              display:inline-block;
              padding:12px 20px;
              background:#059669;
              color:#ffffff;
              text-decoration:none;
              border-radius:6px;
            ">
            Email megerősítése
          </a>

          <p style="margin-top:20px; font-size:12px; color:#666">
            A link 24 óráig érvényes.
          </p>
        </div>
      `,
    });

  

    return res.json({
      message: "Ha létezik a fiók, elküldtük az emailt.",
    });
  } catch (err) {
    console.error("Resend verification error:", err);
    return res.json({
      message: "Ha létezik a fiók, elküldtük az emailt.",
    });
  }
};


// --------------------
// AUTH ME (DB-ALAPÚ, STRIPE-KOMPATIBILIS)
// --------------------
exports.me = async (req, res) => {
  try {
    const userId = req.user.id;

    // USER ALAPADAT
    const [users] = await db.query(
      `
      SELECT id, email, is_admin, email_verified, has_struggle_breaker
      FROM users
      WHERE id = ?
      `,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "Felhasználó nem található." });
    }

    const user = users[0];

    // AKTÍV ELŐFIZETÉS / HOZZÁFÉRÉS
    const [subs] = await db.query(
      `
      SELECT id
      FROM subscriptions
      WHERE user_id = ?
        AND status IN ('active', 'trialing')
      LIMIT 1
      `,
      [userId]
    );

    res.json({
      id: user.id,
      email: user.email,
      isAdmin: user.is_admin === 1,
      emailVerified: user.email_verified === 1,
      has_struggle_breaker: user.has_struggle_breaker === 1,
      hasAccess: subs.length > 0,
    });
  } catch (err) {
    console.error("GET /auth/me error:", err);
    res.status(500).json({ error: "Szerver hiba." });
  }
};
