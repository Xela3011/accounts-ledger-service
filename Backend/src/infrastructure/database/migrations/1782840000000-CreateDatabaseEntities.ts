import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDatabaseEntities1782840000000 implements MigrationInterface {
  name = 'CreateDatabaseEntities1782840000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(
      `CREATE TYPE "public"."accounts_status_enum" AS ENUM('ACTIVE', 'FROZEN', 'CLOSED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transactions_type_enum" AS ENUM('CREDIT', 'DEBIT')`,
    );
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(320) NOT NULL,
        "passwordHash" character varying(255) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`
      CREATE TABLE "accounts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ownerId" uuid NOT NULL,
        "accountNumber" character varying(64) NOT NULL,
        "currency" character(3) NOT NULL,
        "balance" numeric(19,4) NOT NULL DEFAULT '0',
        "status" "public"."accounts_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_accounts_balance_non_negative" CHECK ("balance" >= 0),
        CONSTRAINT "PK_accounts_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_accounts_owner_id" ON "accounts" ("ownerId")`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_accounts_account_number" ON "accounts" ("accountNumber")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_accounts_created_at" ON "accounts" ("createdAt")`);
    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "accountId" uuid NOT NULL,
        "amount" numeric(19,4) NOT NULL,
        "type" "public"."transactions_type_enum" NOT NULL,
        "description" character varying(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_transactions_amount_positive" CHECK ("amount" > 0),
        CONSTRAINT "PK_transactions_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_transactions_account_id" ON "transactions" ("accountId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transactions_created_at" ON "transactions" ("createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transactions_account_id_created_at" ON "transactions" ("accountId", "createdAt")`,
    );
    await queryRunner.query(`
      ALTER TABLE "accounts"
      ADD CONSTRAINT "FK_accounts_owner_id_users_id"
      FOREIGN KEY ("ownerId") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD CONSTRAINT "FK_transactions_account_id_accounts_id"
      FOREIGN KEY ("accountId") REFERENCES "accounts"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_transactions_account_id_accounts_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" DROP CONSTRAINT "FK_accounts_owner_id_users_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_transactions_account_id_created_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_transactions_created_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_transactions_account_id"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_accounts_created_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_accounts_account_number"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_accounts_owner_id"`);
    await queryRunner.query(`DROP TABLE "accounts"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_email"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."accounts_status_enum"`);
  }
}
