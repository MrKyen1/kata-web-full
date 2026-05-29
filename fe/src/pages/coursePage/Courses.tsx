import { Typography, Row, Col } from 'antd';
import { coursesData } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import CourseCard from './CourseCard';
import { useState, useEffect } from 'react';

const { Title, Text, Paragraph } = Typography;

export default function Courses() {
  const navigate = useNavigate();
  const [customText, setCustomText] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('admin_courses');
    if (saved) setCustomText(saved);
  }, []);

  if (customText) {
    return (
      <div className="w-full bg-slate-50 py-16 px-6 md:px-16 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Title level={1} className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">Khóa Học Của Chúng Tôi</Title>
            <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full mb-6"></div>
          </div>
          <Paragraph className="text-lg text-slate-600 leading-relaxed whitespace-pre-line">
            {customText}
          </Paragraph>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50 py-16 px-6 md:px-16 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <Title level={1} className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">Khóa Học Của Chúng Tôi</Title>
          <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full mb-6"></div>
          <Text className="text-lg text-slate-600 max-w-2xl mx-auto block">
            Lựa chọn khóa học phù hợp để bắt đầu hành trình chinh phục tri thức cùng Kata Edu.
          </Text>
        </div>

        {coursesData.map((category) => (
          <div key={category.id} className="mb-20">
            <div className="flex items-center gap-4 mb-10">
              <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
                <BookOpen size={32} />
              </div>
              <Title level={2} className="text-3xl font-bold text-slate-800 m-0">{category.title}</Title>
            </div>

            <Row gutter={[32, 32]}>
              {category.subCourses.map((course) => (
                <Col xs={24} sm={12} lg={8} key={course.id}>
                  <CourseCard course={course} onSelect={(courseId) => navigate(`/courses/${courseId}`)} />
                </Col>
              ))}
            </Row>
          </div>
        ))}
      </div>
    </div>
  );
}
