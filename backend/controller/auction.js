const express = require("express");
const router = express.Router();
const Auction = require("../model/auction");

// Route to create a new auction
router.post("/create", async (req, res) => {
  try {
    const { productId, startingPrice, bidIncrement, duration, shopId } =
      req.body;

    // Check if an auction with the given productId already exists
    const existingAuction = await Auction.findOne({ productId });

    if (existingAuction) {
      // Auction for the product already exists, handle accordingly
      return res.status(400).json({
        success: false,
        message: "An auction for this product already exists.",
      });
    }

    // Proceed with creating a new auction
    const startDate = Date.now();
    const endDate = startDate + duration * 24 * 60 * 60 * 1000;

    const auctionData = {
      productId,
      startingPrice,
      currentBid: startingPrice,
      bidIncrement,
      shopId,
      startDate,
      endDate,
      highestBidder: null,
    };

    const newAuction = await Auction.create(auctionData);
    res.status(201).json({ success: true, auction: newAuction });
  } catch (error) {
    console.error("Error creating auction:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Route to get auctions of a shop
router.get("/shop/:shopId", async (req, res) => {
  try {
    const shopAuctions = await Auction.find({ shopId: req.params.shopId });
    res.status(200).json({ success: true, auctions: shopAuctions });
  } catch (error) {
    console.error("Error fetching shop auctions:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Route to get all auctions
router.get("/all", async (req, res) => {
  try {
    const allAuctions = await Auction.find();
    res.status(200).json({ success: true, auctions: allAuctions });
  } catch (error) {
    console.error("Error fetching auctions:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Route to get a specific auction by ID
router.get("/:auctionId", async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.auctionId);
    if (!auction) {
      return res
        .status(404)
        .json({ success: false, message: "Auction not found" });
    }
    res.status(200).json({ success: true, auction });
  } catch (error) {
    console.error("Error fetching auction:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Route to place a bid on an auction
router.post("/:auctionId/bid", async (req, res) => {
  try {
    const { bidAmount, bidderId } = req.body;

    const auction = await Auction.findById(req.params.auctionId);
    if (!auction) {
      return res
        .status(404)
        .json({ success: false, message: "Auction not found" });
    }

    // Check if bid is higher than current bid + bid increment
    if (bidAmount < auction.currentBid + auction.bidIncrement) {
      return res.status(400).json({ success: false, message: "Bid too low" });
    }

    // Update current bid and highest bidder
    auction.currentBid = bidAmount;
    auction.highestBidder = bidderId;

    // Save the updated auction
    await auction.save();

    res
      .status(200)
      .json({ success: true, message: "Bid placed successfully", auction });
  } catch (error) {
    console.error("Error placing bid:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

module.exports = router;
