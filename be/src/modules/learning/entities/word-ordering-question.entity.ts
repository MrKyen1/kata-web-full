import { Uuidv7PrimaryColumn } from 'src/common/decorators/uuidv7.decorator';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinColumn, OneToOne, Unique } from 'typeorm';
import { Question } from './question.entity';

@Entity('word_ordering_questions')
@Unique(['questionId'])
export class WordOrderingQuestion extends BaseEntity {
  @Uuidv7PrimaryColumn()
  id!: string;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId!: string;

  @OneToOne(() => Question, (question) => question.wordOrderingDetail, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'question_id' })
  question!: Question;

  @Column({ name: 'correct_tokens', type: 'text', array: true })
  correctTokens!: string[];

  @Column({ name: 'case_sensitive', default: false })
  caseSensitive!: boolean;

  @Column({ name: 'allow_punctuation_variants', default: true })
  allowPunctuationVariants!: boolean;
}
