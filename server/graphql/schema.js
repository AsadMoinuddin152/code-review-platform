const { gql } = require("apollo-server-express");

module.exports = gql`
  type Query {
    me: User
    repos(
      page: Int = 1
      perPage: Int = 100
      sort: String = "created"
      order: String = "desc"
    ): [Repo!]!
    pullRequests(
      ownerLogin: String!
      repoName: String!
      state: String
      page: Int = 1
      perPage: Int = 10
      sort: String = "created"
      order: String = "desc"
    ): [PullRequest!]!
    comments(prId: ID!): [Comment!]!
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
    addComment(prId: ID!, body: String!): Comment!
    deleteComment(id: ID!): Boolean!
    generateSuggestions(prId: ID!, diff: String!): [Suggestion!]!
  }

  type Suggestion {
    id: ID!
    prId: ID!
    category: String!
    message: String!
    line: Int!
    createdAt: String!
  }

  type Subscription {
    commentAdded(prId: ID!): Comment!
    suggestionGenerated(prId: ID!): Suggestion!
  }
`;
