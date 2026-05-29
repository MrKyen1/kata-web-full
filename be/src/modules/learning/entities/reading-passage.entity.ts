import { Uuidv7PrimaryColumn } from 'src/common/decorators/uuidv7.decorator';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Level } from './level.entity';
import { ReadingComprehensionQuestion } from './reading-comprehension-question.entity';

@Entity('reading_passages')
export class ReadingPassage extends BaseEntity {
  @Uuidv7PrimaryColumn()
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', nullable: true })
  source!: string | null;

  @Column({ name: 'level_id', type: 'uuid', nullable: true })
  levelId!: string | null;

  @ManyToOne(() => Level, (level) => level.readingPassages, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'level_id' })
  level?: Level | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata!: Record<string, unknown>;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(() => ReadingComprehensionQuestion, (detail) => detail.passage)
  questions!: ReadingComprehensionQuestion[];
}
