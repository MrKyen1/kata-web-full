import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLevelDto } from '../dto/create-level.dto';
import { UpdateLevelDto } from '../dto/update-level.dto';
import { Level } from '../entities/level.entity';

@Injectable()
export class LevelsService {
  constructor(
    @InjectRepository(Level)
    private readonly levelRepository: Repository<Level>,
  ) {}

  async create(dto: CreateLevelDto) {
    await this.ensureCodeAvailable(dto.code);
    return {
      data: await this.levelRepository.save(this.levelRepository.create(dto)),
    };
  }

  async findAll(query: { isActive?: boolean; search?: string }) {
    const qb = this.levelRepository
      .createQueryBuilder('level')
      .where('level.is_active = :isActive', {
        isActive: query.isActive ?? true,
      });

    if (query.search) {
      qb.andWhere('(level.code ILIKE :search OR level.name ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    return { data: await qb.orderBy('level.rank', 'ASC').getMany() };
  }

  async findOne(id: string) {
    const level = await this.levelRepository.findOne({
      where: { id, isActive: true },
    });
    if (!level) throw new NotFoundException('Không tìm thấy cấp độ');
    return { data: level };
  }

  async update(id: string, dto: UpdateLevelDto) {
    const level = await this.findActive(id);
    if (dto.code && dto.code !== level.code)
      await this.ensureCodeAvailable(dto.code);
    Object.assign(level, dto);
    return { data: await this.levelRepository.save(level) };
  }

  async inactive(id: string) {
    const level = await this.findActive(id);
    level.isActive = false;
    await this.levelRepository.save(level);
    return { data: { id: level.id, isActive: level.isActive } };
  }

  private async findActive(id: string) {
    const level = await this.levelRepository.findOne({
      where: { id, isActive: true },
    });
    if (!level) throw new NotFoundException('Không tìm thấy cấp độ');
    return level;
  }

  private async ensureCodeAvailable(code: string) {
    const existing = await this.levelRepository.findOne({ where: { code } });
    if (existing) throw new ConflictException('Mã cấp độ đã tồn tại');
  }
}
