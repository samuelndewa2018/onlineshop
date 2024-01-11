const express = require("express");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const Order = require("../model/order");
const Aorder = require("../model/aorder");
const Shop = require("../model/shop");
const Product = require("../model/product");
const sendMail = require("../utils/sendMail");
const pdf = require("pdfkit");
const fs = require("fs");
const path = require("path"); //
const cloudinary = require("cloudinary");
const axios = require("axios");
// const moment = require("moment")
// import moment from "moment";

function sendSMS(phoneNumber, message) {
  const url = "https://api.umeskiasoftwares.com/api/v1/sms";
  const data = {
    api_key: "SDlTWDE0V0Y6dmZxY21tM2s=", // Replace with your API key
    email: "cornecraig26@gmail.com", // Replace with your email
    Sender_Id: "23107", // If you have a custom sender id, use it here OR Use the default sender id: 23107
    message: message,
    phone: phoneNumber, // Phone number should be in the format: 0768XXXXX60 OR 254768XXXXX60 OR 254168XXXXX60
  };

  return axios.post(url, data, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
}

// create new order

router.post(
  "/create-order",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const {
        cart,
        shippingAddress,
        user,
        orderNo,
        totalPrice,
        paymentInfo,
        shippingPrice,
        discount,
      } = req.body;

      // Check if order with the same order number already exists
      const existingOrder = await Order.findOne({ orderNo });

      if (existingOrder) {
        return res.status(400).json({
          success: false,
          message: "Order with the same order number already exists.",
        });
      }
      async function updateOrder(id, qty) {
        const product = await Product.findById(id);
        product.stock -= qty;
        product.sold_out += qty;
        await product.save({ validateBeforeSave: false });
      }

      async function updateOrderWithSizes(id, qty, size) {
        const product = await Product.findById(id);
        product.sizes.find((s) => s.name === size).stock -= qty;
        await product.save({ validateBeforeSave: false });
      }
      const allItems = cart.reduce((acc, item) => {
        const shopId = item.shopId;
        if (!acc[shopId]) {
          acc[shopId] = [];
        }
        acc[shopId].push(item);
        return acc;
      }, {});

      const promises = Object.keys(allItems).map(async (shopId) => {
        const items = allItems[shopId];
        const subTotals = items.reduce(
          (acc, item) => acc + item.qty * item.discountPrice,
          0
        );

        try {
          const shop = await Shop.findById(shopId);

          if (!shop) {
            console.error(`Shop with ID ${shopId} not found.`);
          } else {
            if (
              (paymentInfo.type === "Mpesa" || paymentInfo.type === "Paypal") &&
              paymentInfo.status === "succeeded"
            ) {
              const amountToAdd = (subTotals * 0.9).toFixed(2);
              shop.availableBalance += parseInt(amountToAdd);

              for (const o of items) {
                if (o.sizes.length > 0) {
                  await updateOrderWithSizes(o._id, o.qty, o.size);
                }
                await updateOrder(o._id, o.qty);
              }
            }

            await shop.save();
          }
        } catch (error) {
          console.error(
            `Error updating availableBalance for shop ${shopId}: ${error}`
          );
        }
      });

      await Promise.all(promises);

      const order = await Order.create({
        cart,
        shippingAddress,
        user,
        orderNo,
        totalPrice,
        paymentInfo,
        shippingPrice,
        discount,
      });

      res.status(201).json({
        success: true,
        order,
      });
    } catch (error) {
      console.log(error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
//send emails
router.post(
  "/sendmyorder",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const {
        cart,
        orderNo,
        shippingAddress,
        user,
        totalPrice,
        paymentInfo,
        shippingPrice,
        discount,
      } = req.body;

      const shopItemsMap = new Map();
      const shopEmailsMap = new Map();
      const order = req.body;

      const shopOrders = [];

      const subTotals = order?.cart.reduce(
        (acc, item) => acc + item.qty * item.discountPrice,
        0
      );

      const currentDate = Date.now();
      const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      const date = new Date(currentDate).toLocaleString("en-US", options);

      const attachments = order.cart.map((item) => ({
        filename: item.images[0].url,
        path: item.images[0].url,
        cid: item.images[0].url,
      }));
      attachments.push({
        filename: "logo.png",
        path: `https://res.cloudinary.com/bramuels/image/upload/v1695878268/logo/LOGO-01_moo9oc.png`,
        cid: "logo",
      });

      for (const item of cart) {
        const shopId = item.shopId;
        if (!shopItemsMap.has(shopId)) {
          shopItemsMap.set(shopId, []);
        }
        shopItemsMap.get(shopId).push(item);

        if (!shopEmailsMap.has(shopId)) {
          const shop = await Shop.findById(shopId);
          if (shop) {
            shopEmailsMap.set(shopId, shop.email);
          }
        }
      }

      for (const [shopId, items] of shopItemsMap) {
        try {
          const shop = await Shop.findById(shopId);

          if (shop) {
            const shopOrder = await Aorder.create({
              cart: items,
              shippingAddress,
              user,
              totalPrice: items.reduce(
                (acc, item) => acc + item.qty * item.discountPrice,
                0
              ),
              paymentInfo,
              shippingPrice,
              discount,
              orderNo,
            });

            shopOrders.push(shopOrder);
          }
        } catch (error) {
          console.error(error);
        }
      }

      for (const [shopId, items] of shopItemsMap) {
        try {
          const shop = await Shop.findById(shopId);

          if (shop) {
            const shopEmail = shop.email;
            let shopPhoneNumber = shop.phoneNumber;
            const shopName = shop.name;

            // Check if the phone number starts with "07" and replace it with "2547"
            if (shopPhoneNumber.startsWith("07")) {
              shopPhoneNumber = "2547" + shopPhoneNumber.slice(2);
            }
            console.log("Sending SMS to:", shopPhoneNumber);
            console.log("this is", shopName);

            // Sending SMS
            sendSMS(
              shopPhoneNumber,
              `Hello ${shopName}, You have a new order Order Number:${order.orderNo} click on these link below to check https://ninetyone.co.ke/dashboard-orders`
            );

            console.log("SMS sent successfully to:", shopPhoneNumber);
          }
        } catch (error) {
          console.error(
            `Error fetching shop details for shopId ${shopId}: ${error}`
          );
        }
      }

      await sendMail({
        email: order.user.email || order.user.guestEmail,
        subject: "Order Confirmation",
        html: `<!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
            <link
            href="https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700;1,800&display=swap"
            rel="stylesheet"
          />
            <title>3 dolts Emails</title>
            <style>
              @media only screen and (max-width: 620px) {
                table.body h1 {
                  font-size: 28px !important;
                  margin-bottom: 10px !important;
                }
                table.body p,
                table.body ul,
                table.body ol,
                table.body td,
                table.body span,
                table.body a {
                  font-size: 16px !important;
                }
                table.body .wrapper,
                table.body .article {
                  padding: 10px !important;
                }
                table.body .content {
                  padding: 0 !important;
                }
                table.body .container {
                  padding: 0 !important;
                  width: 100% !important;
                }
                table.body .main {
                  border-left-width: 0 !important;
                  border-radius: 0 !important;
                  border-right-width: 0 !important;
                }
                table.body .btn table {
                  width: 100% !important;
                }
                table.body .btn a {
                  width: 100% !important;
                }
                table.body .img-responsive {
                  height: auto !important;
                  max-width: 100% !important;
                  width: auto !important;
                }
              }
              @media all {
                .ExternalClass {
                  width: 100%;
                }
                .ExternalClass,
                .ExternalClass p,
                .ExternalClass span,
                .ExternalClass font,
                .ExternalClass td,
                .ExternalClass div {
                  line-height: 100%;
                }
                .apple-link a {
                  color: inherit !important;
                  font-family: inherit !important;
                  font-size: inherit !important;
                  font-weight: inherit !important;
                  line-height: inherit !important;
                  text-decoration: none !important;
                }
                #MessageViewBody a {
                  color: inherit;
                  text-decoration: none;
                  font-size: inherit;
                  font-family: inherit;
                  font-weight: inherit;
                  line-height: inherit;
                }
                .btn-primary table td:hover {
                  background-color: #34495e !important;
                }
                .btn-primary a:hover {
                  background-color: #34495e !important;
                  border-color: #34495e !important;
                }
              }
            </style>
          </head>
          <body
            style="
              background-color: #f6f6f6;
              font-family: sans-serif;
              -webkit-font-smoothing: antialiased;
              font-size: 14px;
              line-height: 1.4;
              margin: 0;
              padding: 0;
              -ms-text-size-adjust: 100%;
              -webkit-text-size-adjust: 100%;
            "
          >
            <span
              class="preheader"
              style="
                color: transparent;
                display: none;
                height: 0;
                max-height: 0;
                max-width: 0;
                opacity: 0;
                overflow: hidden;
                mso-hide: all;
                visibility: hidden;
                width: 0;
              "
              >eShop</span
            >
            <table
              role="presentation"
              border="0"
              cellpadding="0"
              cellspacing="0"
              class="body"
              style="
                border-collapse: separate;
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                background-color: #f6f6f6;
                width: 100%;
              "
              width="100%"
              bgcolor="#f6f6f6"
            >
              <tr>
                <td
                  style="font-family: sans-serif; font-size: 14px; vertical-align: top"
                  valign="top"
                >
                  &nbsp;
                </td>
                <td
                  class="container"
                  style="
                    font-family: sans-serif;
                    font-size: 14px;
                    vertical-align: top;
                    display: block;
                    max-width: 580px;
                    padding: 10px;
                    width: 580px;
                    margin: 0 auto;
                  "
                  width="580"
                  valign="top"
                >
                  <div
                    class="content"
                    style="
                      box-sizing: border-box;
                      display: block;
                      margin: 0 auto;
                      max-width: 580px;
                      padding: 10px;
                    "
                  >
                 
                  <div
                  class="logo-container"
                  style="
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100px;
                    width: 100px;
                    margin: 0 auto;
                  "
                >
                  <img
                    src="cid:logo"
                    alt="3 dolts logo"
                    style="height: 80px; width: 100px;"
                  />
                </div>
               
                    <!-- START CENTERED WHITE CONTAINER -->
                    <table
                      role="presentation"
                      class="main"
                      style="
                        border-collapse: separate;
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        background: #ffffff;
                        border-radius: 3px;
                        width: 100%;
                      "
                      width="100%"
                    >
                      <!-- START MAIN CONTENT AREA -->
                      <tr>
                        <td
                          class="wrapper"
                          style="
                            font-family: sans-serif;
                            font-size: 14px;
                            vertical-align: top;
                            box-sizing: border-box;
                            padding: 20px;
                          "
                          valign="top"
                        >
                          <table
                            role="presentation"
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            style="
                              border-collapse: separate;
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              width: 100%;
                            "
                            width="100%"
                          >
                            <tr>
                              <td
                                style="
                                  font-family: sans-serif;
                                  font-size: 14px;
                                  vertical-align: top;
                                "
                                valign="top"
                              >
                                <h2>Thanks for shopping with us</h2>
                                <p>Hello ${
                                  order.user.name || order.user.guestName
                                },</p>
                                <p>
                                  We have received your order and it's being processed.
                                </p>
                                <h2>
                                  Order No.
                                  ${order.orderNo}
                                </h2>
                                <h4>
                                Placed on: ${date}
                                <h4>
                                <table>
                                  <thead>
                                    <tr>
                                    <td style="padding-right: 5px;"><strong>Product(s)</strong></td>
                                    <td style="padding-right: 5px;"><strong>Quantity</strong></td>
                                    <td style="text-align: right;"><strong align="right">Price</strong></td>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    ${order.cart
                                      .map(
                                        (item) => `
                                    <tr style="border: 1px solid #000; border-radius: 5px; margin-bottom: 5px;">
                                    <td style="display: flex;" align="start">
                                    <img src="cid:${item.images[0].url}" 
                                    style="height: 80px; width: 80px; margin-right: 5px"/>
                                    ${item.name}  <br/> ${
                                          item.size ? `Size: ${item.size}` : ""
                                        }
                                   </td>
                                      <td align="center">${item.qty}</td>
                                      <td align="right">${item.discountPrice
                                        .toString()
                                        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                    </td>
                                    </tr>
                                    `
                                      )
                                      .join("\n")}
                                  </tbody>
                                  <br/>
                                  <tfoot>
                                    <tr>
                                      <td colspan="2">Items Price:</td>
                                      <td align="right">Ksh. ${subTotals
                                        .toString()
                                        .replace(
                                          /\B(?=(\d{3})+(?!\d))/g,
                                          ","
                                        )}</td>
                                    </tr> 
                                    <tr>
                                      <td colspan="2">Shipping Price:</td>
                                      <td align="right">Ksh. ${
                                        shippingPrice
                                          ? shippingPrice
                                              .toString()
                                              .replace(
                                                /\B(?=(\d{3})+(?!\d))/g,
                                                ","
                                              )
                                          : 0
                                      }</td>
                                    </tr>
                                    <tr>
                                      <td colspan="2">Discount: </td>
                                      <td align="right">Ksh. ${
                                        discount
                                          ? discount
                                              .toString()
                                              .replace(
                                                /\B(?=(\d{3})+(?!\d))/g,
                                                ","
                                              )
                                          : 0
                                      }</td>
                                    </tr>
                                    <br/>
                                    <tr>
                                      <td colspan="2"><strong>Total Price:</strong></td>
                                      <td align="right">
                                        <strong> Ksh. ${Math.round(totalPrice)
                                          .toString()
                                          .replace(
                                            /\B(?=(\d{3})+(?!\d))/g,
                                            ","
                                          )}</strong>
                                      </td>
                                    
                                    </tr>
                                    <br/><br/>
                                    <tr>
                                      <td colspan="2">Payment Method:</td>
                                      <td align="right">${paymentInfo.type}</td>
                                    </tr>
                                    <tr>
                                      <td colspan="2">Payment Status:</td>
                                      <td align="right">${
                                        paymentInfo.status
                                          ? paymentInfo.status
                                          : "Not paid"
                                      }</td>
                                    </tr>
                                  </tfoot>
                                </table>
        
                                <h2>Shipping address</h2>
                                <p>
                                ${
                                  shippingAddress.address1 &&
                                  shippingAddress.address1 + `, <br />`
                                }
                                ${
                                  shippingAddress.address2 &&
                                  shippingAddress.address2 + `, <br />`
                                }
                                ${
                                  shippingAddress.zipCode &&
                                  shippingAddress.zipCode + `, <br />`
                                }
                                ${
                                  shippingAddress.city &&
                                  shippingAddress.city + `, <br />`
                                }
                                ${
                                  shippingAddress.country &&
                                  shippingAddress.country
                                }<br />
                              </p>
                                <hr />
                                <p>Thanks for shopping with us.</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
        
                      <!-- END MAIN CONTENT AREA -->
                    </table>
                    <!-- END CENTERED WHITE CONTAINER -->
        
                    <!-- START FOOTER -->
                    <div
                      class="footer"
                      style="
                        clear: both;
                        margin-top: 10px;
                        text-align: center;
                        width: 100%;
                      "
                    >
                      <table
                        role="presentation"
                        border="0"
                        cellpadding="0"
                        cellspacing="0"
                        style="
                          border-collapse: separate;
                          mso-table-lspace: 0pt;
                          mso-table-rspace: 0pt;
                          width: 100%;
                        "
                        width="100%"
                      >
                        <tr>
                          <td
                            class="content-block"
                            style="
                              font-family: sans-serif;
                              vertical-align: top;
                              padding-bottom: 10px;
                              padding-top: 10px;
                              color: #999999;
                              font-size: 12px;
                              text-align: center;
                            "
                            valign="top"
                            align="center"
                          >
                            <span
                              class="apple-link"
                              style="
                                color: #999999;
                                font-size: 12px;
                                text-align: center;
                              "
                              >eShop Online Shop, Kahawa Shukari, Baringo Road</span
                            >
                            <br />
                          </td>
                        </tr>
                        <tr>
                          <td
                            class="content-block powered-by"
                            style="
                              font-family: sans-serif;
                              vertical-align: top;
                              padding-bottom: 10px;
                              padding-top: 10px;
                              color: #999999;
                              font-size: 12px;
                              text-align: center;
                            "
                            valign="top"
                            align="center"
                          >
                            <a
                              href="http://htmlemail.io"
                              style="
                                color: #999999;
                                font-size: 12px;
                                text-align: center;
                                text-decoration: none;
                              "
                              >&copy; ${new Date().getFullYear()} eShop. All rights
                              reserved.</a
                            >.
                          </td>
                        </tr>
                      </table>
                    </div>
                    <!-- END FOOTER -->
                  </div>
                </td>
                <td
                  style="font-family: sans-serif; font-size: 14px; vertical-align: top"
                  valign="top"
                >
                  &nbsp;
                </td>
              </tr>
            </table>
          </body>
        </html>
        `,
        attachments: attachments,
      });

      res.status(201).json({
        success: true,
      });
    } catch (error) {
      console.log(error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

//get all orders
router.get(
  "/get-all-orders/:userId",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const orders = await Order.find({ "user._id": req.params.userId }).sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get all orders of seller
router.get(
  "/get-seller-all-orders/:shopId",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const orders = await Order.find({
        "cart.shopId": req.params.shopId,
      }).sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

//generate receipt
router.get(
  "/generate-receipt/:orderId",

  catchAsyncErrors(async (req, res, next) => {
    try {
      const orderId = req.params.orderId;
      const order = await Order.findById(orderId);

      console.log(order);
      const footerText =
        "Nb: This is a computer generated receipt and therefore not signed. It is valid and issued by ninetyone.co.ke";
      const remainingSpaceForFooter = 10; // Adjust this value as needed

      // Adjust the yCoordinate to leave space for the footer
      const yCoordinate = pageHeight - fontSize - remainingSpaceForFooter;

      const pdfFileName = `receipt_${orderId}.pdf`;

      const doc = new pdf({
        size: "Letter",
      });
      const pageHeight = doc.page.height;

      const fontSize = 10;

      // Replace with your image URL

      try {
        const logoPath = path.join(__dirname, "logo.png");
        doc.image(logoPath, 50, 20, { width: 150, height: 100 });
      } catch (error) {
        console.error("Error loading image:", error);
      }

      doc.moveTo(50, 395);
      doc.dash(3);
      doc.lineTo(520, 395);

      doc.lineWidth(0.5);

      doc.stroke("#184ca0");

      doc.rect(0, 140, 350, 40).fill("#f3782f");
      doc.rect(520, 140, 620, 40).fill("#f3782f");

      doc
        .font("Helvetica-Bold")
        .fontSize(18)
        .fillColor("#1e4598")
        .text("Payment Receipt", 360, 153);

      doc.fill("black").font("Helvetica").fontSize(10);
      doc.moveDown(2);
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#1e4598")
        .text(`Date: ${order.createdAt.toDateString()}`, { align: "right" });
      doc.moveUp(1);
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#1e4598")
        .text("Customer Details:", 50, doc.y);

      doc.fill("black").font("Helvetica").fontSize(11);
      doc.moveDown();
      doc.font("Helvetica").fontSize(10);
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#1e4598")
        .text("Name:", 50, doc.y);
      doc.fill("black").font("Helvetica").fontSize(10);
      doc.moveUp(1);
      doc.fontSize(10).text(`${order.user.name}`, 150, doc.y);
      doc.moveDown();
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#1e4598")
        .text("Email:", 50, doc.y);
      doc.fill("black").font("Helvetica").fontSize(10);
      doc.moveUp(1);
      doc.fontSize(10).text(`${order.user.email}`, 150, doc.y);
      doc.moveDown();
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#1e4598")
        .text("Phone No:", 50, doc.y);
      doc.fill("black").font("Helvetica").fontSize(10);
      doc.moveUp(1);
      doc.fontSize(10).text(`${order.user.phoneNumber}`, 150, doc.y);

      doc.moveDown();
      doc.font("Helvetica").fontSize(10);
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#1e4598")
        .text("Payment Method:", 50, doc.y);
      doc.fill("black").font("Helvetica").fontSize(10);
      doc.moveUp(1);
      doc.fontSize(10).text(`${order.paymentInfo.type}`, 150, doc.y);
      doc.moveDown();
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#1e4598")
        .text("Payment Status:", 50, doc.y);
      doc.fill("black").font("Helvetica").fontSize(10);
      doc.moveUp(1);
      doc.text(
        `${order.paymentInfo.status === "succeeded" ? "Paid" : "Not Paid"}`,
        150,
        doc.y
      );
      doc.moveDown();
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#1e4598")
        .text("Order No:", 50, doc.y);
      doc.fill("black").font("Helvetica").fontSize(10);
      doc.moveUp(1);
      doc.text(`${order.orderNo}`, 150, doc.y);
      doc.moveDown();
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#1e4598")
        .text("Shipping Address: ", 50, doc.y);

      doc.fill("black").font("Helvetica").fontSize(10);
      doc.moveUp(1);
      doc.text(
        `${order.shippingAddress.address1}, ${order.shippingAddress.zipCode}, ${order.shippingAddress.country}`,
        150,
        doc.y
      );

      doc.moveDown(2);

      // Create the table header row on the same line
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#1e4598")
        .text("Items", 50, doc.y)
        .moveUp(1) // Adjust the vertical position
        .text("Qty", 280, doc.y)
        .moveUp(1) // Adjust the vertical position
        .text("Price", 380, doc.y)
        .moveUp(1) // Adjust the vertical position
        .text("Total", 480, doc.y);

      order.cart.forEach((item) => {
        const truncatedName =
          item.name.length > 25
            ? item.name.substring(0, 40) +
              "...\n" +
              item.name.substring(40, 80) +
              "...\n" +
              item.name.substring(80, 120)
            : item.name;
        doc
          .font("Helvetica")
          .fillColor("black")
          .fontSize(10)
          .text(truncatedName, 50, doc.y + 30)
          .moveUp(1)
          .text(item.qty, 280, doc.y)
          .font("Helvetica")
          .fillColor("black")
          .fontSize(10)
          .moveUp(1)
          .text(item.discountPrice, 380, doc.y)
          .font("Helvetica")
          .fillColor("black")
          .fontSize(10)
          .moveUp(1)
          .text(item.discountPrice * item.qty, 480, doc.y)
          .font("Helvetica")
          .fillColor("black")
          .fontSize(10);
      });

      // Calculate and display the total
      const total = order.cart.reduce(
        (acc, item) => acc + item.discountPrice * item.qty,
        0
      );

      doc.moveDown(3);
      doc
        .font("Helvetica-Bold")
        .fillColor("#1e4598")
        .fontSize(12)
        .text("Total", 380, doc.y);

      doc.moveUp(1);
      doc.fontSize(12).text("Ksh " + total, { align: "right" });

      doc.moveDown(1);
      doc
        .font("Helvetica-Bold")
        .fillColor("#1e4598")
        .fontSize(12)
        .text("Discount:", 380);

      doc.moveUp(1);
      doc
        .fontSize(10)
        .text(
          `Ksh ${
            order.discount && order.discount === null ? 0 : order.discount
          }`,
          {
            align: "right",
          }
        );

      // Set the response headers for the PDF
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${pdfFileName}"`
      );
      res.setHeader("Content-Type", "application/pdf");
      doc.y = yCoordinate;

      doc.fillColor("#1e4598").fontSize(9).text(footerText, 50);

      doc.pipe(res);

      doc.end();
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// update order status for seller
// router.put(
//   "/update-order-status/:id",

//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const order = await Order.findById(req.params.id);

//       if (!order) {
//         return next(new ErrorHandler("Order not found with this id", 400));
//       }
//       if (
//         req.body.status === "Transferred to delivery partner" &&
//         order.paymentInfo.status !== "succeeded"
//       ) {
//         order.cart.forEach(async (o) => {
//           if (o.sizes.length > 0) {
//             await updateOrderWithSizes(o._id, o.qty, o.size);
//           }
//           await updateOrder(o._id, o.qty);
//         });
//       }

//       order.status = req.body.status;

//       if (req.body.status === "Delivered") {
//         order.deliveredAt = Date.now();
//         if (order.paymentInfo.status !== "succeeded") {
//           const seller = await Shop.findById(req.body.sellerId);

//           const realTotalPrice = parseFloat(req.body.totalPricee);

//           const amountToAdd = (realTotalPrice * 0.9).toFixed(2);

//           seller.availableBalance += parseFloat(amountToAdd);

//           await seller.save();
//         }
//         order.paymentInfo.status = "succeeded";
//       }

//       await order.save({ validateBeforeSave: false });
//       res.status(200).json({
//         success: true,
//         order,
//       });

//       async function updateOrder(id, qty) {
//         const product = await Product.findById(id);

//         product.stock -= qty;
//         product.sold_out += qty;

//         await product.save({ validateBeforeSave: false });
//       }

//       async function updateOrderWithSizes(id, qty, size) {
//         const product = await Product.findById(id);

//         product.sizes.find((s) => s.name === size).stock -= qty;

//         await product.save({ validateBeforeSave: false });
//       }

//       async function updateSellerInfo(amount) {
//         const seller = await Shop.findById(req.seller.id);

//         seller.availableBalance = amount;

//         await seller.save();
//       }
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );
router.put(
  "/update-order-status/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }

      if (
        req.body.status === "Transferred to delivery partner" &&
        order.paymentInfo.status !== "succeeded"
      ) {
        order.cart.forEach(async (o) => {
          if (o.sizes.length > 0) {
            await updateOrderWithSizes(o._id, o.qty, o.size);
          }
          await updateOrder(o._id, o.qty);
        });
      }

      order.status = req.body.status;

      if (req.body.status === "Delivered") {
        order.deliveredAt = Date.now();
        if (order.paymentInfo.status !== "succeeded") {
          // Create an object to store shop totals
          const shopTotals = {};

          // Iterate through each item in the cart
          order.cart.forEach(async (o) => {
            const seller = await Shop.findById(o.sellerId);

            // Calculate the total amount for the item
            const itemTotal = parseFloat(o.totalPrice);

            // Add the item total to the shop's total
            shopTotals[o.sellerId] = (shopTotals[o.sellerId] || 0) + itemTotal;
          });

          // Iterate through the calculated totals for each shop
          for (const sellerId in shopTotals) {
            const seller = await Shop.findById(sellerId);

            // Calculate the 10% fee
            const fee = shopTotals[sellerId] * 0.1;

            // Add the remainder to the shop's availableBalance
            seller.availableBalance += shopTotals[sellerId] - fee;

            // Save the updated seller information
            await seller.save();
          }

          order.paymentInfo.status = "succeeded";
        }
      }

      await order.save({ validateBeforeSave: false });
      res.status(200).json({
        success: true,
        order,
      });

      async function updateOrder(id, qty) {
        const product = await Product.findById(id);

        product.stock -= qty;
        product.sold_out += qty;

        await product.save({ validateBeforeSave: false });
      }

      async function updateOrderWithSizes(id, qty, size) {
        const product = await Product.findById(id);

        product.sizes.find((s) => s.name === size).stock -= qty;

        await product.save({ validateBeforeSave: false });
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// give a refund ----- user
router.put(
  "/order-refund/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }

      order.status = req.body.status;

      await order.save({ validateBeforeSave: false });

      res.status(200).json({
        success: true,
        order,
        message: "Order Refund Request successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// accept the refund ---- seller
router.put(
  "/order-refund-success/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }

      order.status = req.body.status;

      await order.save();

      res.status(200).json({
        success: true,
        message: "Order Refund successfull!",
      });

      if (req.body.status === "Refund Success") {
        order.cart.forEach(async (o) => {
          await updateOrder(o._id, o.qty);
        });
      }

      async function updateOrder(id, qty) {
        const product = await Product.findById(id);

        product.stock += qty;
        product.sold_out -= qty;

        await product.save({ validateBeforeSave: false });
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// all orders --- for admin
router.get(
  "/admin-all-orders",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const orders = await Order.find().sort({
        deliveredAt: -1,
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

//admin orderdetails
router.get(
  "/get-order-details/:id",
  catchAsyncErrors(async (req, res, next) => {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    if (!order) {
      return next(new ErrorHandler("Order not found with this ID", 404));
    }

    res.status(200).json({
      success: true,
      order,
    });
  })
);

// Get a specific order by order number
// router.get(
//   "/specific-order",
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const { orderNo } = req.query;
//       const order = await Order.findOne({ orderNo });
//       if (!order) {
//         return next(new ErrorHandler("Order not found", 404));
//       }
//       res.status(200).json({
//         success: true,
//         message: "i found this order for sure!!!",
//         order,
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );
router.get(
  "/specific-order",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { orderNo } = req.query;
      const orders = await Order.find({ orderNo });

      if (orders.length === 0) {
        return next(new ErrorHandler("Order not found", 404));
      }

      if (orders.length === 1) {
        // Only one order found
        const order = orders[0];
        console.log("order", order);

        return res.status(200).json({
          success: true,
          message: "I found this order for sure!!!",
          order,
        });
      }
      console.log("orders", orders);

      // More than one order found
      res.status(200).json({
        success: true,
        message: "Multiple orders found",
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
