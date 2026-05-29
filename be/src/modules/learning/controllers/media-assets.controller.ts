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
import { CreateMediaAssetDto } from '../dto/create-media-asset.dto';
import { UpdateMediaAssetDto } from '../dto/update-media-asset.dto';
import { MediaType } from '../enums/learning.enums';
import { MediaAssetsService } from '../services/media-assets.service';

@ApiTags('Learning - Media Assets')
@Permissions('learning.manage')
@Controller('learning/media-assets')
export class MediaAssetsController {
  constructor(private readonly mediaAssetsService: MediaAssetsService) {}

  @Post()
  create(@Body() dto: CreateMediaAssetDto) {
    return this.mediaAssetsService.create(dto);
  }

  @Get()
  findAll(
    @Query('isActive') isActive?: boolean,
    @Query('search') search?: string,
    @Query('type') type?: MediaType,
  ) {
    return this.mediaAssetsService.findAll({ isActive, search, type });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mediaAssetsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMediaAssetDto) {
    return this.mediaAssetsService.update(id, dto);
  }

  @Delete(':id')
  inactive(@Param('id') id: string) {
    return this.mediaAssetsService.inactive(id);
  }
}
