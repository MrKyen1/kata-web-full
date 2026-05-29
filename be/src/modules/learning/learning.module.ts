import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurriculumsController } from './controllers/curriculums.controller';
import { ExamsController } from './controllers/exams.controller';
import { LevelsController } from './controllers/levels.controller';
import { MediaAssetsController } from './controllers/media-assets.controller';
import { QuestionsController } from './controllers/questions.controller';
import { ReadingPassagesController } from './controllers/reading-passages.controller';
import { SkillsController } from './controllers/skills.controller';
import { TagsController } from './controllers/tags.controller';
import { TopicsController } from './controllers/topics.controller';
import { CurriculumExam } from './entities/curriculum-exam.entity';
import { Curriculum } from './entities/curriculum.entity';
import { ErrorCorrectionQuestion } from './entities/error-correction-question.entity';
import { ExamQuestion } from './entities/exam-question.entity';
import { Exam } from './entities/exam.entity';
import { HintRewriteQuestion } from './entities/hint-rewrite-question.entity';
import { Level } from './entities/level.entity';
import { MatchingPair } from './entities/matching-pair.entity';
import { MatchingQuestion } from './entities/matching-question.entity';
import { MediaAsset } from './entities/media-asset.entity';
import { QuestionMedia } from './entities/question-media.entity';
import { QuestionOption } from './entities/question-option.entity';
import { QuestionTag } from './entities/question-tag.entity';
import { Question } from './entities/question.entity';
import { ReadingComprehensionQuestion } from './entities/reading-comprehension-question.entity';
import { ReadingPassage } from './entities/reading-passage.entity';
import { SentenceRewriteQuestion } from './entities/sentence-rewrite-question.entity';
import { Skill } from './entities/skill.entity';
import { Tag } from './entities/tag.entity';
import { Topic } from './entities/topic.entity';
import { WordOrderingQuestion } from './entities/word-ordering-question.entity';
import { CurriculumsService } from './services/curriculums.service';
import { ExamsService } from './services/exams.service';
import { LevelsService } from './services/levels.service';
import { MediaAssetsService } from './services/media-assets.service';
import { QuestionsService } from './services/questions.service';
import { ReadingPassagesService } from './services/reading-passages.service';
import { SkillsService } from './services/skills.service';
import { TagsService } from './services/tags.service';
import { TopicsService } from './services/topics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Curriculum,
      CurriculumExam,
      Exam,
      ExamQuestion,
      Question,
      QuestionOption,
      MediaAsset,
      QuestionMedia,
      QuestionTag,
      Level,
      Skill,
      Topic,
      Tag,
      ReadingPassage,
      WordOrderingQuestion,
      ReadingComprehensionQuestion,
      SentenceRewriteQuestion,
      HintRewriteQuestion,
      ErrorCorrectionQuestion,
      MatchingQuestion,
      MatchingPair,
    ]),
  ],
  controllers: [
    CurriculumsController,
    ExamsController,
    QuestionsController,
    LevelsController,
    SkillsController,
    TopicsController,
    TagsController,
    MediaAssetsController,
    ReadingPassagesController,
  ],
  providers: [
    CurriculumsService,
    ExamsService,
    QuestionsService,
    LevelsService,
    SkillsService,
    TopicsService,
    TagsService,
    MediaAssetsService,
    ReadingPassagesService,
  ],
})
export class LearningModule {}
