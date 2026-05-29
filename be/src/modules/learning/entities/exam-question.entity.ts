import { Uuidv7PrimaryColumn } from 'src/common/decorators/uuidv7.decorator';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Exam } from './exam.entity';
import { Question } from './question.entity';

@Entity('exam_questions')
@Index(['examId', 'questionId'])
@Index(['examId', 'orderIndex'])
export class ExamQuestion extends BaseEntity {
  @Uuidv7PrimaryColumn()
  id!: string;

  @Column({ name: 'exam_id', type: 'uuid' })
  examId!: string;

  @ManyToOne(() => Exam, (exam) => exam.examQuestions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_id' })
  exam!: Exam;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId!: string;

  @ManyToOne(() => Question, (question) => question.examQuestions, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'question_id' })
  question!: Question;

  @Column({ name: 'order_index', type: 'int' })
  orderIndex!: number;

  @Column({ type: 'numeric', precision: 6, scale: 2, default: 1 })
  score!: string;

  @Column({ name: 'is_required', default: true })
  isRequired!: boolean;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
