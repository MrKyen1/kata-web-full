import { Uuidv7PrimaryColumn } from 'src/common/decorators/uuidv7.decorator';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinColumn, OneToOne, Unique } from 'typeorm';
import { Question } from './question.entity';

@Entity('error_correction_questions')
@Unique(['questionId'])
export class ErrorCorrectionQuestion extends BaseEntity {
  @Uuidv7PrimaryColumn()
  id!: string;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId!: string;

  @OneToOne(() => Question, (question) => question.errorCorrectionDetail, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'question_id' })
  question!: Question;

  @Column({ name: 'incorrect_sentence', type: 'text' })
  incorrectSentence!: string;

  @Column({ name: 'correct_sentence', type: 'text' })
  correctSentence!: string;

  @Column({ name: 'error_spans', type: 'jsonb', default: () => "'[]'" })
  errorSpans!: Record<string, unknown>[];
}
