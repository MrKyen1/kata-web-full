import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Class } from '../academic/entities/class.entity';
import { Role } from '../rbac/entities/role.entity';
import { Specialization } from '../academic/entities/specialization.entity';
import { Student } from '../academic/entities/student.entity';
import { StudentClass } from '../academic/entities/student-class.entity';
import { Teacher } from '../academic/entities/teacher.entity';
import { TeacherClass } from '../academic/entities/teacher-class.entity';
import { TeacherSpecialization } from '../academic/entities/teacher-specialization.entity';
import { CreateUserDto } from './dto/create-user.dto';
import {
  UpdateUserDto,
  UpdateUserStudentProfileDto,
  UpdateUserTeacherProfileDto,
} from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateUserDto) {
    await this.ensureUniqueCode(dto.code);
    const role = await this.ensureRoleExists(dto.roleId);
    this.validateProvisioningPayload(dto, role);

    const user = await this.dataSource.transaction(async (manager) => {
      const { password, teacherProfile, studentProfile, ...userData } = dto;
      const userRepository = manager.getRepository(User);
      const createdUser = await userRepository.save(
        userRepository.create({
          ...userData,
          hashedPassword: await argon2.hash(password),
          startDate: new Date(),
          passwordChangedAt: new Date(),
        }),
      );

      if (role.code === 'teacher') {
        await this.ensureActiveClasses(manager, teacherProfile?.classIds ?? []);
        await this.ensureActiveSpecializations(
          manager,
          teacherProfile?.specializationIds ?? [],
        );

        const teacher = await manager.getRepository(Teacher).save(
          manager.getRepository(Teacher).create({
            yearsOfExperience: teacherProfile?.yearsOfExperience,
            description: teacherProfile?.description,
            userId: createdUser.id,
          }),
        );
        teacher.classes = await manager.getRepository(TeacherClass).save(
          teacherProfile?.classIds.map((classId) =>
            manager.getRepository(TeacherClass).create({
              teacherId: teacher.id,
              classId,
            }),
          ) ?? [],
        );
        teacher.teacherSpecializations = await manager
          .getRepository(TeacherSpecialization)
          .save(
            teacherProfile?.specializationIds.map((specializationId) =>
              manager.getRepository(TeacherSpecialization).create({
                teacherId: teacher.id,
                specializationId,
              }),
            ) ?? [],
          );
        createdUser.teacher = teacher;
      }

      if (role.code === 'student') {
        await this.ensureActiveClasses(manager, studentProfile?.classIds ?? []);

        const student = await manager.getRepository(Student).save(
          manager.getRepository(Student).create({
            userId: createdUser.id,
          }),
        );
        student.classes = await manager.getRepository(StudentClass).save(
          studentProfile?.classIds.map((classId) =>
            manager.getRepository(StudentClass).create({
              studentId: student.id,
              classId,
            }),
          ) ?? [],
        );
        createdUser.student = student;
      }

      return createdUser;
    });

    return { data: this.sanitize(await this.findOneEntity(user.id)) };
  }

  async findAll(query: UserQueryDto = {}) {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('role.permissions', 'rolePermission')
      .leftJoinAndSelect('rolePermission.permission', 'permission')
      .leftJoinAndSelect('user.student', 'student')
      .leftJoinAndSelect(
        'student.classes',
        'studentClass',
        'studentClass.is_active = true',
      )
      .leftJoinAndSelect('studentClass.class', 'studentClassEntity')
      .leftJoinAndSelect('studentClassEntity.center', 'studentClassCenter')
      .leftJoinAndSelect('user.teacher', 'teacher')
      .leftJoinAndSelect(
        'teacher.classes',
        'teacherClass',
        'teacherClass.is_active = true',
      )
      .leftJoinAndSelect('teacherClass.class', 'teacherClassEntity')
      .leftJoinAndSelect('teacherClassEntity.center', 'teacherClassCenter')
      .leftJoinAndSelect(
        'teacher.teacherSpecializations',
        'teacherSpecialization',
        'teacherSpecialization.is_active = true',
      )
      .leftJoinAndSelect(
        'teacherSpecialization.specialization',
        'specialization',
      )
      .where('user.is_active = :isActive', {
        isActive: query.isActive ?? true,
      });

    if (query.search) {
      qb.andWhere(
        '(user.code ILIKE :search OR user.full_name ILIKE :search OR user.phone ILIKE :search OR user.email ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.code) {
      qb.andWhere('user.code ILIKE :code', { code: `%${query.code}%` });
    }

    if (query.phone) {
      qb.andWhere('user.phone ILIKE :phone', { phone: `%${query.phone}%` });
    }

    if (query.email) {
      qb.andWhere('user.email ILIKE :email', { email: `%${query.email}%` });
    }

    if (query.roleId) {
      qb.andWhere('user.role_id = :roleId', { roleId: query.roleId });
    }

    if (query.roleCode) {
      qb.andWhere('role.code = :roleCode', { roleCode: query.roleCode });
    }

    if (query.classId) {
      qb.andWhere(
        '(studentClass.class_id = :classId OR teacherClass.class_id = :classId)',
        { classId: query.classId },
      );
    }

    if (query.centerId) {
      qb.andWhere(
        '(studentClassEntity.center_id = :centerId OR teacherClassEntity.center_id = :centerId)',
        { centerId: query.centerId },
      );
    }

    if (query.specializationId) {
      qb.andWhere(
        'teacherSpecialization.specialization_id = :specializationId',
        {
          specializationId: query.specializationId,
        },
      );
    }

    const users = await qb.orderBy('user.created_at', 'DESC').getMany();
    return { data: users.map((user) => this.sanitize(user)) };
  }

  async findOne(id: string) {
    const user = await this.findOneEntity(id);
    return { data: this.sanitize(user) };
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findActive(id);
    if (dto.code && dto.code !== user.code) {
      await this.ensureUniqueCode(dto.code, id);
    }
    const role = dto.roleId
      ? await this.ensureRoleExists(dto.roleId)
      : await this.ensureRoleExists(user.roleId);

    this.validateProfileUpdatePayload(dto, role);

    await this.dataSource.transaction(async (manager) => {
      const { teacherProfile, studentProfile, ...userData } = dto;
      Object.assign(user, userData);
      await manager.getRepository(User).save(user);

      if (teacherProfile) {
        await this.updateTeacherProfile(manager, id, teacherProfile);
      }

      if (studentProfile) {
        await this.updateStudentProfile(manager, id, studentProfile);
      }
    });

    return { data: this.sanitize(await this.findOneEntity(id)) };
  }

  async remove(id: string) {
    const user = await this.findActive(id);
    user.isActive = false;
    await this.userRepository.save(user);
    return { data: { id: user.id, isActive: user.isActive } };
  }

  private async findActive(id: string) {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

  private async findOneEntity(id: string) {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
      relations: {
        role: {
          permissions: {
            permission: true,
          },
        },
        student: {
          classes: {
            class: {
              center: true,
            },
          },
        },
        teacher: {
          classes: {
            class: {
              center: true,
            },
          },
          teacherSpecializations: {
            specialization: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

  private async ensureRoleExists(roleId: string) {
    const role = await this.roleRepository.findOne({
      where: { id: roleId, isActive: true },
    });
    if (!role) throw new NotFoundException('Không tìm thấy vai trò');
    return role;
  }

  private async ensureUniqueCode(code: string, excludeId?: string) {
    const existing = await this.userRepository
      .createQueryBuilder('user')
      .where('user.code = :code', { code })
      .getOne();
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('Mã người dùng đã tồn tại');
    }
  }

  private sanitize(user: User) {
    const safeUser = { ...user } as Partial<User>;
    delete safeUser.hashedPassword;

    if (safeUser.student?.classes) {
      safeUser.student.classes = safeUser.student.classes.filter(
        (item) => item.isActive,
      );
    }

    if (safeUser.teacher?.classes) {
      safeUser.teacher.classes = safeUser.teacher.classes.filter(
        (item) => item.isActive,
      );
    }

    if (safeUser.teacher?.teacherSpecializations) {
      safeUser.teacher.teacherSpecializations =
        safeUser.teacher.teacherSpecializations.filter((item) => item.isActive);
    }

    if (safeUser.role?.permissions) {
      safeUser.role = {
        id: safeUser.role.id,
        code: safeUser.role.code,
        name: safeUser.role.name,
        description: safeUser.role.description,
        permissions: safeUser.role.permissions.map(
          (item) => item.permission.code,
        ),
        isActive: safeUser.role.isActive,
        createdAt: safeUser.role.createdAt,
        updatedAt: safeUser.role.updatedAt,
      } as unknown as User['role'];
    }
    return safeUser;
  }

  private validateProfileUpdatePayload(dto: UpdateUserDto, role: Role) {
    if (dto.teacherProfile && dto.studentProfile) {
      throw new BadRequestException(
        'Chỉ được gửi một hồ sơ khi cập nhật người dùng',
      );
    }

    if (dto.teacherProfile && role.code !== 'teacher') {
      throw new BadRequestException(
        'Hồ sơ giáo viên chỉ được áp dụng cho người dùng có vai trò giáo viên',
      );
    }

    if (dto.studentProfile && role.code !== 'student') {
      throw new BadRequestException(
        'Hồ sơ học viên chỉ được áp dụng cho người dùng có vai trò học viên',
      );
    }

    if (dto.teacherProfile) {
      if (dto.teacherProfile.classIds) {
        this.ensureUniqueIds(
          dto.teacherProfile.classIds,
          'ID lớp của giáo viên',
        );
      }
      if (dto.teacherProfile.specializationIds) {
        this.ensureUniqueIds(
          dto.teacherProfile.specializationIds,
          'ID chuyên môn của giáo viên',
        );
      }
    }

    if (dto.studentProfile?.classIds) {
      this.ensureUniqueIds(dto.studentProfile.classIds, 'ID lớp của học viên');
    }
  }

  private async updateTeacherProfile(
    manager: EntityManager,
    userId: string,
    dto: UpdateUserTeacherProfileDto,
  ) {
    const teacherRepository = manager.getRepository(Teacher);
    const teacher = await teacherRepository.findOne({
      where: { userId },
    });
    if (!teacher) throw new NotFoundException('Không tìm thấy hồ sơ giáo viên');

    if (dto.yearsOfExperience !== undefined) {
      teacher.yearsOfExperience = dto.yearsOfExperience;
    }
    if (dto.description !== undefined) {
      teacher.description = dto.description;
    }
    await teacherRepository.save(teacher);

    if (dto.classIds) {
      await this.ensureActiveClasses(manager, dto.classIds);
      await this.syncTeacherClasses(manager, teacher.id, dto.classIds);
    }

    if (dto.specializationIds) {
      await this.ensureActiveSpecializations(manager, dto.specializationIds);
      await this.syncTeacherSpecializations(
        manager,
        teacher.id,
        dto.specializationIds,
      );
    }
  }

  private async updateStudentProfile(
    manager: EntityManager,
    userId: string,
    dto: UpdateUserStudentProfileDto,
  ) {
    const studentRepository = manager.getRepository(Student);
    const student = await studentRepository.findOne({
      where: { userId },
    });
    if (!student) throw new NotFoundException('Không tìm thấy hồ sơ học viên');

    if (dto.classIds) {
      await this.ensureActiveClasses(manager, dto.classIds);
      await this.syncStudentClasses(manager, student.id, dto.classIds);
    }
  }

  private async syncTeacherClasses(
    manager: EntityManager,
    teacherId: string,
    classIds: string[],
  ) {
    const repository = manager.getRepository(TeacherClass);
    const rows = await repository.find({ where: { teacherId } });
    const nextIds = new Set(classIds);

    const updates = rows
      .filter((row) => row.isActive !== nextIds.has(row.classId))
      .map((row) => {
        row.isActive = nextIds.has(row.classId);
        return row;
      });
    const existingIds = new Set(rows.map((row) => row.classId));
    const creates = classIds
      .filter((classId) => !existingIds.has(classId))
      .map((classId) => repository.create({ teacherId, classId }));

    await repository.save([...updates, ...creates]);
  }

  private async syncTeacherSpecializations(
    manager: EntityManager,
    teacherId: string,
    specializationIds: string[],
  ) {
    const repository = manager.getRepository(TeacherSpecialization);
    const rows = await repository.find({ where: { teacherId } });
    const nextIds = new Set(specializationIds);

    const updates = rows
      .filter((row) => row.isActive !== nextIds.has(row.specializationId))
      .map((row) => {
        row.isActive = nextIds.has(row.specializationId);
        return row;
      });
    const existingIds = new Set(rows.map((row) => row.specializationId));
    const creates = specializationIds
      .filter((specializationId) => !existingIds.has(specializationId))
      .map((specializationId) =>
        repository.create({ teacherId, specializationId }),
      );

    await repository.save([...updates, ...creates]);
  }

  private async syncStudentClasses(
    manager: EntityManager,
    studentId: string,
    classIds: string[],
  ) {
    const repository = manager.getRepository(StudentClass);
    const rows = await repository.find({ where: { studentId } });
    const nextIds = new Set(classIds);

    const updates = rows
      .filter((row) => row.isActive !== nextIds.has(row.classId))
      .map((row) => {
        row.isActive = nextIds.has(row.classId);
        return row;
      });
    const existingIds = new Set(rows.map((row) => row.classId));
    const creates = classIds
      .filter((classId) => !existingIds.has(classId))
      .map((classId) => repository.create({ studentId, classId }));

    await repository.save([...updates, ...creates]);
  }

  private validateProvisioningPayload(dto: CreateUserDto, role: Role) {
    if (role.code === 'teacher') {
      if (!dto.teacherProfile?.description) {
        throw new BadRequestException('Mô tả hồ sơ giáo viên là bắt buộc');
      }
      if (dto.studentProfile) {
        throw new BadRequestException(
          'Không được gửi hồ sơ học viên cho người dùng có vai trò giáo viên',
        );
      }
      this.ensureUniqueIds(dto.teacherProfile.classIds, 'ID lớp của giáo viên');
      this.ensureUniqueIds(
        dto.teacherProfile.specializationIds,
        'ID chuyên môn của giáo viên',
      );
      return;
    }

    if (role.code === 'student') {
      if (!dto.studentProfile?.classIds?.length) {
        throw new BadRequestException(
          'ID lớp trong hồ sơ học viên là bắt buộc',
        );
      }
      if (dto.teacherProfile) {
        throw new BadRequestException(
          'Không được gửi hồ sơ giáo viên cho người dùng có vai trò học viên',
        );
      }
      this.ensureUniqueIds(dto.studentProfile.classIds, 'ID lớp của học viên');
      return;
    }

    if (role.code === 'admin') {
      if (dto.teacherProfile || dto.studentProfile) {
        throw new BadRequestException(
          'Không được gửi hồ sơ cho người dùng có vai trò quản trị viên',
        );
      }
      return;
    }

    throw new BadRequestException(
      `Vai trò người dùng không được hỗ trợ: ${role.code}`,
    );
  }

  private ensureUniqueIds(ids: string[], label: string) {
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException(`${label} phải là duy nhất`);
    }
  }

  private async ensureActiveClasses(
    manager: EntityManager,
    classIds: string[],
  ) {
    const classes = await manager.getRepository(Class).find({
      where: { id: In(classIds), isActive: true },
    });
    if (classes.length !== classIds.length) {
      throw new NotFoundException('Không tìm thấy một hoặc nhiều lớp');
    }
  }

  private async ensureActiveSpecializations(
    manager: EntityManager,
    specializationIds: string[],
  ) {
    const specializations = await manager.getRepository(Specialization).find({
      where: { id: In(specializationIds), isActive: true },
    });
    if (specializations.length !== specializationIds.length) {
      throw new NotFoundException('Không tìm thấy một hoặc nhiều chuyên môn');
    }
  }
}
