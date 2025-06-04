const express = require("express");
const router = express.Router();

// Route: /dash/owner
router.get("/", (req, res) => {
  if (req.session.role !== "admin") {
    return res.status(403).send("Access denied");
  }

  res.render("admin/dash", { user: req.session.user });
});

module.exports = router;
