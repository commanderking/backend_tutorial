import { createConnection } from "typeorm";
import "dotenv-safe/config";
import "reflect-metadata";
import { Activity } from "./entities/Activity";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { ActivityResolver } from "./resolvers/activity";
import firebaseAdmin from "firebase-admin";
import cors from "cors";
import path from "path";

const origin =
  process.env.NODE_ENV === "development" ? true : "reasonloop.vercel.app";

const main = async () => {
  let retries = 5;
  while (retries) {
    try {
      await createConnection({
        type: "postgres",
        url: process.env.DATABASE_URL,
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        entities: [Activity],
        migrations: [path.join(__dirname, "./migrations/*")],
        // synchronize: process.env.NODE_ENV === "development"
      });
      console.log("connected to postgres");
      break;
    } catch (error) {
      retries -= 1;
      console.log(`Attempts remaining: ${retries}`);
      console.log(process.env.DATABASE_URL);
      console.log(process.env.DATABASE_USERNAME);
      console.log(process.env.PASSWORD);
      console.log("error", error);

      await new Promise((res) => setTimeout(res, 5000));
    }
  }

  await firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.applicationDefault(),
    projectId: "reasonloop",
  });

  const app = await express();
  app.use(cors({ origin }));

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [ActivityResolver],
      validate: false,
    }),
    context: async ({ req, res }) => {
      const token = req.headers.authorization || "";
      const user = await firebaseAdmin
        .auth()
        .verifyIdToken(token)
        .catch((error) => {
          console.log("error", error);
          return null;
        });

      return {
        req,
        res,
        user,
      };
    },
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  app.listen(process.env.PORT, () => {
    console.log("server started on localhost:4000");
  });
};

main();
