import { Uuidv7PrimaryColumn } from 'src/common/decorators/uuidv7.decorator';
import { BaseEntity } from 'src/common/entities/base.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { ContentStatus, QuestionType } from '../enums/learning.enums';
import { ErrorCorrectionQuestion } from './error-correction-question.entity';
import { ExamQuestion } from './exam-question.entity';
import { HintRewriteQuestion } from './hint-rewrite-question.entity';
import { Level } from './level.entity';
import { MatchingPair } from './matching-pair.entity';
import { MatchingQuestion } from './matching-question.entity';
import { QuestionMedia } from './question-media.entity';
import { QuestionOption } from './question-option.entity';
import { QuestionTag } from './question-tag.entity';
import { ReadingComprehensionQuestion } from './reading-comprehension-question.entity';
import { SentenceRewriteQuestion } from './sentence-rewrite-question.entity';
import { Skill } from './skill.entity';
import { Topic } from './topic.entity';
import { WordOrderingQuestion } from './word-ordering-question.entity';

@Entity('questions')
@Index(['type', 'status', 'isActive'])
@Index(['skillId', 'difficultyLevelId'])
@Index(['topicId'])
export class Question extends BaseEntity {
  @Uuidv7PrimaryColumn()
  id!: string;

  @Column({ type: 'enum', enum: QuestionType, enumName: 'questions_type_enum' })
  type!: QuestionType;

  @Column({ type: 'text' })
  prompt!: string;

  @Column({ type: 'text', nullable: true })
  instruction!: string | null;

  @Column({ name: 'difficulty_level_id', type: 'uuid', nullable: true })
  difficultyLevelId!: string | null;

  @ManyToOne(() => Level, (level) => level.questions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'difficulty_level_id' })
  difficultyLevel?: Level | null;

  @Column({ name: 'skill_id', type: 'uuid', nullable: true })
  skillId!: string | null;

  @ManyToOne(() => Skill, (skill) => skill.questions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'skill_id' })
  skill?: Skill | null;

  @Column({ name: 'topic_id', type: 'uuid', nullable: true })
  topicId!: string | null;

  @ManyToOne(() => Topic, (topic) => topic.questions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'topic_id' })
  topic?: Topic | null;

  @Column({ type: 'text', nullable: true })
  explanation!: string | null;

  @Column({
    type: 'enum',
    enum: ContentStatus,
    enumName: 'content_status_enum',
    default: ContentStatus.DRAFT,
  })
  status!: ContentStatus;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata!: Record<string, unknown>;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(() => QuestionOption, (option) => option.question)
  options!: QuestionOption[];

  @OneToMany(() => QuestionMedia, (questionMedia) => questionMedia.question)
  media!: QuestionMedia[];

  @OneToMany(() => QuestionTag, (questionTag) => questionTag.question)
  questionTags!: QuestionTag[];

  @OneToMany(() => ExamQuestion, (examQuestion) => examQuestion.question)
  examQuestions!: ExamQuestion[];

  @OneToOne(() => WordOrderingQuestion, (detail) => detail.question)
  wordOrderingDetail?: WordOrderingQuestion | null;

  @OneToOne(() => ReadingComprehensionQuestion, (detail) => detail.question)
  readingComprehensionDetail?: ReadingComprehensionQuestion | null;

  @OneToOne(() => SentenceRewriteQuestion, (detail) => detail.question)
  sentenceRewriteDetail?: SentenceRewriteQuestion | null;

  @OneToOne(() => HintRewriteQuestion, (detail) => detail.question)
  hintRewriteDetail?: HintRewriteQuestion | null;

  @OneToOne(() => ErrorCorrectionQuestion, (detail) => detail.question)
  errorCorrectionDetail?: ErrorCorrectionQuestion | null;

  @OneToOne(() => MatchingQuestion, (detail) => detail.question)
  matchingDetail?: MatchingQuestion | null;

  @OneToMany(() => MatchingPair, (pair) => pair.question)
  matchingPairs!: MatchingPair[];
}
