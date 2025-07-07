require("dotenv").config();
const express = require("express");
const http = require("http");
const { ApolloServer } = require("apollo-server-express");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const typeDefs = require("./graphql/schema");
const resolvers = require("./graphql/resolvers");

async function start() {
  const app = express();
  app.use(express.json());
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ MongoDB connected");
  app.use("/auth", authRoutes);

  // GraphQL setup
  const server = new ApolloServer({
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
  await server.start();
  server.applyMiddleware({ app, path: "/graphql" });

  // HTTP server
  http.createServer(app).listen(process.env.PORT, () => {
    console.log(
      `🚀 Server ready at http://localhost:${process.env.PORT}/graphql`
    );
    console.log(
      `🔒 OAuth callback at ${process.env.GITHUB_OAUTH_CALLBACK_URL}`
    );
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
