import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMediaAssetDto } from '../dto/create-media-asset.dto';
import { UpdateMediaAssetDto } from '../dto/update-media-asset.dto';
import { MediaAsset } from '../entities/media-asset.entity';
import { MediaType } from '../enums/learning.enums';

@Injectable()
export class MediaAssetsService {
  constructor(
    @InjectRepository(MediaAsset)
    private readonly mediaAssetRepository: Repository<MediaAsset>,
  ) {}

  async create(dto: CreateMediaAssetDto) {
    const mediaAsset = this.mediaAssetRepository.create({
      ...dto,
      metadata: dto.metadata ?? {},
    });
    return { data: await this.mediaAssetRepository.save(mediaAsset) };
  }

  async findAll(query: {
    isActive?: boolean;
    search?: string;
    type?: MediaType;
  }) {
    const qb = this.mediaAssetRepository
      .createQueryBuilder('mediaAsset')
      .where('mediaAsset.is_active = :isActive', {
        isActive: query.isActive ?? true,
      });

    if (query.type) {
      qb.andWhere('mediaAsset.type = :type', { type: query.type });
    }

    if (query.search) {
      qb.andWhere(
        '(mediaAsset.url ILIKE :search OR mediaAsset.storage_key ILIKE :search OR mediaAsset.alt_text ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    return {
      data: await qb.orderBy('mediaAsset.created_at', 'DESC').getMany(),
    };
  }

  async findOne(id: string) {
    const mediaAsset = await this.mediaAssetRepository.findOne({
      where: { id, isActive: true },
    });
    if (!mediaAsset)
      throw new NotFoundException('Không tìm thấy tài nguyên media');
    return { data: mediaAsset };
  }

  async update(id: string, dto: UpdateMediaAssetDto) {
    const mediaAsset = await this.findActive(id);
    Object.assign(mediaAsset, dto);
    return { data: await this.mediaAssetRepository.save(mediaAsset) };
  }

  async inactive(id: string) {
    const mediaAsset = await this.findActive(id);
    mediaAsset.isActive = false;
    await this.mediaAssetRepository.save(mediaAsset);
    return { data: { id: mediaAsset.id, isActive: mediaAsset.isActive } };
  }

  private async findActive(id: string) {
    const mediaAsset = await this.mediaAssetRepository.findOne({
      where: { id, isActive: true },
    });
    if (!mediaAsset)
      throw new NotFoundException('Không tìm thấy tài nguyên media');
    return mediaAsset;
  }
}
