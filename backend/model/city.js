// models/City.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const citySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  state: {
    type: Schema.Types.ObjectId,
    ref: "State",
    required: true,
  },
});

module.exports = mongoose.model("City", citySchema);
