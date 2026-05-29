import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSpecializationDto } from '../dto/create-specialization.dto';
import { UpdateSpecializationDto } from '../dto/update-specialization.dto';
import { Specialization } from '../entities/specialization.entity';

@Injectable()
export class SpecializationsService {
  constructor(
    @InjectRepository(Specialization)
    private readonly specializationRepository: Repository<Specialization>,
  ) {}

  async create(dto: CreateSpecializationDto) {
    await this.ensureUnique(dto.code, dto.name);
    return {
      data: await this.specializationRepository.save(
        this.specializationRepository.create(dto),
      ),
    };
  }

  async findAll(query: { isActive?: boolean; search?: string } = {}) {
    const qb = this.specializationRepository
      .createQueryBuilder('specialization')
      .where('specialization.is_active = :isActive', {
        isActive: query.isActive ?? true,
      });
    if (query.search) {
      qb.andWhere(
        '(specialization.name ILIKE :search OR specialization.code ILIKE :search)',
        {
          search: `%${query.search}%`,
        },
      );
    }
    return { data: await qb.orderBy('specialization.name', 'ASC').getMany() };
  }

  async findOne(id: string) {
    const specialization = await this.specializationRepository.findOne({
      where: { id, isActive: true },
    });
    if (!specialization)
      throw new NotFoundException('Không tìm thấy chuyên môn');
    return { data: specialization };
  }

  async update(id: string, dto: UpdateSpecializationDto) {
    const specialization = await this.findActive(id);
    if (
      (dto.code && dto.code !== specialization.code) ||
      (dto.name && dto.name !== specialization.name)
    ) {
      await this.ensureUnique(
        dto.code ?? specialization.code,
        dto.name ?? specialization.name,
        id,
      );
    }
    Object.assign(specialization, dto);
    return { data: await this.specializationRepository.save(specialization) };
  }

  async remove(id: string) {
    const specialization = await this.findActive(id);
    specialization.isActive = false;
    await this.specializationRepository.save(specialization);
    return {
      data: { id: specialization.id, isActive: specialization.isActive },
    };
  }

  private async findActive(id: string) {
    const specialization = await this.specializationRepository.findOne({
      where: { id, isActive: true },
    });
    if (!specialization)
      throw new NotFoundException('Không tìm thấy chuyên môn');
    return specialization;
  }

  private async ensureUnique(code: string, name: string, excludeId?: string) {
    const existing = await this.specializationRepository
      .createQueryBuilder('specialization')
      .where('(specialization.code = :code OR specialization.name = :name)', {
        code,
        name,
      })
      .getOne();
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('Mã hoặc tên chuyên môn đã tồn tại');
    }
  }
}
