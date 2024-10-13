const express = require("express");
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

  const resultId = stkCallbackResponse.Body.stkCallback.TinyPesaID;

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
        let phone;
        if (metadataItems.length === 5) {
          phone = metadataItems[4].Value;
        } else if (metadataItems.length === 4) {
          phone = metadataItems[3].Value;
        }

        if (code === 0) {
          const transaction = new TinyTransaction();
          transaction.customer_number = phone;
          transaction.mpesa_ref = ref;
          transaction.amount = amount;
          transaction.resultId = resultId;

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

//transactions
router.get("/get-transactions", async (req, res) => {
  try {
    const transactions = await TinyTransaction.find({}).sort({ createdAt: -1 });

    console.log("tra", transactions);

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
  console.log("This is the resultId ", resultId);

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
    const callback_url = "https://onlineshop-delta-three.vercel.app/api/v2/tiny/callback"

    const postData = {
      amount,
      phone_number: convertedPhoneNumber,
      channel_id: 897, // Replace with the actual channel ID if needed
      provider: "m-pesa", // Payment provider
      external_reference: external_reference || "INV-001", // External reference (invoice number)
      callback_url: callback_url || "https://example.com/callback.php", // Callback URL
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
    const request_id = response.invoice.invoice_id;
    console.log(request_id);

    // Respond with the STK push result
    res.status(200).json({
      success: true,
      message: "Stk Pushed Successfully",
      request_id,
    });
  } catch (err) {
    console.error(`STK Push error:`, err);
    res.status(500).json({
      message: "STK Push failed",
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

module.exports = router;
