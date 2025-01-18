const express = require("express");
const axios = require("axios");
const router = express.Router();
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const TinyTransaction = require("../model/tinytransactions");

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
  const stkCallbackResponse = req.body.response;

  console.log("this is the callback", stkCallbackResponse);

  const code = stkCallbackResponse.ResultCode; // Access ResultCode directly
  const resultId = stkCallbackResponse.CheckoutRequestID; // Assuming TinyPesaID was meant to be CheckoutRequestID
  const amount = stkCallbackResponse.ExternalReference; // Access Amount directly
  const ref = stkCallbackResponse.MpesaReceiptNumber; // Access MpesaReceiptNumber directly
  const phone = stkCallbackResponse.Phone; // Access Phone directly

  //   try {
  //     if (code === 0) {
  //       const transaction = new TinyTransaction();
  //       transaction.customer_number = phone;
  //       transaction.mpesa_ref = ref;
  //       transaction.amount = amount;
  //       transaction.resultId = resultId;
  //       transaction.type = "deposit";

  //       const savedTransaction = await transaction.save();

  //       console.log({
  //         message: "Transaction saved successfully",
  //         data: savedTransaction,
  //       });
  //     }

  //     return res.json({
  //       message: "Callback processed successfully",
  //     });
  //   } catch (err) {
  //     console.error(err.message);
  //     return res.json({
  //       message: "Callback processed with error",
  //       error: err.message,
  //     });
  //   }
});

module.exports = router;
