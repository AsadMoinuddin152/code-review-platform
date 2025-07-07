const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  prId: { type: String, required: true },
  authorLogin: { type: String, required: true },
  body: { type: String, required: true },
  createdAt: { type: Date, default: () => new Date() },
});

module.exports = mongoose.model("Comment", CommentSchema);
