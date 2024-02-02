const mongoose = require("mongoose");

const auctionSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
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
    type: String, // Assuming bidder's user ID or a unique identifier
  },
  shopId: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Auction", auctionSchema);
