const express = require("express");
const Location = require("../model/location");
const router = express.Router();

//set location for delivery
router.post("/set-location", (req, res) => {
  const { latitude, longitude } = req.body;

  // Save the location data to the database
  const location = new Location({ latitude, longitude });
  location.save((err, savedLocation) => {
    if (err) {
      return res.status(500).json({ error: "Error saving location" });
    }
    res.json({
      message: "Location data saved successfully",
      location: savedLocation,
    });
  });
});

module.exports = router;
