const express = require("express");
const Country = require("../model/country");
const router = express.Router();

router.post("/countries", async (req, res) => {
  try {
    const { name } = req.body;
    const country = new Country({ name });
    await country.save();
    res.status(201).json(country);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
