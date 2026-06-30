import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AccountEntity } from '../../accounts/entities/account.entity';

export enum TransactionType {
  Credit = 'CREDIT',
  Debit = 'DEBIT',
}

registerEnumType(TransactionType, {
  name: 'TransactionType',
});

@ObjectType('Transaction')
@Entity({ name: 'transactions' })
@Check('CHK_transactions_amount_positive', '"amount" > 0')
@Index('IDX_transactions_account_id_created_at', ['accountId', 'createdAt'])
export class TransactionEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Index('IDX_transactions_account_id')
  @Column({ type: 'uuid' })
  accountId!: string;

  @Field()
  @Column({ type: 'numeric', precision: 19, scale: 4 })
  amount!: string;

  @Field(() => TransactionType)
  @Column({ type: 'enum', enum: TransactionType })
  type!: TransactionType;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @Field()
  @Index('IDX_transactions_created_at')
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => AccountEntity, (account) => account.transactions, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'accountId',
    foreignKeyConstraintName: 'FK_transactions_account_id_accounts_id',
  })
  account!: AccountEntity;
}
