import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateReadingPassageDto {
  @ApiProperty({ example: 'A Day at School' })
  @IsString()
  title!: string;

  @ApiProperty({ example: "Tom goes to school at seven o'clock..." })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ example: 'Internal content team' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ example: '018f7f76-0f30-7cc9-b5f9-6a2f8f49f1e2' })
  @IsOptional()
  @IsUUID()
  levelId?: string;

  @ApiPropertyOptional({ example: {} })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
