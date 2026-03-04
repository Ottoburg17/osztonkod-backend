const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

const {
  createOrder,
  getMyOrders,
  getAllOrders,
  deleteOrder,
  updateOrderStatus,
  hasProduct,
  getOrderById,
  getAdminOrderById, 
} = require("../controllers/orderController");

// --------------------
// ÚJ RENDELÉS (USER)
// --------------------
router.post("/", auth, createOrder);

// --------------------
// SAJÁT RENDELÉSEK (USER)
// --------------------
router.get("/my", auth, getMyOrders);

// --------------------
// DIGITÁLIS TARTALOM HOZZÁFÉRÉS
// --------------------
router.get("/has-product/:slug", auth, hasProduct);

// --------------------
// ADMIN: ÖSSZES RENDELÉS
// --------------------
router.get("/all", auth, admin, getAllOrders);

// ADMIN: RENDELÉS RÉSZLETEI (JOGI ADATOKKAL)
// --------------------
router.get("/admin/:id", auth, admin, getAdminOrderById);

// --------------------
// ADMIN: RENDELÉS STÁTUSZ FRISSÍTÉS
// --------------------
router.patch("/:id/status", auth, admin, updateOrderStatus);

// --------------------
// ADMIN: RENDELÉS TÖRLÉSE
// --------------------
router.delete("/:id", auth, admin, deleteOrder);

// --------------------
// USER: RENDELÉS RÉSZLETEI
// ⚠️ MINDIG A VÉGÉN!
// --------------------
router.get("/:id", auth, getOrderById);

module.exports = router;
