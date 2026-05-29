import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRequestAndAuditLogging1780000001000 implements MigrationInterface {
  name = 'AddRequestAndAuditLogging1780000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS request_logs (
        id uuid PRIMARY KEY,
        request_id varchar NOT NULL,
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        method varchar NOT NULL,
        path text NOT NULL,
        status_code int NOT NULL,
        duration_ms int NOT NULL,
        ip_address varchar,
        user_agent text,
        request_body jsonb NOT NULL DEFAULT '{}',
        query jsonb NOT NULL DEFAULT '{}',
        params jsonb NOT NULL DEFAULT '{}',
        error_code varchar,
        error_message text,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_request_logs_request_id ON request_logs(request_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_request_logs_user_created ON request_logs(user_id, created_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_request_logs_status_created ON request_logs(status_code, created_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_request_logs_created ON request_logs(created_at)`,
    );

    await queryRunner.query(
      `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS request_id varchar`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id ON audit_logs(request_id)`,
    );

    await queryRunner.query(`
      INSERT INTO permissions (id, code, name, description)
      VALUES
        ('018f7f76-0000-7000-8000-000000000105', 'request-logs.read', 'Read request logs', 'View operational request logs'),
        ('018f7f76-0000-7000-8000-000000000106', 'audit-logs.read', 'Read audit logs', 'View business audit logs')
      ON CONFLICT (code) DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO role_permissions (id, role_id, permission_id)
      VALUES
        ('018f7f76-0000-7000-8000-000000000206', '018f7f76-0000-7000-8000-000000000001', '018f7f76-0000-7000-8000-000000000105'),
        ('018f7f76-0000-7000-8000-000000000207', '018f7f76-0000-7000-8000-000000000001', '018f7f76-0000-7000-8000-000000000106')
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_logs_request_id`);
    await queryRunner.query(
      `ALTER TABLE audit_logs DROP COLUMN IF EXISTS request_id`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS request_logs`);
  }
}
