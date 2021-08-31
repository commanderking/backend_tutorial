import { createConnection } from "typeorm";
import "dotenv-safe/config";
import "reflect-metadata";
import { Activity } from "./entities/Activity";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { ActivityResolver } from "./resolvers/activity";
import cors from "cors";
import path from "path";

const origin =
  process.env.NODE_ENV === "development"
    ? true
    : ["https://parsewise.vercel.app/", "https://www.parsewise.com"];

const main = async () => {
  let retries = 5;
  while (retries) {
    try {
      console.log("process.env.DATABASE_URL", process.env.DATABASE_URL);
      await createConnection({
        type: "postgres",
        url: process.env.DATABASE_URL,
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        entities: [Activity],
        migrations: [path.join(__dirname, "./migrations/*")],
        migrationsRun: true,
      });
      console.log("connected to postgres");
      break;
    } catch (error) {
      retries -= 1;
      console.log(`Attempts remaining: ${retries}`);
      console.log("error", error);
      await new Promise((res) => setTimeout(res, 5000));
    }
  }

  const app = await express();
  app.use(cors({ origin }));

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [ActivityResolver],
      validate: false,
    }),
    context: async ({ req, res }) => {
      return {
        req,
        res,
      };
    },
  });

  app.get("/", (__, res) => {
    res.send("Hello World!");
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  app.listen(process.env.PORT, () => {
    console.log("server started on localhost:4000");
  });
};

main();
