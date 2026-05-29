import { Uuidv7PrimaryColumn } from 'src/common/decorators/uuidv7.decorator';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Center } from 'src/modules/academic/entities/center.entity';
import { StudentClass } from 'src/modules/academic/entities/student-class.entity';
import { TeacherClass } from 'src/modules/academic/entities/teacher-class.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('classes')
export class Class extends BaseEntity {
  @Uuidv7PrimaryColumn()
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ name: 'center_id', type: 'uuid' })
  centerId!: string;

  @ManyToOne(() => Center, (center) => center.classes, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'center_id' })
  center!: Center;

  @Column({ type: 'varchar', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', nullable: true })
  image!: string | null;

  @OneToMany(() => StudentClass, (studentClass) => studentClass.class)
  studentClasses!: StudentClass[];

  @OneToMany(() => TeacherClass, (teacherClass) => teacherClass.class)
  teacherClasses!: TeacherClass[];

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
