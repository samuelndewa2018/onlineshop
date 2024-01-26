const express = require("express");
const Carousel = require("../model/carousel");
const router = express.Router();
const cloudinary = require("cloudinary");

//create carousel
router.post("/carousel", async (req, res) => {
  const { caption } = req.body;
  let image = [];

  if (req.files && req.files.image) {
    const result = await cloudinary.v2.uploader.upload(
      req.files.image.tempFilePath,
      {
        folder: "carousel",
      }
    );
    image.push({
      public_id: result.public_id,
      url: result.secure_url,
    });
  }

  const newCarouselItem = new Carousel({ caption, image });

  try {
    const savedCarouselItem = await newCarouselItem.save();
    res.json(savedCarouselItem);
  } catch (error) {
    res.status(500).json({ error: "Failed to save the carousel" });
  }
});
//get carousels
router.get("/get-carousel", async (req, res) => {
  try {
    const carouselData = await Carousel.find();
    res.json(carouselData);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

//delete carousel
router.delete("/carousel/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const carousel = await Carousel.findById(req.params.id);

    if (!carousel) {
      return next(new ErrorHandler("carousel is not found with this id", 404));
    }

    for (const image of carousel.image) {
      const result = await cloudinary.v2.uploader.destroy(image.public_id);
    }

    await Carousel.deleteOne({ _id: req.params.id });
    res.status(201).json({
      success: true,
      message: "carousel Deleted successfully!",
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete carousel item" });
  }
});

module.exports = router;
