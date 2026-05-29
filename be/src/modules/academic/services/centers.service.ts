import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCenterDto } from '../dto/create-center.dto';
import { UpdateCenterDto } from '../dto/update-center.dto';
import { Center } from '../entities/center.entity';

@Injectable()
export class CentersService {
  constructor(
    @InjectRepository(Center)
    private readonly centerRepository: Repository<Center>,
  ) {}

  async create(dto: CreateCenterDto) {
    const existing = await this.centerRepository.findOne({
      where: { name: dto.name },
    });
    if (existing) throw new ConflictException('Tên trung tâm đã tồn tại');
    return {
      data: await this.centerRepository.save(this.centerRepository.create(dto)),
    };
  }

  async findAll(query: { isActive?: boolean; search?: string } = {}) {
    const qb = this.centerRepository
      .createQueryBuilder('center')
      .where('center.is_active = :isActive', {
        isActive: query.isActive ?? true,
      });
    if (query.search) {
      qb.andWhere(
        '(center.name ILIKE :search OR center.address ILIKE :search)',
        {
          search: `%${query.search}%`,
        },
      );
    }
    return { data: await qb.orderBy('center.created_at', 'DESC').getMany() };
  }

  async findOne(id: string) {
    const center = await this.centerRepository.findOne({
      where: { id, isActive: true },
      relations: { classes: true },
    });
    if (!center) throw new NotFoundException('Không tìm thấy trung tâm');
    return { data: center };
  }

  async update(id: string, dto: UpdateCenterDto) {
    const center = await this.findActive(id);
    if (dto.name && dto.name !== center.name) {
      const existing = await this.centerRepository.findOne({
        where: { name: dto.name },
      });
      if (existing) throw new ConflictException('Tên trung tâm đã tồn tại');
    }
    Object.assign(center, dto);
    return { data: await this.centerRepository.save(center) };
  }

  async remove(id: string) {
    const center = await this.findActive(id);
    center.isActive = false;
    await this.centerRepository.save(center);
    return { data: { id: center.id, isActive: center.isActive } };
  }

  private async findActive(id: string) {
    const center = await this.centerRepository.findOne({
      where: { id, isActive: true },
    });
    if (!center) throw new NotFoundException('Không tìm thấy trung tâm');
    return center;
  }
}
