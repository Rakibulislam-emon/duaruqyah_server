const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const cors = require("cors");
const path = require("path");

const app = express();
require("dotenv").config();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection function (connects to the SQLite database)
const getDatabase = async () => {
  try {
    return await open({
      filename: path.resolve(__dirname, "dua_main.sqlite"), // Adjust to your SQLite file location
      driver: sqlite3.Database,
    });
  } catch (error) {
    console.error("Error connecting to the database:", error.message);
    throw new Error("Failed to connect to the database");
  }
};

// Route to fetch categories from the database
app.get("/api/categories", async (req, res) => {
  let db;
  try {
    // Connect to the database
    db = await getDatabase();

    // Query to get categories from the database
    const rows = await db.all("SELECT * FROM category");

    // Send the fetched data as a response
    res.json(rows);
  } catch (error) {
    // Handle errors
    res
      .status(500)
      .json({ message: "Failed to fetch categories", error: error.message });
  } finally {
    // Close the database connection
    if (db) {
      try {
        await db.close();
      } catch (closeError) {
        console.error(
          "Error closing the database connection:",
          closeError.message
        );
      }
    }
  }
});

// Route to fetch subcategories based on categoryId
app.get("/api/subcategories", async (req, res) => {
  let db;
  try {
    // Connect to the database
    db = await getDatabase();

    // Get categoryId from the query string
    const categoryId = req.query.categoryId;

    // Make sure categoryId is provided
    if (!categoryId) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    // Query to fetch subcategories based on category_id
    const subcategories = await db.all(
      "SELECT * FROM sub_category WHERE cat_id = ?",
      [categoryId]
    );

    // If no subcategories are found, return a message
    if (subcategories.length === 0) {
      return res.status(404).json({ message: "No subcategories found" });
    }

    // Return subcategory data as a response
    res.status(200).json(subcategories);
  } catch (error) {
    console.error("Error fetching subcategories:", error.message || error);
    res.status(500).json({ message: "Internal Server Error" });
  } finally {
    // Ensure the database connection is closed after the operation
    if (db) {
      try {
        await db.close();
      } catch (closeError) {
        console.error(
          "Error closing the database connection:",
          closeError.message
        );
      }
    }
  }
});

// Duas route (converted from Next.js handler)
app.get("/api/duas", async (req, res) => {
  let db;
  try {
    // Connect to the database
    db = await getDatabase();

    const subcategoryId = req.query.subcategoryId;

    let duas;

    if (subcategoryId) {
      // Fetch Duas based on subcategory ID
      duas = await db.all("SELECT * FROM dua WHERE subcat_id = ?", [
        subcategoryId,
      ]);
    } else {
      // Fetch all Duas
      duas = await db.all("SELECT * FROM dua");
    }

    // Send the fetched data as a response
    res.status(200).json(duas);
  } catch (error) {
    // Handle errors
    console.error("Error fetching duas:", error);
    res.status(500).json({ message: "Internal Server Error" });
  } finally {
    // Ensure the database connection is closed after the operation
    if (db) {
      try {
        await db.close();
      } catch (closeError) {
        console.error(
          "Error closing the database connection:",
          closeError.message
        );
      }
    }
  }
});
// Default route to check if the server is working
app.get("/", (req, res) => {
  res.json({ message: "WELCOME TO THE SERVER" });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
