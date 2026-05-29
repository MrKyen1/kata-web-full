/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  CreateQuestionDto,
  CreateQuestionMediaDto,
  CreateQuestionOptionDto,
} from '../dto/create-question.dto';
import { UpdateQuestionDto } from '../dto/update-question.dto';
import { ErrorCorrectionQuestion } from '../entities/error-correction-question.entity';
import { HintRewriteQuestion } from '../entities/hint-rewrite-question.entity';
import { MatchingPair } from '../entities/matching-pair.entity';
import { MatchingQuestion } from '../entities/matching-question.entity';
import { MediaAsset } from '../entities/media-asset.entity';
import { QuestionMedia } from '../entities/question-media.entity';
import { QuestionOption } from '../entities/question-option.entity';
import { QuestionTag } from '../entities/question-tag.entity';
import { Question } from '../entities/question.entity';
import { ReadingPassage } from '../entities/reading-passage.entity';
import { ReadingComprehensionQuestion } from '../entities/reading-comprehension-question.entity';
import { SentenceRewriteQuestion } from '../entities/sentence-rewrite-question.entity';
import { Level } from '../entities/level.entity';
import { Skill } from '../entities/skill.entity';
import { Tag } from '../entities/tag.entity';
import { Topic } from '../entities/topic.entity';
import { WordOrderingQuestion } from '../entities/word-ordering-question.entity';
import {
  ContentStatus,
  GradingMode,
  QuestionType,
} from '../enums/learning.enums';

type QuestionDetail = Record<string, any>;

@Injectable()
export class QuestionsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {}

  async create(dto: CreateQuestionDto) {
    this.validateQuestionPayload(
      dto.type,
      dto.detail,
      dto.options,
      dto.mediaIds,
    );

    return this.dataSource.transaction(async (manager) => {
      await this.validateReferences(manager, dto);

      const question = await manager.getRepository(Question).save(
        manager.getRepository(Question).create({
          type: dto.type,
          prompt: dto.prompt,
          instruction: dto.instruction,
          explanation: dto.explanation,
          difficultyLevelId: dto.difficultyLevelId,
          skillId: dto.skillId,
          topicId: dto.topicId,
          status: dto.status,
          metadata: dto.metadata ?? {},
        }),
      );

      await this.replaceOptions(manager, question.id, dto.options);
      await this.replaceMedia(manager, question.id, dto.mediaIds);
      await this.replaceTags(manager, question.id, dto.tagIds);
      await this.saveDetail(manager, question.id, dto.type, dto.detail);

      return { data: await this.loadFullQuestion(manager, question.id) };
    });
  }

  async findAll(query: {
    isActive?: boolean;
    type?: QuestionType;
    status?: ContentStatus;
    skillId?: string;
    levelId?: string;
    topicId?: string;
    tagIds?: string[];
    search?: string;
  }) {
    const qb = this.questionRepository.createQueryBuilder('question');

    qb.where('question.is_active = :isActive', {
      isActive: query.isActive ?? true,
    });

    if (query.type) {
      qb.andWhere('question.type = :type', { type: query.type });
    }

    if (query.status) {
      qb.andWhere('question.status = :status', { status: query.status });
    }

    if (query.skillId) {
      qb.andWhere('question.skill_id = :skillId', { skillId: query.skillId });
    }

    if (query.levelId) {
      qb.andWhere('question.difficulty_level_id = :levelId', {
        levelId: query.levelId,
      });
    }

    if (query.topicId) {
      qb.andWhere('question.topic_id = :topicId', { topicId: query.topicId });
    }

    if (query.search) {
      qb.andWhere('question.prompt ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    if (query.tagIds?.length) {
      qb.innerJoin('question.questionTags', 'questionTag');
      qb.andWhere('questionTag.tag_id IN (:...tagIds)', {
        tagIds: query.tagIds,
      });
    }

    qb.orderBy('question.created_at', 'DESC');

    return { data: await qb.getMany() };
  }

  async findOne(id: string) {
    const question = await this.loadFullQuestion(this.dataSource.manager, id);
    if (!question || !question.isActive) {
      throw new NotFoundException('Không tìm thấy câu hỏi');
    }

    return { data: question };
  }

  async update(id: string, dto: UpdateQuestionDto) {
    if ('type' in dto) {
      throw new BadRequestException('Không được thay đổi loại câu hỏi');
    }

    const existing = await this.questionRepository.findOne({
      where: { id, isActive: true },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy câu hỏi');
    }

    const shouldValidateDetail =
      dto.detail !== undefined ||
      dto.options !== undefined ||
      dto.mediaIds !== undefined;
    if (shouldValidateDetail) {
      this.validateQuestionPayload(
        existing.type,
        dto.detail ?? {},
        dto.options,
        dto.mediaIds,
        dto.detail === undefined,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      await this.validateReferences(manager, {
        ...dto,
        type: existing.type,
        prompt: dto.prompt ?? existing.prompt,
        detail: dto.detail ?? {},
      });

      const repo = manager.getRepository(Question);
      const question = await repo.findOneOrFail({ where: { id } });

      Object.assign(question, {
        prompt: dto.prompt ?? question.prompt,
        instruction: dto.instruction ?? question.instruction,
        explanation: dto.explanation ?? question.explanation,
        difficultyLevelId: dto.difficultyLevelId ?? question.difficultyLevelId,
        skillId: dto.skillId ?? question.skillId,
        topicId: dto.topicId ?? question.topicId,
        status: dto.status ?? question.status,
        metadata: dto.metadata ?? question.metadata,
      });

      await repo.save(question);

      if (dto.options !== undefined) {
        await this.replaceOptions(manager, id, dto.options);
      }
      if (dto.mediaIds !== undefined) {
        await this.replaceMedia(manager, id, dto.mediaIds);
      }
      if (dto.tagIds !== undefined) {
        await this.replaceTags(manager, id, dto.tagIds);
      }
      if (dto.detail !== undefined) {
        await this.replaceDetail(manager, id, existing.type);
        await this.saveDetail(manager, id, existing.type, dto.detail);
      }

      return { data: await this.loadFullQuestion(manager, id) };
    });
  }

  async inactive(id: string) {
    const question = await this.questionRepository.findOne({
      where: { id, isActive: true },
    });

    if (!question) {
      throw new NotFoundException('Không tìm thấy câu hỏi');
    }

    question.isActive = false;
    await this.questionRepository.save(question);

    return { data: { id: question.id, isActive: question.isActive } };
  }

  private validateQuestionPayload(
    type: QuestionType,
    detail: QuestionDetail,
    options?: CreateQuestionOptionDto[],
    mediaIds?: CreateQuestionMediaDto[],
    partial = false,
  ) {
    const hasCorrectOption =
      options?.some((option) => option.isCorrect) ?? false;
    const hasPromptAudio =
      mediaIds?.some((media) => media.role === 'prompt_audio') ?? false;
    const hasPromptImage =
      mediaIds?.some((media) => media.role === 'prompt_image') ?? false;

    if (
      [
        QuestionType.MULTIPLE_CHOICE,
        QuestionType.AUDIO_CHOICE,
        QuestionType.IMAGE_CHOICE,
      ].includes(type) &&
      ((!partial && !options?.length) ||
        (options !== undefined && (!options.length || !hasCorrectOption)))
    ) {
      throw new BadRequestException(
        'Câu hỏi lựa chọn cần ít nhất một đáp án đúng',
      );
    }

    if (
      type === QuestionType.AUDIO_CHOICE &&
      ((!partial && !hasPromptAudio) ||
        (mediaIds !== undefined && !hasPromptAudio))
    ) {
      throw new BadRequestException(
        'Câu hỏi lựa chọn âm thanh cần media prompt_audio',
      );
    }

    if (
      type === QuestionType.IMAGE_CHOICE &&
      ((!partial && !hasPromptImage) ||
        (mediaIds !== undefined && !hasPromptImage))
    ) {
      throw new BadRequestException(
        'Câu hỏi lựa chọn hình ảnh cần media prompt_image',
      );
    }

    if (type === QuestionType.READING_COMPREHENSION) {
      if (
        (!partial &&
          (!detail.passageId || !options?.length || !hasCorrectOption)) ||
        (options !== undefined && (!options.length || !hasCorrectOption))
      ) {
        throw new BadRequestException(
          'Câu hỏi đọc hiểu cần passageId và đáp án đúng',
        );
      }
    }

    if (
      type === QuestionType.WORD_ORDERING &&
      !partial &&
      !detail.correctTokens?.length
    ) {
      throw new BadRequestException('Câu hỏi sắp xếp từ cần correctTokens');
    }

    if (type === QuestionType.SENTENCE_REWRITE && !partial) {
      if (!detail.sourceSentence || !detail.acceptedAnswers?.length) {
        throw new BadRequestException(
          'Câu hỏi viết lại câu cần sourceSentence và acceptedAnswers',
        );
      }
    }

    if (type === QuestionType.HINT_REWRITE && !partial) {
      if (
        !detail.sourceSentence ||
        !detail.hintWord ||
        !detail.acceptedAnswers?.length
      ) {
        throw new BadRequestException(
          'Câu hỏi viết lại theo gợi ý cần sourceSentence, hintWord và acceptedAnswers',
        );
      }
    }

    if (type === QuestionType.ERROR_CORRECTION && !partial) {
      if (!detail.incorrectSentence || !detail.correctSentence) {
        throw new BadRequestException(
          'Câu hỏi sửa lỗi cần incorrectSentence và correctSentence',
        );
      }
    }

    if (
      type === QuestionType.MATCHING &&
      !partial &&
      detail.pairs?.length < 2
    ) {
      throw new BadRequestException('Câu hỏi nối cặp cần ít nhất hai cặp');
    }
  }

  private async replaceOptions(
    manager: EntityManager,
    questionId: string,
    options?: CreateQuestionOptionDto[],
  ) {
    await manager.getRepository(QuestionOption).delete({ questionId });

    if (!options?.length) {
      return;
    }

    await manager.getRepository(QuestionOption).save(
      options.map((option, index) =>
        manager.getRepository(QuestionOption).create({
          questionId,
          label: option.label,
          content: option.content,
          isCorrect: option.isCorrect ?? false,
          orderIndex: option.orderIndex ?? index,
          explanation: option.explanation,
          metadata: option.metadata ?? {},
        }),
      ),
    );
  }

  private async validateReferences(
    manager: EntityManager,
    dto: CreateQuestionDto,
  ) {
    if (dto.difficultyLevelId) {
      const exists = await manager.getRepository(Level).exists({
        where: { id: dto.difficultyLevelId, isActive: true },
      });
      if (!exists) throw new NotFoundException('Không tìm thấy cấp độ');
    }

    if (dto.skillId) {
      const exists = await manager.getRepository(Skill).exists({
        where: { id: dto.skillId, isActive: true },
      });
      if (!exists) throw new NotFoundException('Không tìm thấy kỹ năng');
    }

    if (dto.topicId) {
      const exists = await manager.getRepository(Topic).exists({
        where: { id: dto.topicId, isActive: true },
      });
      if (!exists) throw new NotFoundException('Không tìm thấy chủ đề');
    }

    if (dto.tagIds?.length) {
      const count = await manager.getRepository(Tag).count({
        where: dto.tagIds.map((id) => ({ id, isActive: true })),
      });
      if (count !== new Set(dto.tagIds).size) {
        throw new NotFoundException('Không tìm thấy một hoặc nhiều thẻ');
      }
    }

    if (dto.mediaIds?.length) {
      const mediaIds = [...new Set(dto.mediaIds.map((item) => item.mediaId))];
      const count = await manager.getRepository(MediaAsset).count({
        where: mediaIds.map((id) => ({ id, isActive: true })),
      });
      if (count !== mediaIds.length) {
        throw new NotFoundException(
          'Không tìm thấy một hoặc nhiều tài nguyên media',
        );
      }
    }

    if (
      dto.type === QuestionType.READING_COMPREHENSION &&
      dto.detail?.passageId
    ) {
      const exists = await manager.getRepository(ReadingPassage).exists({
        where: { id: dto.detail.passageId as string, isActive: true },
      });
      if (!exists) throw new NotFoundException('Không tìm thấy bài đọc');
    }
  }

  private async replaceMedia(
    manager: EntityManager,
    questionId: string,
    mediaIds?: CreateQuestionMediaDto[],
  ) {
    await manager.getRepository(QuestionMedia).delete({ questionId });

    if (!mediaIds?.length) {
      return;
    }

    await manager.getRepository(QuestionMedia).save(
      mediaIds.map((media, index) =>
        manager.getRepository(QuestionMedia).create({
          questionId,
          mediaId: media.mediaId,
          role: media.role,
          orderIndex: media.orderIndex ?? index,
        }),
      ),
    );
  }

  private async replaceTags(
    manager: EntityManager,
    questionId: string,
    tagIds?: string[],
  ) {
    await manager.getRepository(QuestionTag).delete({ questionId });

    if (!tagIds?.length) {
      return;
    }

    await manager.getRepository(QuestionTag).save(
      tagIds.map((tagId) =>
        manager.getRepository(QuestionTag).create({
          questionId,
          tagId,
        }),
      ),
    );
  }

  private async replaceDetail(
    manager: EntityManager,
    questionId: string,
    type: QuestionType,
  ) {
    switch (type) {
      case QuestionType.WORD_ORDERING:
        await manager
          .getRepository(WordOrderingQuestion)
          .delete({ questionId });
        break;
      case QuestionType.READING_COMPREHENSION:
        await manager
          .getRepository(ReadingComprehensionQuestion)
          .delete({ questionId });
        break;
      case QuestionType.SENTENCE_REWRITE:
        await manager
          .getRepository(SentenceRewriteQuestion)
          .delete({ questionId });
        break;
      case QuestionType.HINT_REWRITE:
        await manager.getRepository(HintRewriteQuestion).delete({ questionId });
        break;
      case QuestionType.ERROR_CORRECTION:
        await manager
          .getRepository(ErrorCorrectionQuestion)
          .delete({ questionId });
        break;
      case QuestionType.MATCHING:
        await manager.getRepository(MatchingQuestion).delete({ questionId });
        await manager.getRepository(MatchingPair).delete({ questionId });
        break;
      default:
        break;
    }
  }

  private async saveDetail(
    manager: EntityManager,
    questionId: string,
    type: QuestionType,
    detail: QuestionDetail,
  ) {
    switch (type) {
      case QuestionType.WORD_ORDERING:
        await manager.getRepository(WordOrderingQuestion).save({
          questionId,
          correctTokens: detail.correctTokens,
          caseSensitive: detail.caseSensitive ?? false,
          allowPunctuationVariants: detail.allowPunctuationVariants ?? true,
        });
        break;
      case QuestionType.READING_COMPREHENSION:
        await manager.getRepository(ReadingComprehensionQuestion).save({
          questionId,
          passageId: detail.passageId,
        });
        break;
      case QuestionType.SENTENCE_REWRITE:
        await manager.getRepository(SentenceRewriteQuestion).save({
          questionId,
          sourceSentence: detail.sourceSentence,
          acceptedAnswers: detail.acceptedAnswers,
          gradingMode: detail.gradingMode ?? GradingMode.NORMALIZED,
        });
        break;
      case QuestionType.HINT_REWRITE:
        await manager.getRepository(HintRewriteQuestion).save({
          questionId,
          sourceSentence: detail.sourceSentence,
          hintWord: detail.hintWord,
          acceptedAnswers: detail.acceptedAnswers,
          mustUseHint: detail.mustUseHint ?? true,
          gradingMode: detail.gradingMode ?? GradingMode.NORMALIZED,
        });
        break;
      case QuestionType.ERROR_CORRECTION:
        await manager.getRepository(ErrorCorrectionQuestion).save({
          questionId,
          incorrectSentence: detail.incorrectSentence,
          correctSentence: detail.correctSentence,
          errorSpans: detail.errorSpans ?? [],
        });
        break;
      case QuestionType.MATCHING:
        await manager.getRepository(MatchingQuestion).save({
          questionId,
          shuffleLeft: detail.shuffleLeft ?? true,
          shuffleRight: detail.shuffleRight ?? true,
        });
        await manager.getRepository(MatchingPair).save(
          (detail.pairs ?? []).map((pair: QuestionDetail, index: number) => ({
            questionId,
            leftText: pair.leftText,
            rightText: pair.rightText,
            leftMediaId: pair.leftMediaId,
            rightMediaId: pair.rightMediaId,
            orderIndex: pair.orderIndex ?? index,
          })),
        );
        break;
      default:
        break;
    }
  }

  private async loadFullQuestion(manager: EntityManager, id: string) {
    const question = await manager.getRepository(Question).findOne({
      where: { id },
      relations: {
        difficultyLevel: true,
        skill: true,
        topic: true,
        options: true,
        media: {
          media: true,
        },
        questionTags: {
          tag: true,
        },
        wordOrderingDetail: true,
        readingComprehensionDetail: {
          passage: true,
        },
        sentenceRewriteDetail: true,
        hintRewriteDetail: true,
        errorCorrectionDetail: true,
        matchingDetail: true,
        matchingPairs: {
          leftMedia: true,
          rightMedia: true,
        },
      },
      order: {
        options: {
          orderIndex: 'ASC',
        },
        media: {
          orderIndex: 'ASC',
        },
        matchingPairs: {
          orderIndex: 'ASC',
        },
      },
    });

    return question;
  }
}
