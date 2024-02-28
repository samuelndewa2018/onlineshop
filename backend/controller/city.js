// routes/city.js
const express = require("express");
const City = require("../model/city");

const router = express.Router();

// GET all cities
router.get("/", async (req, res) => {
  try {
    const cities = await City.find();
    res.json(cities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:stateId", async (req, res) => {
  try {
    const cities = await City.find({ state: req.params.stateId });
    res.json(cities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new city
router.post("/create-city", async (req, res) => {
  const { name, stateId } = req.body;
  console.log(name, stateId);
  const newCity = new City({ name, state: stateId });

  try {
    const savedCity = await newCity.save();
    res.status(201).json(savedCity);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update a city
router.put("/:id", async (req, res) => {
  const { name } = req.body;

  try {
    const updatedCity = await City.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );
    res.json(updatedCity);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a city
router.delete("/:id", async (req, res) => {
  try {
    await City.findByIdAndDelete(req.params.id);
    res.json({ message: "City deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
