const express = require("express");
const FlashSale = require("../model/flashSale");
const Shop = require("../model/shop");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const router = express.Router();

// Create a new flash sale
// const authenticateShop = async (req, res, next) => {
//   try {
//     const shopId = req.session.shopId;

//     const shop = await Shop.findById(shopId);
//     if (!shop) {
//       return res.status(401).json({ error: "Shop not authenticated" });
//     }

//     // Make the shop object available in the request for further use
//     req.shop = shop;

//     next(); // Proceed to the next middleware or route handler
//   } catch (error) {
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

router.get("/flash-sales", async (req, res) => {
  try {
    const flashSales = await FlashSale.find();
    res.json(flashSales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});
router.post(
  "/flash-sale",
  catchAsyncErrors(async (req, res) => {
    try {
      const { productId, startDate, endDate, shopId } = req.body;

      const shop = await Shop.findById(shopId);

      if (!shop) {
        return res.status(400).json({ error: "Shop not found" });
      }

      const flashSale = new FlashSale({
        productId,
        startDate,
        endDate,
        shopId,
        shop, // Include the shop data here
      });

      await flashSale.save();
      res.status(201).json(flashSale);
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  })
);

// Update a flash sale by ID
router.put("/flash-sales/:id", async (req, res) => {
  try {
    const flashSale = await FlashSale.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!flashSale) {
      return res.status(404).json({ error: "Flash sale not found" });
    }
    res.json(flashSale);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a flash sale by ID
router.delete("/flash-sales/:id", async (req, res) => {
  try {
    const flashSale = await FlashSale.findByIdAndDelete(req.params.id);
    if (!flashSale) {
      return res.status(404).json({ error: "Flash sale not found" });
    }
    res.json({ message: "Flash sale deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.get("/flash-sales/shop/:shopId", async (req, res) => {
  try {
    const shopId = req.params.shopId;

    const flashSales = await FlashSale.find({ shopId });
    res.json(flashSales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
