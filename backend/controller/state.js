// routes/state.js
const express = require("express");
const State = require("../model/state");

const router = express.Router();

// GET all states
router.get("/", async (req, res) => {
  try {
    const states = await State.find();
    res.json(states);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new state
router.post("/create-state", async (req, res) => {
  const { name, countryId, price } = req.body;
  console.log(name, countryId, price);
  const newState = new State({ name, country: countryId, price });

  try {
    const savedState = await newState.save();
    res.status(201).json(savedState);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get("/price/:stateId", async (req, res) => {
  try {
    const state = await State.findById(req.params.stateId);
    if (!state) {
      return res.status(404).json({ message: "State not found" });
    }
    res.json({ price: state.price });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:countryId", async (req, res) => {
  try {
    const states = await State.find({ country: req.params.countryId });
    res.json(states);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update a state
router.put("/:id", async (req, res) => {
  const { name } = req.body;

  try {
    const updatedState = await State.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );
    res.json(updatedState);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a state
router.delete("/:id", async (req, res) => {
  try {
    await State.findByIdAndDelete(req.params.id);
    res.json({ message: "State deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
