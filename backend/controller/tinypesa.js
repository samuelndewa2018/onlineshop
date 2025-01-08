const express = require("express");
const axios = require("axios");
const router = express.Router();
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const TinyTransaction = require("../model/tinytransactions");
const IntaSend = require("intasend-node");
const AccT = require("../model/accT");
const Acc = require("../model/acc");
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
      transaction.type = "deposit";

      const savedTransaction = await transaction.save();

      const accTransaction = await AccT.findOne({ request_id: resultId });

      if (!accTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      // Update the status to "paid"
      accTransaction.status = "paid";

      // Save the updated transaction
      await accTransaction.save();

      const { acc_id, amount: accAmount } = accTransaction;

      // Find the account associated with the acc_id
      let transactionAcc = await Acc.findOne({ name: acc_id });

      if (!transactionAcc) {
        // Create the account with the initial balance set to accAmount
        transactionAcc = new Acc({
          name: acc_id,
          balance: accAmount,
        });

        // Save the newly created account
        await transactionAcc.save();
      } else {
        transactionAcc.balance += accAmount;

        // Save the updated account
        await transactionAcc.save();
      }

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
// payhero stk push
router.post("/mpesa-stk-push", async (req, res) => {
  try {
    const { amount, phone } = req.body;

    // Input validation
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount provided." });
    }

    if (!phone || !/^0\d{9}$/.test(phone)) {
      return res
        .status(400)
        .json({ message: "Invalid phone number provided." });
    }

    function convertPhoneNumber(phoneNumber) {
      if (phoneNumber.startsWith("0") && phoneNumber.length === 10) {
        return "254" + phoneNumber.slice(1);
      }
      return phoneNumber;
    }

    const convertedPhoneNumber = convertPhoneNumber(phone);
    const channelIds = [897, 899, 900];
    const channel_id =
      channelIds[Math.floor(Math.random() * channelIds.length)];
    const callback_url =
      "https://onlineshop-delta-three.vercel.app/api/v2/tiny/callback";

    const postData = {
      amount,
      phone_number: convertedPhoneNumber,
      channel_id,
      provider: "m-pesa",
      external_reference: String(amount),
      callback_url,
    };

    const basicAuthToken = generateBasicAuthToken();

    try {
      const response = await axios.post(
        "https://backend.payhero.co.ke/api/v2/payments",
        postData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: basicAuthToken,
          },
          timeout: 10000, // 10 seconds timeout
        }
      );

      const { CheckoutRequestID: request_id, reference: track_id } =
        response.data;

      const channel_id = 123; // Example value
      console.log("channel id:", channel_id, "type:", typeof channel_id);

      const accT = new AccT({
        request_id,
        acc_id: channel_id,
        amount,
        type: "deposit",
      });
      await accT.save();

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

router.post("/statas", async (req, res) => {
  try {
    const basicAuthToken = generateBasicAuthToken();

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
