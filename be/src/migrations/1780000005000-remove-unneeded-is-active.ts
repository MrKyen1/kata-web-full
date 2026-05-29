import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUnneededIsActive1780000005000 implements MigrationInterface {
  name = 'RemoveUnneededIsActive1780000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_question_options_question_order_active`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_question_options_question_order ON question_options(question_id, order_index)`,
    );

    await queryRunner.query(
      `ALTER TABLE student_classes DROP CONSTRAINT IF EXISTS student_classes_student_id_class_id_key`,
    );
    await queryRunner.query(
      `ALTER TABLE teacher_classes DROP CONSTRAINT IF EXISTS teacher_classes_teacher_id_class_id_key`,
    );
    await queryRunner.query(
      `ALTER TABLE teacher_specializations DROP CONSTRAINT IF EXISTS teacher_specializations_teacher_id_specialization_id_key`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_student_classes_active_pair ON student_classes(student_id, class_id) WHERE is_active = true`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_teacher_classes_active_pair ON teacher_classes(teacher_id, class_id) WHERE is_active = true`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_teacher_specializations_active_pair ON teacher_specializations(teacher_id, specialization_id) WHERE is_active = true`,
    );

    await queryRunner.query(`ALTER TABLE students DROP COLUMN is_active`);
    await queryRunner.query(`ALTER TABLE teachers DROP COLUMN is_active`);
    await queryRunner.query(
      `ALTER TABLE question_options DROP COLUMN is_active`,
    );
    await queryRunner.query(`ALTER TABLE matching_pairs DROP COLUMN is_active`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE matching_pairs ADD COLUMN is_active boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE question_options ADD COLUMN is_active boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE teachers ADD COLUMN is_active boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE students ADD COLUMN is_active boolean NOT NULL DEFAULT true`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS uq_teacher_specializations_active_pair`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS uq_teacher_classes_active_pair`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS uq_student_classes_active_pair`,
    );

    await queryRunner.query(
      `ALTER TABLE teacher_specializations ADD CONSTRAINT teacher_specializations_teacher_id_specialization_id_key UNIQUE (teacher_id, specialization_id)`,
    );
    await queryRunner.query(
      `ALTER TABLE teacher_classes ADD CONSTRAINT teacher_classes_teacher_id_class_id_key UNIQUE (teacher_id, class_id)`,
    );
    await queryRunner.query(
      `ALTER TABLE student_classes ADD CONSTRAINT student_classes_student_id_class_id_key UNIQUE (student_id, class_id)`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_question_options_question_order`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_question_options_question_order_active ON question_options(question_id, order_index, is_active)`,
    );
  }
}
