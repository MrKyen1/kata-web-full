import { Uuidv7PrimaryColumn } from 'src/common/decorators/uuidv7.decorator';
import { BaseEntity } from 'src/common/entities/base.entity';
import { TeacherClass } from 'src/modules/academic/entities/teacher-class.entity';
import { TeacherSpecialization } from 'src/modules/academic/entities/teacher-specialization.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';

@Entity('teachers')
export class Teacher extends BaseEntity {
  @Uuidv7PrimaryColumn()
  id!: string;

  @Column({ name: 'years_of_experience', type: 'int', nullable: true })
  yearsOfExperience!: number | null;

  @Column()
  description!: string;

  @Column({
    name: 'user_id',
    type: 'uuid',
    unique: true,
  })
  userId!: string;

  @OneToOne(() => User, (user) => user.teacher, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToMany(() => TeacherClass, (teacherClass) => teacherClass.teacher)
  classes!: TeacherClass[];

  @OneToMany(
    () => TeacherSpecialization,
    (teacherSpecialization) => teacherSpecialization.teacher,
  )
  teacherSpecializations!: TeacherSpecialization[];
}
