import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Class } from '../academic/entities/class.entity';
import { Role } from '../rbac/entities/role.entity';
import { Specialization } from '../academic/entities/specialization.entity';
import { Student } from '../academic/entities/student.entity';
import { StudentClass } from '../academic/entities/student-class.entity';
import { Teacher } from '../academic/entities/teacher.entity';
import { TeacherClass } from '../academic/entities/teacher-class.entity';
import { TeacherSpecialization } from '../academic/entities/teacher-specialization.entity';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      Student,
      Teacher,
      Class,
      Specialization,
      StudentClass,
      TeacherClass,
      TeacherSpecialization,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
