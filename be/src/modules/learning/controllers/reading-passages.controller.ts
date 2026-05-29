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
import { CreateReadingPassageDto } from '../dto/create-reading-passage.dto';
import { UpdateReadingPassageDto } from '../dto/update-reading-passage.dto';
import { ReadingPassagesService } from '../services/reading-passages.service';

@ApiTags('Learning - Reading Passages')
@Permissions('learning.manage')
@Controller('learning/reading-passages')
export class ReadingPassagesController {
  constructor(
    private readonly readingPassagesService: ReadingPassagesService,
  ) {}

  @Post()
  create(@Body() dto: CreateReadingPassageDto) {
    return this.readingPassagesService.create(dto);
  }

  @Get()
  findAll(
    @Query('isActive') isActive?: boolean,
    @Query('search') search?: string,
    @Query('levelId') levelId?: string,
  ) {
    return this.readingPassagesService.findAll({ isActive, search, levelId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.readingPassagesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReadingPassageDto) {
    return this.readingPassagesService.update(id, dto);
  }

  @Delete(':id')
  inactive(@Param('id') id: string) {
    return this.readingPassagesService.inactive(id);
  }
}
