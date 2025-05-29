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

// Routes
const routes = require("./routes/index");
app.use("/", routes);

const logRoutes = require("./routes/logs");
app.use("/logs", logRoutes);

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
