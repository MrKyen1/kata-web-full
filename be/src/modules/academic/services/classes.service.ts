import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Center } from '../entities/center.entity';
import { CreateClassDto } from '../dto/create-class.dto';
import { UpdateClassDto } from '../dto/update-class.dto';
import { Class } from '../entities/class.entity';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Center)
    private readonly centerRepository: Repository<Center>,
  ) {}

  async create(dto: CreateClassDto) {
    await this.ensureCenter(dto.centerId);
    await this.ensureUniqueName(dto.name);
    return {
      data: await this.classRepository.save(this.classRepository.create(dto)),
    };
  }

  async findAll(
    query: { isActive?: boolean; search?: string; centerId?: string } = {},
  ) {
    const qb = this.classRepository
      .createQueryBuilder('class')
      .leftJoinAndSelect('class.center', 'center')
      .where('class.is_active = :isActive', {
        isActive: query.isActive ?? true,
      });
    if (query.centerId)
      qb.andWhere('class.center_id = :centerId', { centerId: query.centerId });
    if (query.search)
      qb.andWhere('class.name ILIKE :search', { search: `%${query.search}%` });
    return { data: await qb.orderBy('class.created_at', 'DESC').getMany() };
  }

  async findOne(id: string) {
    const item = await this.classRepository.findOne({
      where: { id, isActive: true },
      relations: { center: true, studentClasses: true, teacherClasses: true },
    });
    if (!item) throw new NotFoundException('Không tìm thấy lớp');
    return { data: item };
  }

  async update(id: string, dto: UpdateClassDto) {
    const item = await this.findActive(id);
    if (dto.name && dto.name !== item.name) {
      await this.ensureUniqueName(dto.name, id);
    }
    if (dto.centerId) await this.ensureCenter(dto.centerId);
    Object.assign(item, dto);
    return { data: await this.classRepository.save(item) };
  }

  async remove(id: string) {
    const item = await this.findActive(id);
    item.isActive = false;
    await this.classRepository.save(item);
    return { data: { id: item.id, isActive: item.isActive } };
  }

  private async findActive(id: string) {
    const item = await this.classRepository.findOne({
      where: { id, isActive: true },
    });
    if (!item) throw new NotFoundException('Không tìm thấy lớp');
    return item;
  }

  private async ensureCenter(centerId: string) {
    const center = await this.centerRepository.findOne({
      where: { id: centerId, isActive: true },
    });
    if (!center) throw new NotFoundException('Không tìm thấy trung tâm');
  }

  private async ensureUniqueName(name: string, excludeId?: string) {
    const existing = await this.classRepository.findOne({
      where: { name },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('Tên lớp đã tồn tại');
    }
  }
}
