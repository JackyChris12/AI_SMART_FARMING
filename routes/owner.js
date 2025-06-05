const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { initializeConnection } = require('../modules/db');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

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

// POST /dash/owner/equipment/add - Handle equipment creation with image upload
router.post('/equipment/add', isOwner, upload.single('image'), async (req, res) => {
  const { name, description, price_per_day } = req.body;
  const image_url = `/uploads/${req.file.filename}`;

  try{
const conn = await initializeConnection();
 await conn.execute(
    'INSERT INTO equipment (name, description, price_per_day, image_url, owner_id) VALUES (?, ?, ?, ?, ?)',
    [name, description, price_per_day, image_url, req.session.userId]
  );
   res.redirect('/dash/owner/equipment');
  }
  catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }



 
 
});

// GET /dash/owner/equipment/:id/edit - Edit form
router.get('/equipment/:id/edit', isOwner, async (req, res) => {
  const conn = await initializeConnection();
  const [rows] = await conn.execute('SELECT * FROM equipment WHERE equipment_id = ? AND owner_id = ?', [req.params.id, req.session.userId]);
  if (!rows.length) return res.status(404).send('Equipment not found');
  res.render('owner/equipment-edit', { equipment: rows[0] });
});

// POST /dash/owner/equipment/:id/edit - Handle edit with optional new image
router.post('/equipment/:id/edit', isOwner, upload.single('image'), async (req, res) => {
  const { name, description, price_per_day } = req.body;
  const conn = await initializeConnection();

  if (req.file) {
    const image_filename = req.file.filename;
    await conn.execute(
      'UPDATE equipment SET name = ?, description = ?, price_per_day = ?, image_url = ? WHERE equipment_id = ? AND owner_id = ?',
      [name, description, price_per_day, image_filename, req.params.id, req.session.userId]
    );
  } else {
    await conn.execute(
      'UPDATE equipment SET name = ?, description = ?, price_per_day = ? WHERE equipment_id = ? AND owner_id = ?',
      [name, description, price_per_day, req.params.id, req.session.userId]
    );
  }

  res.redirect('/dash/owner/equipment');
});

// POST /dash/owner/equipment/:id/delete - Handle deletion
router.post('/equipment/:id/delete', isOwner, async (req, res) => {
  const conn = await initializeConnection();
  await conn.execute('DELETE FROM equipment WHERE equipment_id = ? AND owner_id = ?', [req.params.id, req.session.userId]);
  res.redirect('/dash/owner/equipment');
});

// Helpers
function formatCurrencyKES(amount) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDateReadable(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

// GET /dash/owner/requests
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

// GET /dash/owner/earnings
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
