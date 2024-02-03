const mongoose = require("mongoose");

const auctionSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  size: {
    type: String,
  },
  startingPrice: {
    type: Number,
    required: true,
  },
  currentBid: {
    type: Number,
    default: 0,
  },
  bidIncrement: {
    type: Number,
    default: 10,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  highestBidder: {
    type: String,
  },
  shopId: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Auction", auctionSchema);
