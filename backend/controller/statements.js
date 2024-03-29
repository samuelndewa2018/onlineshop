const express = require("express");
const Statements = require("../model/Statements");
const router = express.Router();

// Create a statement
router.post("/create-statements", async (req, res) => {
  try {
    const {
      promotionName,
      typingName1,
      typingName2,
      typingName3,
      promotionImage,
      promotionDetails,
      productId,
      exchangeRate,
    } = req.body;

    const statement = new Statements({
      promotionName,
      typingName1,
      typingName2,
      typingName3,
      promotionImage,
      promotionDetails,
      productId,
      exchangeRate,
    });

    await statement.save();

    res.status(200).json({
      success: true,
      statement,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create statement." });
  }
});

// Get all statements
router.get("/get-statements", async (req, res) => {
  try {
    const statements = await Statements.find();
    res.status(200).json({
      success: true,
      statements,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve statements." });
  }
});

// Backend route
router.get("/get-first-statements", async (req, res) => {
  try {
    const statements = await Statements.find().sort({ createdAt: -1 }).limit(1);
    if (statements.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No statements found in the database!",
      });
    }

    const exchangeRate = statements[0].exchangeRate;
    res.status(200).json({
      success: true,
      exchangeRate, // Include the exchange rate in the response
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Failed to retrieve statements." });
  }
});

// Update a statement
router.put("/update-statement/:id", async (req, res) => {
  try {
    const {
      promotionName,
      typingName1,
      typingName2,
      typingName3,
      promotionImage,
      promotionDetails,
      productId,
      exchangeRate,
    } = req.body;

    const statement = await Statements.findById(req.params.id);
    if (!statement) {
      return res.status(404).json({ error: "Statement not found." });
    }

    statement.promotionName = promotionName;
    statement.typingName1 = typingName1;
    statement.typingName2 = typingName2;
    statement.typingName3 = typingName3;
    statement.promotionImage = promotionImage;
    statement.promotionDetails = promotionDetails;
    statement.productId = productId;
    statement.exchangeRate = exchangeRate;

    statement.updatedAt = Date.now();

    await statement.save();

    res.status(200).json({
      success: true,
      statement,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update statement." });
  }
});

// Delete a statement
router.delete("/delete-statement/:id", async (req, res) => {
  try {
    const statement = await Statements.findByIdAndDelete(req.params.id);
    if (!statement) {
      return res.status(404).json({ error: "Statement not found." });
    }

    res.status(200).json({
      success: true,
      message: "Statement deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete statement." });
  }
});

module.exports = router;
