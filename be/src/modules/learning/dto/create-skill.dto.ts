import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateSkillDto {
  @ApiProperty({ example: 'reading' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Reading' })
  @IsString()
  name!: string;
}
