import { Field, ID, InputType } from '@nestjs/graphql';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsOptional, IsString, IsUUID, Length, Matches, MaxLength } from 'class-validator';

@InputType()
export class TransactionInput {
  @Field(() => ID)
  @IsUUID('4')
  accountId!: string;

  @Field()
  @Transform(({ value }: TransformFnParams) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^(?:0|[1-9]\d*)(?:\.\d{1,4})?$/)
  amount!: string;

  @Field(() => String, { nullable: true })
  @Transform(({ value }: TransformFnParams) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  description?: string | null;
}
