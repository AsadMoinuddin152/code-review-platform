const axios = require("axios");
const jwt = require("jsonwebtoken");

exports.githubLogin = (_req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_OAUTH_CALLBACK_URL,
    scope: "repo read:user",
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
};

exports.githubCallback = async (req, res) => {
  try {
    const { data } = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: req.query.code,
      },
      { headers: { Accept: "application/json" } }
    );
    const token = jwt.sign(
      { githubToken: data.access_token },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.json({ token });
  } catch (err) {
    console.error("OAuth Error:", err);
    res.status(500).json({ error: "OAuth failed" });
  }
};
