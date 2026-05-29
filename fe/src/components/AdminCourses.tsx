import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Form,
  Input,
  Modal,
  Table,
  Space,
  message,
  Collapse,
  Empty,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  FileAddOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import {
  getCourses,
  addCourse,
  updateCourse,
  deleteCourse,
  addExamToCourse,
} from '../utils/adminStorage';
import { Course, SubCourse } from '../types';

interface CourseFormValues {
  title: string;
  description?: string;
  level?: string;
  duration?: number;
}

interface SubCourseFormValues {
  title: string;
  description?: string;
  order?: number;
  image?: string;
}

interface ExamFormValues {
  title: string;
  description?: string;
  timeLimit?: number;
  passingScore?: number;
}

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isCourseModalVisible, setIsCourseModalVisible] = useState(false);
  const [isExamModalVisible, setIsExamModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedSubCourseId, setSelectedSubCourseId] = useState<string>('');
  const [courseForm] = Form.useForm();
  const [subCourseForm] = Form.useForm();
  const [examForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = () => {
    const data = getCourses();
    setCourses(data);
  };

  // ===== COURSE MANAGEMENT =====
  const handleAddCourse = () => {
    setEditingCourse(null);
    courseForm.resetFields();
    setIsCourseModalVisible(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    courseForm.setFieldsValue(course);
    setIsCourseModalVisible(true);
  };

  const handleDeleteCourse = (id: string) => {
    deleteCourse(id);
    message.success('Đã xóa khóa học!');
    loadCourses();
  };

  const handleSubmitCourse = async (values: CourseFormValues) => {
    setLoading(true);
    try {
      if (editingCourse) {
        updateCourse(editingCourse.id, values);
        message.success('Cập nhật khóa học thành công!');
      } else {
        addCourse({
          id: `course_${Date.now()}`,
          title: values.title,
          subCourses: [],
        });
        message.success('Thêm khóa học thành công!');
      }
      setIsCourseModalVisible(false);
      loadCourses();
    } catch (error) {
      message.error('Lỗi khi lưu khóa học!');
    } finally {
      setLoading(false);
    }
  };

  // ===== SUB-COURSE MANAGEMENT =====
  const handleAddSubCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    subCourseForm.resetFields();
    setIsExamModalVisible(true);
  };

  const handleDeleteSubCourse = (courseId: string, subCourseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (course) {
      course.subCourses = course.subCourses.filter((sc) => sc.id !== subCourseId);
      updateCourse(courseId, course);
      message.success('Đã xóa khóa học con!');
      loadCourses();
    }
  };

  const handleSubmitSubCourse = async (values: SubCourseFormValues) => {
    setLoading(true);
    try {
      const course = courses.find((c) => c.id === selectedCourseId);
      if (course) {
        const newSubCourse: SubCourse = {
          id: `subcourse_${Date.now()}`,
          title: values.title,
          image: values.image || 'https://picsum.photos/seed/default/400/300',
        };
        course.subCourses.push(newSubCourse);
        updateCourse(selectedCourseId, course);
        message.success('Thêm khóa học con thành công!');
        setIsExamModalVisible(false);
        loadCourses();
      }
    } catch (error) {
      message.error('Lỗi khi lưu khóa học con!');
    } finally {
      setLoading(false);
    }
  };

  // ===== EXAM MANAGEMENT =====
  const handleAddExam = (courseId: string, subCourseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedSubCourseId(subCourseId);
    examForm.resetFields();
    setIsExamModalVisible(true);
  };

  const handleSubmitExam = async (values: ExamFormValues) => {
    setLoading(true);
    try {
      addExamToCourse(selectedCourseId, selectedSubCourseId, {
        id: `exam_${Date.now()}`,
        title: values.title,
        timeLimit: (values.timeLimit || 0) * 60, // Convert minutes to seconds
      });
      message.success('Thêm đề thi thành công!');
      setIsExamModalVisible(false);
      loadCourses();
    } catch (error) {
      message.error('Lỗi khi lưu đề thi!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card
        title="Quản lý Khóa học"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddCourse}
          >
            Thêm Khóa học
          </Button>
        }
      >
        {courses.length > 0 ? (
          <Collapse
            items={courses.map((course) => ({
              key: course.id,
              label: (
                <div className="flex items-center justify-between w-full pr-4">
                  <span className="font-semibold text-lg">{course.title}</span>
                  <span className="text-sm text-gray-500">
                    ({course.subCourses.length} khóa học con)
                  </span>
                </div>
              ),
              extra: (
                <Space size="small" onClick={(e) => e.stopPropagation()}>
                  <Button
                    type="primary"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEditCourse(course)}
                  >
                    Sửa
                  </Button>
                  <Popconfirm
                    title="Xác nhận xóa"
                    description="Bạn có chắc chắn muốn xóa khóa học này?"
                    onConfirm={() => handleDeleteCourse(course.id)}
                    okText="Xóa"
                    okType="danger"
                    cancelText="Hủy"
                  >
                    <Button danger size="small" icon={<DeleteOutlined />}>
                      Xóa
                    </Button>
                  </Popconfirm>
                </Space>
              ),
              children: (
                <div className="space-y-4">
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => handleAddSubCourse(course.id)}
                  >
                    Thêm Khóa học Con
                  </Button>

                  {course.subCourses.length > 0 ? (
                    <div className="space-y-3">
                      {course.subCourses.map((subCourse) => (
                        <Card
                          key={subCourse.id}
                          size="small"
                          className="border border-gray-200"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-semibold mb-2">
                                {subCourse.title}
                              </h4>
                              <img
                                src={subCourse.image}
                                alt={subCourse.title}
                                className="w-full max-w-xs h-auto rounded mb-3"
                              />
                              <Button
                                type="dashed"
                                size="small"
                                icon={<FileAddOutlined />}
                                onClick={() =>
                                  handleAddExam(course.id, subCourse.id)
                                }
                              >
                                Thêm Đề thi
                              </Button>
                            </div>
                            <Popconfirm
                              title="Xác nhận xóa"
                              description="Bạn có chắc chắn muốn xóa khóa học con này?"
                              onConfirm={() =>
                                handleDeleteSubCourse(course.id, subCourse.id)
                              }
                              okText="Xóa"
                              okType="danger"
                              cancelText="Hủy"
                            >
                              <Button
                                danger
                                size="small"
                                icon={<MinusOutlined />}
                              >
                                Xóa
                              </Button>
                            </Popconfirm>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Empty description="Chưa có khóa học con nào" />
                  )}
                </div>
              ),
            }))}
          />
        ) : (
          <Empty description="Chưa có khóa học nào" />
        )}
      </Card>

      {/* Modal for adding/editing course */}
      <Modal
        title={editingCourse ? 'Chỉnh sửa Khóa học' : 'Thêm Khóa học mới'}
        open={isCourseModalVisible}
        onOk={() => courseForm.submit()}
        onCancel={() => setIsCourseModalVisible(false)}
        confirmLoading={loading}
        width={500}
      >
        <Form
          form={courseForm}
          layout="vertical"
          onFinish={handleSubmitCourse}
          autoComplete="off"
        >
          <Form.Item
            label="Tên khóa học"
            name="title"
            rules={[{ required: true, message: 'Vui lòng nhập tên khóa học!' }]}
          >
            <Input placeholder="Ví dụ: Toán, Tiếng Anh" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal for adding sub-course */}
      <Modal
        title="Thêm Khóa học Con"
        open={isExamModalVisible && !selectedSubCourseId}
        onOk={() => subCourseForm.submit()}
        onCancel={() => setIsExamModalVisible(false)}
        confirmLoading={loading}
        width={500}
      >
        <Form
          form={subCourseForm}
          layout="vertical"
          onFinish={handleSubmitSubCourse}
          autoComplete="off"
        >
          <Form.Item
            label="Tên khóa học con"
            name="title"
            rules={[{ required: true, message: 'Vui lòng nhập tên khóa học con!' }]}
          >
            <Input placeholder="Ví dụ: Toán Lớp 1-5" />
          </Form.Item>

          <Form.Item
            label="URL Hình ảnh"
            name="image"
          >
            <Input placeholder="https://picsum.photos/seed/course/400/300" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal for adding exam */}
      <Modal
        title="Thêm Đề thi"
        open={isExamModalVisible && !!selectedSubCourseId}
        onOk={() => examForm.submit()}
        onCancel={() => setIsExamModalVisible(false)}
        confirmLoading={loading}
        width={500}
      >
        <Form
          form={examForm}
          layout="vertical"
          onFinish={handleSubmitExam}
          autoComplete="off"
        >
          <Form.Item
            label="Tên đề thi"
            name="title"
            rules={[{ required: true, message: 'Vui lòng nhập tên đề thi!' }]}
          >
            <Input placeholder="Ví dụ: Đề kiểm tra giữa kì 1" />
          </Form.Item>

          <Form.Item
            label="Thời gian làm bài (phút)"
            name="timeLimit"
            rules={[{ required: true, message: 'Vui lòng nhập thời gian!' }]}
          >
            <Input type="number" placeholder="30" min={1} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
