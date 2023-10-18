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
        totalPrice,
        paymentInfo,
        shippingPrice,
        discount,
      } = req.body;

      const shopItemsMap = new Map();

      for (const item of cart) {
        const shopId = item.shopId;
        if (!shopItemsMap.has(shopId)) {
          shopItemsMap.set(shopId, []);
        }
        shopItemsMap.get(shopId).push(item);
      }
      const shopEmailsMap = new Map();

      for (const shopId of shopItemsMap.keys()) {
        const shop = await Shop.findById(shopId);

        if (shop) {
          shopEmailsMap.set(shopId, shop.email);
        }
      }

      const orders = [];

      for (const [shopId, items] of shopItemsMap) {
        const shopEmail = shopEmailsMap.get(shopId);
        const order = await Order.create({
          cart: items,
          shippingAddress,
          user,
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
              shop.availableBalance += parseInt(amountToAdd);

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
        }

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
                                  <p>Hello ${user.name},</p>
                                  <p>
                                    We have received your order and it's being processed.
                                  </p>
                                  <h2>
                                    Order No.
                                    ${order._id
                                      .toString()
                                      .replace(/\D/g, "")
                                      .slice(0, 10)}
                                  </h2>
                                  <h4>
                                  Ordered on: (${order.createdAt
                                    .toString()
                                    .substring(0, 10)})</h4>
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
        await sendMail({
          email: user.email,
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
                                  <p>Hello ${user.name},</p>
                                  <p>
                                    We have received your order and it's being processed.
                                  </p>
                                  <h2>
                                    Order No.
                                    ${order._id
                                      .toString()
                                      .replace(/\D/g, "")
                                      .slice(0, 10)}
                                  </h2>
                                  <h4>
                                  Ordered on: (${order.createdAt
                                    .toString()
                                    .substring(0, 10)})</h4>
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
        orders.push(order);
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

// get all orders of user
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
      const pdfFileName = `receipt_${orderId}.pdf`;

      const doc = new pdf();
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${pdfFileName}"`
      );
      doc.pipe(res);

      doc.text(`Receipt for Order ID: ${orderId}`);
      doc.text("thank you for shopping with us");
      doc.text("thank you for shopping with us");
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

module.exports = router;
