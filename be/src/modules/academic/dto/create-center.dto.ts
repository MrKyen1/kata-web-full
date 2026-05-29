import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateCenterDto {
  @IsString()
  name!: string;

  @IsString()
  address!: string;

  @IsString()
  phone!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  mapEmbedUrl?: string;
}
