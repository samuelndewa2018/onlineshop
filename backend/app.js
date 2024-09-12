const express = require("express");
const ErrorHandler = require("./middleware/error");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");

app.use(
  cors({
    origin: [
      "https://www.ninetyone.co.ke",
      "https://ninetyone.co.ke",
      "www.ninetyone.co.ke",
      "ninetyone.co.ke",
      "https://www.ninetyone.co.ke/",
      "https://ninetyone.co.ke/",
      "www.ninetyone.co.ke/",
      "ninetyone.co.ke",
      "https://whatsapp-delta-nine.vercel.app",
    ], //this one
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Access-Control-Allow-Credentials",
      "Access-Control-Allow-Origin",
    ],
    credentials: true, // email data change
  })
);

app.use(
  express.json({
    limit: "50mb",
  })
);
app.use(cookieParser());
app.use(bodyParser.json());
app.use("/test", (req, res) => {
  res.send("Hello world!");
});

app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));

// config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

// import routes
const user = require("./controller/user");
const shop = require("./controller/shop");
const product = require("./controller/product");
const event = require("./controller/event");
const coupon = require("./controller/coupounCode");
const payment = require("./controller/payment");
const order = require("./controller/order");
const conversation = require("./controller/conversation");
const message = require("./controller/message");
const withdraw = require("./controller/withdraw");
const mpesaRoutes = require("./controller/mpesa");
const tinyRoutes = require("./controller/tinypesa");
const statementsRoutes = require("./controller/statements");
const category = require("./controller/categories");
const carousel = require("./controller/carousel");
const subscribe = require("./controller/subscribers");
const location = require("./controller/location");
const flashSale = require("./controller/flashSale");
const auction = require("./controller/auction");
const cities = require("./controller/city");
const states = require("./controller/state");
const countries = require("./controller/country");

app.use("/api/v2/user", user);
app.use("/api/v2/conversation", conversation);
app.use("/api/v2/message", message);
app.use("/api/v2/order", order);
app.use("/api/v2/shop", shop);
app.use("/api/v2/product", product);
app.use("/api/v2/event", event);
app.use("/api/v2/coupon", coupon);
app.use("/api/v2/auction", auction);
app.use("/api/v2/withdraw", withdraw);
app.use("/api/v2/pesa", mpesaRoutes);
app.use("/api/v2/tiny", tinyRoutes);
app.use("/api/v2/statements", statementsRoutes);
app.use("/api/v2/category", category);
app.use("/api/v2/carousel", carousel);
app.use("/api/v2/subscribe", subscribe);
app.use("/api/v2/location", location);
app.use("/api/v2/flashsale", flashSale);
app.use("/api/v2/countries", countries);
app.use("/api/v2/cities", cities);
app.use("/api/v2/states", states);

// it's for ErrorHandling
app.use(ErrorHandler);

module.exports = app;
