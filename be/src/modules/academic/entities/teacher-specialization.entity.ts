import { Uuidv7PrimaryColumn } from 'src/common/decorators/uuidv7.decorator';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Specialization } from 'src/modules/academic/entities/specialization.entity';
import { Teacher } from 'src/modules/academic/entities/teacher.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

@Entity('teacher_specializations')
@Index(
  'uq_teacher_specializations_active_pair',
  ['teacherId', 'specializationId'],
  {
    unique: true,
    where: 'is_active = true',
  },
)
export class TeacherSpecialization extends BaseEntity {
  @Uuidv7PrimaryColumn()
  id!: string;

  @Column({ name: 'teacher_id', type: 'uuid' })
  teacherId!: string;

  @Column({ name: 'specialization_id', type: 'uuid' })
  specializationId!: string;

  @ManyToOne(() => Teacher, (teacher) => teacher.teacherSpecializations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'teacher_id' })
  teacher!: Teacher;

  @ManyToOne(
    () => Specialization,
    (specialization) => specialization.teacherSpecializations,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'specialization_id' })
  specialization!: Specialization;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
