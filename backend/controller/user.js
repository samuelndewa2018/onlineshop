const express = require("express");
const path = require("path");
const User = require("../model/user");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const cloudinary = require("cloudinary");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const sendToken = require("../utils/jwtToken");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const crypto = require("crypto");

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

//create user
router.post("/create-user", async (req, res, next) => {
  try {
    const { name, email, password, avatar, phoneNumber, country } = req.body;
    const userEmail = await User.findOne({ email });
    const userPhone = await User.findOne({ phoneNumber });

    if (userPhone) {
      return next(new ErrorHandler("Phone number already exists", 400));
    }
    if (userEmail) {
      return next(new ErrorHandler("User already exists", 400));
    }

    const myCloud = await cloudinary.v2.uploader.upload(avatar, {
      folder: "avatars",
    });

    const user = {
      name: name,
      email: email,
      password: password,
      phoneNumber: phoneNumber,
      country: country,
      avatar: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
    };

    const activationToken = createActivationToken(user);

    const activationUrl = `https://ninetyone.co.ke/activation/${activationToken}`;
    const message = `Hello ${name}, Welcome to Ninety One. Click the link below to activate your account. ${activationUrl}`;

    try {
      await sendWhatsAppText(
        message,
        process.env.WHATSAPP_SESSION,
        user.phoneNumber
      );
      await sendMail({
        email: user.email,
        subject: "Activate your account",
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
                      style="height: 80px; width: 100px;"
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
                                  Hello ${name},
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
                                  Welcome to <b>Ninety One</b>. Click the button below to activate your account.<br />
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
        message: `Registered successfully. Please check your email or whatsapp to activate your account.`,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

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
      const user = await User.findOne({ phoneNumber: phoneNumber });
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

// login with otp

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
      const user = await User.findById({ userId });

      if (!user) {
        return next(new ErrorHandler("User doesn't exists!", 400));
      }

      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// create activation token
const createActivationToken = (user) => {
  return jwt.sign(user, process.env.ACTIVATION_SECRET, {
    expiresIn: "5m",
  });
};

// activate user
router.post(
  "/activation",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { activation_token } = req.body;

      const newUser = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET
      );

      if (!newUser) {
        return next(new ErrorHandler("Invalid token", 400));
      }
      const { name, email, password, avatar, phoneNumber } = newUser;

      let user = await User.findOne({ email });

      if (user) {
        return next(new ErrorHandler("User already exists", 400));
      }
      user = await User.create({
        name,
        email,
        avatar,
        password,
        phoneNumber,
      });

      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// contact email
router.post(
  "/subscribe",
  catchAsyncErrors(async (req, res) => {
    const { email } = req.body;
    try {
      await sendMail({
        email: "samuelndewa2018@gmail.com",
        subject: `Subscription`,
        html: `Hello eShop,\nYou have a new subscription. Email: ${email}\n*******************************\n@Quality is our middle name.`,
      });
      await sendMail({
        email: email,
        subject: `Subscription`,
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
                              <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 25px;">
                              <img src="htpps://res.cloudinary.com/bramuels/image/upload/v1695878268/logo/LOGO-01_moo9oc.png" alt="eShoplogo"/>
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
                                  Hello User,
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
                                  Thank you for subscribing to our newsletter<br />
                                  You will be the first one to here from us
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
        message: "Thanks. You'll be the first one to receive our News.",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// login user
router.post(
  "/login-user",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return next(new ErrorHandler("Please provide the all fields!", 400));
      }

      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("User doesn't exists!", 400));
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
      }
      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// load user
router.get(
  "/getuser",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return next(new ErrorHandler("User doesn't exists", 400));
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// log out user
router.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
    try {
      res.cookie("token", null, {
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

// update user info
router.put(
  "/update-user-info",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password, phoneNumber, name } = req.body;

      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("User not found", 400));
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
      }

      user.name = name;
      user.email = email;
      user.phoneNumber = phoneNumber;

      await user.save();

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user avatar
router.put(
  "/update-avatar",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      let existsUser = await User.findById(req.user.id);

      if (!existsUser) {
        return next(new ErrorHandler("User avatar not found!", 404));
      }

      // Check if the user has an existing avatar
      if (existsUser.avatar && existsUser.avatar.public_id) {
        // Delete the existing avatar from Cloudinary
        await cloudinary.v2.uploader.destroy(existsUser.avatar.public_id);
      }

      const { avatar } = req.body;

      // Upload the new avatar to Cloudinary
      const myCloud = await cloudinary.v2.uploader.upload(avatar, {
        folder: "avatars",
      });

      // Update the user's avatar field with the new details
      existsUser.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };

      await existsUser.save();

      res.status(200).json({
        success: true,
        user: existsUser,
      });
    } catch (error) {
      console.log(error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user addresses

router.put(
  "/update-user-addresses",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      const sameTypeAddress = user.addresses.find(
        (address) => address.addressType === req.body.addressType
      );
      if (sameTypeAddress) {
        return next(
          new ErrorHandler(`${req.body.addressType} address already exists`)
        );
      }

      const existsAddress = user.addresses.find(
        (address) => address._id === req.body._id
      );

      if (existsAddress) {
        Object.assign(existsAddress, req.body);
      } else {
        // add the new address to the array
        user.addresses.push(req.body);
      }

      await user.save();

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete user address
router.delete(
  "/delete-user-address/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const userId = req.user._id;
      const addressId = req.params.id;

      console.log(addressId);

      await User.updateOne(
        {
          _id: userId,
        },
        { $pull: { addresses: { _id: addressId } } }
      );

      const user = await User.findById(userId);

      res.status(200).json({ success: true, user });
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
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found with this email");
    try {
      const token = await user.createPasswordResetToken();
      await user.save();
      const resetURL = `https://ninetyone.co.ke/reset-password/${token}`;
      await sendMail({
        email: user.email,
        subject: "Forgot Password Link",
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
                      style="height: 80px; width: 100px;"
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
                                  Hello ${user.name},
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
                                  Click the button below to reset your password.<br />
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
                                                  href=${resetURL}
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
                                                  >Click Here to Reset your Password</a
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
                                <p>Please note that this link is valid for 10 minutes starting now.</p>
                                <br/>
                                <p><b>eShop</b> only contacts you through 0712012113 or email threedoltscommunications@gmail.com</p>
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
    const user = await User.findOne({
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

// update user password
router.put(
  "/update-user-password",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select("+password");

      const isPasswordMatched = await user.comparePassword(
        req.body.oldPassword
      );

      if (!isPasswordMatched) {
        return next(new ErrorHandler("Old password is incorrect!", 400));
      }

      if (req.body.newPassword !== req.body.confirmPassword) {
        return next(
          new ErrorHandler("Password doesn't matched with each other!", 400)
        );
      }
      user.password = req.body.newPassword;

      await user.save();

      res.status(200).json({
        success: true,
        message: "Password updated successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// find user information with the userId
router.get(
  "/user-info/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// all users --- for admin
router.get(
  "/admin-all-users",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const users = await User.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        users,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete users --- admin
router.delete(
  "/delete-user/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return next(
          new ErrorHandler("User is not available with this id", 400)
        );
      }
      const imageId = user.avatar.public_id;

      await cloudinary.v2.uploader.destroy(imageId);

      await User.findByIdAndDelete(req.params.id);

      res.status(201).json({
        success: true,
        message: "User deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// contact email
router.post(
  "/email",
  catchAsyncErrors(async (req, res, next) => {
    const { name, email, mobile, comment } = req.body;
    try {
      await sendMail({
        email: "samuelndewa2018@gmail.com",
        subject: "Contact Us",
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
                              <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 25px;">
                              <img src="https://res.cloudinary.com/bramuels/image/upload/v1695878268/logo/LOGO-01_moo9oc.png" alt="eShoplogo"/>
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
                                  Hello ${name},
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
                                  <b>eShop</b> has received your email.<br />
                                  We will reply as soon as we can.<br/>
                                  <hr style="color: rgb(204, 202, 203);"/>
                                  Thanks for contacting us.
                                  <hr/>
                                  @Quality is our middle name.
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
                                                  href="https://ninetyone.co.ke/"
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
                                                  >Continue Shopping</a
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
      });
      await sendMail({
        email: email,
        subject: `Contact Us`,
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
                              <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 25px;">
                              <img src="https://res.cloudinary.com/bramuels/image/upload/v1695878268/logo/LOGO-01_moo9oc.png" alt="eShoplogo"/>
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
                                  Hello ${name},
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
                                  <b>eShop</b> has received your email.<br />
                                  We will reply as soon as we can.<br/>
                                  <hr style="color: rgb(204, 202, 203);"/>
                                  Thanks for contacting us.
                                  <hr/>
                                  @Quality is our middle name.
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
                                                  href="https://ninetyone.co.ke"
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
                                                  >Continue Shopping</a
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
      });
      res.status(201).json({
        success: true,
        message: "We have received your email. We'll reply to you soon",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// update refCode
router.put("/update-refcode/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const { refCode } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const existingUserWithRefCode = await User.findOne({ refCode: refCode });
    if (
      existingUserWithRefCode &&
      existingUserWithRefCode._id.toString() !== userId
    ) {
      return res.status(400).json({
        success: false,
        message: "RefCode already in use by another user.",
      });
    }

    user.refCode = refCode;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "RefCode updated successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
});

// get UserId refcode
router.get("/get-user-id/:refCode", async (req, res) => {
  try {
    const refCode = req.params.refCode;

    const user = await User.findOne({ refCode });

    if (user) {
      res.status(200).json({ success: true, userId: user._id });
    } else {
      res.status(404).json({ success: false, message: "User not found." });
    }
  } catch (error) {
    console.error("Error fetching user by refCode:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
});

module.exports = router;
