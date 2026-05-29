export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  AUDIO_CHOICE = 'audio_choice',
  WORD_ORDERING = 'word_ordering',
  READING_COMPREHENSION = 'reading_comprehension',
  SENTENCE_REWRITE = 'sentence_rewrite',
  HINT_REWRITE = 'hint_rewrite',
  ERROR_CORRECTION = 'error_correction',
  IMAGE_CHOICE = 'image_choice',
  MATCHING = 'matching',
}

export enum MediaType {
  AUDIO = 'audio',
  IMAGE = 'image',
  VIDEO = 'video',
}

export enum ContentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum GradingMode {
  EXACT = 'exact',
  NORMALIZED = 'normalized',
  MANUAL = 'manual',
}
