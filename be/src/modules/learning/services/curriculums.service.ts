import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttachExamToCurriculumDto } from '../dto/attach-exam-to-curriculum.dto';
import { CreateCurriculumDto } from '../dto/create-curriculum.dto';
import { UpdateCurriculumDto } from '../dto/update-curriculum.dto';
import { CurriculumExam } from '../entities/curriculum-exam.entity';
import { Curriculum } from '../entities/curriculum.entity';
import { Exam } from '../entities/exam.entity';
import { ContentStatus } from '../enums/learning.enums';

@Injectable()
export class CurriculumsService {
  constructor(
    @InjectRepository(Curriculum)
    private readonly curriculumRepository: Repository<Curriculum>,
    @InjectRepository(CurriculumExam)
    private readonly curriculumExamRepository: Repository<CurriculumExam>,
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
  ) {}

  async create(dto: CreateCurriculumDto) {
    await this.ensureCodeAvailable(dto.code);

    const curriculum = this.curriculumRepository.create({
      ...dto,
      metadata: dto.metadata ?? {},
    });

    return { data: await this.curriculumRepository.save(curriculum) };
  }

  async findAll(query: {
    isActive?: boolean;
    status?: ContentStatus;
    levelId?: string;
    search?: string;
  }) {
    const qb = this.curriculumRepository.createQueryBuilder('curriculum');

    qb.where('curriculum.is_active = :isActive', {
      isActive: query.isActive ?? true,
    });

    if (query.status) {
      qb.andWhere('curriculum.status = :status', { status: query.status });
    }

    if (query.levelId) {
      qb.andWhere('curriculum.level_id = :levelId', { levelId: query.levelId });
    }

    if (query.search) {
      qb.andWhere(
        '(curriculum.title ILIKE :search OR curriculum.code ILIKE :search)',
        {
          search: `%${query.search}%`,
        },
      );
    }

    qb.orderBy('curriculum.created_at', 'DESC');

    return { data: await qb.getMany() };
  }

  async findOne(id: string) {
    const curriculum = await this.curriculumRepository.findOne({
      where: { id, isActive: true },
      relations: {
        level: true,
        curriculumExams: {
          exam: true,
        },
      },
      order: {
        curriculumExams: {
          orderIndex: 'ASC',
        },
      },
    });

    if (!curriculum) {
      throw new NotFoundException('Không tìm thấy chương trình học');
    }

    curriculum.curriculumExams = (curriculum.curriculumExams ?? []).filter(
      (item) => item.isActive && item.exam?.isActive,
    );

    return { data: curriculum };
  }

  async update(id: string, dto: UpdateCurriculumDto) {
    const curriculum = await this.findActiveCurriculum(id);

    if (dto.code && dto.code !== curriculum.code) {
      await this.ensureCodeAvailable(dto.code);
    }

    Object.assign(curriculum, dto);
    return { data: await this.curriculumRepository.save(curriculum) };
  }

  async inactive(id: string) {
    const curriculum = await this.findActiveCurriculum(id);
    curriculum.isActive = false;
    await this.curriculumRepository.save(curriculum);
    return { data: { id: curriculum.id, isActive: curriculum.isActive } };
  }

  async attachExam(curriculumId: string, dto: AttachExamToCurriculumDto) {
    await this.findActiveCurriculum(curriculumId);

    const exam = await this.examRepository.findOne({
      where: { id: dto.examId, isActive: true },
    });
    if (!exam) {
      throw new NotFoundException('Không tìm thấy bài thi');
    }

    await this.ensureOrderAvailable(curriculumId, dto.orderIndex, dto.examId);

    let mapping = await this.curriculumExamRepository.findOne({
      where: { curriculumId, examId: dto.examId },
    });

    mapping = this.curriculumExamRepository.create({
      ...mapping,
      curriculumId,
      examId: dto.examId,
      orderIndex: dto.orderIndex,
      isRequired: dto.isRequired ?? mapping?.isRequired ?? true,
      availableFrom: dto.availableFrom,
      availableUntil: dto.availableUntil,
      isActive: true,
    });

    return { data: await this.curriculumExamRepository.save(mapping) };
  }

  async removeExam(curriculumId: string, examId: string) {
    const mapping = await this.curriculumExamRepository.findOne({
      where: { curriculumId, examId, isActive: true },
    });

    if (!mapping) {
      throw new NotFoundException(
        'Không tìm thấy liên kết bài thi trong chương trình học',
      );
    }

    mapping.isActive = false;
    await this.curriculumExamRepository.save(mapping);

    return { data: { id: mapping.id, isActive: mapping.isActive } };
  }

  private async findActiveCurriculum(id: string) {
    const curriculum = await this.curriculumRepository.findOne({
      where: { id, isActive: true },
    });

    if (!curriculum) {
      throw new NotFoundException('Không tìm thấy chương trình học');
    }

    return curriculum;
  }

  private async ensureCodeAvailable(code: string) {
    const existing = await this.curriculumRepository.findOne({
      where: { code },
    });
    if (existing) {
      throw new ConflictException('Mã chương trình học đã tồn tại');
    }
  }

  private async ensureOrderAvailable(
    curriculumId: string,
    orderIndex: number,
    examId: string,
  ) {
    const existing = await this.curriculumExamRepository.findOne({
      where: { curriculumId, orderIndex, isActive: true },
    });

    if (existing && existing.examId !== examId) {
      throw new ConflictException(
        'Thứ tự bài thi trong chương trình học đã tồn tại',
      );
    }
  }
}
