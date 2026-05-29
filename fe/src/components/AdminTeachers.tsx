import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Form,
  Input,
  Modal,
  Space,
  message,
  Empty,
  Avatar,
  Row,
  Col,
  Popconfirm,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import {
  getTeachers,
  addTeacher,
  updateTeacher,
  deleteTeacher,
} from '../utils/adminStorage';
import { Teacher } from '../types';

interface TeacherFormValues {
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  experience?: number;
  bio?: string;
}

export default function AdminTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = () => {
    const data = getTeachers();
    setTeachers(data);
  };

  const handleAddTeacher = () => {
    setEditingTeacher(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    form.setFieldsValue(teacher);
    setIsModalVisible(true);
  };

  const handleDeleteTeacher = (id: string | number) => {
    deleteTeacher(id);
    message.success('Đã xóa giáo viên!');
    loadTeachers();
  };

  const handleSubmit = async (values: TeacherFormValues) => {
    setLoading(true);
    try {
      if (editingTeacher) {
        updateTeacher(editingTeacher.id, values);
        message.success('Cập nhật giáo viên thành công!');
      } else {
        addTeacher({
          name: values.name,
          subject: values.subject,
          image: values.image || 'https://picsum.photos/seed/teacher/200/200',
          desc: values.desc,
          email: values.email,
          experience: values.experience || 0,
        });
        message.success('Thêm giáo viên thành công!');
      }
      setIsModalVisible(false);
      loadTeachers();
    } catch (error) {
      message.error('Lỗi khi lưu giáo viên!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card
        title="Quản lý Giáo viên"
        extra={
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={handleAddTeacher}
          >
            Thêm Giáo viên
          </Button>
        }
      >
        {teachers.length > 0 ? (
          <Row gutter={[24, 24]}>
            {teachers.map((teacher) => (
              <Col xs={24} sm={12} lg={8} key={teacher.id}>
                <Card
                  hoverable
                  className="h-full flex flex-col"
                  cover={
                    <div className="bg-gray-100 p-4 flex justify-center items-center min-h-[250px]">
                      <Avatar
                        size={150}
                        src={teacher.image}
                        alt={teacher.name}
                      />
                    </div>
                  }
                >
                  <div className="space-y-3">
                    <h3 className="font-bold text-lg">{teacher.name}</h3>

                    <div>
                      <p className="text-xs text-gray-600 font-semibold">
                        MÔN DẠY
                      </p>
                      <p className="text-sm">{teacher.subject}</p>
                    </div>

                    {teacher.experience && (
                      <div>
                        <p className="text-xs text-gray-600 font-semibold">
                          KINH NGHIỆM
                        </p>
                        <p className="text-sm">{teacher.experience} năm</p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs text-gray-600 font-semibold">
                        MÔ TẢ
                      </p>
                      <p className="text-sm text-gray-700">{teacher.desc}</p>
                    </div>

                    {teacher.email && (
                      <div>
                        <p className="text-xs text-gray-600 font-semibold">
                          EMAIL
                        </p>
                        <p className="text-sm text-blue-500">{teacher.email}</p>
                      </div>
                    )}

                    <Space className="w-full justify-between pt-3 border-t">
                      <Button
                        type="primary"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditTeacher(teacher)}
                      >
                        Sửa
                      </Button>
                      <Popconfirm
                        title="Xác nhận xóa"
                        description="Bạn có chắc chắn muốn xóa giáo viên này?"
                        onConfirm={() => handleDeleteTeacher(teacher.id)}
                        okText="Xóa"
                        okType="danger"
                        cancelText="Hủy"
                      >
                        <Button
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                        >
                          Xóa
                        </Button>
                      </Popconfirm>
                    </Space>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="Chưa có giáo viên nào" />
        )}
      </Card>

      {/* Modal for adding/editing teacher */}
      <Modal
        title={editingTeacher ? 'Chỉnh sửa Giáo viên' : 'Thêm Giáo viên mới'}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            label="Tên giáo viên"
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên giáo viên!' }]}
          >
            <Input placeholder="Ví dụ: Cô Nguyễn Thị A" />
          </Form.Item>

          <Form.Item
            label="Môn dạy"
            name="subject"
            rules={[{ required: true, message: 'Vui lòng nhập môn dạy!' }]}
          >
            <Input placeholder="Ví dụ: Toán, Tiếng Anh" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
          >
            <Input placeholder="example@email.com" type="email" />
          </Form.Item>

          <Form.Item
            label="Kinh nghiệm (năm)"
            name="experience"
          >
            <InputNumber min={0} placeholder="10" />
          </Form.Item>

          <Form.Item
            label="Mô tả ngắn"
            name="desc"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Ví dụ: 10 năm kinh nghiệm luyện thi, IELTS 8.5..."
            />
          </Form.Item>

          <Form.Item
            label="URL Hình ảnh"
            name="image"
          >
            <Input placeholder="https://picsum.photos/seed/teacher/200/200" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
