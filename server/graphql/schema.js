const { gql } = require("apollo-server-express");

module.exports = gql`
  type Query {
    me: User
    repos: [Repo!]!
    pullRequests(ownerLogin: String!, repoName: String!): [PullRequest!]!
    comments(prId: String!): [Comment!]!
    suggestions(prId: ID!): [Suggestion!]!
  }

  type User {
    id: ID!
    login: String!
    avatarUrl: String
  }

  type Repo {
    id: ID!
    name: String!
    ownerLogin: String!
  }

  type PullRequest {
    id: ID!
    number: Int!
    title: String!
    authorLogin: String!
    merged: Boolean!
    createdAt: String!
  }

  type Comment {
    id: ID!
    prId: String!
    authorLogin: String!
    body: String!
    createdAt: String!
  }

  type Mutation {
    addComment(prId: String!, body: String!): Comment!
    deleteComment(id: ID!): Boolean!
    generateSuggestions(prId: String!, diff: String!): [Suggestion!]!
  }

  type Suggestion {
    id: ID!
    prId: ID!
    category: String!
    message: String!
    line: Int!
    createdAt: String!
  }
`;
