import { Resolver, Query, Arg, Mutation } from "type-graphql";
import { Activity } from "../entities/Activity";


@Resolver()
export class ActivityResolver {
    @Query(() => [Activity])
    async activities() {
        return Activity.find();
    }

    @Query(() => Activity, { nullable: true }) 
    activity(@Arg("id") id: number) {
        return Activity.findOne(id)
    }

    @Mutation(() => Activity)
    async createActivity() {
        return await Activity.create().save();
    }
}