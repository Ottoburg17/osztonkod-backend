const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const db = require("../config/db");
const prompts = require("../data/dopaminePrompts");

const getToday = require("../utils/getToday");



/* ======================================================
   GET /api/dopamine-cycle/status
====================================================== */
router.get("/status", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getToday();



    const [cycles] = await db.query(
      `SELECT id, current_day, last_checkin, risk_level
       FROM dopamine_cycles
       WHERE user_id = ? AND is_active = 1
       LIMIT 1`,
      [userId]
    );

    
    if (cycles.length === 0) {
      const [result] = await db.query(
        `INSERT INTO dopamine_cycles (user_id, start_date, is_active)
        VALUES (?, ?, 1)`,
        [userId, today]
      );

      return res.json({
        active: true,
        day: 1,
        lastCheckIn: null,
        riskLevel: null,
        acknowledgedToday: false,
        streak: 0,
      });
    }


    const cycle = cycles[0];

    const [ackToday] = await db.query(
      `SELECT 1
       FROM dopamine_acknowledgements
       WHERE cycle_id = ? AND acknowledged_date = ?
       LIMIT 1`,
      [cycle.id, today]
    );

    const [streakRows] = await db.query(
      `
      SELECT COUNT(*) AS streak
      FROM dopamine_acknowledgements
      WHERE cycle_id = ?
        AND acknowledged_date >= DATE_SUB(?, INTERVAL 30 DAY)
      `,
      [cycle.id, today]
    );

    res.json({
      active: true,
      day: cycle.current_day,
      lastCheckIn: cycle.last_checkin,
      riskLevel: cycle.risk_level,
      acknowledgedToday: ackToday.length > 0,
      streak: streakRows[0].streak,
    });

  } catch (err) {
    console.error("status error:", err);
    res.status(500).json({ error: "Status lekérés hiba." });
  }
});


// -----------------------------------
// POST /api/dopamine-cycle/checkin
// -----------------------------------
router.post("/checkin", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getToday();

    const { trigger, notes, bodySignals, intensity } = req.body;

    const [rows] = await db.query(
      `SELECT * FROM dopamine_cycles
       WHERE user_id = ? AND is_active = 1
       LIMIT 1`,
      [userId]
    );

    let cycle;

    if (rows.length === 0) {
      const [result] = await db.query(
        `INSERT INTO dopamine_cycles (user_id, start_date, is_active)
         VALUES (?, ?, 1)`,
        [userId, today]
      );

      cycle = {
        id: result.insertId,
        current_day: 1,
        last_checkin: null,
      };
    } else {
      cycle = rows[0];
    }

    const safeBodySignals =
      Array.isArray(bodySignals)
        ? bodySignals
        : bodySignals
        ? [bodySignals]
        : null;

    const safeIntensity =
      typeof intensity === "number"
        ? intensity
        : intensity != null
        ? Number(intensity)
        : null;

    const safeNotes =
      notes && typeof notes === "object"
        ? JSON.stringify(notes)
        : notes || null;

    await db.query(
      `
      INSERT INTO dopamine_checkins
        (cycle_id, checkin_date, trigger_label, notes, body_signals, intensity)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        trigger_label = VALUES(trigger_label),
        notes = VALUES(notes),
        body_signals = VALUES(body_signals),
        intensity = VALUES(intensity)
      `,
      [
        cycle.id,
        today,
        trigger ?? null,
        safeNotes,
        safeBodySignals ? JSON.stringify(safeBodySignals) : null,
        safeIntensity,
      ]
    );

    if (cycle.last_checkin !== today) {
      await db.query(
        `UPDATE dopamine_cycles
         SET current_day = current_day + 1,
             last_checkin = ?
         WHERE id = ?`,
        [today, cycle.id]
      );
    }

    const [updated] = await db.query(
      `SELECT current_day, last_checkin, risk_level
       FROM dopamine_cycles
       WHERE id = ?`,
      [cycle.id]
    );

    res.json({
      active: true,
      day: updated[0].current_day,
      lastCheckIn: updated[0].last_checkin,
      riskLevel: updated[0].risk_level,
      acknowledgedToday: false,
    });

  } catch (err) {
    console.error("checkin error:", err);
    res.status(500).json({ error: "Check-in hiba." });
  }
});



// -----------------------------------
// GET /api/dopamine-cycle/daily-prompt
// -----------------------------------
router.get("/daily-prompt", auth, async (req, res) => {
  try {
  
  const userId = req.user.id;

  const [rows] = await db.query(
    `SELECT current_day
     FROM dopamine_cycles
     WHERE user_id = ? AND is_active = 1
     LIMIT 1`,
    [userId]
  );

  if (rows.length === 0) {
      if (req.user?.isAdmin) {
        const prompt = prompts[0];

        return res.json({
          day: 1,
      title: prompt.title,
      text: prompt.text,
      category: prompt.category,
      disclaimer:
        "Admin preview mód – szimulált tartalom.",
        });
      }

    return res.status(404).json({
      error: "Nincs aktív dopamin-ciklus",
    });
  }

  const day = rows[0].current_day;

  const prompt =
    prompts.find((p) => p.day === day) ||
    prompts[(day - 1) % prompts.length];

  res.json({
    day,
    title: prompt.title,
    text: prompt.text,
    category: prompt.category,
    disclaimer:
      "Ez az útmutatás nem tanácsadás és nem terápia. Megfigyelési gyakorlat.",
  });


  } catch (err) {
    console.error("daily-prompt error:", err);
    res.status(500).json({ error: "Daily prompt hiba." });
  }

});


// -----------------------------------
// POST /api/dopamine-cycle/acknowledge
// -----------------------------------
router.post("/acknowledge", auth, async (req, res) => {
  
  try {

  const userId = req.user.id;
  const today = getToday();


  // 1️⃣ aktív ciklus
  const [cycles] = await db.query(
    `SELECT id FROM dopamine_cycles
     WHERE user_id = ? AND is_active = 1
     LIMIT 1`,
    [userId,]
  );

  if (cycles.length === 0) {
  return res.status(400).json({
    error: "Nincs aktív dopamin-ciklus",
  });
}

  const cycleId = cycles[0].id;

  // 2️⃣ VOLT-E MÁR MA ACKNOWLEDGE?
  const [existing] = await db.query(
    `SELECT 1
     FROM dopamine_acknowledgements
     WHERE cycle_id = ? AND acknowledged_date = ?
     LIMIT 1`,
    [cycleId, today]
  );

  if (existing.length > 0) {
    return res.status(409).json({
      error: "Ma már megtörtént az acknowledge",
    });
  }

  // 3️⃣ mentés
  await db.query(
    `INSERT INTO dopamine_acknowledgements
     (cycle_id, acknowledged_date)
     VALUES (?, ?)`,
    [cycleId, today]
  );

  // 4️⃣ streak (utolsó 30 nap)
  const [streakRows] = await db.query(
    `
    SELECT COUNT(*) AS streak
    FROM dopamine_acknowledgements
    WHERE cycle_id = ?
      AND acknowledged_date >= DATE_SUB(?, INTERVAL 30 DAY)
    `,
    [cycleId, today]
  );

  res.json({
    acknowledged: true,
    date: today,
    streak: streakRows[0].streak,
  });

  } catch (err) {
    console.error("acknowledge error:", err);
    res.status(500).json({ error: "Acknowledge hiba." });
  }
});

// -----------------------------------
// GET /api/dopamine-cycle/weekly-summary
// -----------------------------------


router.get("/weekly-summary", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getToday(); 

    const [cycles] = await db.query(
      `SELECT id FROM dopamine_cycles
       WHERE user_id = ? AND is_active = 1
       LIMIT 1`,
      [userId]
    );

    if (cycles.length === 0) {
      return res.json({ hasData: false });
    }

    const cycleId = cycles[0].id;

    const [rows] = await db.query(
      `
      SELECT intensity, body_signals
      FROM dopamine_checkins
      WHERE cycle_id = ?
        AND checkin_date >= DATE_SUB(?, INTERVAL 7 DAY)
      `,
      [cycleId, today]
    );

    if (rows.length === 0) {
      return res.json({ hasData: false });
    }

    const intensities = rows
      .map(r => r.intensity)
      .filter(v => typeof v === "number");

    const avgIntensity =
      intensities.length > 0
        ? Math.round(
            intensities.reduce((a, b) => a + b, 0) / intensities.length
          )
        : null;

    const bodyCount = {};

    rows.forEach(r => {
      if (!r.body_signals) return;

      try {
        const parsed = JSON.parse(r.body_signals);
        const signals = Array.isArray(parsed) ? parsed : [parsed];

        signals.forEach(s => {
          bodyCount[s] = (bodyCount[s] || 0) + 1;
        });
      } catch {
        bodyCount[r.body_signals] =
          (bodyCount[r.body_signals] || 0) + 1;
      }
    });

    const mostCommonBody =
      Object.entries(bodyCount)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    res.json({
      hasData: true,
      checkins: rows.length,
      avgIntensity,
      mostCommonBody,
    });

  } catch (err) {
    console.error("weekly-summary error:", err);
    res.status(500).json({ error: "Weekly summary hiba." });
  }
});




router.get("/weekly-mirror", auth, async (req, res) => {
  
  try {
  const userId = req.user.id;
  const today = getToday(); 

  // 1️⃣ aktív ciklus ellenőrzése
  const [cycles] = await db.query(
    `SELECT id FROM dopamine_cycles
     WHERE user_id = ? AND is_active = 1
     LIMIT 1`,
    [userId]
  );

  if (cycles.length === 0) {
    return res.json({
      text: "Most nincs aktív megfigyelési folyamat."
    });
  }

  const cycleId = cycles[0].id;

  // 2️⃣ elmúlt 7 nap check-injei
  const [rows] = await db.query(
    `
    SELECT intensity
    FROM dopamine_checkins
    WHERE cycle_id = ?
      AND checkin_date >= DATE_SUB(?, INTERVAL 7 DAY)
    `,
    [cycleId, today]
  );

  if (rows.length === 0) {
    return res.json({
      text: "Ezen a héten nem történt rögzített megfigyelés."
    });
  }

  // 3️⃣ intenzitás feldolgozás
  const intensities = rows
    .map(r => r.intensity)
    .filter(v => typeof v === "number");

  const avg =
    intensities.length > 0
      ? intensities.reduce((a, b) => a + b, 0) / intensities.length
      : null;

  // 4️⃣ heti tükör (nem elemzés, nem tanács)
  let text = "A megfigyelések ezen a héten kiegyensúlyozott mintát mutattak.";

  if (avg !== null) {
    if (avg >= 7) {
      text = "Ezen a héten több helyzetben magas intenzitás jelent meg.";
    } else if (avg <= 3) {
      text = "Ezen a héten több megfigyelés alacsonyabb feszültséggel zajlott.";
    }
  }

  res.json({ text });

    } catch (err) {
    console.error("weekly-mirror error:", err);
    res.status(500).json({ error: "Weekly mirror hiba." });
  }
});



module.exports = router;
