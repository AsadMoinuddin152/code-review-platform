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
const pubsub = require("../pubsub");
const {
  AuthenticationError,
  UserInputError,
} = require("apollo-server-express");
module.exports = {
  Query: {
    me: async (_, __, { token }) => {
      if (!token) return null;
      const { githubToken } = jwt.verify(token, process.env.JWT_SECRET);
      return await getOrCreateUser(githubToken);
    },

    repos: async (
      _,
      { page = 1, perPage = 10, sort = "created", order = "desc" },
      { token }
    ) => {
      if (!token) throw new AuthenticationError("Not authenticated");
      if (page < 1 || perPage < 1 || perPage > 100) {
        throw new UserInputError(
          "`page` and `perPage` must be positive; max 100"
        );
      }
      const { githubToken } = jwt.verify(token, process.env.JWT_SECRET);
      return await listUserRepos(githubToken, page, perPage, sort, order);
    },

    pullRequests: async (
      _,
      {
        ownerLogin,
        repoName,
        page = 1,
        state = "open",
        perPage = 10,
        sort = "created",
        order = "desc",
      },
      { token }
    ) => {
      if (!token) throw new AuthenticationError("Not authenticated");
      if (page < 1 || perPage < 1 || perPage > 100) {
        throw new UserInputError(
          "`page` and `perPage` must be positive; max 100"
        );
      }
      const { githubToken } = jwt.verify(token, process.env.JWT_SECRET);
      return await listPullRequests(
        githubToken,
        ownerLogin,
        repoName,
        state,
        page,
        perPage,
        (sort = "created"),
        (order = "desc")
      );
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
      if (!token) throw new AuthenticationError("Not authenticated");

      const { githubToken } = jwt.verify(token, process.env.JWT_SECRET);

      const user = await getOrCreateUser(githubToken);
      if (!user) throw new Error("Unable to fetch GitHub user");

      const comment = new Comment({
        prId,
        authorLogin: user.login,
        body,
      });
      await comment.save();
      pubsub.publish(`COMMENT_ADDED:${prId}`, { commentAdded: comment });

      return comment;
    },

    generateSuggestions: async (_, { prId, diff }, { token }) => {
      if (!token) throw new AuthenticationError("Not authenticated");

      jwt.verify(token, process.env.JWT_SECRET);

      let suggestions;
      try {
        suggestions = await generateSuggestions(prId, diff);
      } catch (err) {
        throw new Error(`Failed to generate suggestions: ${err.message}`);
      }

      const docs = await Suggestion.insertMany(suggestions);
      pubsub.publish(`SUGGESTION_ADDED:${prId}`, {
        suggestionGenerated: docs,
      });
      return docs;
    },
  },

  Subscription: {
    commentAdded: {
      subscribe: (_, { prId }) => {
        pubsub.asyncIterator(`COMMENT_ADDED:${prId}`);
      },
    },

    suggestionGenerated: {
      subscribe: (_, { prId }) => {
        pubsub.asyncIterator(`SUGGESTION_ADDED:${prId}`);
      },
    },
  },
};
