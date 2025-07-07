// server/tests/suggestions.test.js

require("dotenv").config();
const mongoose = require("mongoose");
const request = require("supertest");
const http = require("http");
const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const axios = require("axios");

jest.mock("axios");

const authRoutes = require("../routes/authRoutes");
const typeDefs = require("../graphql/schema");
const resolvers = require("../graphql/resolvers");

let app, apolloServer;

beforeAll(async () => {
  // Connect to MongoDB for persistence
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Set up Express + GraphQL
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

describe("GraphQL suggestions", () => {
  const JWT = process.env.TEST_GITHUB_JWT;
  if (!JWT) {
    console.warn(
      "⚠️  Please set TEST_GITHUB_JWT in your .env to run suggestions tests"
    );
    return;
  }

  it("errors when SUGGESTION_API_URL is not set", async () => {
    delete process.env.SUGGESTION_API_URL; // ensure it's undefined

    const res = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${JWT}`)
      .send({
        query: `
          mutation {
            generateSuggestions(prId: "123", diff: "dummy diff") {
              id
            }
          }
        `,
      });

    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].message).toMatch(
      /Suggestion API endpoint not configured/
    );
  });

  it("generates suggestions when SUGGESTION_API_URL is set", async () => {
    // 1. Configure the env var
    process.env.SUGGESTION_API_URL = "http://fake-api.local/analyze";

    // 2. Stub axios.post to return a dummy suggestion
    const dummySuggestion = {
      prId: "123",
      category: "style",
      message: "Test suggestion",
      line: 1,
    };
    axios.post.mockResolvedValue({ data: [dummySuggestion] });

    // 3. Call the mutation
    const genRes = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${JWT}`)
      .send({
        query: `
          mutation($prId: String!, $diff: String!) {
            generateSuggestions(prId: $prId, diff: $diff) {
              id
              prId
              category
              message
              line
              createdAt
            }
          }
        `,
        variables: { prId: "123", diff: "example diff" },
      });

    // 4. Assert the response matches our stub
    const generated = genRes.body.data.generateSuggestions;
    expect(generated).toBeInstanceOf(Array);
    expect(generated).toEqual(
      expect.arrayContaining([expect.objectContaining(dummySuggestion)])
    );
  });
});
