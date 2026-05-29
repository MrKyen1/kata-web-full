import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QuestionCard } from "./QuestionCard";
import { ExamData } from "../types";
import { ClockCircleOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "antd";

interface ExamContainerProps {
  examData: ExamData;
  isDarkMode?: boolean;
  toggleDarkMode?: () => void;
}

export const ExamContainer: React.FC<ExamContainerProps> = ({
  examData,
  isDarkMode,
  toggleDarkMode,
}) => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [currentIndex, setCurrentIndex] = useState(0);
  type AnswerValue = string | string[] | Record<string, string>;

  const [userAnswers, setUserAnswers] = useState<
    Record<string, AnswerValue>
  >({});
  const [questionResults, setQuestionResults] = useState<
    Record<string, "correct" | "wrong">
  >({});
  const [timeRemaining, setTimeRemaining] = useState(examData.timeLimit);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isExamComplete, setIsExamComplete] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);

  const currentQuestion = examData.questions[currentIndex];
  const totalQuestions = examData.questions.length;
  const progressPercent = (currentIndex / totalQuestions) * 100;

  const handleBackClick = () => {
    Modal.confirm({
      title: "Quay lại khóa học",
      content:
        "Bạn chắc chắn muốn quay lại? Tiến độ làm bài sẽ không được lưu.",
      style: {
        top: 200,
      },
      okText: "Quay lại",
      okType: "danger",
      cancelText: "Tiếp tục",
      onOk() {
        navigate(-1);
      },
    });
  };

  // Timer logic
  useEffect(() => {
    if (timeRemaining <= 0) {
      handleFinish();
      return;
    }
    const timer = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const status = questionResults[currentQuestion.id];
    if (status) {
      setShowFeedback(true);
      setIsCorrect(status === "correct");
    } else {
      setShowFeedback(false);
    }
  }, [currentQuestion.id, questionResults]);

  const handleAnswerChange = (answer: AnswerValue) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));
  };

  const areObjectAnswersEqual = (
    answer: Record<string, string>,
    correct: Record<string, string>,
  ) => {
    const answerKeys = Object.keys(answer);
    const correctKeys = Object.keys(correct);
    if (answerKeys.length !== correctKeys.length) return false;

    return answerKeys.every((key) => {
      const normalizedAnswer = answer[key]?.trim().toLowerCase() ?? "";
      const normalizedCorrect = correct[key]?.trim().toLowerCase() ?? "";
      return normalizedAnswer === normalizedCorrect;
    });
  };

  const checkCorrectness = (
    answer: AnswerValue,
    correct: string | string[] | Record<string, string>,
  ) => {
    if (
      typeof answer === "object" &&
      !Array.isArray(answer) &&
      typeof correct === "object" &&
      !Array.isArray(correct)
    ) {
      return areObjectAnswersEqual(answer, correct);
    }

    if (Array.isArray(answer) && Array.isArray(correct)) {
      return JSON.stringify(answer) === JSON.stringify(correct);
    }

    const normAnswer =
      typeof answer === "string" ? answer.trim().toLowerCase() : answer;
    const normCorrect =
      typeof correct === "string" ? correct.trim().toLowerCase() : correct;

    return normAnswer === normCorrect;
  };

  const handleSubmit = () => {
    const answer = userAnswers[currentQuestion.id];
    const correct = checkCorrectness(answer, currentQuestion.correctAnswer);
    setIsCorrect(correct);
    setShowFeedback(true);
    setQuestionResults((prev) => ({
      ...prev,
      [currentQuestion.id]: correct ? "correct" : "wrong",
    }));
  };

  const handleNext = () => {
    setShowFeedback(false);
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const isAnswerProvided = (answer: AnswerValue | undefined) => {
    if (answer === undefined || answer === null) return false;
    if (Array.isArray(answer)) return answer.length > 0;
    if (typeof answer === "object") return Object.keys(answer).length > 0;
    return String(answer).trim().length > 0;
  };

  const handleFinish = () => {
    const updatedResults: Record<string, "correct" | "wrong"> = {};
    let score = 0;

    examData.questions.forEach((q) => {
      const uAnswer = userAnswers[q.id];
      const isCorrectAnswer =
        uAnswer !== undefined && checkCorrectness(uAnswer, q.correctAnswer);

      if (isCorrectAnswer) {
        score++;
        updatedResults[q.id] = "correct";
      } else if (isAnswerProvided(uAnswer)) {
        updatedResults[q.id] = "wrong";
      }
    });

    setQuestionResults(updatedResults);
    setIsExamComplete(true);
    setIsReviewMode(false);
    setShowFeedback(false);
  };

  const getQuestionStatus = (question: typeof currentQuestion) => {
    const answer = userAnswers[question.id];
    if (questionResults[question.id]) {
      return questionResults[question.id];
    }
    if (!isAnswerProvided(answer)) {
      return null;
    }
    return "selected";
  };

  const totalCorrect = Object.values(questionResults).filter(
    (status) => status === "correct",
  ).length;
  const totalWrong = Object.values(questionResults).filter(
    (status) => status === "wrong",
  ).length;
  const totalAnswered = Object.keys(userAnswers).filter((key) => {
    const answer = userAnswers[key];
    return isAnswerProvided(answer);
  }).length;
  const totalUnanswered = totalQuestions - totalAnswered;

  const shouldShowFeedback = showFeedback || isReviewMode;

  const handleReview = () => {
    setIsExamComplete(false);
    setIsReviewMode(true);
    setShowFeedback(true);
    setCurrentIndex(0);
  };

  const handleRetryWrong = () => {
    const resetResults = { ...questionResults };
    Object.keys(resetResults).forEach((key) => {
      if (resetResults[key] === "wrong") {
        delete resetResults[key];
      }
    });
    setQuestionResults(resetResults);
    setIsExamComplete(false);
    setIsReviewMode(false);
    setShowFeedback(false);

    const firstWrongIndex = examData.questions.findIndex(
      (q) => questionResults[q.id] === "wrong",
    );
    if (firstWrongIndex >= 0) {
      setCurrentIndex(firstWrongIndex);
    }
  };

  const handleResetExam = () => {
    setUserAnswers({});
    setQuestionResults({});
    setTimeRemaining(examData.timeLimit);
    setShowFeedback(false);
    setIsCorrect(false);
    setIsExamComplete(false);
    setIsReviewMode(false);
    setCurrentIndex(0);
  };

  if (isExamComplete && !isReviewMode) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 md:p-10 transition-colors">
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="p-8 md:p-10 text-center">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Kết quả bài thi
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
              Bạn đã trả lời đúng{" "}
              <span className="font-black text-emerald-600 dark:text-emerald-400">
                {totalCorrect}
              </span>{" "}
              trên tổng số{" "}
              <span className="font-black text-slate-900 dark:text-slate-100">
                {totalQuestions}
              </span>{" "}
              câu.
            </p>
            <div className="grid grid-cols-2 gap-4 text-left mb-8">
              <div className="rounded-3xl bg-emerald-50 dark:bg-emerald-900/20 p-5 border border-emerald-100 dark:border-emerald-700">
                <p className="text-sm uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                  Đúng
                </p>
                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                  {totalCorrect}
                </p>
              </div>
              <div className="rounded-3xl bg-rose-50 dark:bg-rose-900/20 p-5 border border-rose-100 dark:border-rose-700">
                <p className="text-sm uppercase tracking-widest text-rose-700 dark:text-rose-300">
                  Sai
                </p>
                <p className="text-3xl font-bold text-rose-700 dark:text-rose-300">
                  {totalWrong}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 dark:bg-slate-800/80 p-5 border border-slate-200 dark:border-slate-700">
                <p className="text-sm uppercase tracking-widest text-slate-600 dark:text-slate-400">
                  Chưa làm
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {totalUnanswered}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 dark:bg-slate-800/80 p-5 border border-slate-200 dark:border-slate-700">
                <p className="text-sm uppercase tracking-widest text-slate-600 dark:text-slate-400">
                  Tổng số
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {totalQuestions}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={handleReview}
                className="px-6 py-4 rounded-3xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold hover:bg-slate-200 transition"
              >
                Xem lại chi tiết
              </button>
              <button
                onClick={handleRetryWrong}
                disabled={totalWrong === 0}
                className="px-6 py-4 rounded-3xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Làm lại câu sai
              </button>
              <button
                onClick={handleResetExam}
                className="px-6 py-4 rounded-3xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
              >
                Làm lại toàn bộ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-slate-800 dark:text-slate-200 flex flex-col h-screen overflow-hidden font-sans bg-slate-50 dark:bg-slate-900 transition-colors">
      <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 flex items-center justify-between z-10 shrink-0 transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackClick}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
            title="Quay lại"
          >
            <ArrowLeftOutlined className="text-lg" />
          </button>
          <img
            src="/src/assets/logo/logo.png"
            alt="Logo"
            className="h-14 object-contain"
          />
          <h1 className="font-bold text-xl">{examData.title}</h1>
        </div>
        <div className="flex items-center gap-4 md:gap-8">
          {toggleDarkMode && (
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
          )}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700">
            <ClockCircleOutlined className="text-emerald-600 dark:text-emerald-400" />
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
              {formatTime(timeRemaining)}
            </span>
          </div>
          <button
            onClick={handleFinish}
            className="px-4 py-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-md text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
          >
            NỘP BÀI
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col shrink-0 transition-colors">
          <div className="p-5 flex-1 overflow-y-auto">
            <div className="mb-6">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tiến độ làm bài
                </span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {currentIndex + 1}/{totalQuestions}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 dark:bg-emerald-400 h-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            <div className="mb-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Danh sách câu hỏi
            </div>
            <div className="grid grid-cols-5 gap-2">
              {examData.questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isSelected =
                  !!userAnswers[q.id] &&
                  (!Array.isArray(userAnswers[q.id]) ||
                    (userAnswers[q.id] as string[]).length > 0);
                const questionStatus = getQuestionStatus(q);

                let itemClass =
                  "w-9 h-9 flex items-center justify-center rounded-lg text-[13px] font-semibold border transition-all cursor-pointer";
                // =======================
                // CÂU HIỆN TẠI
                // =======================
                if (isCurrent) {
                  if (questionStatus === "correct") {
                    itemClass +=
                      " bg-emerald-500 text-white border-emerald-500 dark:bg-emerald-600 dark:border-emerald-600";
                  } else if (questionStatus === "wrong") {
                    itemClass +=
                      " bg-rose-500 text-white border-rose-500 dark:bg-rose-600 dark:border-rose-600";
                  } else if (isSelected) {
                    // 🟦 Câu hiện tại + chưa chấm + ĐÃ CHỌN
                    itemClass +=
                      " bg-blue-700 text-white border-blue-200 dark:bg-blue-600 dark:text-white dark:border-blue-700";
                  } else {
                    // 🔵 Câu hiện tại + chưa chấm + CHƯA CHỌN
                    itemClass +=
                      " border-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400";
                  }
                }

                // =======================
                // KHÔNG PHẢI CÂU HIỆN TẠI
                // =======================
                else {
                  if (questionStatus === "correct") {
                    itemClass +=
                      " bg-emerald-500 text-white border-emerald-500 dark:bg-emerald-600 dark:border-emerald-600";
                  } else if (questionStatus === "wrong") {
                    itemClass +=
                      " bg-rose-500 text-white border-rose-500 dark:bg-rose-600 dark:border-rose-600";
                  } else if (isSelected) {
                    itemClass +=
                      " bg-blue-700 text-white border-blue-200 dark:bg-blue-600 dark:text-white dark:border-blue-700";
                  } else {
                    itemClass +=
                      " border-slate-200 text-slate-600 dark:border-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50";
                  }
                }
                return (
                  <div
                    key={q.id}
                    className={itemClass}
                    onClick={() => !showFeedback && setCurrentIndex(idx)}
                  >
                    {idx + 1}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="text-[10px] text-slate-400 dark:text-slate-500 italic mb-2 text-center underline uppercase">
              Chú thích:
            </div>
            <div className="grid grid-cols-2 gap-3 text-[10px] dark:text-slate-400 ">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-200   dark:bg-slate-700 border border-gray-300 dark:border-slate-600" />
                Chưa chọn
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-600" />
                Đã chọn
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 dark:bg-emerald-600" />
                Đúng
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 dark:bg-rose-600" />
                Sai
              </div>
            </div>
          </div>
        </aside>

        <section className="flex-1 bg-slate-50 dark:bg-slate-900 p-6 md:p-8 pt-10 flex flex-col items-center justify-center overflow-hidden relative transition-colors">
          <div
            className={`w-full ${currentQuestion.passage || (currentQuestion.media && (Array.isArray(currentQuestion.media) ? currentQuestion.media.some((m) => m.type === "image") : currentQuestion.media.type === "image")) ? "max-w-6xl" : "max-w-3xl"} h-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700/80 relative flex flex-col transition-all duration-500`}
          >
            <div className="absolute -top-3.5 left-6 bg-emerald-600 dark:bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider z-20 shadow-md">
              CÂU HỎI {currentIndex + 1}
            </div>

            <div className="flex-1 w-full h-full rounded-2xl overflow-hidden flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col flex-1 h-full w-full overflow-hidden"
                >
                  <QuestionCard
                    question={currentQuestion}
                    currentAnswer={userAnswers[currentQuestion.id]}
                    onAnswerChange={handleAnswerChange}
                    onSubmit={handleSubmit}
                    isCorrect={isCorrect}
                    showFeedback={shouldShowFeedback}
                    onNext={handleNext}
                    isLastQuestion={currentIndex === totalQuestions - 1}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
