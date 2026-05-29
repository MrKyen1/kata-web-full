import { PartialType } from '@nestjs/mapped-types';
import { CreateReadingPassageDto } from './create-reading-passage.dto';

export class UpdateReadingPassageDto extends PartialType(
  CreateReadingPassageDto,
) {}
