const mongoose = require("mongoose");
const acc = require("./acc");

const accTSchema = new mongoose.Schema({
  request_id: String,
  acc_id: Number,
  amount: Number,
  type: String,
  status: {
    type: String,
    default: "pending",
  },
});

module.exports = mongoose.model("AccT", accTSchema);
