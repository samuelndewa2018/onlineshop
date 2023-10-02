const mongoose = require("mongoose");

const flashSaleSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  shopId: {
    type: String,
    required: true,
  },
  shop: {
    type: Object,
    required: true,
  },
});

module.exports = mongoose.model("FlashSale", flashSaleSchema);
