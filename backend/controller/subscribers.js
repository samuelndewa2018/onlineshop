const express = require("express");
const Subscriber = require("../model/subscribers");
const router = express.Router();
const sendMail = require("../utils/sendMail");
const { isAuthenticated } = require("../middleware/auth");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

//create a subscriber
router.post("/subscribe", async (req, res) => {
  try {
    // Extract the 'input' field from the request body
    const { input } = req.body;
    console.log(input);

    // Check if the input is a valid email address
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);

    // Check if the input is a 10-digit phone number
    const isPhoneNumber = /^\d{10}$/.test(input);

    // If the input is neither a valid email nor a valid phone number, return a 400 error
    if (!isEmail && !isPhoneNumber) {
      return res.status(400).json({
        message:
          "Invalid input. Please provide a valid email or a 10-digit phone number.",
      });
    }

    // Check if the input already exists in the database
    const existingSubscriber = isEmail
      ? await Subscriber.findOne({ email: input })
      : await Subscriber.findOne({ number: input });

    // If the input already exists, return a 400 error
    if (existingSubscriber) {
      return res.status(400).json({ message: "user already subscribed." });
    }

    // Create data for a new subscriber based on the input
    const newSubscriberData = isEmail
      ? { email: input, number: `91NUL${input}` }
      : { number: input, email: `91NUL${input}` };

    // Create a new Subscriber instance with the provided data
    const newSubscriber = new Subscriber(newSubscriberData);

    // Save the new subscriber to the database
    await newSubscriber.save();

    // Return a success response
    res.status(201).json({
      success: true,
      message: "Woohoo, you're subscribed!",
    });
  } catch (error) {
    // Handle MongoDB duplicate key error (code 11000)
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Duplicate key error. Email or number already exists.",
      });
    }

    // Return a generic error response for other errors
    res.status(500).json({ error: "Failed to subscribe." });
  }
});

//get all subscribers
router.get("/get-subscribers", async (req, res) => {
  try {
    const subscribers = await Subscriber.find();
    res.status(200).json({
      sucess: true,
      subscribers,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while fetching subscribers." });
  }
});

// Send emails to all subscribers
router.post("/send-emails", async (req, res) => {
  const { subject, message } = req.body;

  try {
    const subscribers = await Subscriber.find();

    if (!subscribers.length) {
      return res.status(404).json({ message: "No subscribers found." });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMPT_HOST,
      port: process.env.SMPT_PORT,
      service: process.env.SMPT_SERVICE,
      auth: {
        user: process.env.SMPT_MAIL,
        pass: process.env.SMPT_PASSWORD,
      },
    });

    const emails = subscribers.map((subscriber) => subscriber.email);
    const mailOptions = {
      from: process.env.SMPT_MAIL,
      to: emails.join(", "),
      subject: subject,
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
                  <div
                  style="
                    clear: both;
                    margin-top: 10px;
                    text-align: center;
                    width: 100%;
                  "
                >
                  <img
                    src="cid:logo"
                    alt="eShoplogo"
                    style="height: 80px; width: 100px"
                  />
                  <p style="color: #999999; font-size: 12px; text-align: center">
                    We are here to serve
                  </p>
                </div>
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
                             <div>${message}</div>
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
                          Like receive <b>eShop</b> emails Again?
                          <a
                            href="https://ninetyone.co.ke/"
                            style="
                              text-decoration: underline;
                              color: #999999;
                              font-size: 12px;
                              text-align: center;
                            "
                            >subscribe</a
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
          cid: "logo", //same cid value as in the html img src
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Emails sent successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while sending emails." });
  }
});

//delete/unsubscribe subscriber
router.delete("/delete-subscribe", async (req, res) => {
  const { email } = req.query;

  try {
    await sendMail({
      email: email,
      subject: `UnSubscription`,
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
                      <div
                      style="
                        clear: both;
                        margin-top: 10px;
                        text-align: center;
                        width: 100%;
                      "
                    >
                      <img
                        src="cid:logo"
                        alt="eShoplogo"
                        style="height: 80px; width: 100px"
                      />
                      <p style="color: #999999; font-size: 12px; text-align: center">
                        We are here to serve
                      </p>
                    </div>
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
                                    You have unsubscribed to our newsletter.<br />
                                    We feel bad to see you leave. <b>Byeeee<b>
                                    You will not hear from us again
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
                              Like receive <b>eShop</b> emails Again?
                              <a
                                href="https://ninetyone.co.ke/"
                                style="
                                  text-decoration: underline;
                                  color: #999999;
                                  font-size: 12px;
                                  text-align: center;
                                "
                                >subscribe</a
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

    const deletedSubscriber = await Subscriber.findOneAndDelete({ email });
    if (!deletedSubscriber) {
      return res.status(404).json({ message: "Subscriber not found." });
    }

    res.status(200).json({ message: "UnSubscription successfully." });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "An error occurred while deleting the subscriber." });
  }
});

module.exports = router;
