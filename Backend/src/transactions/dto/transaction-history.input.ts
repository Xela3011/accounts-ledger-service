import { Field, GraphQLISODateTime, ID, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { TransactionType } from '../entities/transaction.entity';

@InputType()
export class TransactionHistoryInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID('4')
  accountId?: string;

  @Field(() => TransactionType, { nullable: true })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;

  @Field(() => Int, { nullable: true, defaultValue: 25 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}
