import { createConnection, getRepository } from 'typeorm';
import "reflect-metadata";
import { Activity } from './entities/Activity';


const main = async () => {
    const connection = await createConnection({
        type: 'postgres',
        database: 'reasonloop', 
        entities: [Activity],
        synchronize: process.env.NODE_ENV === "development"
    })

    console.log('connection', connection);

    const activityRepository = getRepository(Activity);

    let activity = new Activity();

    await activityRepository.save(activity);

    let activities = await activityRepository.find();
    console.log('activities', activities);


}

main();