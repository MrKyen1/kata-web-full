import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateClassDto {
  @IsString()
  name!: string;

  @IsUUID()
  centerId!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;
}
