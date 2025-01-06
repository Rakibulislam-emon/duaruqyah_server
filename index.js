const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware
// Use CORS to allow requests from your frontend domain
app.use(
  cors({
    origin: ["http://localhost:3000"], // Allow requests only from this frontend
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"], // Allowed methods
    credentials: true, // If you're using cookies or credentials
  })
);
app.use(express.json()); // Middleware to parse JSON bodies in requests

// Database connection function (connects to the SQLite database)
const getDatabase = async () => {
  try {
    return await open({
      filename: path.resolve(__dirname, "dua_main.sqlite"),
      driver: sqlite3.Database,
    });
  } catch (error) {
    console.error("Error connecting to the database:", error.message);
    throw new Error("Failed to connect to the database");
  }
};

// Routes

// Fetch categories from the database
app.get("/api/categories", async (req, res) => {
  let db;
  try {
    db = await getDatabase();
    const categories = await db.all("SELECT * FROM category");
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories", error: error.message });
  } finally {
    if (db) await db.close();
  }
});

// Fetch subcategories based on categoryId
app.get("/api/subcategories", async (req, res) => {
  let db;
  try {
    db = await getDatabase();
    const categoryId = req.query.categoryId;

    if (!categoryId) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    const subcategories = await db.all("SELECT * FROM sub_category WHERE cat_id = ?", [categoryId]);

    if (subcategories.length === 0) {
      return res.status(404).json({ message: "No subcategories found" });
    }

    res.status(200).json(subcategories);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch subcategories", error: error.message });
  } finally {
    if (db) await db.close();
  }
});

// Fetch duas based on subcategoryId (or fetch all)
app.get("/api/duas", async (req, res) => {
  let db;
  try {
    db = await getDatabase();
    const subcategoryId = req.query.subcategoryId;
    let duas;

    if (subcategoryId) {
      duas = await db.all("SELECT * FROM dua WHERE subcat_id = ?", [subcategoryId]);
    } else {
      duas = await db.all("SELECT * FROM dua");
    }

    res.status(200).json(duas);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch duas", error: error.message });
  } finally {
    if (db) await db.close();
  }
});

// Default route to check if the server is working
app.get("/", (req, res) => {
  res.json({ message: "WELCOME TO THE SERVER" });
});

// Start the server for local development
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Export the app for serverless environments like Vercel
module.exports = app;
