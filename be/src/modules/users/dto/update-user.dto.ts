import {
  ArrayMinSize,
  IsDateString,
  IsEmail,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserTeacherProfileDto {
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

export class UpdateUserStudentProfileDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  classIds?: string[];
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateUserTeacherProfileDto)
  teacherProfile?: UpdateUserTeacherProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateUserStudentProfileDto)
  studentProfile?: UpdateUserStudentProfileDto;
}
