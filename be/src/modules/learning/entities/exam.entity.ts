import { Uuidv7PrimaryColumn } from 'src/common/decorators/uuidv7.decorator';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { ContentStatus } from '../enums/learning.enums';
import { CurriculumExam } from './curriculum-exam.entity';
import { ExamQuestion } from './exam-question.entity';

@Entity('exams')
export class Exam extends BaseEntity {
  @Uuidv7PrimaryColumn()
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: ContentStatus,
    enumName: 'content_status_enum',
    default: ContentStatus.DRAFT,
  })
  status!: ContentStatus;

  @Column({ name: 'time_limit_seconds', type: 'int', nullable: true })
  timeLimitSeconds!: number | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata!: Record<string, unknown>;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(() => CurriculumExam, (curriculumExam) => curriculumExam.exam)
  curriculumExams!: CurriculumExam[];

  @OneToMany(() => ExamQuestion, (examQuestion) => examQuestion.exam)
  examQuestions!: ExamQuestion[];
}
