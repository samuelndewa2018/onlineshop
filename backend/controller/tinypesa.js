const express = require("express");
const axios = require("axios");
const router = express.Router();
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const TinyTransaction = require("../model/tinytransactions");
const IntaSend = require("intasend-node");
const intasend = new IntaSend(
  process.env.PUBLISHABLE_KEY,
  process.env.SECRET_KEY
);

let successfulCallbackData = null;

// Your API username and password (could be stored in environment variables)
const apiUsername = process.env.apiUsername;
const apiPassword = process.env.apiPassword;

// Function to generate the Basic Auth token
const generateBasicAuthToken = () => {
  const credentials = `${apiUsername}:${apiPassword}`;
  const encodedCredentials = Buffer.from(credentials).toString("base64");
  return `Basic ${encodedCredentials}`;
};

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

  successfulCallbackData = stkCallbackResponse;

  const code = stkCallbackResponse.ResultCode; // Access ResultCode directly
  const resultId = stkCallbackResponse.CheckoutRequestID; // Assuming TinyPesaID was meant to be CheckoutRequestID
  const amount = stkCallbackResponse.ExternalReference; // Access Amount directly
  const ref = stkCallbackResponse.MpesaReceiptNumber; // Access MpesaReceiptNumber directly
  const phone = stkCallbackResponse.Phone; // Access Phone directly

  try {
    if (code === 0) {
      const transaction = new TinyTransaction();
      transaction.customer_number = phone;
      transaction.mpesa_ref = ref;
      transaction.amount = amount;
      transaction.resultId = resultId;

      const savedTransaction = await transaction.save();
      console.log({
        message: "Transaction saved successfully",
        data: savedTransaction,
      });
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

//transactions
router.get("/get-transactions", async (req, res) => {
  try {
    const transactions = await TinyTransaction.find({}).sort({ createdAt: -1 });

    const maskedTransactions = transactions.map((transaction) => {
      const firstFour = transaction.customer_number.substring(0, 4);
      const lastTwo = transaction.customer_number.slice(-2);
      const maskedNumber = `${firstFour}xxxx${lastTwo}`;
      return {
        ...transaction.toObject(),
        customer_number: maskedNumber,
      };
    });

    res.status(200).json(maskedTransactions);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// //transactions

router.get("/checkResultId/:resultId", async (req, res) => {
  const { resultId } = req.params;

  try {
    const existingTransaction = await TinyTransaction.findOne({ resultId });

    if (existingTransaction) {
      res.status(200).json({ exists: true });
    } else {
      res.status(200).json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//transactions
router.get("/checkRefcode/:mpesa_ref/:requestID", async (req, res) => {
  const { mpesa_ref, requestID } = req.params;

  try {
    const existingTransaction = await TinyTransaction.findOne({
      mpesa_ref,
    });

    if (existingTransaction) {
      if (existingTransaction.resultId === requestID) {
        res.status(200).json({ exists: true });
      } else {
        res.status(200).json({ exists: false });
      }
    } else {
      res.status(200).json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// intasend stk push
router.post("/mpesa-stk-push", async (req, res) => {
  try {
    const { amount, phone } = req.body;

    // Convert phone number to international format
    function convertPhoneNumber(phoneNumber) {
      if (phoneNumber.startsWith("0") && phoneNumber.length === 10) {
        return "254" + phoneNumber.slice(1);
      } else {
        return phoneNumber;
      }
    }

    const convertedPhoneNumber = convertPhoneNumber(phone);
    const callback_url =
      "https://onlineshop-delta-three.vercel.app/api/v2/tiny/callback";

    const postData = {
      amount,
      phone_number: convertedPhoneNumber,
      channel_id: 897, // Replace with the actual channel ID if needed
      provider: "m-pesa",
      external_reference: String(amount),
      callback_url: callback_url, // Callback URL
    };

    // Generate the Basic Auth token
    const basicAuthToken = generateBasicAuthToken();

    try {
      // Make the POST request using axios
      const response = await axios.post(
        "https://backend.payhero.co.ke/api/v2/payments",
        postData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: basicAuthToken,
          },
        }
      );

      // Assuming `CheckoutRequestID` is in the response data
      const request_id = response.data.CheckoutRequestID;
      const track_id = response.data.reference;

      // Log the details before sending the response
      console.log({
        request_id,
        track_id,
        apiUsername,
        apiPassword,
      });

      // Respond with the STK push result
      res.status(200).json({
        success: true,
        message: "STK Pushed Successfully",
        request_id,
        track_id,
      });
    } catch (err) {
      console.error(
        "STK Push error:",
        err.response ? err.response.data : err.message
      );
      res.status(500).json({
        message: "STK Push failed",
        error: err.response ? err.response.data : err.message,
      });
    }
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({
      message: "Request failed",
      error: err.message,
    });
  }
});

// Define the route to check payment status
router.get("/payment-status/:transaction_id", async (req, res) => {
  try {
    const { transaction_id } = req.params;

    const response = await intasend.collection().status(transaction_id);
    const request_id = response.invoice.invoice_id;

    // Respond with the payment status
    res.status(200).json({
      message: "Payment status fetched successfully",
      data: response,
    });
  } catch (err) {
    console.error(`Payment status error:`, err);
    res.status(500).json({
      message: "Failed to fetch payment status",
      error: err.message,
    });
  }
});

router.get("/statas", async (req, res) => {
  try {
    const basicAuthToken = generateBasicAuthToken();

    const reference = "b607806a-7262-4e8f-8802-5351ce33a61a";
    console.log("this is the ref", reference);

    // Make the GET request using axios
    const response = await axios.get(
      `https://backend.payhero.co.ke/api/v2/transaction-status?reference=${reference}`,
      {
        headers: {
          Authorization: basicAuthToken,
        },
      }
    );

    res.status(200).json({
      message: "Transaction status retrieved successfully",
      data: response.data,
    });
    console.log("this is the data", response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to retrieve transaction status",
      error: error.message,
    });
  }
});

module.exports = router;

//  Received response: {
//   Amount: 1,
//   CheckoutRequestID: 'ws_CO_14102024092514495741895028',
//   ExternalReference: '1',
//   MerchantRequestID: '0a83-4731-ac2e-58dccc54ee5984319654',
//   MpesaReceiptNumber: 'SJE91DHU17',
//   PaymentWalletBalance: 0,
//   Phone: '+254741895028',
//   ResultCode: 0,
//   ResultDesc: 'The service request is processed successfully.',
//   ServiceWalletBalance: 0,
//   Status: 'Success'
// }
