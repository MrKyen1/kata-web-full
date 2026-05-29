import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClassNameUnique1780000004000 implements MigrationInterface {
  name = 'AddClassNameUnique1780000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE classes ADD CONSTRAINT classes_name_key UNIQUE (name)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_name_key`,
    );
  }
}
