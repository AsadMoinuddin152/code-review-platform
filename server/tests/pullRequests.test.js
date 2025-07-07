require("dotenv").config();
const request = require("supertest");
const http = require("http");
const express = require("express");
const { ApolloServer } = require("apollo-server-express");

const authRoutes = require("../routes/authRoutes");
const typeDefs = require("../graphql/schema");
const resolvers = require("../graphql/resolvers");

let appServer, app;

beforeAll(async () => {
  const expressApp = express();
  expressApp.use(express.json());
  expressApp.use("/auth", authRoutes);

  appServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      const header = req.headers.authorization || "";
      const token = header.replace("Bearer ", "");
      return { token };
    },
  });
  await appServer.start();
  appServer.applyMiddleware({ app: expressApp, path: "/graphql" });

  app = http.createServer(expressApp);
});

afterAll(async () => {
  await appServer.stop();
});

describe("GraphQL /pullRequests", () => {
  const JWT = process.env.TEST_GITHUB_JWT;
  if (!JWT) {
    console.warn(
      "⚠️  Please set TEST_GITHUB_JWT in your .env to run pullRequests tests"
    );
    return;
  }

  it("errors without token", async () => {
    const res = await request(app).post("/graphql").send({
      query: 'query { pullRequests(ownerLogin:"foo",repoName:"bar"){id} }',
    });
    expect(res.body.errors).toBeDefined();
  });

  it("dynamically fetches a repo then returns its pullRequests", async () => {
    // 1) Fetch your repos
    const reposRes = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${JWT}`)
      .send({ query: "{ repos { ownerLogin name } }" });
    expect(reposRes.body.data.repos).toBeInstanceOf(Array);
    expect(reposRes.body.data.repos.length).toBeGreaterThan(0);

    const { ownerLogin, name: repoName } = reposRes.body.data.repos[0];

    // 2) Fetch pull requests for the first repo
    const prRes = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${JWT}`)
      .send({
        query: `
          query($owner:String!,$repo:String!){
            pullRequests(ownerLogin:$owner,repoName:$repo){
              id number title authorLogin merged createdAt
            }
          }
        `,
        variables: { owner: ownerLogin, repo: repoName },
      });

    expect(prRes.body.data.pullRequests).toBeInstanceOf(Array);
    // We don't know if there are PRs—just assert the shape if non-empty
    if (prRes.body.data.pullRequests.length > 0) {
      const pr = prRes.body.data.pullRequests[0];
      expect(pr).toHaveProperty("id");
      expect(typeof pr.number).toBe("number");
      expect(typeof pr.title).toBe("string");
      expect(typeof pr.authorLogin).toBe("string");
    }
  });
});
