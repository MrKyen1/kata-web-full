import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CreateTopicDto } from '../dto/create-topic.dto';
import { UpdateTopicDto } from '../dto/update-topic.dto';
import { Topic } from '../entities/topic.entity';

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic)
    private readonly topicRepository: Repository<Topic>,
  ) {}

  async create(dto: CreateTopicDto) {
    if (dto.parentId) await this.ensureParentExists(dto.parentId);
    await this.ensureCodeAvailable(dto.code, dto.parentId);
    return {
      data: await this.topicRepository.save(this.topicRepository.create(dto)),
    };
  }

  async findAll(query: {
    isActive?: boolean;
    search?: string;
    parentId?: string;
  }) {
    const qb = this.topicRepository
      .createQueryBuilder('topic')
      .leftJoinAndSelect('topic.parent', 'parent')
      .where('topic.is_active = :isActive', {
        isActive: query.isActive ?? true,
      });

    if (query.parentId) {
      qb.andWhere('topic.parent_id = :parentId', { parentId: query.parentId });
    }

    if (query.search) {
      qb.andWhere('(topic.code ILIKE :search OR topic.name ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    return { data: await qb.orderBy('topic.name', 'ASC').getMany() };
  }

  async findOne(id: string) {
    const topic = await this.topicRepository.findOne({
      where: { id, isActive: true },
      relations: { parent: true, children: true },
    });
    if (!topic) throw new NotFoundException('Không tìm thấy chủ đề');
    topic.children = (topic.children ?? []).filter((child) => child.isActive);
    return { data: topic };
  }

  async update(id: string, dto: UpdateTopicDto) {
    const topic = await this.findActive(id);
    const nextParentId =
      dto.parentId !== undefined ? dto.parentId : topic.parentId;

    if (nextParentId) {
      if (nextParentId === id)
        throw new ConflictException('Chủ đề không thể là cha của chính nó');
      await this.ensureParentExists(nextParentId);
    }

    if ((dto.code && dto.code !== topic.code) || dto.parentId !== undefined) {
      await this.ensureCodeAvailable(dto.code ?? topic.code, nextParentId, id);
    }

    Object.assign(topic, dto);
    return { data: await this.topicRepository.save(topic) };
  }

  async inactive(id: string) {
    const topic = await this.findActive(id);
    topic.isActive = false;
    await this.topicRepository.save(topic);
    return { data: { id: topic.id, isActive: topic.isActive } };
  }

  private async findActive(id: string) {
    const topic = await this.topicRepository.findOne({
      where: { id, isActive: true },
    });
    if (!topic) throw new NotFoundException('Không tìm thấy chủ đề');
    return topic;
  }

  private async ensureParentExists(parentId: string) {
    const parent = await this.topicRepository.findOne({
      where: { id: parentId, isActive: true },
    });
    if (!parent) throw new NotFoundException('Không tìm thấy chủ đề cha');
  }

  private async ensureCodeAvailable(
    code: string,
    parentId?: string | null,
    excludeId?: string,
  ) {
    const existing = await this.topicRepository.findOne({
      where: {
        code,
        parentId: parentId ?? IsNull(),
      },
    });

    if (existing && existing.id !== excludeId) {
      throw new ConflictException('Mã chủ đề đã tồn tại trong chủ đề cha này');
    }
  }
}
