const mongoose = require("mongoose");

const statementsSchema = new mongoose.Schema({
  promotionName: {
    type: String,
    default: "Welcome to eShop",
  },
  typingName1: {
    type: String,
    default: "Welcome to eShop",
  },
  typingName2: {
    type: String,
    default: "Welcome to eShop",
  },
  typingName3: {
    type: String,
    default: "Welcome to eShop",
  },
  promotionImage: {
    type: String,
  },
  promotionDetails: {
    type: String,
    default: "Welcome to eShop",
  },
  productId: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
  },
});

module.exports = mongoose.model("Statements", statementsSchema);
