const express = require("express");
const router = express.Router();
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const TinyTransaction = require("../model/tinytransactions");

let successfulCallbackData = null;

router.post(
  "/tinystk",
  catchAsyncErrors(async (req, res, next) => {
    const phone = req.body.phone; // Use req.body to access parameters sent from the frontend
    const amount = req.body.amount;

    async function initializePayment() {
      const url = "https://tinypesa.com/api/v1/express/initialize";
      const apiKey = "BVf5CweiOBs";

      const formData = new URLSearchParams();
      formData.append("amount", amount); // Use the amount received from the frontend
      formData.append("msisdn", phone); // Use the phone number received from the frontend

      const options = {
        method: "POST",
        body: formData,
        headers: {
          Apikey: apiKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      };

      try {
        const response = await fetch(url, options);
        const data = await response.json();

        console.log("TinyPesa response:", data);
        const request_id = data.request_id;
        res.json({
          success: true,
          message: "Stk Pushed Successfully",
          request_id,
        });
      } catch (error) {
        console.error("Error occurred:", error);
        res
          .status(500)
          .json({ success: false, message: "Payment initialization failed" });
      }
    }

    initializePayment();
  })
);

router.post("/callback", async (req, res) => {
  const stkCallbackResponse = req.body;

  console.log("this is", stkCallbackResponse);

  const code = stkCallbackResponse.Body.stkCallback.ResultCode;
  successfulCallbackData = stkCallbackResponse.Body.stkCallback;

  try {
    if (
      stkCallbackResponse.Body.stkCallback.CallbackMetadata &&
      stkCallbackResponse.Body.stkCallback.CallbackMetadata.Item
    ) {
      const metadataItems =
        stkCallbackResponse.Body.stkCallback.CallbackMetadata.Item;

      if (metadataItems.length > 0) {
        const amount = metadataItems[0].Value;
        const ref = metadataItems[1].Value;
        const phone = metadataItems[4].Value;

        if (code === 0) {
          const transaction = new TinyTransaction();
          transaction.customer_number = phone;
          transaction.mpesa_ref = ref;
          transaction.amount = amount;

          const savedTransaction = await transaction.save();
          console.log({
            message: "transaction saved successfully",
            data: savedTransaction,
          });
        }
      }
    }
    return res.json({
      message: "Callback processed successfully",
    });
  } catch (err) {
    console.error(err.message);
    return res.json({
      message: "Callback processed with error",
      error: err.message,
    });
  }
});

router.get("/get-callback-status", async (req, res) => {
  if (successfulCallbackData) {
    res.json(successfulCallbackData);
  } else {
    res.status(404).json({ message: "Callback data not found" });
  }
});

module.exports = router;
