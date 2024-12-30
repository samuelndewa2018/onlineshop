const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  userId: String,
  otp: String,
  createdAt: { type: Date, default: Date.now },
  expireAt: { type: Date, required: true },
});

module.exports = mongoose.model("Otp", otpSchema);
