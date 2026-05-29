import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTopicDto {
  @ApiProperty({ example: 'daily-life' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Daily Life' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: '018f7f76-0f30-7cc9-b5f9-6a2f8f49f1e2' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
