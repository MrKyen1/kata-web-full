import { Uuidv7PrimaryColumn } from 'src/common/decorators/uuidv7.decorator';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { MediaAsset } from './media-asset.entity';
import { Question } from './question.entity';

@Entity('question_media')
@Index(['questionId', 'role'])
export class QuestionMedia extends BaseEntity {
  @Uuidv7PrimaryColumn()
  id!: string;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId!: string;

  @ManyToOne(() => Question, (question) => question.media, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'question_id' })
  question!: Question;

  @Column({ name: 'media_id', type: 'uuid' })
  mediaId!: string;

  @ManyToOne(() => MediaAsset, (media) => media.questionMedia, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'media_id' })
  media!: MediaAsset;

  @Column()
  role!: string;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  orderIndex!: number;
}
