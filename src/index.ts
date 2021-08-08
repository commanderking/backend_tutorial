import { createConnection } from 'typeorm';
import "reflect-metadata";
import { Activity } from './entities/Activity';
import express from 'express';
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import {ActivityResolver } from "./resolvers/activity";
import firebaseAdmin from "firebase-admin";


const main = async () => {
     await createConnection({
        type: 'postgres',
        database: 'reasonloop', 
        entities: [Activity],
        synchronize: process.env.NODE_ENV === "development"
    })

    await firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.applicationDefault(),
         projectId: "reasonloop"
    });

    const app = await express();
    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [ActivityResolver],
            validate: false
        }),
        context: async ({req, res}) => {
            const token = req.headers.authorization || '';
            const user = await firebaseAdmin.auth().verifyIdToken(token).catch((error) => {
                console.log('error', error);
                return null;
            })
        
            return {
                req, res, user
            }
        },
    })

    await apolloServer.start();
    apolloServer.applyMiddleware({ app })

    app.listen(4000, () => {
        console.log('server started on localhost:4000');
    })
}

main();
