require("dotenv").config();
const request = require("supertest");
const http = require("http");
const express = require("express");
const { ApolloServer } = require("apollo-server-express");

const authRoutes = require("../routes/authRoutes");
const typeDefs = require("../graphql/schema");
const resolvers = require("../graphql/resolvers");

let app, server;

beforeAll(async () => {
  const expressApp = express();
  expressApp.use(express.json());
  expressApp.use("/auth", authRoutes);

  server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      const header = req.headers.authorization || "";
      const token = header.replace("Bearer ", "");
      return { token };
    },
  });
  await server.start();
  server.applyMiddleware({ app: expressApp, path: "/graphql" });

  app = http.createServer(expressApp);
});

afterAll(async () => {
  await server.stop();
});

describe("GraphQL /me", () => {
  it("returns null without token", async () => {
    const res = await request(app)
      .post("/graphql")
      .send({ query: "{ me { login } }" });
    expect(res.body.data.me).toBeNull();
  });
});
