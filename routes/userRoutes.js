const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const db = require("../config/db");
const validateHungarianTaxNumber = require("../utils/validateHungarianTaxNumber");

// --------------------------------------------------
// 🔹 SZÁMLÁZÁSI ADATOK LEKÉRÉSE
// --------------------------------------------------
router.get("/billing", auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
        billing_name,
        billing_country,
        billing_zip,
        billing_city,
        billing_address,
        billing_email,
        billing_tax_number,
        billing_is_company,
        billing_company_name,
        billing_company_zip,
        billing_company_city,
        billing_company_address
      FROM users
      WHERE id = ?
      `,
      [req.user.id]
    );

    res.json(rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Szerver hiba." });
  }
});


// --------------------------------------------------
// 🔹 SZÁMLÁZÁSI ADATOK MENTÉSE
// --------------------------------------------------
router.post("/billing", auth, async (req, res) => {
  try {
    const {
      billing_name,
      billing_country,
      billing_zip,
      billing_city,
      billing_address,
      billing_email,
      billing_tax_number,
      billing_is_company,
      billing_company_name,
      billing_company_zip,
      billing_company_city,
      billing_company_address,
    } = req.body;

    // 🔐 Boolean normalizálás
    const isCompany =
      billing_is_company === true ||
      billing_is_company === 1 ||
      billing_is_company === "true";

    // 🧹 Trim helper
    const safe = (val) => (typeof val === "string" ? val.trim() : val);

    const name = safe(billing_name);
    const zip = safe(billing_zip);
    const city = safe(billing_city);
    const address = safe(billing_address);
    const country = safe(billing_country) || "Magyarország";
    const email = safe(billing_email);
    const taxNumber = safe(billing_tax_number);

    const companyName = safe(billing_company_name);
    const companyZip = safe(billing_company_zip);
    const companyCity = safe(billing_company_city);
    const companyAddress = safe(billing_company_address);

    // --------------------------------------------------
    // 📧 EMAIL VALIDÁCIÓ (MINDIG KÖTELEZŐ)
    // --------------------------------------------------
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        message: "Érvénytelen számlázási email.",
      });
    }

    // --------------------------------------------------
    // 👤 MAGÁNSZEMÉLY VALIDÁCIÓ
    // --------------------------------------------------
    if (!isCompany) {
      if (!name || !zip || !city || !address) {
        return res.status(400).json({
          message: "Hiányzó számlázási adatok.",
        });
      }
    }

    // --------------------------------------------------
    // 🏢 CÉGES VALIDÁCIÓ
    // --------------------------------------------------
    if (isCompany) {
      if (!companyName || !companyZip || !companyCity || !companyAddress || !taxNumber) {
        return res.status(400).json({
          message: "Hiányzó céges számlázási adatok.",
        });
      }

      if (!validateHungarianTaxNumber(taxNumber)) {
        return res.status(400).json({
          message: "Érvénytelen magyar adószám.",
        });
      }
    }

    // --------------------------------------------------
    // 💾 ADATBÁZIS MENTÉS
    // --------------------------------------------------
    await db.query(
      `
      UPDATE users SET
        billing_name = ?,
        billing_country = ?,
        billing_zip = ?,
        billing_city = ?,
        billing_address = ?,
        billing_email = ?,
        billing_tax_number = ?,
        billing_is_company = ?,
        billing_company_name = ?,
        billing_company_zip = ?,
        billing_company_city = ?,
        billing_company_address = ?
      WHERE id = ?
      `,
      [
        isCompany ? companyName : name,
        country,
        isCompany ? companyZip : zip,
        isCompany ? companyCity : city,
        isCompany ? companyAddress : address,
        email, // ✅ helyes pozíció
        isCompany ? taxNumber : null,
        isCompany ? 1 : 0,
        isCompany ? companyName : null,
        isCompany ? companyZip : null,
        isCompany ? companyCity : null,
        isCompany ? companyAddress : null,
        req.user.id,
      ]
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Szerver hiba." });
  }
});







module.exports = router;
