const express = require("express");
const Category = require("../model/categories");
const router = express.Router();
const cloudinary = require("cloudinary");

// Create category with subcategories
router.post("/create-category", async (req, res, next) => {
  try {
    const { name, subcategories } = req.body;
    let image = [];

    if (req.body.image) {
      const result = await cloudinary.v2.uploader.upload(req.body.image, {
        folder: "categories",
      });
      image.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    const category = new Category({ name, image, subcategories });

    const savedCategory = await category.save();

    res.json(savedCategory);
  } catch (error) {
    return next(new ErrorHandler(error, 500));
  }
});

// Get all categories with subcategories
router.get("/categories", (req, res) => {
  Category.find()
    .then((categories) => {
      res.json(categories);
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to fetch categories" });
    });
});

// Delete category and its subcategories
router.delete("/delete-category/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return next(new ErrorHandler("category is not found with this id", 404));
    }

    for (const image of category.image) {
      const result = await cloudinary.v2.uploader.destroy(image.public_id);
    }

    await Category.deleteOne({ _id: req.params.id });
    res.status(201).json({
      success: true,
      message: "category Deleted successfully!",
    });
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
});

module.exports = router;
