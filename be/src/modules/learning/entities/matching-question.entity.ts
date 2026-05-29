import { Uuidv7PrimaryColumn } from 'src/common/decorators/uuidv7.decorator';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinColumn, OneToOne, Unique } from 'typeorm';
import { Question } from './question.entity';

@Entity('matching_questions')
@Unique(['questionId'])
export class MatchingQuestion extends BaseEntity {
  @Uuidv7PrimaryColumn()
  id!: string;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId!: string;

  @OneToOne(() => Question, (question) => question.matchingDetail, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'question_id' })
  question!: Question;

  @Column({ name: 'shuffle_left', default: true })
  shuffleLeft!: boolean;

  @Column({ name: 'shuffle_right', default: true })
  shuffleRight!: boolean;
}
