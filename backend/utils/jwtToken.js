// create token and saving that in cookies
const sendToken = (user, statusCode, req, res) => {
  const token = user.getJwtToken();

  // Options for cookies
  const options = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    // sameSite: "none", //when backend and frontend are not on the same site
    // secure: true,
  };

  // Check if the user agent is Safari and adjust the sameSite option
  // const userAgent = req.get("User-Agent");
  // if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
  //   options.sameSite = "lax"; // Use "lax" for Safari
  // }

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user,
    token,
  });
};

module.exports = sendToken;
