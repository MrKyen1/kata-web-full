import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class AttachQuestionToExamDto {
  @IsUUID()
  questionId!: string;

  @IsInt()
  @Min(0)
  orderIndex!: number;

  @IsNumber()
  @Min(0)
  score!: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}
