import { Resolver, Query, Arg, Ctx, Mutation } from "type-graphql";
import { Activity } from "../entities/Activity";
import { UserContext } from "types/context";

@Resolver()
export class ActivityResolver {
  @Query(() => [Activity])
  async activities(@Ctx() ctx: UserContext) {
    console.log("ctx", ctx);

    if (!ctx.user) {
      return [];
    }
    return Activity.find();
  }

  @Query(() => Activity, { nullable: true })
  activity(@Arg("id") id: number) {
    return Activity.findOne(id);
  }

  @Mutation(() => Activity)
  async createActivity() {
    return await Activity.create().save();
  }
}
