// town.model.js
const mongoose = require("mongoose");

const townSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: mongoose.Schema.Types.ObjectId, ref: "City", required: true },
});

module.exports = mongoose.model("Town", townSchema);
