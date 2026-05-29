import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSkillDto } from '../dto/create-skill.dto';
import { UpdateSkillDto } from '../dto/update-skill.dto';
import { Skill } from '../entities/skill.entity';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
  ) {}

  async create(dto: CreateSkillDto) {
    await this.ensureCodeAvailable(dto.code);
    return {
      data: await this.skillRepository.save(this.skillRepository.create(dto)),
    };
  }

  async findAll(query: { isActive?: boolean; search?: string }) {
    const qb = this.skillRepository
      .createQueryBuilder('skill')
      .where('skill.is_active = :isActive', {
        isActive: query.isActive ?? true,
      });

    if (query.search) {
      qb.andWhere('(skill.code ILIKE :search OR skill.name ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    return { data: await qb.orderBy('skill.name', 'ASC').getMany() };
  }

  async findOne(id: string) {
    const skill = await this.skillRepository.findOne({
      where: { id, isActive: true },
    });
    if (!skill) throw new NotFoundException('Không tìm thấy kỹ năng');
    return { data: skill };
  }

  async update(id: string, dto: UpdateSkillDto) {
    const skill = await this.findActive(id);
    if (dto.code && dto.code !== skill.code)
      await this.ensureCodeAvailable(dto.code);
    Object.assign(skill, dto);
    return { data: await this.skillRepository.save(skill) };
  }

  async inactive(id: string) {
    const skill = await this.findActive(id);
    skill.isActive = false;
    await this.skillRepository.save(skill);
    return { data: { id: skill.id, isActive: skill.isActive } };
  }

  private async findActive(id: string) {
    const skill = await this.skillRepository.findOne({
      where: { id, isActive: true },
    });
    if (!skill) throw new NotFoundException('Không tìm thấy kỹ năng');
    return skill;
  }

  private async ensureCodeAvailable(code: string) {
    const existing = await this.skillRepository.findOne({ where: { code } });
    if (existing) throw new ConflictException('Mã kỹ năng đã tồn tại');
  }
}
