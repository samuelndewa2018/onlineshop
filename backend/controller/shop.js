const express = require("express");
const path = require("path");
const router = express.Router();
const fs = require("fs");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const sendToken = require("../utils/jwtToken");
const crypto = require("crypto");
const Shop = require("../model/shop");
const Otp = require("../model/otp");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");
const sendShopToken = require("../utils/shopToken");
const shop = require("../model/shop");
const bcrypt = require("bcrypt");
const cloudinary = require("cloudinary");
import { v4 as uuidv4 } from "uuid";
const sendOtp = require("../utils/sendVerify");

// middlewares
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
// create and send otp
const generateAndSendOtp = async (user) => {
  try {
    let otp, hashedOtp;

    // Loop until a unique OTP is generated
    do {
      // Generate a 6-digit OTP
      const randomPart = uuidv4().slice(0, 6);
      otp = randomPart.replace(/-/g, "").slice(0, 6);

      const saltRounds = process.env.SALT_ROUNDS || 10;

      // Hash the OTP
      hashedOtp = await bcrypt.hash(otp, saltRounds);

      // Check if the OTP already exists in the database
      const existingOtp = await Otp.findOne({ otp: hashedOtp });
      if (!existingOtp) break; // Exit loop if the OTP is unique
    } while (true);

    const message = `Your OTP is ${otp}. It is valid for 60 secs.`;

    // Save the OTP to the database
    const newOtp = new Otp({
      userId: user.userId,
      otp: hashedOtp,
      createdAt: new Date(),
      expireAt: new Date(new Date().getTime() + 60 * 1000),
    });
    await newOtp.save();

    // Send OTP via WhatsApp
    await sendWhatsAppText(
      message,
      process.env.WHATSAPP_SESSION,
      user.phoneNumber
    );

    // Send OTP via Email
    await sendOtp({
      email: user.email,
      otp: otp,
      subject: "Your Verification Code",
    });

    return { success: true, message: "OTP sent successfully" };
  } catch (error) {
    console.error("Error generating and sending OTP:", error);
    throw new Error("Failed to generate and send OTP");
  }
};

// create shop
router.post(
  "/create-shop",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, name, phoneNumber, country } = req.body;
      const sellerEmail = await Shop.findOne({ email });
      if (sellerEmail) {
        return next(new ErrorHandler("User already exists", 400));
      }
      const existingShop = await Shop.findOne({ name });
      if (existingShop) {
        return next(new ErrorHandler("Shop name already exists", 400));
      }
      // Check if a shop with the given phone number exists
      const existingPhoneNumber = await Shop.findOne({ phoneNumber });
      if (existingPhoneNumber) {
        return next(new ErrorHandler("Phone number already in use", 400));
      }
      const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
      });

      const seller = {
        name: req.body.name,
        email: email,
        password: req.body.password,
        country: country,
        avatar: {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        },
        // address: req.body.address,
        phoneNumber: req.body.phoneNumber,
        instaShop: req.body.instaShop,
      };

      const activationToken = createActivationToken(seller);

      const activationUrl = `https://ninetyone.co.ke/seller/activation/${activationToken}`;

      try {
        await sendMail({
          email: seller.email,
          subject: "Activate your Shop",
          html: `<!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
              <title>Simple Transactional Email</title>
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
                                  <p
                                    style="
                                      font-family: sans-serif;
                                      font-size: 14px;
                                      font-weight: normal;
                                      margin: 0;
                                      margin-bottom: 15px;
                                    "
                                  >
                                    Hello ${seller.name},
                                  </p>
                                  <p
                                    style="
                                      font-family: sans-serif;
                                      font-size: 14px;
                                      font-weight: normal;
                                      margin: 0;
                                      margin-bottom: 15px;
                                    "
                                  >
                                    Welcome to <b>eShop</b>. Click the button below to activate your account.<br />
                                    <br/>
                                  </p>
                                  <table
                                    role="presentation"
                                    border="0"
                                    cellpadding="0"
                                    cellspacing="0"
                                    class="btn btn-primary"
                                    style="
                                      border-collapse: separate;
                                      mso-table-lspace: 0pt;
                                      mso-table-rspace: 0pt;
                                      box-sizing: border-box;
                                      width: 100%;
                                    "
                                    width="100%"
                                  >
                                    <tbody>
                                      <tr>
                                        <td
                                          align="left"
                                          style="
                                            font-family: sans-serif;
                                            font-size: 14px;
                                            vertical-align: top;
                                            padding-bottom: 15px;
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
                                              width: auto;
                                            "
                                          >
                                            <tbody>
                                              <tr>
                                                <td
                                                  style="
                                                    font-family: sans-serif;
                                                    font-size: 14px;
                                                    vertical-align: top;
                                                    border-radius: 5px;
                                                    text-align: center;
                                                    background-color: #3498db;
                                                  "
                                                  valign="top"
                                                  align="center"
                                                  bgcolor="#3498db"
                                                >
                                                  <a
                                                    href=${activationUrl}
                                                    target="_blank"
                                                    style="
                                                      border: solid 1px #3126c9;
                                                      border-radius: 5px;
                                                      box-sizing: border-box;
                                                      cursor: pointer;
                                                      display: inline-block;
                                                      font-size: 14px;
                                                      font-weight: bold;
                                                      margin: 0;
                                                      padding: 12px 25px;
                                                      text-decoration: none;
                                                      text-transform: capitalize;
                                                      background-color: #2b1ebb;
                                                      border-color: #3114a5;
                                                      color: #ffffff;
                                                    "
                                                    >Click Here to Activate your Account</a
                                                  >
                                                </td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                  <p
                                    style="
                                      font-family: sans-serif;
                                      font-size: 14px;
                                      font-weight: normal;
                                      margin: 0;
                                      margin-bottom: 15px;
                                    "
                                  >
                                    <b>eShop</b> only contacts you through 0712012113 or email threedoltscommunications@gmail.com
                                  </p>
                                  <p
                                    style="
                                      font-family: sans-serif;
                                      font-size: 14px;
                                      font-weight: normal;
                                      margin: 0;
                                      margin-bottom: 15px;
                                    "
                                  >
                                    Asante Sana! Karibu Tena.
                                  </p>
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
                                href="https://ninetyone.co.ke/unsubscribe"
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
                                href=""
                                style="
                                  color: #999999;
                                  font-size: 12px;
                                  text-align: center;
                                  text-decoration: none;
                                "
                                >&copy; ${new Date().getFullYear()} eShop. All rights reserved.</a
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
          attachments: [
            {
              filename: "logo.png",
              path: "https://res.cloudinary.com/bramuels/image/upload/v1695878268/logo/LOGO-01_moo9oc.png",
              cid: "logo",
            },
          ],
        });
        res.status(201).json({
          success: true,
          message: `please check your email:- ${seller.email} to activate your shop!`,
        });
      } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// create activation token
const createActivationToken = (seller) => {
  return jwt.sign(seller, process.env.ACTIVATION_SECRET, {
    expiresIn: "10m",
  });
};

// activate user
router.post(
  "/activation",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { activation_token } = req.body;

      const newSeller = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET
      );

      if (!newSeller) {
        return next(new ErrorHandler("Invalid token", 400));
      }
      const { name, email, password, avatar, phoneNumber, instaShop } =
        newSeller;

      let seller = await Shop.findOne({ email });

      if (seller) {
        return next(new ErrorHandler("User already exists", 400));
      }

      seller = await Shop.create({
        name,
        email,
        avatar,
        password,
        instaShop,
        // address,
        phoneNumber,
      });

      sendShopToken(seller, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// login shop
router.post(
  "/login-shop",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return next(new ErrorHandler("Please provide the all fields!", 400));
      }

      const user = await Shop.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("User doesn't exists!", 400));
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
      }

      sendShopToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// create otp for login
router.post(
  "/create-otp",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const userOtps = await Otp.find({
        expireAt: { $lt: new Date() },
      });
      for (const userOtp of userOtps) {
        await Otp.deleteOne({ _id: userOtp._id });
      }
      const { phoneNumber } = req.body;
      const user = await Shop.findOne({ phoneNumber: phoneNumber });
      if (!user) {
        return next(new ErrorHandler("User doesn't exists!", 400));
      }

      await generateAndSendOtp({ user });

      res.status(201).json({
        success: true,
        message: "OTP sent successfully check your whatsapp & email!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// resend otp
router.post(
  "/resend-otp",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const userOtps = await Otp.find({
        expireAt: { $lt: new Date() },
      });
      for (const userOtp of userOtps) {
        await Otp.deleteOne({ _id: userOtp._id });
      }
      const { phoneNumber } = req.body;
      const user = await Shop.findOne({ phoneNumber });
      if (!user) {
        return next(new ErrorHandler("User doesn't exists!", 400));
      }

      await generateAndSendOtp({ user });

      res.status(201).json({
        success: true,
        message: "OTP sent successfully check your whatsapp & email!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// login_otp
router.post(
  "/login-otp",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { otp } = req.body;
      let hashedOtp;

      const saltRounds = process.env.SALT_ROUNDS || 10;

      // Hash the OTP
      hashedOtp = await bcrypt.hash(otp, saltRounds);

      if (!otp) {
        return res.status(400).send("OTP is required");
      }
      // Find all OTPs for the user that have not expired
      const shop = await Otp.findOne({
        otp: hashedOtp,
        expireAt: { $gt: new Date() },
      });

      if (!shop || shop.length === 0) {
        return res.status(404).send("No valid OTP found for the user");
      }
      const userId = shop.userId;
      const user = await Shop.findById({ userId });

      if (!user) {
        return next(new ErrorHandler("User doesn't exists!", 400));
      }

      sendShopToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// load shop
router.get(
  "/getSeller",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await Shop.findById(req.seller._id);

      if (!seller) {
        return next(new ErrorHandler("User doesn't exists", 400));
      }

      res.status(200).json({
        success: true,
        seller,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// log out from shop
router.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
    try {
      res.cookie("seller_token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
      res.status(201).json({
        success: true,
        message: "Log out successful!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/// get shop info
router.get(
  "/get-shop-info/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shop = await Shop.findById(req.params.id);
      res.status(201).json({
        success: true,
        shop,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update shop profile picture
router.put(
  "/update-shop-avatar",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      let existsSeller = await Shop.findById(req.seller._id);

      const imageId = existsSeller.avatar.public_id;

      await cloudinary.v2.uploader.destroy(imageId);

      const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width: 150,
      });

      existsSeller.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };

      await existsSeller.save();

      res.status(200).json({
        success: true,
        seller: existsSeller,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update seller info
router.put(
  "/update-seller-info",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { name, description, phoneNumber } = req.body;

      const shop = await Shop.findById(req.seller._id);

      if (!shop) {
        return next(new ErrorHandler("Shop not found", 404));
      }

      // Check if the new name already exists for another shop
      if (name && name !== shop.name) {
        const existingShop = await Shop.findOne({ name });
        if (existingShop) {
          return next(new ErrorHandler("Shop name already exists", 400));
        }
      }

      shop.name = name;
      shop.description = description;
      // shop.address = address;
      shop.phoneNumber = phoneNumber;
      // shop.instaShop = instaShop;

      await shop.save();

      res.status(201).json({
        success: true,
        shop,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.get(
  "/admin-all-sellers",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const sellers = await Shop.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        sellers,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete seller ---admin
router.delete(
  "/delete-seller/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await Shop.findById(req.params.id);

      if (!seller) {
        return next(
          new ErrorHandler("Seller is not available with this id", 400)
        );
      }

      await Shop.findByIdAndDelete(req.params.id);

      res.status(201).json({
        success: true,
        message: "Seller deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update seller withdraw methods --- sellers
router.put(
  "/update-payment-methods",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { withdrawMethod } = req.body;

      const seller = await Shop.findByIdAndUpdate(req.seller._id, {
        withdrawMethod,
      });

      res.status(201).json({
        success: true,
        seller,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete seller withdraw merthods --- only seller
router.delete(
  "/delete-withdraw-method/",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await Shop.findById(req.seller._id);

      if (!seller) {
        return next(new ErrorHandler("Seller not found with this id", 400));
      }

      seller.withdrawMethod = null;

      await seller.save();

      res.status(201).json({
        success: true,
        seller,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

//forgot password token
router.post(
  "/forgot-password-token",
  catchAsyncErrors(async (req, res) => {
    const { email } = req.body;
    const user = await Shop.findOne({ email });
    if (!user) throw new Error("User not found with this email");
    try {
      const host = process.env.base_url;
      const token = await user.createPasswordResetToken();
      await user.save();
      const resetURL = `Hi, Please follow this link to reset your Password. \nThis link is valid for 10 minutes starting now.\n Click the link below to reset \n ${req.protocol}://${host}/shop/reset-password/${token}`;
      const data = {
        email: email,
        subject: "Forgot Password Link",
        html: resetURL,
      };

      sendMail(data);
      res.json(token);
    } catch (error) {
      throw new Error(error);
    }
  })
);

//reset password
router.put(
  "/reset-password/:token",
  catchAsyncErrors(async (req, res) => {
    const { password } = req.body;
    const { token } = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await Shop.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordTime: { $gt: Date.now() },
    });
    if (!user)
      throw new Error(
        "Password reset link Expired or invalid, please try again"
      );
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordTime = undefined;
    await user.save();
    res.json(user);
  })
);
//get all sellers
router.get(
  "/get-all-sellers",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const sellers = await Shop.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        sellers,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
