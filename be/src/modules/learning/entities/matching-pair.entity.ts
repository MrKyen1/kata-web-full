import { Uuidv7PrimaryColumn } from 'src/common/decorators/uuidv7.decorator';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { MediaAsset } from './media-asset.entity';
import { Question } from './question.entity';

@Entity('matching_pairs')
export class MatchingPair extends BaseEntity {
  @Uuidv7PrimaryColumn()
  id!: string;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId!: string;

  @ManyToOne(() => Question, (question) => question.matchingPairs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'question_id' })
  question!: Question;

  @Column({ name: 'left_text', type: 'text', nullable: true })
  leftText!: string | null;

  @Column({ name: 'right_text', type: 'text', nullable: true })
  rightText!: string | null;

  @Column({ name: 'left_media_id', type: 'uuid', nullable: true })
  leftMediaId!: string | null;

  @ManyToOne(() => MediaAsset, (media) => media.leftMatchingPairs, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'left_media_id' })
  leftMedia?: MediaAsset | null;

  @Column({ name: 'right_media_id', type: 'uuid', nullable: true })
  rightMediaId!: string | null;

  @ManyToOne(() => MediaAsset, (media) => media.rightMatchingPairs, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'right_media_id' })
  rightMedia?: MediaAsset | null;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  orderIndex!: number;
}
