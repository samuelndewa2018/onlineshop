// models/State.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const stateSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  country: {
    type: Schema.Types.ObjectId,
    ref: "Country",
    required: true,
  },
});

module.exports = mongoose.model("State", stateSchema);
