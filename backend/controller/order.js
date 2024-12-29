const express = require("express");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const Order = require("../model/order");
const Aorder = require("../model/aorder");
const Shop = require("../model/shop");
const User = require("../model/user");
const Product = require("../model/product");
const Invoice = require("../model/invoice");
const sendMail = require("../utils/sendMail");
const pdf = require("pdfkit");
const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary");
const axios = require("axios");
const Expense = require("../model/expense");
const OrderCount = require("../model/numberOrders");
const aorder = require("../model/aorder");
const { log } = require("console");

const uploadsFolder = path.join(__dirname, "uploads");

// send whatsapp sms
const sendWhatsAppReceipt = async (message, session, recipients) => {
  const username = process.env.WHATSAPP_USERNAME;
  const password = process.env.WHATSAPP_PASSWORD;
  const authToken = Buffer.from(`${username}:${password}`).toString("base64");
  try {
    const response = await axios.post(
      "https://backend.payhero.co.ke/api/v2/whatspp/sendBulk",
      {
        message_type: "DOCUMENT",
        message: message,
        session: session,
        recipients: recipients,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${authToken}`, // Dynamic authorization token
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error sending WhatsApp text:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// send whatsapp sms
const sendWhatsAppText = async (message, session, phoneNumber) => {
  const username = process.env.WHATSAPP_USERNAME;
  const password = process.env.WHATSAPP_PASSWORD;
  const authToken = Buffer.from(`${username}:${password}`).toString("base64");
  try {
    const response = await axios.post(
      " https://backend.payhero.co.ke/api/v2/whatspp/sendText",
      {
        message: message,
        session: session,
        phone_number: phoneNumber,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${authToken}`, // Dynamic authorization token
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error sending WhatsApp text:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// generate receipt
const generateReceipt = async (orderNo) => {
  try {
    const lowerCaseOrderNo = orderNo.toLowerCase();
    const order = await Order.findOne({
      orderNo: new RegExp(`^${lowerCaseOrderNo}$`, "i"),
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const doc = new pdf({
      size: "Letter",
    });

    const pdfFileName = `receipt_${orderNo.replace("#", "_")}.pdf`;
    const pdfFilePath = path.join(uploadsFolder, pdfFileName);

    // Replace with your image URL
    const logoPath = path.join(__dirname, "logo.png");
    doc.image(logoPath, 15, 10, { width: 200, height: 125 });

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("NinetyOne", 220, 30)
      .fontSize(10)
      .text("Nairobi City, Kenya", 220, 55)
      .text("www.ninetyone.co.ke", 220, 70)
      .text("contact@ninetyone.co.ke", 220, 85)
      .text("+254751667713", 220, 100);

    doc.font("Helvetica-Bold").fontSize(15).text("RECEIPT", 430, 30);

    doc
      .font("Helvetica")
      .fontSize(10)
      .text("Receipt No:", 430, 55)
      .text(`${order.orderNo}`, 430, 70)
      .text("Payment Status:", 430, 85)
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(
        `${order.paymentInfo.status === "succeeded" ? "Paid" : "Not Paid"}`,
        430,
        100
      );

    const userEmail = order.user.email || order.user.guestEmail || "";
    const userName = order.user.name || order.user.guestName || "";

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("BILL TO", 50, 140)
      .font("Helvetica")
      .fontSize(10)
      .text(`${userEmail}`, 50, 155)
      .text(`${userName}`, 50, 170)
      .text(
        `${order.shippingAddress.zipCode},${order.shippingAddress.country},${order.shippingAddress.city}`,
        50,
        185
      )
      .text(`${order.user.phoneNumber}`, 50, 200);

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("SHIP TO", 300, 140)
      .font("Helvetica")
      .fontSize(10)
      .text(`${order.shippingAddress.address1}`, 300, 155)
      .text(`${order.shippingAddress.zipCode}`, 300, 170)
      .text(`${order.shippingAddress.city}`, 300, 185)
      .text(`${order.user.phoneNumber}`, 300, 200);

    // Table header
    doc.moveTo(50, 250).lineTo(550, 250).stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("DESCRIPTION", 50, 255)
      .text("QTY", 300, 255)
      .text("UNIT PRICE", 400, 255)
      .text("TOTAL", 500, 255);

    // Table body
    let y = 270; // Starting position for table body

    order.cart.forEach((item) => {
      // Check if we need to add a new page
      if (y > 700) {
        // Adjust 700 based on your bottom margin
        doc.addPage();
        y = 50; // Reset y for the new page

        // Redraw table header on the new page
        doc.moveTo(50, y).lineTo(550, y).stroke();
        y += 5;

        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .text("DESCRIPTION", 50, y)
          .text("QTY", 300, y)
          .text("UNIT PRICE", 400, y)
          .text("TOTAL", 500, y);
        y += 15;
      }

      // Truncate item name if it's too long
      const truncatedName =
        item.name.length > 25 ? item.name.slice(0, 25) + "..." : item.name;

      // Print item details
      doc
        .font("Helvetica")
        .fontSize(10)
        .text(truncatedName, 50, y)
        .text(item.qty, 300, y)
        .text(item.discountPrice.toFixed(2), 400, y)
        .text((item.discountPrice * item.qty).toFixed(2), 500, y);

      y += 15;
    });

    // Total section
    const subtotal = order.cart.reduce(
      (acc, item) => acc + item.discountPrice * item.qty,
      0
    );
    const discount = order.discount ?? 0;
    const disc = order.discount ?? 0;

    const shippingPrice = order.totalPrice - disc - subtotal;
    const totalPrice = subtotal - discount + shippingPrice;

    doc
      .moveTo(50, y + 20)
      .lineTo(550, y + 20)
      .stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("SUBTOTAL", 400, y + 30)
      .text(subtotal.toFixed(2), 500, y + 30);

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("DISCOUNT", 400, y + 45)
      .text(discount.toFixed(2), 505, y + 45);

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("SUBTOTAL", 400, y + 60)
      .text(subtotal.toFixed(2), 500, y + 60);

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("SHIPPING", 400, y + 75)
      .text(shippingPrice.toFixed(2), 505, y + 75);

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("TOTAL ", 400, y + 90)
      .text(`${order.totalPrice}`, 500, y + 90);

    doc
      .moveTo(50, y + 125)
      .lineTo(550, y + 125)
      .stroke();

    doc
      .font("Helvetica")
      .fontSize(10)
      .text("Thank you for your business!", 50, y + 160);

    doc
      .font("Helvetica")
      .fontSize(8)
      .text("Notes:", 50, y + 180)
      .text(`Payment method used,${order.paymentInfo.type} `, 50, y + 190)
      .text(
        "Nb: This is a computer generated receipt and therefore not signed. It is valid and issued by ninetyone.co.ke",
        50,
        y + 200
      );

    // Write the PDF file and wait for completion
    await new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(pdfFilePath);
      doc.pipe(writeStream);

      writeStream.on("finish", () => {
        console.log(`Receipt generated successfully at: ${pdfFilePath}`);
        resolve();
      });

      writeStream.on("error", (err) => {
        console.error("Error writing PDF:", err);
        reject(err);
      });

      doc.end();
    });

    return pdfFilePath;
  } catch (error) {
    console.error("Error generating receipt:", error);
    return null;
  }
};

// check the cart
router.post(
  "/check-stock",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { cartItems } = req.body; // cartItems is an array of items from the cart
      let outOfStockItems = [];

      // Iterate through each item in the cart
      for (const [index, item] of cartItems.entries()) {
        const selectedSize = item.size;
        const quantity = item.qty;

        // Fetch the product from the database by its ID
        const product = await Product.findById(item._id);

        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Product with ID ${item._id} not found.`,
          });
        }

        // Find the matching size in the product's sizes array
        const sizeInfo = product.sizes.find((s) => s.name === selectedSize);

        if (!sizeInfo || sizeInfo.stock < quantity) {
          outOfStockItems.push({
            index,
            itemId: item._id,
          });
        }
      }

      // If all items are in stock
      if (outOfStockItems.length === 0) {
        res.status(200).json({
          success: true,
        });
      } else {
        // Some items are out of stock
        res.status(200).json({
          success: false,
          outOfStockItems, // Send back the out-of-stock items
          message: "Some items are out of stock or don't have enough stock.",
        });
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

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
        discShop,
        referee,
        balance,
      } = req.body;

      // Check if order with the same order number already exists
      const existingOrder = await Order.findOne({ orderNo });

      if (existingOrder) {
        return res.status(400).json({
          success: false,
          message: "Order with the same order number already exists.",
        });
      }

      if (user._id) {
        const userr = await User.findById(user._id);
        console.log(user._id);

        if (userr) {
          userr.availableBalance -= balance;
          await userr.save();
          console.log(userr);
          console.log("Balance updated successfully.");
        } else {
          console.log("User not found.");
        }
      } else {
        console.log("User ID is not defined.");
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
        product.stock -= qty;
        product.sold_out += qty;
        await product.save({ validateBeforeSave: false });
      }

      if (discShop && discount) {
        const shopWithDiscount = await Shop.findById(discShop);

        if (!shopWithDiscount) {
          console.error(`Shop with ID ${discShop} not found.`);
        } else {
          shopWithDiscount.availableBalance -= discount;
          await shopWithDiscount.save();
        }
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
            if (referee && referee.trim() !== "") {
              const refereeUser = await User.findById(referee);
              if (refereeUser) {
                if (
                  (paymentInfo.type === "Mpesa" ||
                    paymentInfo.type === "Paypal") &&
                  paymentInfo.status === "succeeded"
                ) {
                  refereeUser.availableBalance += Math.round(subTotals * 0.02);

                  await refereeUser.save();
                }
              } else {
                console.error(`User with ID ${referee} not found.`);
              }
            } else {
              console.log("No valid referee provided.");
            }

            await shop.save();
          }
        } catch (error) {
          console.error(
            `Error updating availableBalance for shop ${shopId}: ${error}`
          );
          // Handle other errors if needed
        }
      });

      await Promise.all(promises);

      if (
        (paymentInfo.type === "Mpesa" || paymentInfo.type === "Paypal") &&
        paymentInfo.status === "succeeded"
      ) {
        const stockUpdatePromises = cart.map(async (item) => {
          if (item.size && item.size !== "") {
            await updateOrderWithSizes(item._id, item.qty, item.size);
          } else {
            await updateOrder(item._id, item.qty);
          }
        });

        // Await all stock updates to complete
        await Promise.all(stockUpdatePromises);
      }

      const order = await Order.create({
        cart,
        shippingAddress,
        user,
        orderNo,
        totalPrice,
        paymentInfo,
        shippingPrice,
        discount,
        discShop,
        referee,
        balance,
      });

      console.log(order);

      // Create invoices for each item in the cart
      const invoicePromises = order.cart.map(async (item) => {
        const paidStatus = order.paymentInfo.status === "succeeded";
        const paidAtDate = paidStatus ? new Date() : null;

        const invoice = await Invoice.create({
          receiptNo: order.orderNo,
          amount: item.discountPrice * item.qty,
          purpose: `Purchase of ${item.name}`,
          paid: {
            status: paidStatus,
            paidAt: paidAtDate,
          },
          shopId: item.shopId,
        });
        return invoice;
      });

      if (order.shippingPrice && order.shippingPrice > 0) {
        const paidStatus = order.paymentInfo.status === "succeeded";
        const paidAtDate = paidStatus ? new Date() : null;

        const shippingInvoice = await Invoice.create({
          receiptNo: order.orderNo,
          amount: order.shippingPrice,
          purpose: "Shipping Fee",
          paid: {
            status: paidStatus,
            paidAt: paidAtDate,
          },
          shopId: "logistics",
        });
        invoicePromises.push(shippingInvoice);
      }
      // Create expense if discount is not null
      if (order.discount != null && order.discount > 0) {
        const paidStatus = order.paymentInfo.status === "succeeded";
        const paidAtDate = paidStatus ? new Date() : null;

        const discountExpense = await Expense.create({
          receiptNo: order.orderNo,
          amount: order.discount,
          purpose: "Discount",
          paid: {
            status: paidStatus,
            paidAt: paidAtDate,
          },
          shopId: order.discShop,
        });

        invoicePromises.push(discountExpense);
      }

      await Promise.all(invoicePromises);
      // Increment the order count
      await OrderCount.updateOne(
        {},
        { $inc: { totalOrders: 1 } },
        { upsert: true }
      );

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

// Create a new expense
router.post("/expense", async (req, res) => {
  try {
    const newExpense = new Expense(req.body);
    const savedExpense = await newExpense.save();
    res.status(201).json(savedExpense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// send my order
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

            if (shopPhoneNumber.startsWith("254")) {
              shopPhoneNumber = "0" + shopPhoneNumber.slice(3); // Remove "2547" and replace with "07"
            } else if (!shopPhoneNumber.startsWith("0")) {
              console.error(
                "Invalid phone number: must start with '07' or '2547'."
              );
            }

            // Sending SMS
            sendWhatsAppText(
              `Hello ${shopName}, You have a new order \n Order Number:${order.orderNo}\n click on the link below to check https://ninetyone.co.ke/dashboard-orders`,
              process.env.WHATSAPP_SESSION,
              shopPhoneNumber
            );
          }
        } catch (error) {
          console.error(
            `Error fetching shop details for shopId ${shopId}: ${error}`
          );
        }
      }
      function formatPhoneNumber(phoneNumber) {
        if (!phoneNumber || typeof phoneNumber !== "string") {
          throw new Error("Invalid phone number: must be a non-empty string.");
        }

        if (phoneNumber.startsWith("0")) {
          return phoneNumber;
        } else if (phoneNumber.startsWith("254")) {
          return "0" + phoneNumber.slice(3);
        } else if (phoneNumber.startsWith("7") || phoneNumber.startsWith("1")) {
          return "0" + phoneNumber;
        } else {
          throw new Error(
            "Invalid phone number: must start with '0', '254', '7', or '1'."
          );
        }
      }
      const number = formatPhoneNumber(order.user.phoneNumber);
      const userName = order.user.name || order.user.guestName;

      sendWhatsAppText(
        `Hello ${userName}, You've received and are processing ypuur order\n Order Number:${order.orderNo}\n click on the link below to track order and download your receipt using the order number https://www.ninetyone.co.ke/searchorder`,
        process.env.WHATSAPP_SESSION,
        number
      );

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
      const orders = await Aorder.find({
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
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      const orderNo = order.orderNo;
      const doc = new pdf({ size: "Letter" });

      const pdfFileName = `receipt_${encodeURIComponent(orderNo)}.pdf`;
      const pdfFilePath = path.join(__dirname, pdfFileName);

      const logoPath = path.join(__dirname, "logo.png");
      doc.image(logoPath, 15, 10, { width: 200, height: 125 });

      doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .text("NinetyOne", 220, 30)
        .fontSize(10)
        .text("Nairobi City, Kenya", 220, 55)
        .text("www.ninetyone.co.ke", 220, 70)
        .text("contact@ninetyone.co.ke", 220, 85)
        .text("+254751667713", 220, 100);

      doc.font("Helvetica-Bold").fontSize(15).text("RECEIPT", 430, 30);

      doc
        .font("Helvetica")
        .fontSize(10)
        .text("Receipt No:", 430, 55)
        .text(`${order.orderNo}`, 430, 70)
        .text("Payment Status:", 430, 85)
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(
          `${order.paymentInfo.status === "succeeded" ? "Paid" : "Not Paid"}`,
          430,
          100
        );

      const userEmail = order.user.email || order.user.guestEmail || "";
      const userName = order.user.name || order.user.guestName || "";

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("BILL TO", 50, 140)
        .font("Helvetica")
        .fontSize(10)
        .text(`${userEmail}`, 50, 155)
        .text(`${userName}`, 50, 170)
        .text(
          `${order.shippingAddress.zipCode}, ${order.shippingAddress.country}, ${order.shippingAddress.city}`,
          50,
          185
        )
        .text(`${order.user.phoneNumber}`, 50, 200);

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("SHIP TO", 300, 140)
        .font("Helvetica")
        .fontSize(10)
        .text(`${order.shippingAddress.address1}`, 300, 155)
        .text(`${order.shippingAddress.zipCode}`, 300, 170)
        .text(`${order.shippingAddress.city}`, 300, 185)
        .text(`${order.user.phoneNumber}`, 300, 200);

      // Table header
      doc.moveTo(50, 250).lineTo(550, 250).stroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("DESCRIPTION", 50, 255)
        .text("QTY", 300, 255)
        .text("UNIT PRICE", 400, 255)
        .text("TOTAL", 500, 255);

      // Table body
      let y = 270; // Starting position for table body

      order.cart.forEach((item) => {
        // Check if we need to add a new page
        if (y > 700) {
          // Adjust 700 based on your bottom margin
          doc.addPage();
          y = 50; // Reset y for the new page

          // Redraw table header on the new page
          doc.moveTo(50, y).lineTo(550, y).stroke();
          y += 5;

          doc
            .font("Helvetica-Bold")
            .fontSize(10)
            .text("DESCRIPTION", 50, y)
            .text("QTY", 300, y)
            .text("UNIT PRICE", 400, y)
            .text("TOTAL", 500, y);
          y += 15;
        }

        // Truncate item name if it's too long
        const truncatedName =
          item.name.length > 25 ? item.name.slice(0, 25) + "..." : item.name;

        // Print item details
        doc
          .font("Helvetica")
          .fontSize(10)
          .text(truncatedName, 50, y)
          .text(item.qty, 300, y)
          .text(item.discountPrice.toFixed(2), 400, y)
          .text((item.discountPrice * item.qty).toFixed(2), 500, y);

        y += 15;
      });

      // Total section
      const subtotal = order.cart.reduce(
        (acc, item) => acc + item.discountPrice * item.qty,
        0
      );
      const discount = order.discount ?? 0;
      const disc = order.discount ?? 0;

      const shippingPrice = order.totalPrice - disc - subtotal;
      const totalPrice = subtotal - discount + shippingPrice;
      doc
        .moveTo(50, y + 20)
        .lineTo(550, y + 20)
        .stroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("SUBTOTAL", 400, y + 30)
        .text(subtotal.toFixed(2), 500, y + 30);

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("DISCOUNT", 400, y + 45)
        .text(discount.toFixed(2), 505, y + 45);

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("SUBTOTAL", 400, y + 60)
        .text(subtotal.toFixed(2), 500, y + 60);

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("SHIPPING", 400, y + 75)
        .text(shippingPrice.toFixed(2), 505, y + 75);

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("TOTAL ", 400, y + 90)
        .text(`${order.totalPrice}`, 500, y + 90);
      doc
        .moveTo(50, y + 125)
        .lineTo(550, y + 125)
        .stroke();

      doc
        .font("Helvetica")
        .fontSize(10)
        .text("Thank you for your business!", 50, y + 160);

      doc
        .font("Helvetica")
        .fontSize(8)
        .text("Notes:", 50, y + 180)
        .text(`Payment method used, ${order.paymentInfo.type} `, 50, y + 190)
        .text(
          "Nb: This is a computer generated receipt and therefore not signed. It is valid and issued by ninetyone.co.ke",
          50,
          y + 200
        );

      // Set the response headers for the PDF
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdfFileName}"`,
      });

      doc.pipe(res);
      doc.end();
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// update order status for seller

router.put(
  "/update-order-status/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }
      const relatedOrders = await Aorder.find({ orderNo: order.orderNo });
      if (relatedOrders.length === 0) {
        return next(new ErrorHandler("No related orders found", 400));
      }

      for (const relOrder of relatedOrders) {
        relOrder.status = req.body.status;

        if (req.body.status === "Delivered") {
          relOrder.deliveredAt = Date.now();
        }
        await relOrder.save({ validateBeforeSave: false });
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

      if (
        req.body.status === "Transferred to delivery partner" &&
        order.paymentInfo.status !== "succeeded"
      ) {
        for (const o of order.cart) {
          if (o.sizes.length > 0) {
            await updateOrderWithSizes(o._id, o.qty, o.size);
          }
          await updateOrder(o._id, o.qty);
        }
      }

      order.status = req.body.status;
      const userName = order.user.name || order.user.guestName;
      const collectionPoint =
        order.shippingAddress.city === "Self Pickup"
          ? "NinetyOne, Kahawa Shukari, Baringo Road"
          : order.shippingAddress.city;
      if (req.body.status === "On the way") {
        sendWhatsAppText(
          `Hello ${userName},\n
          Your order ${order.orderNo} is ready for collection.\n
          Collection point: ${collectionPoint}\n`,
          process.env.WHATSAPP_SESSION,
          order.user.phoneNumber
        );
      }

      if (req.body.status === "Delivered") {
        order.deliveredAt = Date.now();
        try {
          if (order.referee && order.referee.trim() !== "") {
            const user = await User.findById(order.referee);

            const cash =
              (order.totalPrice - order.discount - order.shippingPrice) * 0.02;

            if (user) {
              user.availableBalance += cash;
              console.log(user.availableBalance);
              console.log("Cash is", cash);
              await user.save();
            } else {
              console.error(`User with ID ${order.referee} not found.`);
            }
          } else {
            console.error("Order referee is an empty string.");
          }
        } catch (error) {
          console.error(
            `Error updating availableBalance for user ${order.referee}: ${error}`
          );
        }
        if (order.paymentInfo.status !== "succeeded") {
          let shopTotals = {};

          for (const o of order.cart) {
            const seller = await Shop.findById(o.shopId);

            // Calculate itemTotal using discountPrice if available, otherwise use originalPrice
            const itemTotal =
              parseFloat(o.discountPrice) || parseFloat(o.originalPrice) || 0;
            if (!isNaN(itemTotal)) {
              shopTotals[o.shopId] = (shopTotals[o.shopId] || 0) + itemTotal;
            }
          }

          for (const sellerId in shopTotals) {
            const seller = await Shop.findById(sellerId);

            const fee = shopTotals[sellerId] * 0.1;

            seller.availableBalance += shopTotals[sellerId] - fee;
            await seller.save();
          }

          order.paymentInfo.status = "succeeded";
          const orderNo = order.orderNo;
          const invoices = await Invoice.find({
            receiptNo: orderNo,
            "paid.status": false,
          });
          const expenses = await Expense.find({
            receiptNo: orderNo,
            "paid.status": false,
          });

          for (const invoice of invoices) {
            invoice.paid.status = true;
            invoice.paid.paidAt = new Date();
            await invoice.save();
          }
          for (const expense of expenses) {
            expense.paid.status = true;
            expense.paid.paidAt = new Date();
            await expense.save();
          }
        }
      }
      await order.save({ validateBeforeSave: false });
      res.status(200).json({
        success: true,
        order,
      });
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
      let { orderNo } = req.query;

      if (!orderNo) {
        return next(new ErrorHandler("Order number is required", 400));
      }

      // Ensure the query starts with '#' if not already present
      if (!orderNo.startsWith("#")) {
        orderNo = `#${orderNo}`;
      }

      // Find the order using a regex to allow case-insensitive matching
      const orders = await Order.find({
        orderNo: { $regex: new RegExp(`^${orderNo}$`, "i") },
      });

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
