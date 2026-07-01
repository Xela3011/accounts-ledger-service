import { Field, InputType } from '@nestjs/graphql';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

@InputType()
export class CreateAccountInput {
  @Field()
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/)
  currency!: string;
}
