import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ example: 'present-simple' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Present Simple' })
  @IsString()
  name!: string;
}
