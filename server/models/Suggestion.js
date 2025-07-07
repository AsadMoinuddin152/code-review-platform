const mongoose = require("mongoose");

const SuggestionSchema = new mongoose.Schema({
  prId: { type: String, required: true },
  category: { type: String, required: true },
  message: { type: String, required: true },
  line: { type: Number, required: true },
  createdAt: { type: Date, default: () => new Date() },
});

module.exports = mongoose.model("Suggestion", SuggestionSchema);
