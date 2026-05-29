import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { CreateQuestionDto } from '../dto/create-question.dto';
import { UpdateQuestionDto } from '../dto/update-question.dto';
import { ContentStatus, QuestionType } from '../enums/learning.enums';
import { QuestionsService } from '../services/questions.service';

@ApiTags('Learning - Questions')
@Permissions('learning.manage')
@Controller('learning/questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  create(@Body() dto: CreateQuestionDto) {
    return this.questionsService.create(dto);
  }

  @Get()
  findAll(
    @Query('isActive') isActive?: boolean,
    @Query('type') type?: QuestionType,
    @Query('status') status?: ContentStatus,
    @Query('skillId') skillId?: string,
    @Query('levelId') levelId?: string,
    @Query('topicId') topicId?: string,
    @Query('tagIds') tagIds?: string | string[],
    @Query('search') search?: string,
  ) {
    const normalizedTagIds =
      typeof tagIds === 'string'
        ? tagIds.split(',').filter(Boolean)
        : Array.isArray(tagIds)
          ? tagIds
          : undefined;

    return this.questionsService.findAll({
      isActive,
      type,
      status,
      skillId,
      levelId,
      topicId,
      tagIds: normalizedTagIds,
      search,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.questionsService.update(id, dto);
  }

  @Delete(':id')
  inactive(@Param('id') id: string) {
    return this.questionsService.inactive(id);
  }
}
