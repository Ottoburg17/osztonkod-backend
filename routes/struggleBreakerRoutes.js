const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const requireAccess = require("../middleware/requireStruggleBreakerAccess");

const controller = require("../controllers/struggleBreakerController");

/* ======================================================
   🚀 SESSION
====================================================== */

// Session indítás
router.post(
  "/start",
  auth,
  requireAccess,
  controller.startSession
);

// Aktív session lekérés
router.get(
  "/active-session",
  auth,
  requireAccess,
  controller.getActiveSession
);


/* ======================================================
   🟡 TRIGGER
====================================================== */

router.post(
  "/trigger",
  auth,
  requireAccess,
  controller.addTrigger
);


/* ======================================================
   🔵 BREAK
====================================================== */

router.post(
  "/break",
  auth,
  requireAccess,
  controller.addBreak
);


/* ======================================================
   🟣 REFLECTION
====================================================== */

router.post(
  "/reflection",
  auth,
  requireAccess,
  controller.saveReflection
);


/* ======================================================
   🔴 WEEKLY REPORT
====================================================== */

router.get(
  "/weekly-report",
  auth,
  requireAccess,
  controller.getWeeklyReport
);


/* ======================================================
   📤 EXPORT
====================================================== */

router.get(
  "/export",
  auth,
  requireAccess,
  controller.exportUserData
);


router.get(
  "/mental-state",
  auth,
  requireAccess,
  controller.getMentalState
);



module.exports = router;
