const express = require("express");
const router = express.Router();
const { initializeConnection} = require('../modules/db'); // adjust the path as needed




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
// Helper: Format KES
function formatCurrencyKES(amount) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
  }).format(amount);
}

// Helper: Format readable date
function formatDateReadable(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

router.get('/requests', isOwner, async (req, res) => {
  const conn = await initializeConnection();
  const [rawRequests] = await conn.execute(
    `SELECT 
        r.*, 
        e.name AS equipment_name, 
        u.username AS farmer_name
     FROM rentals r
     JOIN equipment e ON r.equipment_id = e.equipment_id
     JOIN users u ON r.farmer_id = u.id
     WHERE r.owner_id = ?`,
    [req.session.user.id]
  );

  // Format data before rendering
  const requests = rawRequests.map(r => ({
    ...r,
    start_date: formatDateReadable(r.start_date),
    end_date: formatDateReadable(r.end_date),
    total_cost: formatCurrencyKES(r.total_cost),
  }));

  res.render('owner/requests', { user: req.session.user, requests });
});

// POST /dash/owner/requests/:id/approve
router.post('/requests/:id/approve', isOwner, async (req, res) => {
  const conn = await initializeConnection();
  await conn.execute(
    `UPDATE rentals SET status = 'approved' WHERE rental_id = ? AND owner_id = ?`,
    [req.params.id, req.session.user.id]
  );
  res.redirect('/dash/owner/requests');
});

// POST /dash/owner/requests/:id/reject
router.post('/requests/:id/reject', isOwner, async (req, res) => {
  const conn = await initializeConnection();
  await conn.execute(
    `UPDATE rentals SET status = 'rejected' WHERE rental_id = ? AND owner_id = ?`,
    [req.params.id, req.session.user.id]
  );
  res.redirect('/dash/owner/requests');
});


// GET /dash/owner/earnings - View earnings summary
router.get('/earnings', isOwner, async (req, res) => {
  const conn = await initializeConnection();
  const [earnings] = await conn.execute(
    `SELECT SUM(total_cost) AS total_earned FROM rentals r
     JOIN equipment e ON r.equipment_id = e.equipment_id
     WHERE e.owner_id = ? AND r.status = 'approved'`,
    [req.session.userId]
  );
  res.render('owner/earnings', { total: earnings[0].total_earned || 0 });
});

module.exports = router;


