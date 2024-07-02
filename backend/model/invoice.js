// models/Invoice.js
const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema({
  receiptNo: { type: String, required: true },
  amount: { type: Number, required: true },
  purpose: { type: String, required: true }, // Added purpose field
  paid: {
    status: { type: Boolean, default: false },
    paidAt: { type: Date },
  },
  createdAt: { type: Date, default: Date.now },
  shopId: { type: String, required: true },
});

module.exports = mongoose.model("Invoice", InvoiceSchema);
