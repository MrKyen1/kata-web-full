import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReadingPassageDto } from '../dto/create-reading-passage.dto';
import { UpdateReadingPassageDto } from '../dto/update-reading-passage.dto';
import { Level } from '../entities/level.entity';
import { ReadingPassage } from '../entities/reading-passage.entity';

@Injectable()
export class ReadingPassagesService {
  constructor(
    @InjectRepository(ReadingPassage)
    private readonly readingPassageRepository: Repository<ReadingPassage>,
    @InjectRepository(Level)
    private readonly levelRepository: Repository<Level>,
  ) {}

  async create(dto: CreateReadingPassageDto) {
    if (dto.levelId) await this.ensureLevelExists(dto.levelId);
    const passage = this.readingPassageRepository.create({
      ...dto,
      metadata: dto.metadata ?? {},
    });
    return { data: await this.readingPassageRepository.save(passage) };
  }

  async findAll(query: {
    isActive?: boolean;
    search?: string;
    levelId?: string;
  }) {
    const qb = this.readingPassageRepository
      .createQueryBuilder('passage')
      .leftJoinAndSelect('passage.level', 'level')
      .where('passage.is_active = :isActive', {
        isActive: query.isActive ?? true,
      });

    if (query.levelId) {
      qb.andWhere('passage.level_id = :levelId', { levelId: query.levelId });
    }

    if (query.search) {
      qb.andWhere(
        '(passage.title ILIKE :search OR passage.content ILIKE :search)',
        {
          search: `%${query.search}%`,
        },
      );
    }

    return { data: await qb.orderBy('passage.created_at', 'DESC').getMany() };
  }

  async findOne(id: string) {
    const passage = await this.readingPassageRepository.findOne({
      where: { id, isActive: true },
      relations: { level: true },
    });
    if (!passage) throw new NotFoundException('Không tìm thấy bài đọc');
    return { data: passage };
  }

  async update(id: string, dto: UpdateReadingPassageDto) {
    const passage = await this.findActive(id);
    if (dto.levelId) await this.ensureLevelExists(dto.levelId);
    Object.assign(passage, dto);
    return { data: await this.readingPassageRepository.save(passage) };
  }

  async inactive(id: string) {
    const passage = await this.findActive(id);
    passage.isActive = false;
    await this.readingPassageRepository.save(passage);
    return { data: { id: passage.id, isActive: passage.isActive } };
  }

  private async findActive(id: string) {
    const passage = await this.readingPassageRepository.findOne({
      where: { id, isActive: true },
    });
    if (!passage) throw new NotFoundException('Không tìm thấy bài đọc');
    return passage;
  }

  private async ensureLevelExists(levelId: string) {
    const level = await this.levelRepository.findOne({
      where: { id: levelId, isActive: true },
    });
    if (!level) throw new NotFoundException('Không tìm thấy cấp độ');
  }
}
