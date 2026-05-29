import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AttachQuestionToExamDto } from '../dto/attach-question-to-exam.dto';
import { CreateExamDto } from '../dto/create-exam.dto';
import { ReorderExamQuestionsDto } from '../dto/reorder-exam-questions.dto';
import { UpdateExamDto } from '../dto/update-exam.dto';
import { ExamQuestion } from '../entities/exam-question.entity';
import { Exam } from '../entities/exam.entity';
import { Question } from '../entities/question.entity';
import { ContentStatus } from '../enums/learning.enums';

@Injectable()
export class ExamsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(ExamQuestion)
    private readonly examQuestionRepository: Repository<ExamQuestion>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {}

  async create(dto: CreateExamDto) {
    await this.ensureCodeAvailable(dto.code);

    const exam = this.examRepository.create({
      ...dto,
      metadata: dto.metadata ?? {},
    });

    return { data: await this.examRepository.save(exam) };
  }

  async findAll(query: {
    isActive?: boolean;
    status?: ContentStatus;
    search?: string;
  }) {
    const qb = this.examRepository.createQueryBuilder('exam');

    qb.where('exam.is_active = :isActive', {
      isActive: query.isActive ?? true,
    });

    if (query.status) {
      qb.andWhere('exam.status = :status', { status: query.status });
    }

    if (query.search) {
      qb.andWhere('(exam.title ILIKE :search OR exam.code ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    qb.orderBy('exam.created_at', 'DESC');

    return { data: await qb.getMany() };
  }

  async findOne(id: string) {
    const exam = await this.examRepository.findOne({
      where: { id, isActive: true },
      relations: {
        examQuestions: {
          question: true,
        },
      },
      order: {
        examQuestions: {
          orderIndex: 'ASC',
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Không tìm thấy bài thi');
    }

    exam.examQuestions = (exam.examQuestions ?? []).filter(
      (item) => item.isActive && item.question?.isActive,
    );

    return { data: exam };
  }

  async update(id: string, dto: UpdateExamDto) {
    const exam = await this.findActiveExam(id);

    if (dto.code && dto.code !== exam.code) {
      await this.ensureCodeAvailable(dto.code);
    }

    Object.assign(exam, dto);
    return { data: await this.examRepository.save(exam) };
  }

  async inactive(id: string) {
    const exam = await this.findActiveExam(id);
    exam.isActive = false;
    await this.examRepository.save(exam);
    return { data: { id: exam.id, isActive: exam.isActive } };
  }

  async attachQuestion(examId: string, dto: AttachQuestionToExamDto) {
    await this.findActiveExam(examId);

    const question = await this.questionRepository.findOne({
      where: { id: dto.questionId, isActive: true },
    });
    if (!question) {
      throw new NotFoundException('Không tìm thấy câu hỏi');
    }

    await this.ensureOrderAvailable(examId, dto.orderIndex, dto.questionId);

    let mapping = await this.examQuestionRepository.findOne({
      where: { examId, questionId: dto.questionId },
    });

    mapping = this.examQuestionRepository.create({
      ...mapping,
      examId,
      questionId: dto.questionId,
      orderIndex: dto.orderIndex,
      score: dto.score.toString(),
      isRequired: dto.isRequired ?? mapping?.isRequired ?? true,
      isActive: true,
    });

    return { data: await this.examQuestionRepository.save(mapping) };
  }

  async removeQuestion(examId: string, questionId: string) {
    const mapping = await this.examQuestionRepository.findOne({
      where: { examId, questionId, isActive: true },
    });

    if (!mapping) {
      throw new NotFoundException(
        'Không tìm thấy liên kết câu hỏi trong bài thi',
      );
    }

    mapping.isActive = false;
    await this.examQuestionRepository.save(mapping);

    return { data: { id: mapping.id, isActive: mapping.isActive } };
  }

  async reorderQuestions(examId: string, dto: ReorderExamQuestionsDto) {
    await this.findActiveExam(examId);

    const orderIndexes = dto.items.map((item) => item.orderIndex);
    if (new Set(orderIndexes).size !== orderIndexes.length) {
      throw new ConflictException('Thứ tự trong yêu cầu bị trùng');
    }

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(ExamQuestion);

      for (const item of dto.items) {
        const mapping = await repo.findOne({
          where: {
            examId,
            questionId: item.questionId,
            isActive: true,
          },
        });

        if (!mapping) {
          throw new NotFoundException(
            'Không tìm thấy liên kết câu hỏi trong bài thi',
          );
        }

        const orderOwner = await repo.findOne({
          where: { examId, orderIndex: item.orderIndex, isActive: true },
        });

        if (orderOwner && orderOwner.questionId !== item.questionId) {
          throw new ConflictException(
            'Thứ tự câu hỏi trong bài thi đã tồn tại',
          );
        }

        mapping.orderIndex = item.orderIndex;
        await repo.save(mapping);
      }

      const data = await repo.find({
        where: { examId, isActive: true },
        order: { orderIndex: 'ASC' },
      });

      return { data };
    });
  }

  private async findActiveExam(id: string) {
    const exam = await this.examRepository.findOne({
      where: { id, isActive: true },
    });

    if (!exam) {
      throw new NotFoundException('Không tìm thấy bài thi');
    }

    return exam;
  }

  private async ensureCodeAvailable(code: string) {
    const existing = await this.examRepository.findOne({ where: { code } });
    if (existing) {
      throw new ConflictException('Mã bài thi đã tồn tại');
    }
  }

  private async ensureOrderAvailable(
    examId: string,
    orderIndex: number,
    questionId: string,
  ) {
    const existing = await this.examQuestionRepository.findOne({
      where: { examId, orderIndex, isActive: true },
    });

    if (existing && existing.questionId !== questionId) {
      throw new ConflictException('Thứ tự câu hỏi trong bài thi đã tồn tại');
    }
  }
}
