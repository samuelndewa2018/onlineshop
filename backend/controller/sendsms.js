const express = require("express");
const router = express.Router();
const twilio = require("twilio");

//send sms
router.post("/send-sms", async (req, res) => {
  try {
    const client = new twilio(
      process.env.TWILIO_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    return client.messages
      .create({
        body: "hey it worked",
        from: "+447883303589",
        to: "+447876303589",
      })
      .then((message) => console.log(message))
      .catch((err) => console.log(err));
  } catch (error) {
    res.status(500).json({ error: "Failed to send sms." });
  }
});

module.exports = router;
