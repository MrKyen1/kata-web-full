import { Uuidv7PrimaryColumn } from 'src/common/decorators/uuidv7.decorator';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Class } from 'src/modules/academic/entities/class.entity';
import { Teacher } from 'src/modules/academic/entities/teacher.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

@Entity('teacher_classes')
@Index('uq_teacher_classes_active_pair', ['teacherId', 'classId'], {
  unique: true,
  where: 'is_active = true',
})
export class TeacherClass extends BaseEntity {
  @Uuidv7PrimaryColumn()
  id!: string;

  @Column({ name: 'teacher_id', type: 'uuid' })
  teacherId!: string;

  @Column({ name: 'class_id', type: 'uuid' })
  classId!: string;

  @ManyToOne(() => Teacher, (teacher) => teacher.classes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'teacher_id' })
  teacher!: Teacher;

  @ManyToOne(() => Class, (_class) => _class.teacherClasses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'class_id' })
  class!: Class;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
