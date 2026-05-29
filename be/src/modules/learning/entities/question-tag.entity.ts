import { Uuidv7PrimaryColumn } from 'src/common/decorators/uuidv7.decorator';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { Question } from './question.entity';
import { Tag } from './tag.entity';

@Entity('question_tags')
@Unique(['questionId', 'tagId'])
export class QuestionTag extends BaseEntity {
  @Uuidv7PrimaryColumn()
  id!: string;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId!: string;

  @ManyToOne(() => Question, (question) => question.questionTags, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'question_id' })
  question!: Question;

  @Column({ name: 'tag_id', type: 'uuid' })
  tagId!: string;

  @ManyToOne(() => Tag, (tag) => tag.questionTags, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tag_id' })
  tag!: Tag;
}
