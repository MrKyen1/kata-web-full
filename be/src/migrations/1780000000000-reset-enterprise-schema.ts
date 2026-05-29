import { MigrationInterface, QueryRunner } from 'typeorm';

export class ResetEnterpriseSchema1780000000000 implements MigrationInterface {
  name = 'ResetEnterpriseSchema1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP SCHEMA IF EXISTS public CASCADE`);
    await queryRunner.query(`CREATE SCHEMA public`);
    await queryRunner.query(`
      CREATE TABLE migrations (
        id SERIAL NOT NULL,
        timestamp bigint NOT NULL,
        name varchar NOT NULL UNIQUE,
        CONSTRAINT pk_migrations PRIMARY KEY (id)
      )
    `);
    await queryRunner.query(
      `CREATE TYPE content_status_enum AS ENUM ('draft', 'published', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TYPE questions_type_enum AS ENUM ('multiple_choice', 'audio_choice', 'word_ordering', 'reading_comprehension', 'sentence_rewrite', 'hint_rewrite', 'error_correction', 'image_choice', 'matching')`,
    );
    await queryRunner.query(
      `CREATE TYPE media_assets_type_enum AS ENUM ('audio', 'image', 'video')`,
    );
    await queryRunner.query(
      `CREATE TYPE grading_mode_enum AS ENUM ('exact', 'normalized', 'manual')`,
    );

    await queryRunner.query(`
      CREATE TABLE roles (
        id uuid PRIMARY KEY,
        code varchar NOT NULL UNIQUE,
        name varchar NOT NULL UNIQUE,
        description varchar,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE permissions (
        id uuid PRIMARY KEY,
        code varchar NOT NULL UNIQUE,
        name varchar NOT NULL UNIQUE,
        description varchar,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE role_permissions (
        id uuid PRIMARY KEY,
        role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (role_id, permission_id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE centers (
        id uuid PRIMARY KEY,
        name varchar NOT NULL UNIQUE,
        address varchar NOT NULL,
        phone varchar NOT NULL,
        email varchar NOT NULL,
        description varchar,
        image varchar,
        map_embed_url varchar,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE users (
        id uuid PRIMARY KEY,
        code varchar NOT NULL UNIQUE,
        hashed_password varchar NOT NULL,
        full_name varchar NOT NULL,
        date_of_birth date NOT NULL,
        phone varchar NOT NULL,
        email varchar,
        address varchar,
        role_id uuid NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
        avatar varchar,
        start_date timestamp NOT NULL,
        end_date timestamp,
        last_login_at timestamptz,
        password_changed_at timestamptz,
        failed_login_count int NOT NULL DEFAULT 0,
        locked_until timestamptz,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE students (
        id uuid PRIMARY KEY,
        user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE teachers (
        id uuid PRIMARY KEY,
        user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        years_of_experience int,
        description varchar NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE classes (
        id uuid PRIMARY KEY,
        name varchar NOT NULL,
        center_id uuid NOT NULL REFERENCES centers(id) ON DELETE RESTRICT,
        description varchar,
        image varchar,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE student_classes (
        id uuid PRIMARY KEY,
        student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (student_id, class_id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE teacher_classes (
        id uuid PRIMARY KEY,
        teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
        class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (teacher_id, class_id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE specializations (
        id uuid PRIMARY KEY,
        name varchar NOT NULL UNIQUE,
        code varchar NOT NULL UNIQUE,
        description varchar,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE teacher_specializations (
        id uuid PRIMARY KEY,
        teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
        specialization_id uuid NOT NULL REFERENCES specializations(id) ON DELETE CASCADE,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (teacher_id, specialization_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE levels (
        id uuid PRIMARY KEY,
        code varchar NOT NULL UNIQUE,
        name varchar NOT NULL,
        rank int NOT NULL DEFAULT 0,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE skills (
        id uuid PRIMARY KEY,
        code varchar NOT NULL UNIQUE,
        name varchar NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE topics (
        id uuid PRIMARY KEY,
        code varchar NOT NULL,
        name varchar NOT NULL,
        parent_id uuid REFERENCES topics(id) ON DELETE RESTRICT,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (parent_id, code)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE tags (
        id uuid PRIMARY KEY,
        code varchar NOT NULL UNIQUE,
        name varchar NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE media_assets (
        id uuid PRIMARY KEY,
        type media_assets_type_enum NOT NULL,
        url varchar NOT NULL,
        storage_key varchar,
        mime_type varchar,
        duration_seconds int,
        width int,
        height int,
        alt_text varchar,
        metadata jsonb NOT NULL DEFAULT '{}',
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE reading_passages (
        id uuid PRIMARY KEY,
        title varchar NOT NULL,
        content text NOT NULL,
        source varchar,
        level_id uuid REFERENCES levels(id) ON DELETE RESTRICT,
        metadata jsonb NOT NULL DEFAULT '{}',
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE curriculums (
        id uuid PRIMARY KEY,
        code varchar NOT NULL UNIQUE,
        title varchar NOT NULL,
        description text,
        level_id uuid REFERENCES levels(id) ON DELETE RESTRICT,
        status content_status_enum NOT NULL DEFAULT 'draft',
        metadata jsonb NOT NULL DEFAULT '{}',
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE exams (
        id uuid PRIMARY KEY,
        code varchar NOT NULL UNIQUE,
        title varchar NOT NULL,
        description text,
        status content_status_enum NOT NULL DEFAULT 'draft',
        time_limit_seconds int,
        metadata jsonb NOT NULL DEFAULT '{}',
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE questions (
        id uuid PRIMARY KEY,
        type questions_type_enum NOT NULL,
        prompt text NOT NULL,
        instruction text,
        difficulty_level_id uuid REFERENCES levels(id) ON DELETE RESTRICT,
        skill_id uuid REFERENCES skills(id) ON DELETE RESTRICT,
        topic_id uuid REFERENCES topics(id) ON DELETE RESTRICT,
        explanation text,
        status content_status_enum NOT NULL DEFAULT 'draft',
        metadata jsonb NOT NULL DEFAULT '{}',
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_questions_type_status_active ON questions(type, status, is_active)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_questions_skill_level ON questions(skill_id, difficulty_level_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_questions_topic ON questions(topic_id)`,
    );
    await queryRunner.query(`
      CREATE TABLE question_options (
        id uuid PRIMARY KEY,
        question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        label varchar,
        content text NOT NULL,
        is_correct boolean NOT NULL DEFAULT false,
        order_index int NOT NULL DEFAULT 0,
        explanation text,
        metadata jsonb NOT NULL DEFAULT '{}',
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_question_options_question_order_active ON question_options(question_id, order_index, is_active)`,
    );
    await queryRunner.query(`
      CREATE TABLE question_media (
        id uuid PRIMARY KEY,
        question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        media_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
        role varchar NOT NULL,
        order_index int NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_question_media_question_role ON question_media(question_id, role)`,
    );
    await queryRunner.query(`
      CREATE TABLE question_tags (
        id uuid PRIMARY KEY,
        question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE RESTRICT,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (question_id, tag_id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE word_ordering_questions (
        id uuid PRIMARY KEY,
        question_id uuid NOT NULL UNIQUE REFERENCES questions(id) ON DELETE CASCADE,
        correct_tokens text[] NOT NULL,
        case_sensitive boolean NOT NULL DEFAULT false,
        allow_punctuation_variants boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE reading_comprehension_questions (
        id uuid PRIMARY KEY,
        question_id uuid NOT NULL UNIQUE REFERENCES questions(id) ON DELETE CASCADE,
        passage_id uuid NOT NULL REFERENCES reading_passages(id) ON DELETE RESTRICT,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE sentence_rewrite_questions (
        id uuid PRIMARY KEY,
        question_id uuid NOT NULL UNIQUE REFERENCES questions(id) ON DELETE CASCADE,
        source_sentence text NOT NULL,
        accepted_answers text[] NOT NULL,
        grading_mode grading_mode_enum NOT NULL DEFAULT 'normalized',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE hint_rewrite_questions (
        id uuid PRIMARY KEY,
        question_id uuid NOT NULL UNIQUE REFERENCES questions(id) ON DELETE CASCADE,
        source_sentence text NOT NULL,
        hint_word varchar NOT NULL,
        accepted_answers text[] NOT NULL,
        must_use_hint boolean NOT NULL DEFAULT true,
        grading_mode grading_mode_enum NOT NULL DEFAULT 'normalized',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE error_correction_questions (
        id uuid PRIMARY KEY,
        question_id uuid NOT NULL UNIQUE REFERENCES questions(id) ON DELETE CASCADE,
        incorrect_sentence text NOT NULL,
        correct_sentence text NOT NULL,
        error_spans jsonb NOT NULL DEFAULT '[]',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE matching_questions (
        id uuid PRIMARY KEY,
        question_id uuid NOT NULL UNIQUE REFERENCES questions(id) ON DELETE CASCADE,
        shuffle_left boolean NOT NULL DEFAULT true,
        shuffle_right boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE matching_pairs (
        id uuid PRIMARY KEY,
        question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        left_text text,
        right_text text,
        left_media_id uuid REFERENCES media_assets(id) ON DELETE RESTRICT,
        right_media_id uuid REFERENCES media_assets(id) ON DELETE RESTRICT,
        order_index int NOT NULL DEFAULT 0,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE curriculum_exams (
        id uuid PRIMARY KEY,
        curriculum_id uuid NOT NULL REFERENCES curriculums(id) ON DELETE CASCADE,
        exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
        order_index int NOT NULL,
        is_required boolean NOT NULL DEFAULT true,
        available_from timestamptz,
        available_until timestamptz,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_curriculum_exams_active_exam ON curriculum_exams(curriculum_id, exam_id) WHERE is_active = true`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_curriculum_exams_active_order ON curriculum_exams(curriculum_id, order_index) WHERE is_active = true`,
    );
    await queryRunner.query(`
      CREATE TABLE exam_questions (
        id uuid PRIMARY KEY,
        exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
        question_id uuid NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
        order_index int NOT NULL,
        score numeric(6,2) NOT NULL DEFAULT 1,
        is_required boolean NOT NULL DEFAULT true,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_exam_questions_active_question ON exam_questions(exam_id, question_id) WHERE is_active = true`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_exam_questions_active_order ON exam_questions(exam_id, order_index) WHERE is_active = true`,
    );

    await queryRunner.query(`
      CREATE TABLE auth_refresh_tokens (
        id uuid PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash varchar NOT NULL,
        expires_at timestamptz NOT NULL,
        revoked_at timestamptz,
        ip_address varchar,
        user_agent text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_auth_refresh_tokens_user_revoked ON auth_refresh_tokens(user_id, revoked_at)`,
    );
    await queryRunner.query(`
      CREATE TABLE audit_logs (
        id uuid PRIMARY KEY,
        actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
        action varchar NOT NULL,
        resource varchar NOT NULL,
        resource_id varchar,
        request_id varchar,
        payload jsonb NOT NULL DEFAULT '{}',
        ip_address varchar,
        user_agent text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_audit_logs_actor_resource ON audit_logs(actor_id, resource)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_audit_logs_request_id ON audit_logs(request_id)`,
    );
    await queryRunner.query(`
      CREATE TABLE request_logs (
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
      `CREATE INDEX idx_request_logs_request_id ON request_logs(request_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_request_logs_user_created ON request_logs(user_id, created_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_request_logs_status_created ON request_logs(status_code, created_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_request_logs_created ON request_logs(created_at)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP SCHEMA IF EXISTS public CASCADE`);
    await queryRunner.query(`CREATE SCHEMA public`);
  }
}
