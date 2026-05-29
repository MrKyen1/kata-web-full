import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import { CreateRolePermissionDto } from '../dto/create-role-permission.dto';
import { UpdateRolePermissionDto } from '../dto/update-role-permission.dto';
import {
  RolePermissionAssignmentDto,
  UpdateRolePermissionMatrixDto,
} from '../dto/update-role-permission-matrix.dto';
import { RolePermission } from '../entities/role-permission.entity';

@Injectable()
export class RolePermissionsService {
  constructor(
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async create(dto: CreateRolePermissionDto) {
    await this.ensureRefs(dto.roleId, dto.permissionId);
    const existing = await this.rolePermissionRepository.findOne({
      where: { roleId: dto.roleId, permissionId: dto.permissionId },
    });
    if (existing) throw new ConflictException('Phân quyền vai trò đã tồn tại');
    return {
      data: await this.rolePermissionRepository.save(
        this.rolePermissionRepository.create(dto),
      ),
    };
  }

  async findAll() {
    return {
      data: await this.rolePermissionRepository.find({
        relations: { role: true, permission: true },
        order: { createdAt: 'DESC' },
      }),
    };
  }

  async findMatrix() {
    const [roles, permissions] = await Promise.all([
      this.roleRepository.find({
        where: { isActive: true },
        order: { createdAt: 'ASC' },
      }),
      this.permissionRepository.find({
        where: { isActive: true },
        order: { code: 'ASC' },
      }),
    ]);
    const roleIds = roles.map((role) => role.id);
    const permissionIds = permissions.map((permission) => permission.id);
    const assignments =
      roleIds.length && permissionIds.length
        ? await this.findAssignmentsInScope(roleIds, permissionIds)
        : [];

    return {
      data: {
        roles,
        permissions,
        assignments: assignments.map((assignment) =>
          this.toAssignmentResponse(assignment),
        ),
      },
    };
  }

  async syncMatrix(dto: UpdateRolePermissionMatrixDto) {
    this.ensureUniqueIds(dto.roleIds, 'ID vai trò');
    this.ensureUniqueIds(dto.permissionIds, 'ID quyền');
    this.ensureAssignmentsInScope(
      dto.assignments,
      dto.roleIds,
      dto.permissionIds,
    );
    this.ensureUniqueAssignments(dto.assignments);
    await this.ensureActiveRoles(dto.roleIds);
    await this.ensureActivePermissions(dto.permissionIds);

    const assignments = await this.rolePermissionRepository.manager.transaction(
      async (manager) => {
        const repository = manager.getRepository(RolePermission);
        const existing = await repository.find({
          where: {
            roleId: In(dto.roleIds),
            permissionId: In(dto.permissionIds),
          },
        });
        const desiredKeys = new Set(
          dto.assignments.map((assignment) =>
            this.assignmentKey(assignment.roleId, assignment.permissionId),
          ),
        );
        const existingKeys = new Set(
          existing.map((assignment) =>
            this.assignmentKey(assignment.roleId, assignment.permissionId),
          ),
        );
        const toDeleteIds = existing
          .filter(
            (assignment) =>
              !desiredKeys.has(
                this.assignmentKey(assignment.roleId, assignment.permissionId),
              ),
          )
          .map((assignment) => assignment.id);
        const toCreate = dto.assignments.filter(
          (assignment) =>
            !existingKeys.has(
              this.assignmentKey(assignment.roleId, assignment.permissionId),
            ),
        );

        if (toDeleteIds.length) await repository.delete(toDeleteIds);
        if (toCreate.length) {
          await repository.save(repository.create(toCreate));
        }

        return repository.find({
          where: {
            roleId: In(dto.roleIds),
            permissionId: In(dto.permissionIds),
          },
          order: { createdAt: 'ASC' },
        });
      },
    );

    return {
      data: {
        roleIds: dto.roleIds,
        permissionIds: dto.permissionIds,
        assignments: assignments.map((assignment) =>
          this.toAssignmentResponse(assignment),
        ),
      },
    };
  }

  async findOne(id: string) {
    const item = await this.rolePermissionRepository.findOne({
      where: { id },
      relations: { role: true, permission: true },
    });
    if (!item) throw new NotFoundException('Không tìm thấy phân quyền vai trò');
    return { data: item };
  }

  async update(id: string, dto: UpdateRolePermissionDto) {
    const item = await this.rolePermissionRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Không tìm thấy phân quyền vai trò');
    const roleId = dto.roleId ?? item.roleId;
    const permissionId = dto.permissionId ?? item.permissionId;
    await this.ensureRefs(roleId, permissionId);
    Object.assign(item, { roleId, permissionId });
    return { data: await this.rolePermissionRepository.save(item) };
  }

  async remove(id: string) {
    const item = await this.rolePermissionRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Không tìm thấy phân quyền vai trò');
    await this.rolePermissionRepository.delete(id);
    return { data: { id, deleted: true } };
  }

  private async ensureRefs(roleId: string, permissionId: string) {
    const [role, permission] = await Promise.all([
      this.roleRepository.findOne({ where: { id: roleId, isActive: true } }),
      this.permissionRepository.findOne({
        where: { id: permissionId, isActive: true },
      }),
    ]);
    if (!role) throw new NotFoundException('Không tìm thấy vai trò');
    if (!permission) throw new NotFoundException('Không tìm thấy quyền');
  }

  private async findAssignmentsInScope(
    roleIds: string[],
    permissionIds: string[],
  ) {
    return this.rolePermissionRepository.find({
      where: {
        roleId: In(roleIds),
        permissionId: In(permissionIds),
      },
      order: { createdAt: 'ASC' },
    });
  }

  private async ensureActiveRoles(roleIds: string[]) {
    const roles = await this.roleRepository.find({
      where: { id: In(roleIds), isActive: true },
    });
    if (roles.length !== roleIds.length) {
      throw new NotFoundException('Không tìm thấy một hoặc nhiều vai trò');
    }
  }

  private async ensureActivePermissions(permissionIds: string[]) {
    const permissions = await this.permissionRepository.find({
      where: { id: In(permissionIds), isActive: true },
    });
    if (permissions.length !== permissionIds.length) {
      throw new NotFoundException('Không tìm thấy một hoặc nhiều quyền');
    }
  }

  private ensureUniqueIds(ids: string[], label: string) {
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException(`${label} phải là duy nhất`);
    }
  }

  private ensureAssignmentsInScope(
    assignments: RolePermissionAssignmentDto[],
    roleIds: string[],
    permissionIds: string[],
  ) {
    const roleIdSet = new Set(roleIds);
    const permissionIdSet = new Set(permissionIds);
    const outOfScope = assignments.some(
      (assignment) =>
        !roleIdSet.has(assignment.roleId) ||
        !permissionIdSet.has(assignment.permissionId),
    );
    if (outOfScope) {
      throw new BadRequestException(
        'Các phân quyền phải nằm trong phạm vi ma trận',
      );
    }
  }

  private ensureUniqueAssignments(assignments: RolePermissionAssignmentDto[]) {
    const keys = assignments.map((assignment) =>
      this.assignmentKey(assignment.roleId, assignment.permissionId),
    );
    if (new Set(keys).size !== keys.length) {
      throw new BadRequestException('Các phân quyền phải là duy nhất');
    }
  }

  private assignmentKey(roleId: string, permissionId: string) {
    return `${roleId}:${permissionId}`;
  }

  private toAssignmentResponse(assignment: RolePermission) {
    return {
      id: assignment.id,
      roleId: assignment.roleId,
      permissionId: assignment.permissionId,
    };
  }
}
