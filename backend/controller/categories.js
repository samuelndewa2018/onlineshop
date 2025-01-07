const express = require("express");
const Category = require("../model/categories");
const router = express.Router();
const cloudinary = require("cloudinary");
// changed mongo db
//create category
router.post("/create-category", async (req, res, next) => {
  try {
    const { name } = req.body;
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

    const category = new Category({ name, image });

    const savedCategory = await category.save();

    res.json(savedCategory);
  } catch (error) {
    return next(new ErrorHandler(error, 500));
  }
});

//get category
router.get("/categories", (req, res) => {
  Category.find()
    .then((categories) => {
      res.json(categories);
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to fetch categories" });
    });
});

router.get("/category", async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve statements." });
  }
});

//delete category
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
