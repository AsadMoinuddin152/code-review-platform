// server/controllers/authController.js
const axios = require("axios");
const jwt = require("jsonwebtoken");

exports.githubLogin = (_req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_OAUTH_CALLBACK_URL,
    scope: "read:user repo",
    allow_signup: "true",
  });
  // send them to GitHub’s consent page
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
};

exports.githubCallback = async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send("No code provided");
  }

  try {
    // exchange the code for an access token
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_OAUTH_CALLBACK_URL,
      },
      { headers: { Accept: "application/json" } }
    );

    const githubToken = tokenRes.data.access_token;
    if (!githubToken) throw new Error("No access_token in GitHub response");

    // sign our own JWT for the client
    const ourJwt = jwt.sign({ githubToken }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // redirect back to the front-end with the JWT in the URL
    const params = new URLSearchParams({ token: ourJwt });
    res.redirect(`${process.env.FRONTEND_URL}/?${params.toString()}`);
  } catch (err) {
    console.error("GitHub OAuth error", err.response?.data || err);
    res.status(500).send("Authentication failed");
  }
};
