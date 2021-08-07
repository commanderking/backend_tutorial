import { Field, ObjectType } from "type-graphql";
import { Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity } from "typeorm";

@ObjectType()
@Entity() 
export class Activity extends BaseEntity {
    @Field()
    @PrimaryGeneratedColumn()
    id: number;

    @Field(() => Date)
    @CreateDateColumn()
    createdAt: Date;

    @Field(() => Date)
    @UpdateDateColumn()
    updatedAt: Date;
}