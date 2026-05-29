import {
  IsBoolean,
  IsDate,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class AttachExamToCurriculumDto {
  @IsUUID()
  examId!: string;

  @IsInt()
  @Min(0)
  orderIndex!: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsDate()
  availableFrom?: Date;

  @IsOptional()
  @IsDate()
  availableUntil?: Date;
}
