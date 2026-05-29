import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CentersController } from './controllers/centers.controller';
import { ClassesController } from './controllers/classes.controller';
import { SpecializationsController } from './controllers/specializations.controller';
import { Center } from './entities/center.entity';
import { Class } from './entities/class.entity';
import { Specialization } from './entities/specialization.entity';
import { StudentClass } from './entities/student-class.entity';
import { Student } from './entities/student.entity';
import { TeacherClass } from './entities/teacher-class.entity';
import { TeacherSpecialization } from './entities/teacher-specialization.entity';
import { Teacher } from './entities/teacher.entity';
import { CentersService } from './services/centers.service';
import { ClassesService } from './services/classes.service';
import { SpecializationsService } from './services/specializations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Center,
      Class,
      Student,
      StudentClass,
      Teacher,
      TeacherClass,
      Specialization,
      TeacherSpecialization,
    ]),
  ],
  controllers: [
    CentersController,
    ClassesController,
    SpecializationsController,
  ],
  providers: [CentersService, ClassesService, SpecializationsService],
})
export class AcademicModule {}
