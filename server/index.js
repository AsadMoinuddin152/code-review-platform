require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const mongoose = require('mongoose');
const http = require("http");
const { ApolloServer } = require("apollo-server-express");
const {
  ApolloServerPluginLandingPageGraphQLPlayground,
} = require("apollo-server-core");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/use/ws");
const { makeExecutableSchema } = require("@graphql-tools/schema");

const authRoutes = require("./routes/authRoutes");
const typeDefs = require("./graphql/schema");
const resolvers = require("./graphql/resolvers");
const pubsub = require("./pubsub");

async function start() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser:    true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, 
  });
  console.log('✅ MongoDB connected');
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const app = express();
  app.use(helmet());
  app.use(morgan("combined"));
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    })
  );
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );
  app.use(express.json());
  app.use("/auth", authRoutes);
  

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    schema,
    formatError: (err) => {
      const { message, locations, path, extensions } = err;
      return { message, locations, path, ...extensions };
    },
    introspection: true,
    context: ({ req }) => {
      const header = req.headers.authorization || "";
      const token = header.replace("Bearer ", "");
      return { token, pubsub };
    },
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
  });
  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: "/graphql" });

  const httpServer = http.createServer(app);

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  useServer(
    {
      schema: apolloServer.schema,
      schema,
      context: (ctx) => {
        const auth = ctx.connectionParams?.authorization || "";
        const token = auth.replace("Bearer ", "");
        return { token, pubsub };
      },
    },
    wsServer
  );

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    console.log(
      `🔒 OAuth callback at ${process.env.GITHUB_OAUTH_CALLBACK_URL}`
    );
  });
}

start().catch((err) => {
  console.error("Server failed to start", err);
  process.exit(1);
});
