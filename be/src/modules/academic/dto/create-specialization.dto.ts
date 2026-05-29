import { IsOptional, IsString } from 'class-validator';

export class CreateSpecializationDto {
  @IsString()
  name!: string;

  @IsString()
  code!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
