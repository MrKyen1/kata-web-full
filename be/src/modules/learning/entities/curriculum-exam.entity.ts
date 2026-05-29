import { Uuidv7PrimaryColumn } from 'src/common/decorators/uuidv7.decorator';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Curriculum } from './curriculum.entity';
import { Exam } from './exam.entity';

@Entity('curriculum_exams')
@Index(['curriculumId', 'examId'])
@Index(['curriculumId', 'orderIndex'])
export class CurriculumExam extends BaseEntity {
  @Uuidv7PrimaryColumn()
  id!: string;

  @Column({ name: 'curriculum_id', type: 'uuid' })
  curriculumId!: string;

  @ManyToOne(() => Curriculum, (curriculum) => curriculum.curriculumExams, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'curriculum_id' })
  curriculum!: Curriculum;

  @Column({ name: 'exam_id', type: 'uuid' })
  examId!: string;

  @ManyToOne(() => Exam, (exam) => exam.curriculumExams, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'exam_id' })
  exam!: Exam;

  @Column({ name: 'order_index', type: 'int' })
  orderIndex!: number;

  @Column({ name: 'is_required', default: true })
  isRequired!: boolean;

  @Column({ name: 'available_from', type: 'timestamptz', nullable: true })
  availableFrom!: Date | null;

  @Column({ name: 'available_until', type: 'timestamptz', nullable: true })
  availableUntil!: Date | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
