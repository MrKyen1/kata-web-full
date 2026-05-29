import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async create(dto: CreatePermissionDto) {
    await this.ensureUnique(dto.code, dto.name);
    return {
      data: await this.permissionRepository.save(
        this.permissionRepository.create(dto),
      ),
    };
  }

  async findAll(query: { isActive?: boolean; search?: string } = {}) {
    const qb = this.permissionRepository
      .createQueryBuilder('permission')
      .where('permission.is_active = :isActive', {
        isActive: query.isActive ?? true,
      });
    if (query.search) {
      qb.andWhere(
        '(permission.name ILIKE :search OR permission.code ILIKE :search)',
        {
          search: `%${query.search}%`,
        },
      );
    }
    return { data: await qb.orderBy('permission.code', 'ASC').getMany() };
  }

  async findOne(id: string) {
    const permission = await this.permissionRepository.findOne({
      where: { id, isActive: true },
    });
    if (!permission) throw new NotFoundException('Không tìm thấy quyền');
    return { data: permission };
  }

  async update(id: string, dto: UpdatePermissionDto) {
    const permission = await this.findActive(id);
    if (
      (dto.code && dto.code !== permission.code) ||
      (dto.name && dto.name !== permission.name)
    ) {
      await this.ensureUnique(
        dto.code ?? permission.code,
        dto.name ?? permission.name,
        id,
      );
    }
    Object.assign(permission, dto);
    return { data: await this.permissionRepository.save(permission) };
  }

  async remove(id: string) {
    const permission = await this.findActive(id);
    permission.isActive = false;
    await this.permissionRepository.save(permission);
    return { data: { id: permission.id, isActive: permission.isActive } };
  }

  private async findActive(id: string) {
    const permission = await this.permissionRepository.findOne({
      where: { id, isActive: true },
    });
    if (!permission) throw new NotFoundException('Không tìm thấy quyền');
    return permission;
  }

  private async ensureUnique(code: string, name: string, excludeId?: string) {
    const existing = await this.permissionRepository
      .createQueryBuilder('permission')
      .where('(permission.code = :code OR permission.name = :name)', {
        code,
        name,
      })
      .getOne();
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('Mã hoặc tên quyền đã tồn tại');
    }
  }
}
