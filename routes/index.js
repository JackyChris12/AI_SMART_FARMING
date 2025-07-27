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
  const db = await initializeConnection();
  const { username, email, password, phone } = req.body;

  try {
    // Check if email exists
    const [existingUser] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      // Email exists, send a message and redirect to login
      return res.render("register", {
        error: "Email already exists. Please login instead.",
      });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    await db.query(
      "INSERT INTO users (username, email, password, phone) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, phone || null]
    );

    // Redirect to login after successful registration
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
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
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
    };

    // or however your user object looks

    if (user.role == "admin") {
      res.redirect("/dash/admin");
    } else if (user.role == "owner") {
      res.redirect("/dash/owner");
    } else {
      res.redirect("/dashboard"); // or /equipment or wherever
    }
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

// GET /predict-yield page
router.get("/predict-yield", isAuthenticated, (req, res) => {
   res.render("predict-yield", {
    user: req.session.user, // optional if you're using login sessions
  });
});

// POST /predict-yield - handle AI prediction
router.post("/predict-yield", isAuthenticated, async (req, res) => {
  const { crop, region, season } = req.body;

  if (!crop || !region || !season) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const aiPrompt = `Predict the yield for ${crop} in ${region} during the ${season} season.`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
          {
            role: "system",
            content: "You are an expert in agricultural yield predictions.",
          },
          { role: "user", content: aiPrompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiReply =
      response.data.choices?.[0]?.message?.content ||
      "No prediction received from AI.";

    res.json({ prediction: aiReply });
  } catch (error) {
    console.error("Prediction error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch AI prediction." });
  }
});


// Diagnosis page (GET)
router.get("/diagnosis", isAuthenticated, (req, res) => {
  // Initialize session history if it doesn't exist
  if (!req.session.diagnosisHistory) {
    req.session.diagnosisHistory = [];
  }

  res.render("diagnosis", {
    name: req.session.user.name,
    user: req.session.user,
    history: req.session.diagnosisHistory,
  });
});

// Diagnosis post
router.post("/diagnosis", isAuthenticated, async (req, res) => {
  console.log(req.body);

  const question = req.body.question || req.body.query;

  if (!question) {
    return res.status(400).json({ error: "❌ Missing question or query." });
  }

  // ❗️Reject non-agriculture questions
  if (!isAgricultureQuestion(question)) {
    return res.json({
      answer:
        "🤖 I'm here to answer agriculture-related questions only. Please ask about crops, pests, livestock, soil, or weather.",
    });
  }

  // Initialize history if needed
  if (!req.session.diagnosisHistory) {
    req.session.diagnosisHistory = [];
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

    // Save to session history
    req.session.diagnosisHistory.push({
      question,
      answer: reply,
    });

    res.json({ answer: reply });
  } catch (error) {
    console.error("Diagnosis Error:", error.message || error);

    res.status(500).json({
      error: "❌ Sorry, an error occurred while processing your question.",
    });
  }
});


// SHOW ALL EQUIPMENT
router.get("/equipment", async (req, res) => {
  try {
    const db = await initializeConnection();
    const [rows] = await db.query("SELECT * FROM equipment");
    res.render("equipment", { equipment: rows }); // This sends all equipment to equipment.ejs
  } catch (err) {
    console.error("Error fetching equipment:", err);
    res.status(500).send("Error retrieving equipment from database");
  }
});

// SHOW RENT FORM FOR SPECIFIC EQUIPMENT (expects ?id= in URL)
router.get("/rent-equipment", async (req, res) => {
  const equipmentId = req.query.id; // ✅ Make sure the link to this page includes the ID: /rent-equipment?id=3

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

    res.render("rent-equipment", { equipment: results[0] }); // ✅ Sends the selected equipment object
  } catch (error) {
    console.error("Error fetching equipment:", error);
    res.status(500).render("500.ejs");
  }
});

// SUBMIT RENTAL FORM
router.post("/rental-form", async (req, res) => {
  const {
    equipment_id,
    start_date,
    end_date,
    customer_email,
    customer_address,
    rental_purpose,
  } = req.body;

  console.log("Submitted equipment_id:", equipment_id);

  const farmer_id = req.session.user?.id; // ✅ Make sure user is logged in

  if (!farmer_id) {
    return res.status(401).send("Unauthorized: Please log in.");
  }

  try {
    const db = await initializeConnection();

    // Fetch equipment to get owner and price
    const [equipmentData] = await db.execute(
      "SELECT owner_id, price_per_day FROM equipment WHERE equipment_id = ?",
      [equipment_id] // ✅ Correct: match with DB column `id`
    );

    if (equipmentData.length === 0) {
      return res.status(404).send("Equipment not found.");
    }

    const { owner_id, price_per_day } = equipmentData[0];

    if (isNaN(start) || isNaN(end) || end < start) {
      return res
        .status(400)
        .send("Invalid rental dates: End must be after Start.");
    }

    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (duration <= 0) {
      return res.status(400).send("Rental duration must be at least 1 day.");
    }
    const total_cost = price_per_day * duration;

    // Save rental record
    await db.execute(
      `INSERT INTO rentals 
        (equipment_id, farmer_id, owner_id, start_date, end_date, total_cost, status, customer_email, customer_address, rental_purpose, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, NOW())`,
      [
        equipment_id,
        farmer_id,
        owner_id,
        start_date,
        end_date,
        total_cost,
        customer_email,
        customer_address,
        rental_purpose,
      ]
    );

    res.send("Rental request submitted successfully!");
  } catch (err) {
    console.error("Rental request error:", err);
    res.status(500).send("Server error while processing rental.");
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
});
router.get("/livestock/logs/:id", async (req, res) => {
  const livestockId = req.params.id;
  try {
    const db = await initializeConnection();
    const [livestockRows] = await db.query(
      "SELECT * FROM livestock WHERE id = ?",
      [livestockId]
    );
    const [logs] = await db.query(
      "SELECT * FROM livestock_logs WHERE livestock_id = ? ORDER BY log_date DESC",
      [livestockId]
    );

    if (livestockRows.length === 0) {
      return res.status(404).send("Livestock not found");
    }

    res.render("livestock_logs", {
      livestock: livestockRows[0],
      logs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

router.get("/farmer/profile", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  try {
    const db = await initializeConnection();

    // Get user info
    const [userRows] = await db.query("SELECT * FROM users WHERE id = ?", [
      req.session.user.id,
    ]);
    const user = userRows[0];

    // Get equipment rental requests
    const [rentals] = await db.query(
      `
      SELECT rental_requests.*, equipment.name AS equipment_name
      FROM rental_requests
      JOIN equipment ON rental_requests.equipment_id = equipment.equipment_id
      WHERE rental_requests.user_id = ?
    `,
      [req.session.user.id]
    );

    // Get farmer activities
    const [activities] = await db.query(
      `
      SELECT * FROM farmer_activities WHERE user_id = ?
      ORDER BY date DESC
    `,
      [req.session.user.id]
    );

    res.render("farmer/profile", {
      profile: {
        user,
        rentals,
        activities,
      },
    });
  } catch (error) {
    console.error("Failed to load farmer profile:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
