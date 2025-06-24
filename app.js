// app.js
const express = require("express");
const session = require("express-session");
const path = require("path");

const { initializeConnection } = require("./modules/db");

const app = express();
const port = 3000;

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
  })
);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public")); // <-- This makes /public accessible at /
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use(express.static(path.join(__dirname, "public")));

// Routes
const routes = require("./routes/index");
app.use("/", routes);

const logRoutes = require("./routes/logs");
app.use("/logs", logRoutes);

const adminRoutes = require("./routes/admin");
const ownerRoutes = require("./routes/owner");

app.use("/dash/admin", adminRoutes);
app.use("/dash/owner", ownerRoutes);

const farmerRoutes = require("./routes/farmer");
app.use("/dash/farmer/profile", farmerRoutes);

// Start server after DB connects
initializeConnection()
  .then(() => {
    app.listen(port, () =>
      console.log(`Server running on http://localhost:${port}`)
    );
  })
  .catch((err) => {
    console.error("Failed to start server due to DB error:", err);
  });

// generate-hash.js
const bcrypt = require("bcrypt");

const plainPassword = "owner123"; // choose your new password
const saltRounds = 10;

bcrypt.hash(plainPassword, saltRounds, (err, hash) => {
  if (err) throw err;
  console.log("Hashed password:", hash);
});
