import {
  ArrayMinSize,
  IsInt,
  IsDateString,
  IsEmail,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserTeacherProfileDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  yearsOfExperience?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  classIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  specializationIds?: string[];
}

export class CreateUserStudentProfileDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  classIds!: string[];
}

export class CreateUserDto {
  @IsString()
  code!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  fullName!: string;

  @IsDateString()
  dateOfBirth!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsUUID()
  roleId!: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateUserTeacherProfileDto)
  teacherProfile?: CreateUserTeacherProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateUserStudentProfileDto)
  studentProfile?: CreateUserStudentProfileDto;
}
