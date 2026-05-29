import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { UpdateSpecializationDto } from '../dto/update-specialization.dto';
import { CreateSpecializationDto } from '../dto/create-specialization.dto';
import { SpecializationsService } from '../services/specializations.service';

@ApiBearerAuth()
@ApiTags('Specializations')
@Permissions('classes.manage')
@Controller('specializations')
export class SpecializationsController {
  constructor(
    private readonly SpecializationsService: SpecializationsService,
  ) {}

  @Post()
  create(@Body() createSpecializationDto: CreateSpecializationDto) {
    return this.SpecializationsService.create(createSpecializationDto);
  }

  @Get()
  findAll(
    @Query('isActive') isActive?: boolean,
    @Query('search') search?: string,
  ) {
    return this.SpecializationsService.findAll({ isActive, search });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.SpecializationsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSpecializationDto: UpdateSpecializationDto,
  ) {
    return this.SpecializationsService.update(id, updateSpecializationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.SpecializationsService.remove(id);
  }
}
