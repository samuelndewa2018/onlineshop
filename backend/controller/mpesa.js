const express = require("express");
const router = express.Router();
require("dotenv").config();
const Transaction = require("../model/transaction");
const datetime = require("node-datetime");
const axios = require("axios");
const request = require("request");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");
const Shop = require("../model/shop");

const pass_key =
  "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
const short_code = "174379";

//access token function sec ached
function getAccessToken() {
  const consumer_key = process.env.CONSUMER_KEY;
  const consumer_secret = process.env.CONSUMER_SECRET;
  const url =
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
  const auth =
    "Basic " +
    new Buffer.from(consumer_key + ":" + consumer_secret).toString("base64");
  return new Promise((response, reject) => {
    request(
      {
        url: url,
        headers: {
          Authorization: auth,
        },
      },
      function (error, res, body) {
        var jsonBody = JSON.parse(body);
        if (error) {
          reject(error);
        } else {
          const accessToken = jsonBody.access_token;
          response(accessToken);
        }
      }
    );
  });
}

//stk push
router.post(
  "/stk",
  catchAsyncErrors(async (req, res, next) => {
    getAccessToken().then(async (accessToken) => {
      const phone = req.body.phone.substring(1); //formated to 72190........
      const amount = req.body.amount;
      const date = new Date();
      const callbackurl = process.env.CALL_BACK_URL;
      const callbackroute = process.env.CALL_BACK_ROUTE;
      const timestamp =
        date.getFullYear() +
        ("0" + (date.getMonth() + 1)).slice(-2) +
        ("0" + date.getDate()).slice(-2) +
        ("0" + date.getHours()).slice(-2) +
        ("0" + date.getMinutes()).slice(-2) +
        ("0" + date.getSeconds()).slice(-2);

      const base64Encoded = Buffer.from(
        short_code + pass_key + timestamp
      ).toString("base64");

      const password = base64Encoded;
      const headers = {
        Authorization: `Bearer ${accessToken}`,
      };
      const stkUrl =
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
      let data = {
        BusinessShortCode: short_code,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: `254${phone}`,
        PartyB: short_code,
        PhoneNumber: `254${phone}`,
        CallBackURL: `${callbackurl}/api/v2/pesa/${callbackroute}`,
        AccountReference: "eShop",
        TransactionDesc: "Lipa na M-PESA",
      };
      try {
        await axios
          .post(stkUrl, data, {
            headers: headers,
          })
          .then((response) => {
            res.send(response.data);
          });
      } catch (error) {
        console.log(error);
        return next(new ErrorHandler("Error occurred. Please try again", 500));
      }
    });
  })
);
// exports.stkPush = catchAsyncErrors();

const callback_route = process.env.CALLBACK_ROUTE;
const callback_root = process.env.CALL_BACK_ROOT;
const callbackurl = process.env.CALL_BACK_URL;

//callback stk
router.post("/callback", async (req, res) => {
  if (!req.body.Body.stkCallback.CallbackMetadata) {
    console.log(req.body.Body.stkCallback.ResultDesc);
    res.status(200).json("ok");
    return;
  }

  const amount = req.body.Body.stkCallback.CallbackMetadata.Item[0].Value;
  const code = req.body.Body.stkCallback.CallbackMetadata.Item[1].Value;
  const phone1 =
    req.body.Body.stkCallback.CallbackMetadata.Item[4].Value.toString().substring(
      3
    );
  const phone = `0${phone1}`;
  const transaction = new Transaction();

  transaction.customer_number = phone;
  transaction.mpesa_ref = code;
  transaction.amount = amount;

  await transaction
    .save()
    .then((data) => {
      console.log({ message: "transaction saved successfully", data });
    })
    .catch((err) => console.log(err.message));

  res.status(200).json("ok");
});

// REGISTER URL FOR C2B
router.get("/registerurl", (req, resp) => {
  getAccessToken()
    .then((accessToken) => {
      const callbackurl = process.env.CALL_BACK_URL;
      const url = "https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl";
      const auth = "Bearer " + accessToken;
      axios
        .post(
          url,
          {
            ShortCode: "174379",
            ResponseType: "Complete",
            ConfirmationURL: `${callbackurl}/api/v2/pesa/confirmation`,
            ValidationURL: `${callbackurl}/api/v2/pesa/validation`,
          },
          {
            headers: {
              Authorization: auth,
            },
          }
        )
        .then((response) => {
          resp.status(200).json(response.data);
        })
        .catch((error) => {
          console.log(error);
          resp.status(500).send("❌ Request failed");
        });
    })
    .catch(console.log);
});

router.get("/confirmation", (req, res) => {
  console.log("All transaction will be sent to this URL");
  console.log(req.body);
  res.status(200).json("Confirmation success");
});

router.get("/validation", (req, res) => {
  console.log("Validating payment");
  console.log(req.body);
  res.status(200).json("Validating success");
});

//stk query
router.post(
  "/stkpushquery",
  catchAsyncErrors(async (req, res) => {
    getAccessToken().then(async (accessToken) => {
      const CheckoutRequestID = req.body.CheckoutRequestID;

      const date = new Date();
      const timestamp =
        date.getFullYear() +
        ("0" + (date.getMonth() + 1)).slice(-2) +
        ("0" + date.getDate()).slice(-2) +
        ("0" + date.getHours()).slice(-2) +
        ("0" + date.getMinutes()).slice(-2) +
        ("0" + date.getSeconds()).slice(-2);

      const passkey = process.env.MPESA_PASSKEY;

      const password = new Buffer.from(
        short_code + pass_key + timestamp
      ).toString("base64");

      await axios

        .post(
          "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query",
          {
            BusinessShortCode: "174379",
            Password: password,
            Timestamp: timestamp,
            CheckoutRequestID: CheckoutRequestID,
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )
        .then((responce) => {
          res.status(200).json(responce.data);
        })
        .catch((err) => {
          // console.log(err.message);
          res.status(400).json(err);
        });
    });
  })
);

//withdrawal for seller
router.post(
  "/withdrawal",
  catchAsyncErrors(async (req, res) => {
    const { phoneNumber, amount, sellerId, updatedBalance } = req.body;

    const seller = await Shop.findById(sellerId);
    console.log("seller is", seller.availableBalance);

    console.log(phoneNumber);
    getAccessToken()
      .then(async (accessToken) => {
        const securityCredential = process.env.SECURITY_CREDENTIAL;
        const url =
          "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest";
        const auth = "Bearer " + accessToken;
        request(
          {
            url: url,
            method: "POST",
            headers: {
              Authorization: auth,
            },
            json: {
              InitiatorName: "testapi",
              SecurityCredential: securityCredential,
              CommandID: "PromotionPayment",
              Amount: amount,
              PartyA: "600998",
              PartyB: `254${phoneNumber}`,
              Remarks: "Withdrawal",
              QueueTimeOutURL: `${callbackurl}/b2c/queue`,
              ResultURL: `${callbackurl}/b2c/result`,
              Occasion: "Withdrawal",
            },
          },
          async function (error, response, body) {
            if (error) {
              console.log(error);
              res.status(500).json({ error: "Failed to initiate withdrawal" });
            } else {
              seller.availableBalance = updatedBalance;
              await seller.save();
              console.log(seller.availableBalance);

              res.status(200).json(body);
              console.log(body);
            }
          }
        );
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ error: "Failed to get access token" });
      });
  })
);
//transactions
router.get("/transactions", async (req, res) => {
  try {
    const transactions = await Transaction.find({}).sort({ createdAt: -1 });

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

module.exports = router;
