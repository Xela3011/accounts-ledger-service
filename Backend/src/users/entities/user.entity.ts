import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AccountEntity } from '../../accounts/entities/account.entity';

@ObjectType('User')
@Entity({ name: 'users' })
export class UserEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Index('IDX_users_email', { unique: true })
  @Column({ type: 'varchar', length: 320 })
  email!: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', length: 120, nullable: true })
  name?: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', length: 120, nullable: true })
  lastName?: string | null;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => AccountEntity, (account) => account.owner)
  accounts!: AccountEntity[];
}
