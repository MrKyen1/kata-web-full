import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class ReorderExamQuestionItemDto {
  @IsUUID()
  questionId!: string;

  @IsInt()
  @Min(0)
  orderIndex!: number;
}

export class ReorderExamQuestionsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderExamQuestionItemDto)
  items!: ReorderExamQuestionItemDto[];
}
