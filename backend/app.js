const express = require("express");
const ErrorHandler = require("./middleware/error");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");

//to handle cors authorizations
app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://onlineshop-2xjp.vercel.app",
    "https://onlineshop-delta.vercel.app"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true"); // Allow sending cookies from the client
  next();
});

app.use(
  cors({
    origin: ["https://onlineshop-delta.vercel.app/"],
    // origin: ['https://eshop-tutorial-cefl.vercel.app','http://localhost:3000'],
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "50mb",
  })
);
app.use(cookieParser());
// app.use("/", express.static(path.join(__dirname, "./tmp")));
// app.use("/", express.static(path.join(__dirname, "../uploads")));
app.use("/test", (req, res) => {
  res.send("Hello world!");
});

app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

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
const mpesaRoutes = require("./routes/mpesa");
const statementsRoutes = require("./controller/statements");
const category = require("./controller/categories");
const carousel = require("./controller/carousel");
const subscribe = require("./controller/subscribers");
const location = require("./controller/location");

app.use("/api/v2/user", user);
app.use("/api/v2/conversation", conversation);
app.use("/api/v2/message", message);
app.use("/api/v2/order", order);
app.use("/api/v2/shop", shop);
app.use("/api/v2/product", product);
app.use("/api/v2/event", event);
app.use("/api/v2/coupon", coupon);
app.use("/api/v2/payment", payment);
app.use("/api/v2/withdraw", withdraw);
app.use("/api/v2/mpesa", mpesaRoutes);
app.use("/api/v2/statements", statementsRoutes);
app.use("/api/v2/category", category);
app.use("/api/v2/carousel", carousel);
app.use("/api/v2/subscribe", subscribe);
app.use("/api/v2/location", location);

// it's for ErrorHandling
app.use(ErrorHandler);

module.exports = app;
