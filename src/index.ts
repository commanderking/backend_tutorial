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
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { UserInfo } from "types/auth";

const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, function (error, key) {
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

const options = {
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ["RS256" as const],
};

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
    context: async ({ req }) => {
      try {
        // simple auth check on every request
        const authHeader = req.headers.authorization;

        if (!authHeader) {
          return { user: null };
        }

        const token = authHeader.split(" ")[1];
        const userInfo: UserInfo = await new Promise((resolve, reject) => {
          jwt.verify(token, getKey, options, (err, decoded: any) => {
            if (err) {
              return reject(err);
            }
            resolve(decoded);
          });
        });

        if (!userInfo) {
          return {
            user: null,
          };
        }

        return {
          user: {
            id: userInfo["https://parsewise.com/identities"][0].user_id,
            email: userInfo["https://parsewise.com/email"],
          },
        };
      } catch (error) {
        console.log("error", error);
        return {
          user: null,
        };
      }
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
