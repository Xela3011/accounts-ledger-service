import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserNameFields1782926400000 implements MigrationInterface {
  name = 'AddUserNameFields1782926400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "name" character varying(120)`);
    await queryRunner.query(`ALTER TABLE "users" ADD "lastName" character varying(120)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastName"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
  }
}
