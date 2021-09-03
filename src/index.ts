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

const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
});

function getKey(header: any, callback: any) {
  console.log("client", client);
  client.getSigningKey(header.kid, function (error, key) {
    console.log(header.kid);
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

        console.log("authHeader", authHeader);

        if (!authHeader) {
          return { user: null };
        }

        const token = authHeader.split(" ")[1];
        console.log("token", token);
        const user = await new Promise((resolve, reject) => {
          jwt.verify(token, getKey, options, (err, decoded: any) => {
            if (err) {
              return reject(err);
            }
            console.log("decoded", decoded);
            resolve(decoded);
          });
        });

        const decoded: any = user;

        // On Auth0 token we add namespaced attributes including information about user's identity
        // https://auth0.com/docs/configure/apis/scopes/sample-use-cases-scopes-and-claims#add-custom-claims-to-a-token
        const namespace = "https://parsewise.com";

        console.log("decoded", decoded);
        if (!decoded) {
          return {
            user: null,
          };
        }
        return {
          user: {
            id: decoded[`${namespace}/identities`].user_id,
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
