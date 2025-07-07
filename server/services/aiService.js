const axios = require("axios");

/**
 * Generate suggestions by calling an external API.
 * Throws if SUGGESTION_API_URL is not set.
 */
async function generateSuggestions(prId, diff) {
  const url = process.env.SUGGESTION_API_URL;
  if (!url) {
    throw new Error("Suggestion API endpoint not configured");
  }
  // POST { prId, diff } to the external AI service
  const response = await axios.post(url, { prId, diff });
  // Expect the API to return an array of suggestion objects
  return response.data;
}

module.exports = { generateSuggestions };
