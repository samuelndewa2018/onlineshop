const express = require("express");
const router = express.Router();
require("dotenv").config();
const Transaction = require("../model/transaction");
const datetime = require("node-datetime");
const axios = require("axios");
const request = require("request");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");

const pass_key = process.env.pass_key;
const short_code = process.env.SHORT_CODE;

// const pass_key =
//   "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
// const short_code = "174379";

// const short_code_env = process.env.SHORT_CODE;
// const short_code = short_code_env.toString();
// const pass_key_env = process.env.pass_key;
// const pass_key = pass_key_env.toString();

const key = process.env.CONSUMER_KEY;
const secret = process.env.CONSUMER_SECRET;

//access token function
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
        short_code.toString() + pass_key.toString() + timestamp
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
        CallBackURL: `${callbackurl}/${callbackroute}`,
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
router.post("/callback", (req, res) => {
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

  transaction
    .save()
    .then((data) => {
      console.log({ message: "transaction saved successfully", data });
    })
    .catch((err) => console.log(err.message));

  res.status(200).json("ok");
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
router.get(
  "/withdral",
  catchAsyncErrors(async (req, res) => {
    getAccessToken()
      .then((accessToken) => {
        const securityCredential = process.env.SECURITY_CREDENTIAL;
        const url =
            "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest",
          auth = "Bearer " + accessToken;
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

              Amount: "1",

              PartyA: "600998",

              PartyB: "254712012113",

              Remarks: "Withdrawal",

              QueueTimeOutURL: `${callbackurl}/b2c/queue`,

              ResultURL: `${callbackurl}/b2c/result`,

              Occasion: "Withdrawal",
            },
          },
          function (error, response, body) {
            if (error) {
              console.log(error);
            }
            res.status(200).json(body);
            console.log(body);
          }
        );
      })
      .catch(console.log);
  })
);

//transactions
router.get("/transactions", (req, res) => {
  Transaction.find({})
    .sort({ createdAt: -1 })
    .exec(function (err, data) {
      if (err) {
        res.status(400).json(err.message);
      } else {
        res.status(201).json(data);
        // data.forEach((transaction) => {
        //   const firstFour = transaction.customer_number.substring(0, 4);
        //   const lastTwo = transaction.customer_number.slice(-2);

        //   console.log(`${firstFour}xxxx${lastTwo}`);
        // });
      }
    });
});

module.exports = router;
