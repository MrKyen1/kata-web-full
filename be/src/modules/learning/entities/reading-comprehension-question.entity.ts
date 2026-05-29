import { Uuidv7PrimaryColumn } from 'src/common/decorators/uuidv7.decorator';
import { BaseEntity } from 'src/common/entities/base.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  Unique,
} from 'typeorm';
import { Question } from './question.entity';
import { ReadingPassage } from './reading-passage.entity';

@Entity('reading_comprehension_questions')
@Unique(['questionId'])
export class ReadingComprehensionQuestion extends BaseEntity {
  @Uuidv7PrimaryColumn()
  id!: string;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId!: string;

  @OneToOne(() => Question, (question) => question.readingComprehensionDetail, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'question_id' })
  question!: Question;

  @Column({ name: 'passage_id', type: 'uuid' })
  passageId!: string;

  @ManyToOne(() => ReadingPassage, (passage) => passage.questions, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'passage_id' })
  passage!: ReadingPassage;
}
