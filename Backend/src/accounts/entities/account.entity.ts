import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TransactionEntity } from '../../transactions/entities/transaction.entity';
import { UserEntity } from '../../users/entities/user.entity';

export enum AccountStatus {
  Active = 'ACTIVE',
  Frozen = 'FROZEN',
  Closed = 'CLOSED',
}

registerEnumType(AccountStatus, {
  name: 'AccountStatus',
});

@ObjectType('Account')
@Entity({ name: 'accounts' })
@Check('CHK_accounts_balance_non_negative', '"balance" >= 0')
export class AccountEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Index('IDX_accounts_owner_id')
  @Column({ type: 'uuid' })
  ownerId!: string;

  @Field()
  @Index('IDX_accounts_account_number', { unique: true })
  @Column({ type: 'varchar', length: 64 })
  accountNumber!: string;

  @Field()
  @Column({ type: 'char', length: 3 })
  currency!: string;

  @Field()
  @Column({ type: 'numeric', precision: 19, scale: 4, default: '0' })
  balance!: string;

  @Field(() => AccountStatus)
  @Column({
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.Active,
  })
  status!: AccountStatus;

  @Field()
  @Index('IDX_accounts_created_at')
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => UserEntity, (user) => user.accounts, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'ownerId',
    foreignKeyConstraintName: 'FK_accounts_owner_id_users_id',
  })
  owner!: UserEntity;

  @OneToMany(() => TransactionEntity, (transaction) => transaction.account)
  transactions!: TransactionEntity[];
}
