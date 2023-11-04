const express = require("express");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const Order = require("../model/order");
const Shop = require("../model/shop");
const Product = require("../model/product");
const sendMail = require("../utils/sendMail");
const pdf = require("pdfkit");
const fs = require("fs");
const path = require("path"); //
const cloudinary = require("cloudinary");

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

      const shopItemsMap = new Map();
      const shopEmailsMap = new Map();

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

      const orders = [];

      for (const [shopId, items] of shopItemsMap) {
        const shopEmail = shopEmailsMap.get(shopId);

        // Create a single order with all items from the same shop
        const order = await Order.create({
          cart: items,
          shippingAddress,
          user,
          orderNo,
          totalPrice,
          paymentInfo,
          shippingPrice,
          discount,
        });
        const subTotals = order?.cart.reduce(
          (acc, item) => acc + item.qty * item.discountPrice,
          0
        );

        if (order.paymentInfo.status === "succeeded") {
          try {
            const shop = await Shop.findById(shopId);

            if (!shop) {
              console.error(`Shop with ID ${shopId} not found.`);
            } else {
              const amountToAdd = (subTotals * 0.9).toFixed(2);
              // const amountToAdd2 = (subTotals * 0.1).toFixed(2);
              shop.availableBalance += parseInt(amountToAdd);
              // user.admin.availableBalance += parseInt(amountToAdd2);

              await shop.save();
            }
            order.cart.forEach(async (o) => {
              if (o.sizes.length > 0) {
                await updateOrderWithSizes(o._id, o.qty, o.size);
              }
              await updateOrder(o._id, o.qty);
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
            console.error(
              `Error updating availableBalance for shop ${shopId}: ${error}`
            );
          }
          orders.push(order);
        }
      }

      res.status(201).json({
        success: true,
        orders,
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
      const subTotals = order?.cart.reduce(
        (acc, item) => acc + item.qty * item.discountPrice,
        0
      );
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

      for (const [shopId, items] of shopItemsMap) {
        const shopEmail = shopEmailsMap.get(shopId);

        await sendMail({
          email: shopEmail,
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
                      style="height: 80px; width: 80px;"
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
                                    user.name || user.guestName
                                  }---- for seller,</p>
                                  <p>
                                    We have received your order and it's being processed.
                                  </p>
                                  <h2>
                                    Order No.
                                    ${order.orderNo}
                                  </h2>
                                  <h4>
                                  Ordered on: (to do)</h4>
                                  <table>
                                    <thead>
                                      <tr>
                                      <td style="padding-right: 5px;"><strong>Product(s)</strong></td>
                                      <td style="padding-right: 5px;"><strong>Quantity</strong></td>
                                      <td style="text-align: right;"><strong align="right">Price</strong></td>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      ${items
                                        .map(
                                          (item) => `
                                      <tr style="border: 1px solid #000; border-radius: 5px; margin-bottom: 5px;">
                                      <td style="display: flex;" align="start">
                                      <img src="cid:${item.images[0].url}" 
                                      style="height: 80px; width: 80px; margin-right: 5px"/>
                                      ${item.name}  <br/> ${
                                            item.size
                                              ? `Size: ${item.size}`
                                              : ""
                                          }
                                     </td>
                                        <td align="center">${item.qty}</td>
                                        <td align="right">${item.discountPrice
                                          .toString()
                                          .replace(
                                            /\B(?=(\d{3})+(?!\d))/g,
                                            ","
                                          )}
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
                                          order?.shippingPrice &&
                                          order?.shippingPrice
                                            .toString()
                                            .replace(
                                              /\B(?=(\d{3})+(?!\d))/g,
                                              ","
                                            )
                                        }</td>
                                      </tr>
                                      <tr>
                                        <td colspan="2">Discount: </td>
                                        <td align="right">Ksh. ${
                                          order?.discount
                                            ? order?.discount
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
                                        <td align="right">${
                                          paymentInfo.type
                                        }</td>
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
                                    ${shippingAddress.address1},<br />
                                    ${shippingAddress.address2},<br />
                                    ${shippingAddress.zipCode},<br />
                                    ${shippingAddress.city},<br />
                                    ${shippingAddress.country}<br />
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
                              Don't like receiving <b>eShop</b> emails?
                              <a
                                href="http://localhost:3000/unsubscribe"
                                style="
                                  text-decoration: underline;
                                  color: #999999;
                                  font-size: 12px;
                                  text-align: center;
                                "
                                >Unsubscribe</a
                              >.
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
                    style="height: 80px; width: 80px;"
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
                                }, --- for user</p>
                                <p>
                                  We have received your order and it's being processed.
                                </p>
                                <h2>
                                  Order No.
                                  ${order.orderNo}
                                </h2>
                                <h4>
                                Ordered on: (to do)</h4>
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
                                        order?.shippingPrice &&
                                        order?.shippingPrice
                                          .toString()
                                          .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                      }</td>
                                    </tr>
                                    <tr>
                                      <td colspan="2">Discount: </td>
                                      <td align="right">Ksh. ${
                                        order?.discount
                                          ? order?.discount
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
                                  ${shippingAddress.address1},<br />
                                  ${shippingAddress.address2},<br />
                                  ${shippingAddress.zipCode},<br />
                                  ${shippingAddress.city},<br />
                                  ${shippingAddress.country}<br />
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
                            Don't like receiving <b>eShop</b> emails?
                            <a
                              href="http://localhost:3000/unsubscribe"
                              style="
                                text-decoration: underline;
                                color: #999999;
                                font-size: 12px;
                                text-align: center;
                              "
                              >Unsubscribe</a
                            >.
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
      const orderTime = order.createdAt.toLocaleTimeString("en-US", {
        timeStyle: "short",
      });

      console.log(order);
      const footerText =
        "Nb: This is a computer generated receipt and therefore not signed. It is valid and issued by ninetyone.co.ke";

      const pdfFileName = `receipt_${orderId}.pdf`;

      const doc = new pdf({
        size: "A4",
      });
      const pageHeight = doc.page.height;

      const fontSize = 10;

      const yCoordinate = pageHeight - fontSize - 10;

      // Replace with your image URL

      doc.image(
        "data:image/jpeg;base64,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",
        50,
        20,
        { width: 90, height: 100 }
      );

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
      doc.text(`${orderTime}`, 150, doc.y);
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
            ? item.name.substring(0, 25) + "..."
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
        .text(`Ksh ${order.discount === null ? 0 : order.discount}`, {
          align: "right",
        });

      // Set the response headers for the PDF
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${pdfFileName}"`
      );
      res.setHeader("Content-Type", "application/pdf");

      doc.pipe(res);

      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fillColor("#1e4598").fontSize(9).text(footerText, 50, 750);
      }

      doc.end();
      // Stream the PDF to Cloudinary
      const stream = cloudinary.v2.uploader.upload_stream((result) => {
        if (result && result.secure_url) {
          // The result variable contains the public URL of the uploaded PDF
          const pdfUrl = result.secure_url;

          // Send the URL to the client for download
          res.json({
            success: true,
            message: "PDF generated successfully",
            pdfUrl,
          });

          if (result.public_id) {
            // Delete the PDF from Cloudinary after sending the response
            cloudinary.v2.uploader.destroy(
              result.public_id,
              (error, deleteResult) => {
                if (error) {
                  console.error("Error deleting PDF from Cloudinary:", error);
                } else {
                  console.log(
                    "PDF deleted from Cloudinary:",
                    deleteResult.result
                  );
                }
              }
            );
          }
        } else {
          console.error("Cloudinary upload failed: ", result);
          res.json({
            success: false,
            message: "PDF upload to Cloudinary failed",
          });
        }
      });

      // Pipe the PDF content to Cloudinary
      doc.pipe(stream);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// update order status for seller
router.put(
  "/update-order-status/:id",
  isSeller,
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
          const seller = await Shop.findById(req.body.sellerId);

          const realTotalPrice = parseFloat(req.body.totalPricee);

          const amountToAdd = (realTotalPrice * 0.9).toFixed(2);

          seller.availableBalance += parseFloat(amountToAdd);

          await seller.save();
        }
        order.paymentInfo.status = "succeeded";
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

      // async function updateSellerInfo(amount) {
      //   const seller = await Shop.findById(req.seller.id);

      //   seller.availableBalance = amount;

      //   await seller.save();
      // }
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

module.exports = router;
