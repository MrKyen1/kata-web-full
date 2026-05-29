import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

export class CreateLevelDto {
  @ApiProperty({ example: 'A1' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Beginner' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(0)
  rank!: number;
}
