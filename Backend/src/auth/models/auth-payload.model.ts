import { Field, ObjectType } from '@nestjs/graphql';
import { UserEntity } from '../../users/entities/user.entity';

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken!: string;

  @Field(() => UserEntity)
  user!: UserEntity;
}
