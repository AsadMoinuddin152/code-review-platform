const router = require("express").Router();
const {
  githubLogin,
  githubCallback,
} = require("../controllers/authController");
router.get("/github", githubLogin);
router.get("/github/callback", githubCallback);
module.exports = router;
