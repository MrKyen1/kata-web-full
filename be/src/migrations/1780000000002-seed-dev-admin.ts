import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDevAdmin1780000000002 implements MigrationInterface {
  name = 'SeedDevAdmin1780000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO users (
        id,
        code,
        hashed_password,
        full_name,
        date_of_birth,
        phone,
        email,
        role_id,
        start_date,
        password_changed_at
      )
      VALUES (
        '018f7f76-0000-7000-8000-000000000301',
        'admin',
        '$argon2id$v=19$m=65536,t=3,p=4$amJBYYQVtLQcKZpKtMeT/g$GPi0pRupKfji9SitNJdtxoPjR5KPogsF99ecNYr0XaY',
        'System Administrator',
        '1990-01-01',
        '0000000000',
        'admin@kata.edu',
        '018f7f76-0000-7000-8000-000000000001',
        now(),
        now()
      )
      ON CONFLICT (code) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM users WHERE code = 'admin'`);
  }
}
