import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { Role } from '../entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(dto: CreateRoleDto) {
    await this.ensureUnique(dto.code, dto.name);
    return {
      data: await this.roleRepository.save(this.roleRepository.create(dto)),
    };
  }

  async findAll(query: { isActive?: boolean; search?: string } = {}) {
    const qb = this.roleRepository
      .createQueryBuilder('role')
      .where('role.is_active = :isActive', {
        isActive: query.isActive ?? true,
      });
    if (query.search) {
      qb.andWhere('(role.name ILIKE :search OR role.code ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }
    return { data: await qb.orderBy('role.created_at', 'DESC').getMany() };
  }

  async findOne(id: string) {
    const role = await this.roleRepository.findOne({
      where: { id, isActive: true },
      relations: { permissions: { permission: true } },
    });
    if (!role) throw new NotFoundException('Không tìm thấy vai trò');
    return { data: role };
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.findActive(id);
    if (
      (dto.code && dto.code !== role.code) ||
      (dto.name && dto.name !== role.name)
    ) {
      await this.ensureUnique(dto.code ?? role.code, dto.name ?? role.name, id);
    }
    Object.assign(role, dto);
    return { data: await this.roleRepository.save(role) };
  }

  async remove(id: string) {
    const role = await this.findActive(id);
    role.isActive = false;
    await this.roleRepository.save(role);
    return { data: { id: role.id, isActive: role.isActive } };
  }

  private async findActive(id: string) {
    const role = await this.roleRepository.findOne({
      where: { id, isActive: true },
    });
    if (!role) throw new NotFoundException('Không tìm thấy vai trò');
    return role;
  }

  private async ensureUnique(code: string, name: string, excludeId?: string) {
    const existing = await this.roleRepository
      .createQueryBuilder('role')
      .where('(role.code = :code OR role.name = :name)', { code, name })
      .getOne();
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('Mã hoặc tên vai trò đã tồn tại');
    }
  }
}
