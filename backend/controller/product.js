const express = require("express");
const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const router = express.Router();
const Product = require("../model/product");
const Order = require("../model/order");
const Shop = require("../model/shop");
const cloudinary = require("cloudinary");
const ErrorHandler = require("../utils/ErrorHandler");
const Statements = require("../model/Statements");
const crypto = require("crypto");

async function getExchangeRate() {
  const statements = await Statements.find().sort({ createdAt: -1 }).limit(1);
  if (statements.length === 0) {
    throw new Error("No statements found in the database!");
  }
  return statements[0].exchangeRate;
}

// create product
router.post(
  "/create-product",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const statements = await Statements.find()
        .sort({ createdAt: -1 })
        .limit(1);

      if (statements.length === 0) {
        return next(
          new ErrorHandler("No statements found in the database!", 400)
        );
      }
      const latestStatement = statements[0];

      const exchangeRate = latestStatement.exchangeRate;

      const shopId = req.body.shopId;
      const shop = await Shop.findById(shopId);
      if (!shop) {
        return next(new ErrorHandler("Shop Id is invalid!", 400));
      } else {
        let images = [];

        if (typeof req.body.images === "string") {
          images.push(req.body.images);
        } else {
          images = req.body.images;
        }

        const imagesLinks = [];

        for (let i = 0; i < images.length; i++) {
          const result = await cloudinary.v2.uploader.upload(images[i], {
            folder: "products",
          });

          imagesLinks.push({
            public_id: result.public_id,
            url: result.secure_url,
          });
        }
        const calculateDPrice = (price, exchangeRate) => {
          return price && exchangeRate
            ? parseFloat(price / exchangeRate).toFixed(2)
            : 0;
        };

        // Extract sizes data from the request body
        const {
          name,
          description,
          category,
          tags,
          originalPrice,
          discountPrice,
          stock,
          condition,
          reviews,
          ratings,
        } = req.body;
        const sizes = req.body.sizes || []; // If sizes are not provided, default to an empty array

        // Calculate dPrice for each size
        const sizesWithDPrice = sizes.map((size) => ({
          ...size,
          dPrice: calculateDPrice(size.price, exchangeRate),
        }));

        // Validate sizes data (optional step)
        // You may want to perform additional validation on the sizes data here
        // Function to generate a 6-character alphanumeric itemNo
        const generateItemNo = () => {
          return crypto.randomBytes(3).toString("hex").toUpperCase();
        };

        // Generate a unique itemNo
        let itemNo;
        let itemNoExists = true;
        while (itemNoExists) {
          itemNo = generateItemNo();
          itemNoExists = await Product.exists({ itemNo });
        }

        // Create the product object
        const productData = {
          name,
          description,
          category,
          tags,
          originalPrice,
          discountPrice,
          stock,
          dPrice:
            discountPrice && exchangeRate
              ? parseFloat(discountPrice / exchangeRate).toFixed(2)
              : 0,

          condition,
          images: imagesLinks,
          reviews,
          ratings,
          shopId,
          shop,
          sold_out: 0,
          sizes: sizesWithDPrice,
          itemNo,
        };

        const product = await Product.create(productData);

        res.status(201).json({
          success: true,
          product,
        });
      }
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// get all products of a shop
router.get(
  "/get-all-products-shop/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find({ shopId: req.params.id });

      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// delete product of a shop
router.delete(
  "/delete-shop-product/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return next(new ErrorHandler("Product is not found with this id", 404));
      }

      for (const image of product.images) {
        const result = await cloudinary.v2.uploader.destroy(image.public_id);
      }

      await Product.deleteOne({ _id: req.params.id });
      res.status(201).json({
        success: true,
        message: "Product Deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// get all products
router.get(
  "/get-all-products",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find().sort({ createdAt: -1 });

      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// review for a product
router.put(
  "/create-new-review",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { user, rating, comment, productId, orderId } = req.body;

      const product = await Product.findById(productId);

      const review = {
        user,
        rating,
        comment,
        productId,
      };

      const isReviewed = product.reviews.find(
        (rev) => rev.user._id === req.user._id
      );

      if (isReviewed) {
        product.reviews.forEach((rev) => {
          if (rev.user._id === req.user._id) {
            (rev.rating = rating), (rev.comment = comment), (rev.user = user);
          }
        });
      } else {
        product.reviews.push(review);
      }

      let avg = 0;

      product.reviews.forEach((rev) => {
        avg += rev.rating;
      });

      product.ratings = avg / product.reviews.length;

      await product.save({ validateBeforeSave: false });

      await Order.findByIdAndUpdate(
        orderId,
        { $set: { "cart.$[elem].isReviewed": true } },
        { arrayFilters: [{ "elem._id": productId }], new: true }
      );

      res.status(200).json({
        success: true,
        message: "Reviewed successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// all products --- for admin
router.get(
  "/admin-all-products",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get a single product
router.get(
  "/get-product/:id",
  // isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const productId = req.params.id;

      const productData = await Product.findById(productId);
      if (!productData) {
        return next(new ErrorHandler("Product not found", 404));
      }

      res.status(200).json({
        success: true,
        product: productData,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

//update product
// router.put(
//   "/update-product/:productId",
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const productId = req.params.productId;
//       const product = await Product.findById(productId);

//       if (!product) {
//         return next(new ErrorHandler("Product not found!", 404));
//       } else {
//         let images = [];

//         if (typeof req.body.images === "string") {
//           images.push(req.body.images);
//         } else {
//           images = req.body.images;
//         }

//         const updatedData = req.body;
//         console.log(updatedData);

//         if (images && images.length > 0) {
//           const imagesLinks = [];

//           for (let i = 0; i < images.length; i++) {
//             const result = await cloudinary.v2.uploader.upload(images[i], {
//               folder: "products",
//             });

//             imagesLinks.push({
//               public_id: result.public_id,
//               url: result.secure_url,
//             });
//           }

//           const currentImages = product.images;
//           updatedData.images = currentImages.concat(imagesLinks);
//         } else {
//           updatedData.images = product.images;
//         }

//         if (updatedData.discountPrice) {
//           const statements = await Statements.find()
//             .sort({ createdAt: -1 })
//             .limit(1);
//           if (statements.length === 0) {
//             return next(
//               new ErrorHandler("No statements found in the database!", 400)
//             );
//           }
//           const exchangeRate = statements[0].exchangeRate;
//           updatedData.dPrice = parseFloat(
//             (updatedData.discountPrice / exchangeRate).toFixed(2)
//           );

//           if (updatedData.sizes && Array.isArray(updatedData.sizes)) {
//             let totalStock = 0;

//             updatedData.sizes.forEach((size) => {
//               if (size.price) {
//                 size.dPrice = parseFloat(size.price / exchangeRate).toFixed(2);
//               }

//               // Add the stock of the current size to the total stock
//               totalStock += parseInt(size.stock) || 0;
//               updatedData.stock = totalStock;
//             });
//             console.log();
            

//             // totalStock now holds the sum of all sizes' stock
//             console.log("Total stock:", totalStock);
//           }
//         }

//         // Update the product with the new data
//         product.set(updatedData);
//         await product.save();

//         res.status(200).json({
//           success: true,
//           product,
//         });
//       }
//     } catch (error) {
//       return next(new ErrorHandler(error, 400));
//     }
//   })
// );

router.put(
  "/update-product/:productId",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const productId = req.params.productId;
      const product = await Product.findById(productId);

      if (!product) {
        return next(new ErrorHandler("Product not found!", 404));
      }

      // Log incoming request body for debugging
      console.log('Incoming Request Body:', req.body);

      // Individually update fields
      product.name = req.body.name || product.name;
      product.description = req.body.description || product.description;
      product.category = req.body.category || product.category;
      product.tags = req.body.tags || product.tags;
      product.originalPrice = req.body.originalPrice || product.originalPrice;
      product.discountPrice = req.body.discountPrice || product.discountPrice;
      product.stock = req.body.stock || product.stock;
      product.condition = req.body.condition || product.condition;

      // Update sizes and calculate discount price if applicable
      if (req.body.sizes && Array.isArray(req.body.sizes)) {
        let totalStock = 0;
        product.sizes = req.body.sizes.map((size) => {
          if (size.price) {
            size.dPrice = parseFloat(size.price / (await getExchangeRate())).toFixed(2); // Assuming getExchangeRate() is defined
          }
          totalStock += parseInt(size.stock) || 0;
          return size;
        });
        product.stock = totalStock; // Update total stock
      }

      // Save the updated product
      await product.save();

      res.status(200).json({
        success: true,
        product,
      });
    } catch (error) {
      console.error("Update Product Error:", error); // Log the error for debugging
      return next(new ErrorHandler(error.message || "An error occurred!", 400));
    }
  })
);


// remove product image
router.put(
  "/delete-image/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return next(new ErrorHandler("Product is not found with this id", 404));
      }
      const { image } = req.body;

      await cloudinary.v2.uploader.destroy(image.public_id);

      const updatedImages = product.images.filter(
        (img) => img.public_id !== image.public_id
      );
      product.images = updatedImages;

      product.save();

      res.status(200).json({
        success: true,
        product,
      });
    } catch (error) {
      console.log(error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.get(
  "/get-all-products-shop-by-name/:shopName",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shop = await Shop.findOne({ name: req.params.shopName });

      if (!shop) {
        return next(new ErrorHandler("Shop not found", 404));
      }

      const products = await Product.find({ shop: shop._id });

      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
