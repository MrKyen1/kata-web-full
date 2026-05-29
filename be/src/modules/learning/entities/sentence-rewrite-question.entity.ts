import { Uuidv7PrimaryColumn } from 'src/common/decorators/uuidv7.decorator';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinColumn, OneToOne, Unique } from 'typeorm';
import { GradingMode } from '../enums/learning.enums';
import { Question } from './question.entity';

@Entity('sentence_rewrite_questions')
@Unique(['questionId'])
export class SentenceRewriteQuestion extends BaseEntity {
  @Uuidv7PrimaryColumn()
  id!: string;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId!: string;

  @OneToOne(() => Question, (question) => question.sentenceRewriteDetail, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'question_id' })
  question!: Question;

  @Column({ name: 'source_sentence', type: 'text' })
  sourceSentence!: string;

  @Column({ name: 'accepted_answers', type: 'text', array: true })
  acceptedAnswers!: string[];

  @Column({
    name: 'grading_mode',
    type: 'enum',
    enum: GradingMode,
    enumName: 'grading_mode_enum',
    default: GradingMode.NORMALIZED,
  })
  gradingMode!: GradingMode;
}
