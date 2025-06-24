const express = require("express");
const router = express.Router();
const { getConnection } = require("../modules/db");

router.get("/", async (req, res) => {
  try {
    const db = getConnection();

    // Check if user is logged in
    if (!req.session.user) {
      return res.redirect("/login");
    }

    const farmerId = req.session.user.id;

    // Equipment rentals
    const [rentals] = await db.query(`
      SELECT r.*, e.name AS equipment_name
      FROM rentals r
      JOIN equipment e ON r.equipment_id = e.equipment_id
      WHERE r.farmer_id = ?
    `, [farmerId]);

    // Livestock records
    const [livestock] = await db.query(`
      SELECT * FROM livestock
      WHERE farmer_id = ?
    `, [farmerId]);

    // Livestock health logs
    const [logs] = await db.query(`
      SELECT * FROM livestock_logs
      WHERE farmer_id = ?
      ORDER BY created_at DESC
    `, [farmerId]);

    // General farm activities
    const [activities] = await db.query(`
      SELECT * FROM farm_activities
      WHERE farmer_id = ?
      ORDER BY created_at DESC
    `, [farmerId]);

    // Render profile page with all data
    res.render("farmer/profile", {
      profile: {
        user: req.session.user,
        rentals,
        livestock,
        logs,
        activities,
      },
    });

  } catch (err) {
    console.error("❌ Error loading farmer profile:", err);
    res.status(500).send("Server error loading profile");
  }
});

module.exports = router;
