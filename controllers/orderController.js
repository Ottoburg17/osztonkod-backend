const db = require("../config/db");



exports.createOrder = async (req, res) => {
 
  const { items, acceptedLegal } = req.body;
  

  if (acceptedLegal !== true) {
  return res.status(400).json({
    error: "A jogi feltételek elfogadása kötelező a vásárláshoz.",
  });
}
  
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Üres vagy hibás kosár." });
  }

  const slugs = items.map(i => i.slug);

    console.log("ITEMS:", items);   
  console.log("SLUGS:", slugs);   

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1️⃣ Termékek DB-ből (AZ EGYETLEN IGAZSÁGFORRÁS)
    const [products] = await conn.query(
      `SELECT id, slug, price
       FROM products
       WHERE slug IN (?) AND is_active = 1`,
      [slugs]
    );

    if (products.length !== items.length) {
      throw new Error("Ismeretlen vagy inaktív termék van a kosárban.");
    }

    // 2️⃣ Ár újraszámolás
    let totalPrice = 0;

    for (const item of items) {
      if (!item.quantity || item.quantity <= 0) {
        throw new Error("Érvénytelen mennyiség.");
      }

      const product = products.find(p => p.slug === item.slug);
      if (!product) {
        throw new Error("Érvénytelen termék.");
      }

      totalPrice += product.price * item.quantity;
    }

    // 3️⃣ Order létrehozása (PENDING)
      // 🌐 Valódi kliens IP (proxy kompatibilis)
    const clientIp =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress;


     const [orderResult] = await conn.query(
        `
        INSERT INTO orders (
          user_id,
          total_price,
          status,
          accepted_legal,
          accepted_legal_at,
          accepted_legal_ip
        )
        VALUES (?, ?, 'pending', 1, NOW(), ?)
        `,
        [
          req.user.id,
          totalPrice,
          clientIp,
        ]
      );


    const orderId = orderResult.insertId;

    // 4️⃣ Snapshot mentése
    for (const item of items) {
      const product = products.find(p => p.slug === item.slug);

      await conn.query(
        `INSERT INTO order_items
         (order_id, product_id, slug_snapshot, price_snapshot, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        [
          orderId,
          product.id,
          product.slug,
          product.price,
          item.quantity,
        ]
      );
    }

    await conn.commit();

    res.status(201).json({
      orderId,
      totalPrice,
      status: "pending",
    });

  } catch (err) {
    await conn.rollback();
    console.error("Create order error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

// --------------------------------------------------
// SAJÁT RENDELÉSEK
// --------------------------------------------------
exports.getMyOrders = async (req, res) => {
  try {
    const [orders] = await db.query(
      `
      SELECT id, total_price, status, created_at
      FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    if (orders.length === 0) {
      return res.json([]);
    }

    const orderIds = orders.map(o => o.id);

    const [items] = await db.query(
      `
      SELECT
        order_id,
        product_id,
        slug_snapshot,
        price_snapshot,
        quantity
      FROM order_items
      WHERE order_id IN (?)
      `,
      [orderIds]
    );

    // rendelés → tételek összepárosítása
    const ordersWithItems = orders.map(order => ({
      ...order,
      items: items.filter(i => i.order_id === order.id),
    }));

    res.json(ordersWithItems);
  } catch (err) {
    console.error("Get my orders error:", err);
    res.status(500).json({ error: "Szerver hiba." });
  }
};


// --------------------------------------------------
// EGY RENDELÉS RÉSZLETEI (ORDER + ITEMS)
// --------------------------------------------------
exports.getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const [orders] = await db.query(
      `SELECT id, total_price, status, created_at
       FROM orders
       WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: "Nincs ilyen rendelés." });
    }

    const [items] = await db.query(
      `SELECT slug_snapshot, price_snapshot, quantity
       FROM order_items
       WHERE order_id = ?`,
      [id]
    );

    res.json({
      ...orders[0],
      items,
    });
  } catch (err) {
    console.error("Get order by id error:", err);
    res.status(500).json({ error: "Szerver hiba." });
  }
};

// --------------------------------------------------
// VAN-E ADOTT TERMÉKE A USERNEK?
// --------------------------------------------------
exports.hasProduct = async (req, res) => {
  if (process.env.DEV_FREE_ACCESS === "true") {
    return res.json({ hasAccess: true });
  }

  const userId = req.user.id;
  const { slug } = req.params;

  const PRODUCT_BUNDLES = {
    "brainmap": ["full-map"],
    "emotional-brainmap": ["full-map"],
    "perception": ["full-map"],
  };

  const allowedSlugs = [
    slug,
    ...(PRODUCT_BUNDLES[slug] || []),
  ];

  try {
    // 🔹 1️⃣ Lifetime termék ellenőrzés
    const [lifetime] = await db.query(
      `
      SELECT 1
      FROM user_products
      WHERE user_id = ?
        AND product_slug IN (?)
      LIMIT 1
      `,
      [userId, allowedSlugs]
    );

    if (lifetime.length > 0) {
      return res.json({ hasAccess: true });
    }

    // 🔹 2️⃣ Előfizetés ellenőrzés
    const [subscription] = await db.query(
      `
      SELECT 1
      FROM subscriptions
      WHERE user_id = ?
        AND product_slug IN (?)
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at >= CURDATE())
      LIMIT 1
      `,
      [userId, allowedSlugs]
    );

    res.json({ hasAccess: subscription.length > 0 });

  } catch (err) {
    console.error("hasProduct error:", err);
    res.status(500).json({ hasAccess: false });
  }
};




// --------------------------------------------------
// ADMIN: ÖSSZES RENDELÉS
// --------------------------------------------------
exports.getAllOrders = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, user_id, total_price, status, created_at
       FROM orders
       ORDER BY created_at DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error("Get all orders error:", err);
    res.status(500).json({ error: "Szerver hiba." });
  }
};

// --------------------------------------------------
// ADMIN: RENDELÉS STÁTUSZ FRISSÍTÉSE
// --------------------------------------------------
exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowed = ["pending", "paid", "refunded"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: "Érvénytelen státusz." });
  }

  try {
    await db.query(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, id]
    );

    res.json({ message: "Státusz frissítve." });
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ error: "Szerver hiba." });
  }
};

// --------------------------------------------------
// ADMIN: RENDELÉS TÖRLÉSE
// --------------------------------------------------
exports.deleteOrder = async (req, res) => {
  const { id } = req.params;


 

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Előbb a kapcsolódó tételek
    await conn.query(
      "DELETE FROM order_items WHERE order_id = ?",
      [id]
    );

    // Majd maga a rendelés
    const [result] = await conn.query(
      "DELETE FROM orders WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      throw new Error("Nincs ilyen rendelés.");
    }

    await conn.commit();

    res.json({ message: "Rendelés sikeresen törölve." });
  } catch (err) {
    await conn.rollback();
    console.error("Delete order error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};


// --------------------------------------------------
// ADMIN: RENDELÉS RÉSZLETEI (JOGI ADATOKKAL)
// --------------------------------------------------
exports.getAdminOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const [orders] = await db.query(
      `
      SELECT
        id,
        user_id,
        total_price,
        status,
        accepted_legal,
        accepted_legal_at,
        accepted_legal_ip,
        created_at
      FROM orders
      WHERE id = ?
      `,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: "Nincs ilyen rendelés." });
    }

    const [items] = await db.query(
      `
      SELECT
        slug_snapshot,
        price_snapshot,
        quantity
      FROM order_items
      WHERE order_id = ?
      `,
      [id]
    );

    res.json({
      ...orders[0],
      items,
    });
  } catch (err) {
    console.error("Admin get order error:", err);
    res.status(500).json({ error: "Szerver hiba." });
  }
};
