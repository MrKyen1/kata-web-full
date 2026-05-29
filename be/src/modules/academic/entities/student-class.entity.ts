import { Uuidv7PrimaryColumn } from 'src/common/decorators/uuidv7.decorator';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Class } from 'src/modules/academic/entities/class.entity';
import { Student } from 'src/modules/academic/entities/student.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

@Entity('student_classes')
@Index('uq_student_classes_active_pair', ['studentId', 'classId'], {
  unique: true,
  where: 'is_active = true',
})
export class StudentClass extends BaseEntity {
  @Uuidv7PrimaryColumn()
  id!: string;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId!: string;

  @Column({ name: 'class_id', type: 'uuid' })
  classId!: string;

  @ManyToOne(() => Student, (student) => student.classes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @ManyToOne(() => Class, (_class) => _class.studentClasses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'class_id' })
  class!: Class;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
