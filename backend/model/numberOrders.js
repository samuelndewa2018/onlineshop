const mongoose = require("mongoose");

const orderCountSchema = new mongoose.Schema({
  totalOrders: {
    type: Number,
    default: 0,
  },
});

const OrderCount = mongoose.model("OrderCount", orderCountSchema);

module.exports = OrderCount;
