import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropUserPhoneEmailUnique1780000002000 implements MigrationInterface {
  name = 'DropUserPhoneEmailUnique1780000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_key`,
    );
    await queryRunner.query(
      `ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email)`,
    );
    await queryRunner.query(
      `ALTER TABLE users ADD CONSTRAINT users_phone_key UNIQUE (phone)`,
    );
  }
}
