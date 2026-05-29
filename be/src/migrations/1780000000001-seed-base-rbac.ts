import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedBaseRbac1780000000001 implements MigrationInterface {
  name = 'SeedBaseRbac1780000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO roles (id, code, name, description)
      VALUES
        ('018f7f76-0000-7000-8000-000000000001', 'admin', 'Administrator', 'System administrator'),
        ('018f7f76-0000-7000-8000-000000000002', 'teacher', 'Teacher', 'Teacher account'),
        ('018f7f76-0000-7000-8000-000000000003', 'student', 'Student', 'Student account')
      ON CONFLICT (code) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO permissions (id, code, name, description)
      VALUES
        ('018f7f76-0000-7000-8000-000000000101', 'users.manage', 'Manage users', 'Create, update and deactivate users'),
        ('018f7f76-0000-7000-8000-000000000102', 'rbac.manage', 'Manage RBAC', 'Manage roles and permissions'),
        ('018f7f76-0000-7000-8000-000000000103', 'learning.manage', 'Manage learning content', 'Manage curriculums, exams and questions'),
        ('018f7f76-0000-7000-8000-000000000104', 'classes.manage', 'Manage classes', 'Manage centers, classes, students and teachers'),
        ('018f7f76-0000-7000-8000-000000000105', 'request-logs.read', 'Read request logs', 'View operational request logs'),
        ('018f7f76-0000-7000-8000-000000000106', 'audit-logs.read', 'Read audit logs', 'View business audit logs')
      ON CONFLICT (code) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO role_permissions (id, role_id, permission_id)
      VALUES
        ('018f7f76-0000-7000-8000-000000000201', '018f7f76-0000-7000-8000-000000000001', '018f7f76-0000-7000-8000-000000000101'),
        ('018f7f76-0000-7000-8000-000000000202', '018f7f76-0000-7000-8000-000000000001', '018f7f76-0000-7000-8000-000000000102'),
        ('018f7f76-0000-7000-8000-000000000203', '018f7f76-0000-7000-8000-000000000001', '018f7f76-0000-7000-8000-000000000103'),
        ('018f7f76-0000-7000-8000-000000000204', '018f7f76-0000-7000-8000-000000000001', '018f7f76-0000-7000-8000-000000000104'),
        ('018f7f76-0000-7000-8000-000000000205', '018f7f76-0000-7000-8000-000000000002', '018f7f76-0000-7000-8000-000000000103'),
        ('018f7f76-0000-7000-8000-000000000206', '018f7f76-0000-7000-8000-000000000001', '018f7f76-0000-7000-8000-000000000105'),
        ('018f7f76-0000-7000-8000-000000000207', '018f7f76-0000-7000-8000-000000000001', '018f7f76-0000-7000-8000-000000000106')
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM role_permissions`);
    await queryRunner.query(`DELETE FROM permissions`);
    await queryRunner.query(`DELETE FROM roles`);
  }
}
