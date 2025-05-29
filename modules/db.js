const mysql = require("mysql2/promise");
require("dotenv").config();

let dbConnection; // persistent connection holder

async function initializeConnection() {
  try {
    if (!dbConnection) {
      dbConnection = await mysql.createConnection({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "agroai",
      });

      // Test connection
      const [result] = await dbConnection.query("SELECT 1 AS test");
      console.log("✅ MySQL connection initialized successfully:", result);
    }
    return dbConnection;
  } catch (error) {
    console.error("❌ Failed to initialize MySQL connection:", error);
    throw error;
  }
}

module.exports = {
  initializeConnection,
  getConnection: () => dbConnection,
};
