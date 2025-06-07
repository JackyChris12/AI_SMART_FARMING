const express = require('express');
const router = express.Router();
const { getConnection } = require('../modules/db');

// GET /dash/farmer/profile
router.get('/', async (req, res) => {
  try {
    const db = getConnection();

    // Ensure user is logged in
    if (!req.session.user) {
      return res.redirect('/login'); // or wherever your login route is
    }

    const farmerId = req.session.user.id;

    // Get rentals made by this farmer
    const [rentals] = await db.query(`
      SELECT r.*, e.name AS equipment_name
      FROM rentals r
      JOIN equipment e ON r.equipment_id = e.equipment_id
      WHERE r.farmer_id = ?
    `, [farmerId]);

    res.render('farmer/profile', {
      profile: {
        user: req.session.user,
        rentals: rentals
      }
    });
  } catch (error) {
    console.error('Failed to load farmer profile:', error);
    res.status(500).send('Server error loading profile');
  }
});


// Show farm activities
router.get('/activities', async (req, res) => {
  const farmerId = req.session.user.id;

  try {
    const [activities] = await db.execute(
      'SELECT * FROM farm_activities WHERE farmer_id = ? ORDER BY created_at DESC',
      [farmerId]
    );
    res.render('farmer-activities', { activities, user: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching activities');
  }
});

// Post new farm activity
router.post('/activities',async (req, res) => {
  const { description, category } = req.body;
  const farmerId = req.session.user.id;

  try {
    await db.execute(
      'INSERT INTO farm_activities (farmer_id, description, category) VALUES (?, ?, ?)',
      [farmerId, description, category]
    );
    res.redirect('/farmer/activities');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving activity');
  }
});

module.exports = router;
