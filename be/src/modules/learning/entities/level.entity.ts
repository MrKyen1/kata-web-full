import { Uuidv7PrimaryColumn } from 'src/common/decorators/uuidv7.decorator';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { Curriculum } from './curriculum.entity';
import { Question } from './question.entity';
import { ReadingPassage } from './reading-passage.entity';

@Entity('levels')
export class Level extends BaseEntity {
  @Uuidv7PrimaryColumn()
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  name!: string;

  @Column({ default: 0 })
  rank!: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(() => Question, (question) => question.difficultyLevel)
  questions!: Question[];

  @OneToMany(() => Curriculum, (curriculum) => curriculum.level)
  curriculums!: Curriculum[];

  @OneToMany(() => ReadingPassage, (passage) => passage.level)
  readingPassages!: ReadingPassage[];
}
