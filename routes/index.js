const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const axios = require("axios");
const bcrypt = require("bcrypt");
const { isAuthenticated } = require("../middleware/auth");
const { isAgricultureQuestion } = require("../utils/agricultureFilter");
const { initializeConnection } = require("../modules/db"); // Import once here

// Log all routes for debugging
router.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Public routes

// Home page
router.get("/", (req, res) => {
  res.render("index", {
    user: { id: req.session.userId, role: req.session.role },
    pageTitle: "Welcome to AgroAI",
  });
});

// Login form
router.get("/login", (req, res) => {
  res.render("login", { error: null, user: req.session });
});

// Register form
router.get("/register", (req, res) => {
  res.render("register", { error: null, user: req.session });
});
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const role = "farmer"; // ✅ default role

  // Debug log
  console.log("Form submission:", { username, email, password, role });

  // Validate form
  if (!username || !email || !password || !role) {
    return res.render("register", {
      error: "Please fill in all fields",
      user: req.session,
    });
  }

  try {
    const db = await initializeConnection();
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute(
      "INSERT INTO users(username, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, role]
    );

    res.redirect("/login");
  } catch (error) {
    console.error("🔥 Registration SQL error:", error.message);
    console.error("🔥 Full error object:", error); // optional for deeper debug
    res.render("register", {
      error: "Registration failed",
      user: req.session,
    });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  console.log("Fail to login", { username, password });

  if (!username || !password) {
    return res.render("login", {
      error: "Please enter username and password",
      user: req.session,
    });
  }

  try {
    const db = await initializeConnection(); // get single persistent connection
    const [users] = await db.execute("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    const user = users[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render("login", {
        error: "Invalid credentials",
        user: req.session,
      });
    }

    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.user = { id: user.id, name: user.name }; // or however your user object looks

    res.redirect("/dashboard");
  } catch (err) {
    console.error("Login error:", err);
    res.render("login", { error: "Login failed", user: req.session });
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// Protected routes

router.get("/dashboard", isAuthenticated, (req, res) => {
  res.render("index", { user: req.session });
});

router.get("/crops", isAuthenticated, (req, res) => {
  res.render("crops", { user: req.session });
});

// Diagnosis page (GET)
router.get("/diagnosis", isAuthenticated, (req, res) => {
  res.render("diagnosis", { response: null, user: req.session });
});

// Diagnosis page (POST)
router.post(
  "/diagnosis",
  isAuthenticated,
  upload.single("image"),
  async (req, res) => {
    const question = req.body.question || req.body.query;

    if (!isAgricultureQuestion(question)) {
      return res.render("diagnosis", {
        response:
          "❌ This assistant only answers agriculture-related questions. Please ask about crops, livestock, or farming issues.",
        user: req.session,
      });
    }

    try {
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "mistralai/mistral-7b-instruct:free",
          messages: [
            {
              role: "system",
              content:
                "You are an expert agriculture assistant. ONLY answer agriculture-related questions.",
            },
            { role: "user", content: question },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const reply =
        response.data.choices?.[0]?.message?.content ||
        "❓ No answer received from AI.";

      res.render("diagnosis", {
        response: { condition: reply },
        user: req.session,
      });
    } catch (error) {
      console.error("OpenRouter Error:", error.response?.data || error.message);
      res.render("diagnosis", {
        response: "❌ Sorry, an error occurred while processing your question.",
        user: req.session,
      });
    }
  }
);

// Equipment routes
router.get("/rent-equipment", isAuthenticated, (req, res) => {
  res.render("rent-equipment", { user: req.session });
});

// GET /equipments - show all equipment
router.get("/equipment", async (req, res) => {
  try {
    const db = await initializeConnection(); // get db connection
    const [rows] = await db.query("SELECT * FROM equipment");
    res.render("equipment", { equipment: rows });
  } catch (err) {
    console.error("Error fetching equipment:", err);
    res.status(500).send("Error retrieving equipment from database");
  }
});
router.get("/rent-equipment", async (req, res) => {
  const equipmentId = req.query.id;

  if (!equipmentId) {
    return res.status(400).send("Missing equipment ID.");
  }

  try {
    const db = await initializeConnection();
    const [results] = await db.execute(
      "SELECT * FROM equipment WHERE equipment_id = ?",
      [equipmentId]
    );

    if (results.length === 0) {
      return res.status(404).send("Equipment not found.");
    }

    res.render("rent-equipment", { equipment: results[0] });
  } catch (error) {
    console.error("Error fetching equipment:", error);
    res.status(500).render("500.ejs");
  }
});

router.post("/submit-rent", async (req, res) => {
  const { equipment_id, customer_name, customer_phone, start_date, end_date } =
    req.body;

  const sql = `
    INSERT INTO rentals (equipment_id, customer_name, customer_phone, start_date, end_date)
    VALUES (?, ?, ?, ?, ?)
  `;

  try {
    const db = await initializeConnection();
    await db.execute(sql, [
      equipment_id,
      customer_name,
      customer_phone,
      start_date,
      end_date,
    ]);
    res.send("Rental request submitted successfully!");
  } catch (error) {
    console.error("Error inserting rental:", error);
    res.status(500).send("Failed to submit rental request.");
  }
});

router.get("/test", (req, res) => {
  res.render("test");
});
router.get("/livestock", isAuthenticated, async (req, res) => {
  const userId = req.session.user.id;

  try {
    const db = await initializeConnection();

    // 1. Get all livestock for the user
    const [livestockRows] = await db.execute(
      "SELECT * FROM livestock WHERE user_id = ?",
      [userId]
    );

    // If no livestock found, just send empty array
    if (livestockRows.length === 0) {
      return res.render("livestock", { livestockList: [] });
    }

    // 2. Get all logs for these livestock ids
    const livestockIds = livestockRows.map((l) => l.id);

    const [logRows] = await db.execute(
      `SELECT * FROM livestock_logs WHERE livestock_id IN (${livestockIds
        .map(() => "?")
        .join(",")})`,
      livestockIds
    );

    // 3. Attach logs to their respective livestock
    const livestockList = livestockRows.map((l) => {
      const logs = logRows.filter((log) => log.livestock_id === l.id);
      return { ...l, logs };
    });

    // 4. Render the page with livestock and logs
    res.render("livestock", { livestockList });
  } catch (err) {
    console.error("Livestock fetch error:", err);
    res.status(500).send("Error loading data");
  }
});

// POST route to handle form submission
router.post("/monitor", async (req, res) => {
  const { livestock_id, feed, production, symptoms } = req.body;

  const query = `
    INSERT INTO livestock_logs 
    (livestock_id, log_date, feed, production, symptoms)
    VALUES (?, CURDATE(), ?, ?, ?)`;

  try {
    const db = await initializeConnection();
    await db.execute(query, [livestock_id, feed, production, symptoms]);
    res.redirect("/livestock");
  } catch (err) {
    console.error("Livestock log error:", err);
    res.status(500).send("Error saving record");
  }
});

router.get("/livestock/add", isAuthenticated, (req, res) => {
  res.render("add_livestock");
});
router.post("/livestock/add", isAuthenticated, async (req, res) => {
  try {
    const { name, livestock_type, region, breed, dob } = req.body;
    const userId = req.session.user.id;

    // Check all required fields
    if (!name || !livestock_type || !region || !breed || !dob) {
      return res.status(400).send("All fields are required.");
    }

    // Validate date
    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
      return res.status(400).send("Invalid Date of Birth.");
    }

    const db = await initializeConnection();

    const sql = `
      INSERT INTO livestock (name, livestock_type, region, user_id, breed, dob, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    await db.execute(sql, [name, livestock_type, region, userId, breed, dob]);

    res.redirect("/livestock"); // change if your livestock list is on a different route
  } catch (error) {
    console.error("Livestock Insert Error:", error);
    res.status(500).send("An error occurred while adding livestock.");
  }
});router.get('/livestock/logs/:id', async (req, res) => {
  const livestockId = req.params.id;
  try {
    const db = await initializeConnection();
    const [livestockRows] = await db.query('SELECT * FROM livestock WHERE id = ?', [livestockId]);
    const [logs] = await db.query('SELECT * FROM livestock_logs WHERE livestock_id = ? ORDER BY log_date DESC', [livestockId]);

    if (livestockRows.length === 0) {
      return res.status(404).send('Livestock not found');
    }

    res.render('livestock_logs', {
      livestock: livestockRows[0],
      logs
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});




module.exports = router;
