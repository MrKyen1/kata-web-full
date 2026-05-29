import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTagDto } from '../dto/create-tag.dto';
import { UpdateTagDto } from '../dto/update-tag.dto';
import { Tag } from '../entities/tag.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async create(dto: CreateTagDto) {
    await this.ensureCodeAvailable(dto.code);
    return {
      data: await this.tagRepository.save(this.tagRepository.create(dto)),
    };
  }

  async findAll(query: { isActive?: boolean; search?: string }) {
    const qb = this.tagRepository
      .createQueryBuilder('tag')
      .where('tag.is_active = :isActive', { isActive: query.isActive ?? true });

    if (query.search) {
      qb.andWhere('(tag.code ILIKE :search OR tag.name ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    return { data: await qb.orderBy('tag.name', 'ASC').getMany() };
  }

  async findOne(id: string) {
    const tag = await this.tagRepository.findOne({
      where: { id, isActive: true },
    });
    if (!tag) throw new NotFoundException('Không tìm thấy thẻ');
    return { data: tag };
  }

  async update(id: string, dto: UpdateTagDto) {
    const tag = await this.findActive(id);
    if (dto.code && dto.code !== tag.code)
      await this.ensureCodeAvailable(dto.code);
    Object.assign(tag, dto);
    return { data: await this.tagRepository.save(tag) };
  }

  async inactive(id: string) {
    const tag = await this.findActive(id);
    tag.isActive = false;
    await this.tagRepository.save(tag);
    return { data: { id: tag.id, isActive: tag.isActive } };
  }

  private async findActive(id: string) {
    const tag = await this.tagRepository.findOne({
      where: { id, isActive: true },
    });
    if (!tag) throw new NotFoundException('Không tìm thấy thẻ');
    return tag;
  }

  private async ensureCodeAvailable(code: string) {
    const existing = await this.tagRepository.findOne({ where: { code } });
    if (existing) throw new ConflictException('Mã thẻ đã tồn tại');
  }
}
