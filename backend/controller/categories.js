const express = require("express");
const Category = require("../model/categories");
const router = express.Router();
const cloudinary = require("cloudinary");
const multer = require("multer");
const ErrorHandler = require("../utils/ErrorHandler");
const Product = require("../model/product");
const upload = multer();
// changed mongo db
//create category
router.post("/create-category", async (req, res, next) => {
  try {
    const { name, subcategories } = req.body;
    console.log(req.body);

    let image = [];

    // Handle image upload if image is provided in the request
    if (req.body.image) {
      const result = await cloudinary.v2.uploader.upload(req.body.image, {
        folder: "categories",
      });
      image.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    // Create a new category with the provided name, image, and subcategories
    const category = new Category({
      name,
      image,
      subcategories,
    });

    // Save the category to the database
    const savedCategory = await category.save();

    res.json(savedCategory);
  } catch (error) {
    return next(new ErrorHandler(error, 500));
  }
});

// Edit category route

// router.put("/edit-category/:id", upload.none(), async (req, res, next) => {
//   const { id } = req.params;
//   const { name, subcategories } = req.body;

//   try {
//     const updatedData = { name };

//     if (subcategories) {
//       updatedData.subcategories = JSON.parse(subcategories);
//     }
// console.log();

//     // Find the current category to get the old name and subcategories
//     const currentCategory = await Category.findById(id);
//     if (!currentCategory) {
//       return next(new ErrorHandler("Category not found", 404));
//     }

//     const oldCategoryName = currentCategory.name;

//     // Update the category
//     const updatedCategory = await Category.findByIdAndUpdate(
//       id,
//       { $set: updatedData },
//       { new: true, runValidators: true }
//     );

//     if (!updatedCategory) {
//       return next(new ErrorHandler("Category not found", 404));
//     }

//     // Update products with the old category and tags (subcategories)
//     await Product.updateMany(
//       {
//         category: oldCategoryName,
//       },
//       {
//         $set: {
//           category: updatedCategory.name,
//         },
//       }
//     );

//     res.status(200).json(updatedCategory);
//   } catch (error) {
//     return next(new ErrorHandler(error.message, 500));
//   }
// });

router.put("/edit-category/:id", upload.none(), async (req, res, next) => {
  const { id } = req.params;
  const { name, subcategories } = req.body;

  try {
    const updatedData = { name };
    let parsedSubcategories;

    if (subcategories) {
      parsedSubcategories = JSON.parse(subcategories);
      // Ensure each subcategory is an object with the necessary structure
      updatedData.subcategories = parsedSubcategories.map((subcategory) => ({
        name: subcategory.name,
        _id: subcategory._id, // Include _id if needed or remove if not used
      }));
    }

    console.log(updatedData); // Log updatedData to check its structure

    // Find the current category to get the old name and subcategories
    const currentCategory = await Category.findById(id);
    if (!currentCategory) {
      return next(new ErrorHandler("Category not found", 404));
    }

    const oldCategoryName = currentCategory.name;
    const oldSubcategories = currentCategory.subcategories;

    // Update the category
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { $set: updatedData },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return next(new ErrorHandler("Category not found", 404));
    }

    // Update products with the old category
    await Product.updateMany(
      {
        category: oldCategoryName,
      },
      {
        $set: {
          category: updatedCategory.name,
        },
      }
    );

    // Update products with old subcategories (tags)
    if (parsedSubcategories) {
      for (let i = 0; i < oldSubcategories.length; i++) {
        const oldTag = oldSubcategories[i].name;
        const newTag = parsedSubcategories[i].name;

        if (newTag) {
          await Product.updateMany(
            {
              tags: oldTag,
            },
            {
              $set: {
                "tags.$": newTag,
              },
            }
          );
        }
      }
    }

    res.status(200).json(updatedCategory);
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
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
