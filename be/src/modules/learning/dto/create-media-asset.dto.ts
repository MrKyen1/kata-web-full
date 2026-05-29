import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { MediaType } from '../enums/learning.enums';

export class CreateMediaAssetDto {
  @ApiProperty({ enum: MediaType, example: MediaType.AUDIO })
  @IsEnum(MediaType)
  type!: MediaType;

  @ApiProperty({ example: 'https://cdn.example.com/audio/a1-listening-01.mp3' })
  @IsString()
  url!: string;

  @ApiPropertyOptional({ example: 'audio/a1-listening-01.mp3' })
  @IsOptional()
  @IsString()
  storageKey?: string;

  @ApiPropertyOptional({ example: 'audio/mpeg' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ example: 35 })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;

  @ApiPropertyOptional({ example: 1280 })
  @IsOptional()
  @IsInt()
  @Min(0)
  width?: number;

  @ApiPropertyOptional({ example: 720 })
  @IsOptional()
  @IsInt()
  @Min(0)
  height?: number;

  @ApiPropertyOptional({ example: 'A classroom listening prompt' })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({ example: {} })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
