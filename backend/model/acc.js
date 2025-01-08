const mongoose = require("mongoose");

const accSchema = new mongoose.Schema({
  name: Number,
  balance: Number,
});

module.exports = mongoose.model("Acc", accSchema);
