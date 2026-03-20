const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  deleteAccount,
  verifyEmail,
  resendVerificationEmail,
  me, // ⭐ EZ AZ ÚJ, DB-ALAPÚ ENDPOINT
} = require("../controllers/authController");


// ==========================
// AUTH
// ==========================

// REGISZTRÁCIÓ
router.post("/register", register);

// LOGIN
router.post("/login", login);

// EMAIL ELLENŐRZÉS (NEM JWT!)
router.get("/verify-email", verifyEmail);

// ÚJ MEGERŐSÍTŐ EMAIL
router.post("/resend-verification", resendVerificationEmail);


// ==========================
// PROFIL / FELHASZNÁLÓ
// ==========================

// SAJÁT PROFIL (JWT REQUIRED)
router.get("/profile", auth, getProfile);
router.put("/profile", auth, updateProfile);

// 🔑 AKTUÁLIS FELHASZNÁLÓ – DB ALAPÚ (STRIPE KOMPATIBILIS)
router.get("/me", auth, me);


// ==========================
// JELSZÓ
// ==========================

// JELSZÓ MÓDOSÍTÁS
router.put("/change-password", auth, changePassword);

// ELFELEJTETT JELSZÓ
router.post("/forgot-password", forgotPassword);

// ÚJ JELSZÓ BEÁLLÍTÁSA
router.post("/reset-password", resetPassword);


// ==========================
// FIÓK
// ==========================

// FIÓK TÖRLÉS
router.delete("/delete-account", auth, deleteAccount);


module.exports = router;


