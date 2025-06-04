const express = require("express");
const router = express.Router();
const { initializeConnection } = require('../modules/db'); // adjust the path as needed




// Middleware to protect owner routes
function isOwner(req, res, next) {
  if (req.session.role === 'owner') return next();
  return res.status(403).send('Access denied');
}

// Route: /dash/owner
router.get("/", (req, res) => {
  if (req.session.role !== "owner") {
    return res.status(403).send("Access denied");
  }

  res.render("owner/dash", { user: req.session.user });
});
// GET /dash/owner/equipment - Owner's equipment list
router.get('/equipment', isOwner, async (req, res) => {
  const conn = await initializeConnection();
  const [equipment] = await conn.execute('SELECT * FROM equipment WHERE owner_id = ?', [req.session.userId]);
  res.render('owner/equipment-list', { equipment });
});

// GET /dash/owner/equipment/add - Add equipment form
router.get('/equipment/add', isOwner, (req, res) => {
  res.render('owner/equipment-add');
});

// POST /dash/owner/equipment/add - Handle equipment creation
router.post('/equipment/add', isOwner, async (req, res) => {
  const { name, description, price_per_day, image_url } = req.body;
  const conn = await initializeConnection();
  await conn.execute(
    'INSERT INTO equipment (name, description, price_per_day, image_url, owner_id) VALUES (?, ?, ?, ?, ?)',
    [name, description, price_per_day, image_url, req.session.userId]
  );
  res.redirect('/dash/owner/equipment');
});

// GET /dash/owner/equipment/:id/edit - Edit form
router.get('/equipment/:id/edit', isOwner, async (req, res) => {
  const conn = await initializeConnection();
  const [rows] = await conn.execute('SELECT * FROM equipment WHERE equipment_id = ? AND owner_id = ?', [req.params.id, req.session.userId]);
  if (!rows.length) return res.status(404).send('Equipment not found');
  res.render('owner/equipment-edit', { equipment: rows[0] });
});

// POST /dash/owner/equipment/:id/edit - Handle edit
router.post('/equipment/:id/edit', isOwner, async (req, res) => {
  const { name, description, price_per_day, image_url } = req.body;
  const conn = await initializeConnection();
  await conn.execute(
    'UPDATE equipment SET name = ?, description = ?, price_per_day = ?, image_url = ? WHERE equipment_id = ? AND owner_id = ?',
    [name, description, price_per_day, image_url, req.params.id, req.session.userId]
  );
  res.redirect('/dash/owner/equipment');
});

// POST /dash/owner/equipment/:id/delete - Handle deletion
router.post('/equipment/:id/delete', isOwner, async (req, res) => {
  const conn = await initializeConnection();
  await conn.execute('DELETE FROM equipment WHERE equipment_id = ? AND owner_id = ?', [req.params.id, req.session.userId]);
  res.redirect('/dash/owner/equipment');
});

// GET /dash/owner/requests - View rental requests
router.get('/requests', isOwner, async (req, res) => {
  const conn = await initializeConnection();
  const [requests] = await conn.execute(
    `SELECT r.*, e.name AS equipment_name, u.username FROM rental_requests r
     JOIN equipment e ON r.equipment_id = e.equipment_id
     JOIN users u ON r.user_id = u.id
     WHERE e.owner_id = ?`,
    [req.session.userId]
  );
  res.render('owner/requests', { requests });
});

// GET /dash/owner/earnings - View earnings summary
router.get('/earnings', isOwner, async (req, res) => {
  const conn = await initializeConnection();
  const [earnings] = await conn.execute(
    `SELECT SUM(total_price) AS total_earned FROM rental_requests r
     JOIN equipment e ON r.equipment_id = e.equipment_id
     WHERE e.owner_id = ? AND r.status = 'approved'`,
    [req.session.userId]
  );
  res.render('owner/earnings', { total: earnings[0].total_earned || 0 });
});

module.exports = router;

module.exports = router;
