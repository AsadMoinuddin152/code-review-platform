// server/tests/suggestions.test.js

jest.setTimeout(30000); // ⬅️ bump default 5s timeout

require("dotenv").config();
const mongoose = require("mongoose");
const request = require("supertest");
const http = require("http");
const express = require("express");
const { ApolloServer } = require("apollo-server-express");

const authRoutes = require("../routes/authRoutes");
const typeDefs = require("../graphql/schema");
const resolvers = require("../graphql/resolvers");

let apolloServer, app; // ⬅️ use apolloServer consistently

const JWT = process.env.TEST_GITHUB_JWT;
const OWNER = process.env.TEST_OWNER_LOGIN || "AsadMoinuddin152";
const REPO_NAME = process.env.TEST_REPO_NAME;

beforeAll(async () => {
  // 1) Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI);

  // 2) Stand up Express + Apollo
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
  });
  await apolloServer.start();
  apolloServer.applyMiddleware({ app: expressApp, path: "/graphql" });

  app = http.createServer(expressApp);
});

afterAll(async () => {
  await apolloServer.stop(); // ⬅️ match apolloServer
  await mongoose.disconnect();
});

describe("GraphQL suggestions", () => {
  if (!JWT || !REPO_NAME) {
    console.warn(
      "⚠️ Please set TEST_GITHUB_JWT and TEST_REPO_NAME in your .env"
    );
    return;
  }

  it("errors without token on generateSuggestions", async () => {
    const res = await request(app)
      .post("/graphql")
      .send({
        query: `
          mutation {
            generateSuggestions(prId: "123", diff: "dummy") {
              id
            }
          }
        `,
      });

    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].message).toMatch(/Not authenticated/);
  });

  it("generates and fetches suggestions end-to-end", async () => {
    process.env.SUGGESTION_API_URL = "http://fake-api.local/analyze";
    const axios = require("axios");
    const dummy = {
      prId: "2646621738",
      category: "style",
      message: "X",
      line: 1,
    };
    jest.spyOn(axios, "post").mockResolvedValue({ data: [dummy] });

    // 1) Get a real PR ID
    const prRes = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${JWT}`)
      .send({
        query: `
          query($owner:String!,$repo:String!){
            pullRequests(ownerLogin:$owner,repoName:$repo){
              id
            }
          }
        `,
        variables: { owner: OWNER, repo: REPO_NAME },
      });
    const prList = prRes.body.data.pullRequests;
    expect(prList.length).toBeGreaterThan(0);
    const prId = prList[0].id;

    // 2) generateSuggestions()
    const genRes = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${JWT}`)
      .send({
        query: `
          mutation($prId:String!,$diff:String!){
            generateSuggestions(prId:$prId,diff:$diff){
              id prId category message line createdAt
            }
          }
        `,
        variables: { prId, diff: "diff text" },
      });

    expect(genRes.body.errors).toBeUndefined();
    const generated = genRes.body.data.generateSuggestions;
    expect(Array.isArray(generated)).toBe(true);
    expect(generated).toEqual(
      expect.arrayContaining([expect.objectContaining({ prId })])
    );
  });
});
