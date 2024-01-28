const mongoose = require("mongoose");

const sizeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  price: {
    type: Number,
    required: false,
  },
  dPrice: {
    type: Number,
    required: false,
  },
  stock: {
    type: Number,
    required: false,
  },
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your product name!"],
  },
  description: {
    type: String,
    required: [true, "Please enter your product description!"],
  },
  category: {
    type: String,
    required: [true, "Please enter your product category!"],
  },
  tags: {
    type: String,
    required: [true, "Please enter your product tags!"],
  },
  originalPrice: {
    type: Number,
  },
  discountPrice: {
    type: Number,
    required: [true, "Please enter your product price!"],
  },
  dPrice: {
    type: Number,
    required: false,
  },
  stock: {
    type: Number,
    required: [true, "Please enter your product stock!"],
  },
  condition: {
    type: String,
    required: false,
  },
  sizes: [sizeSchema],
  images: [
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
  reviews: [
    {
      user: {
        type: Object,
      },
      rating: {
        type: Number,
      },
      comment: {
        type: String,
      },
      productId: {
        type: String,
      },
      createdAt: {
        type: Date,
        default: Date.now(),
      },
    },
  ],
  ratings: {
    type: Number,
  },
  shopId: {
    type: String,
    required: true,
  },
  shop: {
    type: Object,
    required: true,
  },
  sold_out: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("Product", productSchema);
