import { Uuidv7PrimaryColumn } from 'src/common/decorators/uuidv7.decorator';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Role } from 'src/modules/rbac/entities/role.entity';
import { Student } from 'src/modules/academic/entities/student.entity';
import { Teacher } from 'src/modules/academic/entities/teacher.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

@Entity('users')
export class User extends BaseEntity {
  @Uuidv7PrimaryColumn()
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column({ name: 'hashed_password', select: false })
  hashedPassword!: string;

  @Column({ name: 'full_name' })
  fullName!: string;

  @Column({ type: 'date', name: 'date_of_birth' })
  dateOfBirth!: string;

  @Column()
  phone!: string;

  @Column({ type: 'varchar', nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', nullable: true })
  address!: string | null;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId!: string;

  @ManyToOne(() => Role, (role) => role.users, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @OneToOne(() => Student, (student) => student.user)
  student?: Student | null;

  @OneToOne(() => Teacher, (teacher) => teacher.user)
  teacher?: Teacher | null;

  @Column({ type: 'varchar', nullable: true })
  avatar!: string | null;

  @Column({ type: 'timestamp', name: 'start_date' })
  startDate!: Date;

  @Column({ type: 'timestamp', name: 'end_date', nullable: true })
  endDate!: Date | null;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  @Column({ name: 'password_changed_at', type: 'timestamptz', nullable: true })
  passwordChangedAt!: Date | null;

  @Column({ name: 'failed_login_count', type: 'int', default: 0 })
  failedLoginCount!: number;

  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil!: Date | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
