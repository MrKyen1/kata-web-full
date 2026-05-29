import { Uuidv7PrimaryColumn } from 'src/common/decorators/uuidv7.decorator';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ContentStatus } from '../enums/learning.enums';
import { CurriculumExam } from './curriculum-exam.entity';
import { Level } from './level.entity';

@Entity('curriculums')
export class Curriculum extends BaseEntity {
  @Uuidv7PrimaryColumn()
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'level_id', type: 'uuid', nullable: true })
  levelId!: string | null;

  @ManyToOne(() => Level, (level) => level.curriculums, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'level_id' })
  level?: Level | null;

  @Column({
    type: 'enum',
    enum: ContentStatus,
    enumName: 'content_status_enum',
    default: ContentStatus.DRAFT,
  })
  status!: ContentStatus;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata!: Record<string, unknown>;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(
    () => CurriculumExam,
    (curriculumExam) => curriculumExam.curriculum,
  )
  curriculumExams!: CurriculumExam[];
}
