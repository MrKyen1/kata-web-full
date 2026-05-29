import { Uuidv7PrimaryColumn } from 'src/common/decorators/uuidv7.decorator';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { MediaType } from '../enums/learning.enums';
import { MatchingPair } from './matching-pair.entity';
import { QuestionMedia } from './question-media.entity';

@Entity('media_assets')
export class MediaAsset extends BaseEntity {
  @Uuidv7PrimaryColumn()
  id!: string;

  @Column({ type: 'enum', enum: MediaType, enumName: 'media_assets_type_enum' })
  type!: MediaType;

  @Column()
  url!: string;

  @Column({ name: 'storage_key', type: 'varchar', nullable: true })
  storageKey!: string | null;

  @Column({ name: 'mime_type', type: 'varchar', nullable: true })
  mimeType!: string | null;

  @Column({ name: 'duration_seconds', type: 'int', nullable: true })
  durationSeconds!: number | null;

  @Column({ type: 'int', nullable: true })
  width!: number | null;

  @Column({ type: 'int', nullable: true })
  height!: number | null;

  @Column({ name: 'alt_text', type: 'varchar', nullable: true })
  altText!: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata!: Record<string, unknown>;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(() => QuestionMedia, (questionMedia) => questionMedia.media)
  questionMedia!: QuestionMedia[];

  @OneToMany(() => MatchingPair, (pair) => pair.leftMedia)
  leftMatchingPairs!: MatchingPair[];

  @OneToMany(() => MatchingPair, (pair) => pair.rightMedia)
  rightMatchingPairs!: MatchingPair[];
}
