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
    const { email } = req.body;
    const existingSubscriber = await Subscriber.findOne({ email });

    if (existingSubscriber) {
      return res.status(400).json({ message: "Email already subscribed." });
    }

    const newSubscriber = new Subscriber({ email });
    await newSubscriber.save();

    await sendMail({
      email: "samuelndewa2018@gmail.com",
      subject: "New Subscriber Alert! 🎉",
      html: `<!DOCTYPE html>
     <html>
       <head>
         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
         <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
         <title>Simple Transactional Email</title>
         <style>
           /* Add your CSS styles here */
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
                   <div
                     style="
                       clear: both;
                       margin-top: 10px;
                       text-align: center;
                       width: 100%;
                     "
                   >
                     
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
                             <div
                               style="
                                 display: flex;
                                 justify-content: center;
                                 align-items: center;
                                 margin-bottom: 25px;
                               "
                             ></div>
     
                             <p
                               style="
                                 font-family: sans-serif;
                                 font-size: 14px;
                                 font-weight: normal;
                                 margin: 0;
                                 margin-bottom: 15px;
                               "
                             >
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
                             <p style="font-family: Arial, sans-serif; background-color: #f9f9f9; text-align: center;">
    <h1 style="color: #ff6600;">New Subscriber Alert! 🎉</h1>
    <p>Hey there, Admin Extraordinaire!</p>
    <p>Hold on to your hats because we've got a brand-new subscriber joining our circus of hilarity! 🎪🎉</p>
    <p>Our latest recruit goes by the name of [<strong>${email}</strong>], and we're pretty sure they're ready to embrace the weird and wonderful world of our online shop.</p>
    <p>We can't wait for them to witness our assortment of whacky wonders, from quirky quandaries to brain-teasing surprises. And of course, let's not forget our resident mascot, Chuckles the Crazy Chameleon, who's always ready to spread laughter.</p>
    <p>Now, here's the fun part. As our esteemed Admin, your mission, should you choose to accept it (which we know you will), is to give our new subscriber a warm and uproarious welcome. Let them know they're in for a ride of a lifetime!</p>
    <p>And hey, if you've got any hilarious jokes up your sleeve, don't be shy – share the laughter and brighten their day! 😄</p>
    <p>If you need any circus-related help, remember, you're the Ringmaster of our support team! Feel free to reach out to our new subscriber at <a href="mailto:[Subscriber's Email]">[${email}]</a>. Let's give them the VIP treatment!</p>
    <p>Remember, laughter is the key to a happy circus – and you, dear Admin, are the master of mirth!</p>
    <p>Thank you for being the star of our show and keeping the fun rolling!</p>
    <p>Keep juggling those tasks like a pro, and may your days be filled with endless laughter!</p>
    <p><em>P.S. We heard a rumor that you can juggle flaming rubber chickens while riding a unicycle – Impressive!</em></p>
</p>
                               <br />
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
                                           ></td>
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
                               <b>eShop</b> Quality is our middle name
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
                               Asante Sana! Karibu.
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
     </html>`,
      attachments: [
        {
          filename: "logo.png",
          path: __dirname + "/logo.png",
          cid: "logo",
        },
      ],
    });

    await sendMail({
      email: email,
      subject: `🎉 Welcome to the Party! 🎉`,
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
                                <p style="font-family: Arial, sans-serif; background-color: #f9f9f9; text-align: center;">
    <h1 style="color: #ff6600;">🎉 Welcome to the Party! 🎉</h1>
    <p>Hey [${email}],</p>
    <p>Hold on to your hats because you've just stepped into the wackiest, wildest, and most wonderful online shop in the universe! 🌌🚀</p>
    <p>We're absolutely thrilled to have you join our merry band of misfit subscribers. 🤪🎉 As the newest addition to our family, we promise to keep you entertained, giggling, and perhaps even ROFL-ing (Rolling On the Floor Laughing) from time to time.</p>
    <p>So, what can you expect from our one-of-a-kind shop? Allow us to give you a sneak peek:</p>
    <ul>
        <li>🌈 Whimsical Wares: Unicorns, rainbows, and talking teapots – we've got it all! Our shop is like a magical treasure trove filled with the stuff dreams are made of.</li>
        <li>🤖 Quirky Quandaries: Ever wondered what a dancing robot and a rubber chicken have in common? Neither have we, but we've got 'em both!</li>
        <li>🧠 Brain-Teasing Surprises: Puzzle-solving gurus, rejoice! We'll challenge your wits with mind-bending riddles hidden among our product descriptions.</li>
        <li>🎁 Gifts That Give Giggles: Need a present for a friend or a foe? Fear not! Our quirky collection makes gift-giving an unforgettable experience.</li>
    </ul>
    <p>To kick off your subscription journey with a bang, we've even prepared an exclusive discount code just for you: "<strong>LAUGHOUTLOUD</strong>"! Use it at checkout and prepare to be amazed at the savings! 💰💸</p>
    <p>But wait, there's more! Our resident mascot, Chuckles the Crazy Chameleon, has taken a liking to you already. 🦎 He'll be dropping into your inbox every now and then to share some jokes, funny stories, and, of course, top-secret insider deals.</p>
    <p>So, put on your silliest hat and get ready for a rollercoaster ride of laughter, quirkiness, and extraordinary discoveries. And don't forget to spread the word – share the laughter with your friends, family, and the cat next door (cats love laughter, trust us).</p>
    <p>If you ever have any questions, need assistance, or just want to share a pun, our team is here for you! Reach out to us anytime at <a href="mailto:support@email.com">threedoltscommunications@gmail.com</a>.</p>
    <p>Once again, welcome to our bonkers family! Let the fun begin! 🎉🎈</p>
    <p>Keep laughing and stay quirky!</p>
    <p>Your Friends at 3 dolts - eshop</p>
    <p><em>P.S. Rumor has it that our talking teapots can also dance the tango. But you didn't hear that from us! 😉</em></p>
</p>
                              
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
          path: __dirname + "/logo.png",
          cid: "logo", //same cid value as in the html img src
        },
      ],
    });
    res.status(201).json({
      success: true,
      message: "Subscribed successfully.",
    });
  } catch (error) {
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
