const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 5000;
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swaggerConfig");
app.use(cors());
app.use(express.json());
/**
 * @swagger
 * /api/cases:
 *   get:
 *     summary: Get all cases
 *     tags: [Cases]
 *     responses:
 *       200:
 *         description: List of cases
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */

app.get("/api/cases", (req, res) => {
  const filePath = path.join(__dirname, "cases.json");
  fs.readFile(filePath, "utf8", (err, data) => {
    console.log("Reading from:", filePath);
    if (err) {
      console.error("Error reading cases.json:", err);
      return res.status(500).json({ message: "Failed to read cases data" });
    }
    res.json(JSON.parse(data));
  });
});
/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Get all documents
 *     tags: [Documents]
 *     responses:
 *       200:
 *         description: List of documents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */

app.get("/api/documents", (req, res) => {
  const filePath = path.join(__dirname, "documents.json");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ message: "Failed to read documents data" });
    }
    res.json(JSON.parse(data));
  });
});
// POST new case
// app.post("/api/cases", (req, res) => {
//   const newCase = req.body;

//   fs.readFile("cases.json", "utf8", (err, data) => {
//     if (err) {
//       return res.status(500).json({ message: "Failed to read cases data" });
//     }

//     let cases = [];
//     try {
//       cases = JSON.parse(data);
//     } catch (e) {
//       cases = [];
//     }

//     cases.unshift(newCase);
//     fs.writeFile("cases.json", JSON.stringify(cases, null, 2), (err) => {
//       if (err) {
//         return res.status(500).json({ message: "Failed to write new case" });
//       }
//       res.status(201).json(newCase);
//     });
//   });
// });

/**
 * @swagger
 * /api/cases:
 *   post:
 *     summary: Add a new case
 *     tags: [Cases]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: The created case
 */

app.post("/api/cases", (req, res) => {
  const filePath = path.join(__dirname, "cases.json");
  const newCase = req.body;
  console.log("🔍 Received new case:", newCase);

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("❌ Error reading cases.json:", err);
      return res.status(500).json({ message: "Failed to read cases data" });
    }

    let cases = [];

    try {
      // Handle empty file case
      if (data.trim() === "") {
        console.warn("⚠️ cases.json is empty. Initializing with empty array.");
        cases = [];
      } else {
        cases = JSON.parse(data);

        // Ensure it's an array
        if (!Array.isArray(cases)) {
          console.warn(
            "⚠️ Parsed data is not an array. Resetting to empty array."
          );
          cases = [];
        }
      }
    } catch (parseErr) {
      console.error("❌ JSON parse error:", parseErr.message);
      cases = [];
    }

    // Make sure newCase is a valid object before unshifting
    if (newCase && typeof newCase === "object") {
      cases.unshift(newCase);
    } else {
      console.error("❌ Invalid case data:", newCase);
      return res.status(400).json({ message: "Invalid case format" });
    }

    try {
      fs.writeFile(filePath, JSON.stringify(cases, null, 2), (writeErr) => {
        if (writeErr) {
          console.error("❌ Error writing to cases.json:", writeErr);
          return res.status(500).json({ message: "Failed to write new case" });
        }

        console.log("✅ New case saved successfully.");
        res.status(201).json(newCase);
      });
    } catch (writeCatchErr) {
      console.error("❌ Unexpected write error:", writeCatchErr);
      res.status(500).json({ message: "Unexpected error while saving case" });
    }
  });
});
/**
 * @swagger
 * /api/cases/{id}:
 *   put:
 *     summary: Update a case by ID
 *     tags: [Cases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: The updated case
 */

app.put("/api/cases/:id", (req, res) => {
  const caseId = req.params.id;
  const updates = req.body;
  const filePath = path.join(__dirname, "cases.json");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ message: "Failed to read cases data" });
    }

    let cases;
    try {
      cases = JSON.parse(data);
      if (!Array.isArray(cases)) throw new Error("Cases is not an array");
    } catch (parseErr) {
      return res.status(500).json({ message: "Failed to parse cases.json" });
    }

    const caseIndex = cases.findIndex((c) => c.id === caseId);
    if (caseIndex === -1) {
      return res.status(404).json({ message: "Case not found" });
    }

    // Update the case
    cases[caseIndex] = {
      ...cases[caseIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFile(filePath, JSON.stringify(cases, null, 2), (writeErr) => {
      if (writeErr) {
        return res
          .status(500)
          .json({ message: "Failed to write updated case" });
      }

      res.json(cases[caseIndex]);
    });
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
