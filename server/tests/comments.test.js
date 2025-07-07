// server/tests/comments.test.js

require("dotenv").config();
const mongoose = require("mongoose");
const request = require("supertest");
const http = require("http");
const express = require("express");
const { ApolloServer } = require("apollo-server-express");

const authRoutes = require("../routes/authRoutes");
const typeDefs = require("../graphql/schema");
const resolvers = require("../graphql/resolvers");

let app, apolloServer;

beforeAll(async () => {
  // 1) Connect to MongoDB so Comment.find() works
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // 2) Set up Express + GraphQL
  const expressApp = express();
  expressApp.use(express.json());
  expressApp.use("/auth", authRoutes);

  apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      const header = req.headers.authorization || "";
      const token = header.replace("Bearer ", "");
      return { token };
    },
    introspection: true,
    plugins: [
      require("apollo-server-core").ApolloServerPluginLandingPageGraphQLPlayground(),
    ],
  });
  await apolloServer.start();
  apolloServer.applyMiddleware({ app: expressApp, path: "/graphql" });

  app = http.createServer(expressApp);
});

afterAll(async () => {
  await apolloServer.stop();
  await mongoose.disconnect();
});

describe("GraphQL comments", () => {
  const JWT = process.env.TEST_GITHUB_JWT;
  const REPO_NAME = process.env.TEST_REPO_NAME;
  if (!JWT) {
    console.warn(
      "⚠️  Please set TEST_GITHUB_JWT in your .env to run comments tests"
    );
    return;
  }

  it("returns an empty array without token", async () => {
    const res = await request(app).post("/graphql").send({
      query: 'query { comments(prId: "123") { body authorLogin } }',
    });

    expect(res.body.data.comments).toEqual([]);
  });

  it("can add and fetch comments on a PR", async () => {
    // 1) Fetch a PR to get a valid prId
    const prListRes = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${JWT}`)
      .send({
        query: `
        query {
          pullRequests(
            ownerLogin: "AsadMoinuddin152",
            repoName: "${REPO_NAME}"
          ) {
            id
          }
        }
      `,
      });
    const prList = prListRes.body.data.pullRequests;
    expect(prList).toBeInstanceOf(Array);
    expect(prList.length).toBeGreaterThan(0);
    const prId = prList[0].id;

    // 2) Add a new comment
    const commentText = "Hey, looks good!";
    const addRes = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${JWT}`)
      .send({
        query: `
          mutation($prId: String!, $body: String!) {
            addComment(prId: $prId, body: $body) {
              id
              prId
              authorLogin
              body
              createdAt
            }
          }
        `,
        variables: { prId, body: commentText },
      });

    expect(addRes.body.data.addComment.body).toBe(commentText);
    expect(addRes.body.data.addComment.prId).toBe(prId);

    // 3) Fetch comments for that PR
    const fetchRes = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${JWT}`)
      .send({
        query: `
          query($prId: String!) {
            comments(prId: $prId) {
              id
              prId
              authorLogin
              body
              createdAt
            }
          }
        `,
        variables: { prId },
      });

    const comments = fetchRes.body.data.comments;
    expect(comments).toBeInstanceOf(Array);
    expect(comments.some((c) => c.body === commentText)).toBe(true);
  });
});
