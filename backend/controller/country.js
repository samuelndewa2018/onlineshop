// routes/country.js
const express = require("express");
const Country = require("../model/country");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const countries = await Country.find();
    res.json(countries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/create-country", async (req, res) => {
  const { name } = req.body;
  console.log("Received country name:", name);
  const newCountry = new Country({ name });

  try {
    const savedCountry = await newCountry.save();
    res.status(201).json(savedCountry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Add routes for other CRUD operations (POST, PUT, DELETE)

module.exports = router;
