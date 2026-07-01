import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class BalanceSummary {
  @Field(() => ID)
  accountId!: string;

  @Field()
  currentBalance!: string;

  @Field()
  totalCredits!: string;

  @Field()
  totalDebits!: string;
}
