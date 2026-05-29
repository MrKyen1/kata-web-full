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
import { AttachQuestionToExamDto } from '../dto/attach-question-to-exam.dto';
import { CreateExamDto } from '../dto/create-exam.dto';
import { ReorderExamQuestionsDto } from '../dto/reorder-exam-questions.dto';
import { UpdateExamDto } from '../dto/update-exam.dto';
import { ContentStatus } from '../enums/learning.enums';
import { ExamsService } from '../services/exams.service';

@ApiTags('Learning - Exams')
@Permissions('learning.manage')
@Controller('learning/exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  create(@Body() dto: CreateExamDto) {
    return this.examsService.create(dto);
  }

  @Get()
  findAll(
    @Query('isActive') isActive?: boolean,
    @Query('status') status?: ContentStatus,
    @Query('search') search?: string,
  ) {
    return this.examsService.findAll({ isActive, status, search });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.examsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExamDto) {
    return this.examsService.update(id, dto);
  }

  @Delete(':id')
  inactive(@Param('id') id: string) {
    return this.examsService.inactive(id);
  }

  @Post(':id/questions')
  attachQuestion(
    @Param('id') id: string,
    @Body() dto: AttachQuestionToExamDto,
  ) {
    return this.examsService.attachQuestion(id, dto);
  }

  @Delete(':id/questions/:questionId')
  removeQuestion(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
  ) {
    return this.examsService.removeQuestion(id, questionId);
  }

  @Patch(':id/questions/reorder')
  reorderQuestions(
    @Param('id') id: string,
    @Body() dto: ReorderExamQuestionsDto,
  ) {
    return this.examsService.reorderQuestions(id, dto);
  }
}
