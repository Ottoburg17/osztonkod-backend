const db = require("../config/db");

/* ======================================================
  🚀 SESSION INDÍTÁS
====================================================== */
exports.startSession = async (req, res) => {
  const userId = req.user.id;

  try {
    // Van-e már nem completed session?
    const [[existing]] = await db.query(
      `
      SELECT id
      FROM cycle_breaker_sessions
      WHERE user_id = ?
        AND completed = FALSE
      ORDER BY started_at DESC
      LIMIT 1
      `,
      [userId]
    );

    if (existing) {
      return res.json({ sessionId: existing.id });
    }

    const [result] = await db.query(
      `
      INSERT INTO cycle_breaker_sessions (user_id)
      VALUES (?)
      `,
      [userId]
    );

    res.json({ sessionId: result.insertId });

  } catch (err) {
    console.error("startSession error:", err);
    res.status(500).json({ error: "Session indítás hiba." });
  }
};


/* ======================================================
   📌 AKTÍV SESSION LEKÉRÉS
====================================================== */
exports.getActiveSession = async (req, res) => {
  const userId = req.user.id;

  try {
    const [[session]] = await db.query(
      `
      SELECT *
      FROM cycle_breaker_sessions
      WHERE user_id = ?
        AND completed = FALSE
      ORDER BY started_at DESC
      LIMIT 1
      `,
      [userId]
    );

    res.json(session || null);

  } catch (err) {
    console.error("getActiveSession error:", err);
    res.status(500).json({ error: "Session lekérés hiba." });
  }
};


/* ======================================================
   🟡 TRIGGER RÖGZÍTÉS
====================================================== */
exports.addTrigger = async (req, res) => {
  const userId = req.user.id;

  const {
    sessionId,
    triggerType,
    emotion,
    intensity,
    thoughtPattern,
    bodyReaction,
    avoidanceLevel
  } = req.body;

  try {
    const [result] = await db.query(
      `
      INSERT INTO cycle_breaker_triggers
      (user_id, session_id, trigger_type, emotion, intensity,
       thought_pattern, body_reaction, avoidance_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        sessionId,
        triggerType,
        emotion,
        intensity,
        thoughtPattern,
        bodyReaction,
        avoidanceLevel
      ]
    );

    res.json({ triggerId: result.insertId });

  } catch (err) {
    console.error("addTrigger error:", err);
    res.status(500).json({ error: "Trigger mentés hiba." });
  }
};




/* ======================================================
   🔵 BREAK (Ciklus megszakítás)
====================================================== */
exports.addBreak = async (req, res) => {
  const userId = req.user.id;

  const {
    sessionId,
    triggerId,
    wasSuccessful,
    energyDelta,
    strategy,
    awarenessLevel,
    energyBefore,
    energyAfter
  } = req.body;

  try {
    await db.query(
      `
      INSERT INTO cycle_breaker_breaks
      (user_id, session_id, trigger_id, was_successful,
       energy_delta, strategy, awareness_level,
       energy_before, energy_after)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        sessionId,
        triggerId,
        wasSuccessful,
        energyDelta,
        strategy,
        awarenessLevel,
        energyBefore,
        energyAfter
      ]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("addBreak error:", err);
    res.status(500).json({ error: "Break mentés hiba." });
  }
};


/* ======================================================
   🟣 NAPI REFLEXIÓ
====================================================== */
exports.saveReflection = async (req, res) => {
  const userId = req.user.id;

  const {
    sessionId,
    dayNumber,
    reflectionText,
    energyScore,
    patternRecognized,
    lesson,
    nextCorrection
  } = req.body;

  try {
    await db.query(
      `
      INSERT INTO cycle_breaker_reflections
      (user_id, session_id, day_number,
       reflection_text, energy_score,
       pattern_recognized, lesson, next_correction)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        reflection_text = VALUES(reflection_text),
        energy_score = VALUES(energy_score),
        pattern_recognized = VALUES(pattern_recognized),
        lesson = VALUES(lesson),
        next_correction = VALUES(next_correction)
      `,
      [
        userId,
        sessionId,
        dayNumber,
        reflectionText,
        energyScore,
        patternRecognized,
        lesson,
        nextCorrection
      ]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("saveReflection error:", err);
    res.status(500).json({ error: "Reflection mentés hiba." });
  }
};



/* ======================================================
   🔴 HETI REPORT (AI-SZERŰ GENERÁLÁS)
====================================================== */
exports.getWeeklyReport = async (req, res) => {
  const userId = req.user.id;
  

  try {

      const weekNumberQuery = await db.query(
      `SELECT YEARWEEK(CURDATE(), 1) AS currentWeek`
    );
    const weekNumber = weekNumberQuery[0][0].currentWeek;


    // 1️⃣ Létezik-e már?
    const [[existing]] = await db.query(
      `
      SELECT *
      FROM cycle_breaker_weekly_reports
      WHERE user_id = ?
        AND week_number = ?
      LIMIT 1
      `,
      [userId, weekNumber]
    );

    if (existing) {
      return res.json(existing);
    }

    // 2️⃣ Adatok lekérése
   const [triggers] = await db.query(
      `
      SELECT trigger_type, emotion, thought_pattern,
            avoidance_level, intensity
      FROM cycle_breaker_triggers
      WHERE user_id = ?
        AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)
      `,
      [userId]
    );

    const emotionMap = {};
      triggers.forEach(t => {
        emotionMap[t.emotion] =
          (emotionMap[t.emotion] || 0) + 1;
      });

    const dominantEmotion =
      Object.entries(emotionMap)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "Nincs adat";

    
    const thoughtMap = {};
    triggers.forEach(t => {
      thoughtMap[t.thought_pattern] =
        (thoughtMap[t.thought_pattern] || 0) + 1;
    });

    const dominantThought =
      Object.entries(thoughtMap)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "Nincs adat";

    
   const avoidanceIndex =
    triggers.length > 0
      ? Math.round(
          triggers.reduce((sum, t) => sum + (t.avoidance_level || 0), 0)
          / triggers.length
        )
      : 0;

        
    const [breaks] = await db.query(
      `
      SELECT was_successful, energy_delta
      FROM cycle_breaker_breaks
      WHERE user_id = ?
        AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)
      `,
      [userId]
    );

    // 3️⃣ Statisztika
    const totalTriggers = triggers.length;

    const triggerMap = {};
    triggers.forEach(t => {
      triggerMap[t.trigger_type] =
        (triggerMap[t.trigger_type] || 0) + 1;
    });

    const dominantTrigger =
      Object.entries(triggerMap)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "Nincs adat";

    const totalBreaks = breaks.length;
    const successfulBreaks =
      breaks.filter(b => b.was_successful).length;

    const successRate =
      totalBreaks > 0
        ? Math.round((successfulBreaks / totalBreaks) * 100)
        : 0;

    const totalEnergy =
      breaks.reduce((sum, b) => sum + b.energy_delta, 0);

    let energyTrend = "stagnáló";
    if (totalEnergy > 10) energyTrend = "emelkedő";
    if (totalEnergy < -10) energyTrend = "csökkenő";

    // 4️⃣ Generált szöveg
    const generatedText = `
    Ezen a héten ${totalTriggers} trigger történt.

    Domináns érzelem: ${dominantEmotion}
    Domináns gondolatminta: "${dominantThought}"

    Átlagos elkerülési szint: ${avoidanceIndex}/10

    Megszakítási sikerarány: ${successRate}%
    Energiatrend: ${energyTrend}

    Ez a hét a tudatosság mélyülését mutatja.
    `;


    // 5️⃣ Mentés
        await db.query(
      `
      INSERT INTO cycle_breaker_weekly_reports
      (user_id, week_number,
      dominant_trigger,
      dominant_emotion,
      dominant_thought,
      avoidance_index,
      success_rate,
      energy_trend,
      generated_text)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        weekNumber,
        dominantTrigger,
        dominantEmotion,
        dominantThought,
        avoidanceIndex,
        successRate,
        energyTrend,
        generatedText
      ]
    );

    res.json({
      week_number: weekNumber,
      dominant_trigger: dominantTrigger,
      energy_trend: energyTrend,
      generated_text: generatedText,
      success_rate: successRate,
    });

  } catch (err) {
    console.error("Weekly report error:", err);
    res.status(500).json({ error: "Weekly report hiba." });
  }
};


/* ======================================================
   📤 EXPORT
====================================================== */
exports.exportUserData = async (req, res) => {
  const userId = req.user.id;

  try {
    const [sessions] = await db.query(
      `SELECT * FROM cycle_breaker_sessions WHERE user_id = ?`,
      [userId]
    );

    const [triggers] = await db.query(
      `SELECT * FROM cycle_breaker_triggers WHERE user_id = ?`,
      [userId]
    );

    const [breaks] = await db.query(
      `SELECT * FROM cycle_breaker_breaks WHERE user_id = ?`,
      [userId]
    );

    const [reflections] = await db.query(
      `SELECT * FROM cycle_breaker_reflections WHERE user_id = ?`,
      [userId]
    );

    res.json({
      sessions,
      triggers,
      breaks,
      reflections,
    });

  } catch (err) {
    console.error("exportUserData error:", err);
    res.status(500).json({ error: "Export hiba." });
  }
};



/* ======================================================
   🧠 AKTUÁLIS MENTÁLIS ÁLLAPOT
====================================================== */
exports.getMentalState = async (req, res) => {
  const userId = req.user.id;

  try {
    // 1️⃣ Heti trigger adatok
    const [triggers] = await db.query(
      `
      SELECT emotion, intensity, avoidance_level
      FROM cycle_breaker_triggers
      WHERE user_id = ?
        AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)
      `,
      [userId]
    );

    // 2️⃣ Heti break adatok
    const [breaks] = await db.query(
      `
      SELECT was_successful, energy_delta
      FROM cycle_breaker_breaks
      WHERE user_id = ?
        AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)
      `,
      [userId]
    );

    const totalTriggers = triggers.length;

    const avgIntensity =
      totalTriggers > 0
        ? triggers.reduce((s, t) => s + (t.intensity || 0), 0) / totalTriggers
        : 0;

    const avgAvoidance =
      totalTriggers > 0
        ? triggers.reduce((s, t) => s + (t.avoidance_level || 0), 0) / totalTriggers
        : 0;

    const totalBreaks = breaks.length;
    const successRate =
      totalBreaks > 0
        ? breaks.filter(b => b.was_successful).length / totalBreaks
        : 0;

    const energyBalance =
      breaks.reduce((s, b) => s + (b.energy_delta || 0), 0);

    /* =========================
       MENTÁLIS MÓD LOGIKA
    ========================= */

    let state = "balanced";
    let suggestion = "Figyeld tudatosan a reakcióid.";

    if (avgIntensity > 7 && avgAvoidance > 6) {
      state = "reactive";
      suggestion = "Állj meg 90 másodpercre. Légzés. Ne reagálj azonnal.";
    }
    else if (avgAvoidance > 7) {
      state = "avoidant";
      suggestion = "Menj bele kicsiben. Ne halaszd, indíts mikro-lépéssel.";
    }
    else if (avgIntensity > 8 && successRate < 0.4) {
      state = "overdriven";
      suggestion = "Energia levezetés. Séta vagy fizikai mozgás.";
    }
    else if (successRate > 0.7 && energyBalance > 10) {
      state = "recovering";
      suggestion = "Erősödő kontroll. Tartsd ezt a ritmust.";
    }

    res.json({
      state,
      avgIntensity: Math.round(avgIntensity),
      avgAvoidance: Math.round(avgAvoidance),
      successRate: Math.round(successRate * 100),
      energyBalance,
      suggestion
    });

  } catch (err) {
    console.error("Mental state error:", err);
    res.status(500).json({ error: "Mental state hiba." });
  }
};
