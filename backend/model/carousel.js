const { Schema } = require("mongoose");
const mongoose = require("mongoose");

// Define the Carousel schema
const CarouselSchema = new Schema({
  caption: String,
  image: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model("Carousel", CarouselSchema);
