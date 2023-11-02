const express = require("express");
const router = express.Router();
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const TinyTransaction = require("../model/tinytransactions");

router.post(
  "/tinystk",
  catchAsyncErrors(async (req, res, next) => {
    async function initializePayment() {
      const url = "https://tinypesa.com/api/v1/express/initialize";
      const apiKey = "BVf5CweiOBs";

      const formData = new URLSearchParams();
      formData.append("amount", "1");
      formData.append("msisdn", "0712012113");

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

        console.log("TinyPesa response:", data.success);
      } catch (error) {
        console.error("Error occurred:", error);
      }
    }

    initializePayment();
  })
);

router.post("/callback", async (req, res) => {
  const stkCallbackResponse = req.body;

  const code = stkCallbackResponse.Body.stkCallback.ResultCode;
  const CheckoutRequestID =
    stkCallbackResponse.Body.stkCallback.CheckoutRequestID;
  const amount =
    stkCallbackResponse.Body.stkCallback.CallbackMetadata.Item[0].Value;
  const phone1 =
    stkCallbackResponse.Body.stkCallback.CallbackMetadata.Item[1].Value;
  const phone =
    stkCallbackResponse.Body.stkCallback.CallbackMetadata.Item[4].Value;

  if (code === 0) {
    const transaction = new TinyTransaction();
    transaction.customer_number = phone;
    transaction.mpesa_ref = code;
    transaction.amount = amount;

    await transaction
      .save()
      .then((data) => {
        console.log({ message: "transaction saved successfully", data });
      })
      .catch((err) => console.log(err.message));
  }

  res.json({ message: "Callback processed successfully" });
});

module.exports = router;
