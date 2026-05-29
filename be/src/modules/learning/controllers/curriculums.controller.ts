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
import { AttachExamToCurriculumDto } from '../dto/attach-exam-to-curriculum.dto';
import { CreateCurriculumDto } from '../dto/create-curriculum.dto';
import { UpdateCurriculumDto } from '../dto/update-curriculum.dto';
import { ContentStatus } from '../enums/learning.enums';
import { CurriculumsService } from '../services/curriculums.service';

@ApiTags('Learning - Curriculums')
@Permissions('learning.manage')
@Controller('learning/curriculums')
export class CurriculumsController {
  constructor(private readonly curriculumsService: CurriculumsService) {}

  @Post()
  create(@Body() dto: CreateCurriculumDto) {
    return this.curriculumsService.create(dto);
  }

  @Get()
  findAll(
    @Query('isActive') isActive?: boolean,
    @Query('status') status?: ContentStatus,
    @Query('levelId') levelId?: string,
    @Query('search') search?: string,
  ) {
    return this.curriculumsService.findAll({
      isActive,
      status,
      levelId,
      search,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.curriculumsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCurriculumDto) {
    return this.curriculumsService.update(id, dto);
  }

  @Delete(':id')
  inactive(@Param('id') id: string) {
    return this.curriculumsService.inactive(id);
  }

  @Post(':id/exams')
  attachExam(@Param('id') id: string, @Body() dto: AttachExamToCurriculumDto) {
    return this.curriculumsService.attachExam(id, dto);
  }

  @Delete(':id/exams/:examId')
  removeExam(@Param('id') id: string, @Param('examId') examId: string) {
    return this.curriculumsService.removeExam(id, examId);
  }
}
