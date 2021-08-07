import { createConnection, getRepository } from 'typeorm';
import "reflect-metadata";
import { Activity } from './entities/Activity';
import express from 'express';
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import {ActivityResolver } from "./resolvers/activity";

const main = async () => {
     await createConnection({
        type: 'postgres',
        database: 'reasonloop', 
        entities: [Activity],
        synchronize: process.env.NODE_ENV === "development"
    })

    const app = await express();


    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [ActivityResolver],
            validate: false
        }),
        context: ({req, res}) => ({ req, res })
    })

    await apolloServer.start();

    apolloServer.applyMiddleware({ app })


    app.listen(4000, () => {
        console.log('server started on localhost:4000');
    })

    const activityRepository = getRepository(Activity);

    // let activity = new Activity();

    // await activityRepository.save(activity);

    let activities = await activityRepository.find();
    // console.log('activities', activities);


}

main();