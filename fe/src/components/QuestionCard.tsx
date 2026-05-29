import React, { useState, useEffect } from "react";
import { Input } from "antd";
import { ExamQuestion } from "../types";
import { MatchingQuestion } from "./MatchingQuestion";
interface QuestionCardProps {
  question: ExamQuestion;
  currentAnswer?: string | string[] | Record<string, string>;
  onAnswerChange: (answer: string | string[] | Record<string, string>) => void;
  onSubmit: () => void;
  isCorrect?: boolean;
  showFeedback: boolean;
  onNext?: () => void;
  isLastQuestion?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  currentAnswer,
  onAnswerChange,
  onSubmit,
  isCorrect,
  showFeedback,
  onNext,
  isLastQuestion,
}) => {
  const [orderedWords, setOrderedWords] = useState<string[]>(
    Array.isArray(currentAnswer) ? currentAnswer : [],
  );

  useEffect(() => {
    if (Array.isArray(currentAnswer)) {
      setOrderedWords(currentAnswer);
    } else {
      setOrderedWords([]);
    }
  }, [currentAnswer, question.id]);

  const handleWordClick = (word: string) => {
    if (orderedWords.includes(word)) {
      const newWords = orderedWords.filter((w) => w !== word);
      setOrderedWords(newWords);
      onAnswerChange(newWords);
    } else {
      const newWords = [...orderedWords, word];
      setOrderedWords(newWords);
      onAnswerChange(newWords);
    }
  };

  const mediaItems = question.media
    ? Array.isArray(question.media)
      ? question.media
      : [question.media]
    : [];
  const imageMedia = mediaItems.filter((m) => m.type === "image");
  const audioMedia = mediaItems.filter((m) => m.type === "audio");

  const hasSplitLayout = !!question.passage || imageMedia.length > 0;

  const renderInlineMedia = () => {
    // If it's a split layout, images go to the left pane, so only render audio inline here.
    const inlineItems = hasSplitLayout ? audioMedia : mediaItems;
    if (inlineItems.length === 0) return null;

    return (
      <div className="mt-4 flex flex-col gap-4 bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
        {inlineItems.map((media, index) => (
          <div key={index} className="w-full flex justify-center">
            {media.type === "audio" ? (
              <audio controls className="w-full h-10 custom-audio-player">
                <source src={media.url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            ) : (
              <img
                src={media.url}
                alt={`Question Media ${index + 1}`}
                className="max-h-[400px] rounded-lg shadow-sm w-auto object-contain"
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderInputArea = () => {
    switch (question.type) {
      case "multiple-choice":
      case "listening":
      case "true-false":
        return (
          <div className="grid grid-cols-1 gap-3 mb-6">
            {question.options?.map((option, index) => {
              const isSelected = currentAnswer === option;
              let containerClass =
                "flex items-center p-4 border rounded-xl cursor-pointer transition-colors group ";
              let inputClass = "w-4 h-4 focus:ring-2 ";
              let textClass = "ml-4 text-sm ";

              if (showFeedback && question.correctAnswer === option) {
                // Highlight correct answer
                containerClass +=
                  "border-emerald-400 dark:border-emerald-500 border-2 bg-emerald-50 dark:bg-emerald-900/30 ring-1 ring-emerald-200 dark:ring-emerald-700";
                inputClass +=
                  "text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500 border-emerald-300 dark:border-emerald-600";
                textClass += "font-bold text-emerald-700 dark:text-emerald-300";
              } else if (showFeedback && isSelected && !isCorrect) {
                // Highlight wrong selected answer
                containerClass +=
                  "border-rose-400 dark:border-rose-500 border-2 bg-rose-50 dark:bg-rose-900/30 ring-1 ring-rose-200 dark:ring-rose-700";
                inputClass +=
                  "text-rose-600 dark:text-rose-400 focus:ring-rose-500 border-rose-300 dark:border-rose-600";
                textClass += "font-bold text-rose-700 dark:text-rose-300";
              } else if (isSelected) {
                // Normal selected
                containerClass +=
                  "border-2 border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 ring-1 ring-emerald-200 dark:ring-emerald-700";
                inputClass +=
                  "text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500 border-emerald-300 dark:border-emerald-600";
                textClass += "font-bold text-emerald-700 dark:text-emerald-300";
              } else {
                // Default
                containerClass +=
                  "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-800";
                inputClass +=
                  "text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500 border-slate-300 dark:border-slate-600";
                textClass += "font-medium text-slate-700 dark:text-slate-300";
              }

              return (
                <label key={index} className={containerClass}>
                  <input
                    type="radio"
                    name={`q-${question.id}`}
                    value={option}
                    checked={isSelected}
                    onChange={(e) =>
                      !showFeedback && onAnswerChange(e.target.value)
                    }
                    disabled={showFeedback}
                    className={inputClass}
                  />
                  <span className={textClass}>{option}</span>
                </label>
              );
            })}
          </div>
        );

      case "fill-in-the-blank":
        return (
          <div className="mb-6">
            <Input.TextArea
              autoSize={{ minRows: 2, maxRows: 6 }}
              placeholder="Nhập câu trả lời..."
              value={currentAnswer as string}
              onChange={(e) => onAnswerChange(e.target.value)}
              disabled={showFeedback}
              className={`rounded-xl text-[16px] py-4 px-5 shadow-sm leading-relaxed ${showFeedback ? (isCorrect ? "border-2 border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold" : "border-2 border-rose-400 dark:border-rose-500 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 font-bold") : "border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 hover:border-emerald-400 focus:border-emerald-500"}`}
            />
          </div>
        );

      case "word-ordering":
        return (
          <div className="space-y-4 mb-6">
            <div
              className={`min-h-[60px] p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-wrap gap-2 items-start ${showFeedback ? (isCorrect ? "border-2 border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30" : "border-2 border-rose-400 dark:border-rose-500 bg-rose-50 dark:bg-rose-900/30") : ""}`}
            >
              {orderedWords.length === 0 && (
                <span className="text-slate-400 dark:text-slate-500 italic text-sm">
                  Chọn các từ bên dưới...
                </span>
              )}
              {orderedWords.map((word, index) => (
                <div
                  key={`chosen-${index}`}
                  className="px-3 py-1.5 bg-emerald-600 dark:bg-emerald-500 text-white text-sm font-medium rounded-md shadow-sm cursor-pointer hover:bg-emerald-700 dark:hover:bg-emerald-400 transition-colors"
                  onClick={() => !showFeedback && handleWordClick(word)}
                >
                  {word}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {question.options?.map((word, index) => {
                const isSelected = orderedWords.includes(word);
                return (
                  <button
                    key={`option-${index}`}
                    disabled={isSelected || showFeedback}
                    onClick={() => !showFeedback && handleWordClick(word)}
                    className={`
                      px-3 py-1.5 text-sm font-medium rounded-md transition-all
                      ${
                        isSelected
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border border-slate-200 dark:border-slate-700 cursor-not-allowed transform scale-95"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm hover:shadow"
                      }
                    `}
                  >
                    {word}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case "matching":
        const matchingValue =
          currentAnswer &&
          typeof currentAnswer === "object" &&
          !Array.isArray(currentAnswer)
            ? currentAnswer
            : {};

        return (
          <MatchingQuestion
            question={question}
            value={matchingValue}
            onChange={(val) => onAnswerChange(val)}
            showFeedback={showFeedback}
            correctAnswer={question.correctAnswer as Record<string, string>}
          />
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  const renderQuestionHeader = () => (
    <div className="mb-6 shrink-0">
      <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold mb-3 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 inline-block px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-800">
        {question.type.replace(/-/g, " ")}
      </div>
      <h2 className="text-[16px] md:text-[17px] font-bold leading-relaxed text-slate-800 dark:text-slate-100">
        {question.questionContent}
      </h2>
      {renderInlineMedia()}
    </div>
  );

  const renderFeedbackBox = () => {
    if (!showFeedback) return null;
    return (
      <div
        className={`mt-2 mb-6 p-5 rounded-2xl border-l-4 shadow-sm shrink-0 flex gap-4 transition-all ${isCorrect ? "bg-emerald-50 border-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-500" : "bg-rose-50 border-rose-400 dark:bg-rose-900/20 dark:border-rose-500"}`}
      >
        <div
          className={
            isCorrect
              ? "text-emerald-500 dark:text-emerald-400"
              : "text-rose-500 dark:text-rose-400"
          }
        >
          {isCorrect ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <div>
          <p
            className={`text-sm font-bold ${isCorrect ? "text-emerald-800 dark:text-emerald-300" : "text-rose-800 dark:text-rose-300"}`}
          >
            {isCorrect ? "Tuyệt vời! Chính xác!" : "Giải thích chi tiết:"}
          </p>
          <p
            className={`text-[13px] mt-1.5 leading-relaxed ${isCorrect ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400/90"}`}
          >
            {!isCorrect && (
              <span className="block mb-2 text-[14px]">
                <strong className="text-rose-800 dark:text-rose-200">
                  Đáp án đúng:{" "}
                </strong>
                <span className="bg-rose-100 dark:bg-rose-900/50 px-2 py-0.5 rounded text-rose-900 dark:text-rose-100 font-mono">
                  {Array.isArray(question.correctAnswer)
                    ? question.correctAnswer.join(" ")
                    : question.correctAnswer}
                </span>
              </span>
            )}
            {question.explanation}
          </p>
        </div>
      </div>
    );
  };

  const renderQuestionContent = () => (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto">
      {renderQuestionHeader()}

      <div className="flex-1 shrink-0 pb-4 overflow-x-hidden">
        {renderInputArea()}
      </div>

      {renderFeedbackBox()}
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-white/50 dark:bg-slate-800/10">
      <div className="flex-1 overflow-hidden p-6 md:p-8 flex flex-col lg:flex-row gap-6 lg:gap-10">
        {hasSplitLayout ? (
          <>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-6">
              {/* If no passage but we have images, show header on the left with images/audio */}
              {!question.passage && renderQuestionHeader()}

              {question.passage && (
                <div className="bg-emerald-50/50 dark:bg-emerald-900/20 p-5 md:p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 shadow-inner">
                  <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    Đọc đoạn văn sau
                  </h3>
                  <p className="text-[15px] md:text-base leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {question.passage}
                  </p>
                </div>
              )}
              {imageMedia.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/30 p-2 md:p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-4">
                  {imageMedia.map((media, index) => (
                    <img
                      key={index}
                      src={media.url}
                      alt={`Context Media ${index + 1}`}
                      className="max-w-full rounded-lg shadow-sm object-contain"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto lg:pl-6 lg:border-l border-slate-200 dark:border-slate-700 custom-scrollbar pr-2 pt-2">
              {/* If we showed header on left, we only show input+feedback on right */}
              {!question.passage ? (
                <div className="flex flex-col h-full w-full max-w-3xl mx-auto">
                  <div className="flex-1 shrink-0 pb-4 overflow-x-hidden pt-2">
                    <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">
                      Chọn đáp án của bạn:
                    </h3>
                    {renderInputArea()}
                  </div>
                  {renderFeedbackBox()}
                </div>
              ) : (
                renderQuestionContent()
              )}
            </div>
          </>
        ) : (
          <div className="w-full h-full overflow-y-auto custom-scrollbar flex flex-col mx-auto max-w-3xl pr-2 pt-2">
            {renderQuestionContent()}
          </div>
        )}
      </div>

      <div className="mt-auto px-6 py-4 md:px-8 md:py-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0 z-10 w-full transition-colors">
        <div></div>
        {!showFeedback ? (
          <button
            onClick={onSubmit}
            disabled={
              !currentAnswer ||
              (Array.isArray(currentAnswer) && currentAnswer.length === 0)
            }
            className="px-8 py-3 rounded-xl font-bold bg-emerald-600 dark:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 dark:shadow-emerald-500/20 hover:bg-emerald-700 dark:hover:bg-emerald-600 hover:shadow-emerald-600/40 dark:hover:shadow-emerald-500/30 flex items-center gap-2 transition-all disabled:opacity-50 disabled:shadow-none"
          >
            Nộp câu trả lời
          </button>
        ) : (
          <button
            onClick={onNext}
            className="px-8 py-3 rounded-xl font-bold bg-emerald-600 dark:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 dark:shadow-emerald-500/20 hover:bg-emerald-700 dark:hover:bg-emerald-600 hover:shadow-emerald-600/40 flex items-center gap-2 transition-all group"
          >
            {isLastQuestion ? "Hoàn thành bài thi" : "Câu Tiếp Theo"}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 transform group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
