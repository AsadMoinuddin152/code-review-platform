// server/graphql/resolvers.js

const jwt = require("jsonwebtoken");
const {
  getOrCreateUser,
  listUserRepos,
  listPullRequests,
} = require("../services/githubService");
const Comment = require("../models/Comment");
const { generateSuggestions } = require("../services/aiService");
const Suggestion = require("../models/Suggestion");

module.exports = {
  Query: {
    me: async (_, __, { token }) => {
      if (!token) return null;
      const { githubToken } = jwt.verify(token, process.env.JWT_SECRET);
      return await getOrCreateUser(githubToken);
    },

    repos: async (_, __, { token }) => {
      if (!token) throw new Error("Not authenticated");
      const { githubToken } = jwt.verify(token, process.env.JWT_SECRET);
      return await listUserRepos(githubToken);
    },

    pullRequests: async (_, { ownerLogin, repoName }, { token }) => {
      if (!token) throw new Error("Not authenticated");
      const { githubToken } = jwt.verify(token, process.env.JWT_SECRET);
      return await listPullRequests(githubToken, ownerLogin, repoName);
    },

    comments: async (_, { prId }) => {
      return await Comment.find({ prId }).sort({ createdAt: 1 });
    },

    suggestions: async (_, { prId }) => {
      return await Suggestion.find({ prId }).sort({ createdAt: 1 });
    },
  },

  Mutation: {
    addComment: async (_, { prId, body }, { token }) => {
      if (!token) throw new Error("Not authenticated");

      const { githubToken } = jwt.verify(token, process.env.JWT_SECRET);

      const user = await getOrCreateUser(githubToken);
      if (!user) throw new Error("Unable to fetch GitHub user");

      const comment = new Comment({
        prId,
        authorLogin: user.login,
        body,
      });
      await comment.save();

      return comment;
    },

    generateSuggestions: async (_, { prId, diff }, { token }) => {
      if (!token) throw new Error("Not authenticated");

      // Verify JWT (we only need to ensure user is authenticated)
      jwt.verify(token, process.env.JWT_SECRET);

      // Call external AI service (will error if SUGGESTION_API_URL is not configured)
      let suggestions;
      try {
        suggestions = await generateSuggestions(prId, diff);
      } catch (err) {
        throw new Error(`Failed to generate suggestions: ${err.message}`);
      }

      // Persist suggestions in MongoDB
      const docs = await Suggestion.insertMany(suggestions);
      return docs;
    },
  },
};
