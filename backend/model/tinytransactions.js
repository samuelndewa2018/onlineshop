const mongoose = require("mongoose");
const { Schema } = mongoose;

const tinytransactionSchema = new Schema(
  {
    customer_number: { type: String, required: true },
    mpesa_ref: { type: String, required: true },
    amount: { type: String, required: true },
    resultId: { type: String, required: true },
    type: { type: String, required: true },
  },
  { timestamps: true }
);

const TinyTransaction = mongoose.model(
  "TinyTransaction",
  tinytransactionSchema
);

module.exports = TinyTransaction;
