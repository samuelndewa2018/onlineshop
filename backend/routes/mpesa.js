const express = require("express");
const router = express.Router();
const {
  token,
  stkPush,
  stkpushquery,
  stkCallback,
  withdrawal,
} = require("../controller/mpesa");
const app = express();
const cors = require("cors");

app.use(
  cors({
    origin: [
      "https://onlineshop-2xjp.vercel.app",
      "https://onlineshop-delta.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Access-Control-Allow-Credentials",
    ],
    credentials: true,
  })
);

const callback_route = process.env.CALLBACK_ROUTE;

router.post("/stk", token, stkPush);
router.post("/stkpushquery", token, stkpushquery);
router.post("/callback", stkCallback);
router.get("/withdral", withdrawal);

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
