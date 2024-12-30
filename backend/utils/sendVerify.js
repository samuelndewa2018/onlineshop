const nodemailer = require("nodemailer");

const sendOtp = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMPT_HOST,
    port: process.env.SMPT_PORT,
    auth: {
      user: process.env.SMPT_MAIL,
      pass: process.env.SMPT_PASSWORD,
    },
  });

  // OTP email content
  const otpMessage = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <h2 style="color: #555;">Your OTP Code</h2>
        <p>Hello,</p>
        <p>Use the following OTP to complete your process:</p>
        <h1 style="color: #007BFF;">${options.otp}</h1>
        <p>This code is valid for 10 minutes.</p>
        <p>If you didn’t request this code, please ignore this email.</p>
        <p>Best regards,</p>
        <p><strong>Ninety One</strong></p>
      </div>
    `;

  const mailOptions = {
    from: process.env.SMPT_MAIL,
    to: options.email,
    subject: options.subject || "Your OTP Code",
    html: otpMessage,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send OTP email. Please try again later.");
  }
};

module.exports = sendOtp;
