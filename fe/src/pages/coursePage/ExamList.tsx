import { Typography, Row, Col, Button, Empty } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { examsData, coursesData, examDataMap } from "../../data/mockData";
import { ArrowLeft } from "lucide-react";
import ExamCard from './ExamCard';

const { Title, Text } = Typography;
const getTotalQuestions = (examId: string) =>
  examDataMap[examId]?.questions.length ?? 0;

export default function ExamList() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  // Find course title
  let courseTitle = "";
  coursesData.forEach((cat) => {
    const found = cat.subCourses.find((c) => c.id === courseId);
    if (found) courseTitle = found.title;
  });

  const exams = examsData[courseId as keyof typeof examsData] || [];

  return (
    <div className="w-full bg-slate-50 py-16 px-6 md:px-16 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <Button
          type="text"
          icon={<ArrowLeft size={20} />}
          className="mb-8 text-slate-500 hover:text-blue-600 flex items-center font-medium"
          onClick={() => navigate("/courses")}
        >
          Quay lại danh sách khóa học
        </Button>

        <div className="mb-12">
          <Title level={1} className="text-4xl font-bold text-slate-800 mb-4">
            {courseTitle}
          </Title>
          <div className="w-24 h-1 bg-blue-600 rounded-full mb-6" />
          <Text className="text-lg text-slate-600">
            Danh sách các đề luyện thi dành cho khóa học này.
          </Text>
        </div>

        {exams.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl shadow-sm border border-slate-100 text-center">
            <Empty description="Chưa có đề thi nào cho khóa học này." />
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            {exams.map((exam, idx) => {
              const totalQuestions = getTotalQuestions(exam.id);

              return (
                <Col xs={24} key={exam.id}>
                  <ExamCard
                    exam={exam}
                    totalQuestions={totalQuestions}
                    index={idx}
                    onStart={(id) => navigate(`/exam/${id}?start=true`)}
                  />
                </Col>
              );
            })}
          </Row>
        )}
      </div>
    </div>
  );
}
