import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Table,
  Space,
  message,
  Tag,
  Empty,
  DatePicker,
  Select,
  Divider,
} from "antd";
import {
  UserAddOutlined,
  DeleteOutlined,
  EditOutlined,
  UserOutlined,
  BookOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  getStudents,
  addStudent,
  updateStudent,
  deleteStudent,
} from "../utils/adminStorage";
import { Student } from "../types";

interface StudentFormValues {
  username: string;
  fullName: string;
  birthYear?: number;
  phone?: string;
  address?: string;
  branch?: string;
  class?: string;
  startDate?: dayjs.Dayjs;
  endDate?: dayjs.Dayjs;
}
import StudentRanking from "./StudentRanking";

import dayjs from "dayjs";

export default function AdminDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = () => {
    const data = getStudents();
    setStudents(data);
  };

  const handleAddStudent = () => {
    setEditingStudent(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);

    form.setFieldsValue({
      ...student,
      birthYear: student.birthYear ? dayjs(student.birthYear) : null,
      startDate: student.startDate ? dayjs(student.startDate) : null,
      endDate: student.endDate ? dayjs(student.endDate) : null,
    });

    setIsModalVisible(true);
  };

  const handleDeleteStudent = (id: string) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa học sinh này?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk() {
        deleteStudent(id);
        message.success("Đã xóa học sinh!");
        loadStudents();
      },
    });
  };

  const handleSubmit = async (values: StudentFormValues) => {
    setLoading(true);

    try {
      const payload = {
        ...values,

        // convert DatePicker
        birthYear: values.birthYear?.year(),
        startDate: values.startDate?.format("YYYY-MM-DD"),
        endDate: values.endDate?.format("YYYY-MM-DD"),
      };

      if (editingStudent) {
        updateStudent(editingStudent.id, payload);
        message.success("Cập nhật thành công!");
      } else {
        addStudent({
          id: Date.now().toString(),
          ...payload,
        });
        message.success("Thêm thành công!");
      }

      setIsModalVisible(false);
      loadStudents();
    } catch (err) {
      message.error("Có lỗi xảy ra!");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Username",
      dataIndex: "username",
    },
    {
      title: "Họ tên",
      dataIndex: "fullName",
    },
    {
      title: "Lớp",
      dataIndex: "class",
    },
    {
      title: "Năm sinh",
      dataIndex: "birthYear",
    },
    {
      title: "SĐT",
      dataIndex: "phone",
    },
    {
      title: "Cơ sở",
      dataIndex: "branch",
    },
    {
      title: "Bắt đầu",
      dataIndex: "startDate",
      render: (date: string) => (date ? date : "—"),
    },
    {
      title: "Trạng thái",
      dataIndex: "endDate",
      render: (date: string) =>
        date ? (
          <Tag color="red">Đã nghỉ</Tag>
        ) : (
          <Tag color="green">Đang học</Tag>
        ),
    },
    {
      title: "Hành động",
      render: (_: unknown, record: Student) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditStudent(record)}
          >
            Sửa
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteStudent(record.id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8}>
          <Card className="text-center">
            <Statistic
              title="Tổng số Khóa học"
              value={9}
              prefix={<BookOutlined className="text-blue-500" />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="text-center">
            <Statistic
              title="Tổng số Giáo viên"
              value={2}
              prefix={<TeamOutlined className="text-green-500" />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="text-center">
            <Statistic
              title="Tổng số Học sinh"
              value={students.length}
              prefix={<UserOutlined className="text-orange-500" />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      <div className="">
        <StudentRanking
          students={students}
          title="Bảng xếp hạng tháng hiện tại"
          showFilters={true}
          maxResults={5}
        />
      </div>

      {/* Students Management */}
      <Card
        title="Quản lý Học sinh"
        extra={
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={handleAddStudent}
          >
            Thêm Học sinh
          </Button>
        }
      >
        {students.length > 0 ? (
          <Table
            dataSource={students}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 800 }}
          />
        ) : (
          <Empty
            description="Chưa có học sinh nào"
            style={{ marginTop: "20px" }}
          />
        )}
      </Card>

      {/* Modal for adding/editing student */}

      <Modal
        title={editingStudent ? "Chỉnh sửa Học sinh" : "Thêm Học sinh"}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
        width={820} // ✅ tăng nhẹ cho cân
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          labelCol={{ style: { marginBottom: 4 } }} // ✅ fix label spacing
        >
          <div className="grid grid-cols-2 gap-10 items-start">
            {/* ================= LEFT ================= */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase text-slate-500 tracking-wide">
                THÔNG TIN CÁ NHÂN
              </h3>

              <Form.Item
                label="Username"
                name="username"
                rules={[{ required: true, message: "Nhập username!" }]}
              >
                <Input placeholder="kien" />
              </Form.Item>

              <Form.Item
                label="Họ và tên"
                name="fullName"
                rules={[{ required: true, message: "Nhập tên!" }]}
              >
                <Input placeholder="Nguyễn Văn A" />
              </Form.Item>

              <Form.Item
                label="Năm sinh"
                name="birthYear"
                rules={[{ required: true }]}
              >
                <DatePicker picker="year" style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[{ required: true }]}
              >
                <Input placeholder="0123456789" />
              </Form.Item>

              <Form.Item
                label="Địa chỉ"
                name="address"
                rules={[{ required: true }]}
              >
                <Input placeholder="Địa chỉ" />
              </Form.Item>
            </div>

            {/* ================= RIGHT ================= */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase text-slate-500 tracking-wide">
                THÔNG TIN HỌC TẬP
              </h3>

              <Form.Item
                label="Cơ sở học"
                name="branch"
                rules={[{ required: true }]}
              >
                <Select placeholder="Chọn cơ sở">
                  <Select.Option value="cs1">Cơ sở 1</Select.Option>
                  <Select.Option value="cs2">Cơ sở 2</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Lớp học"
                rules={[{ required: true }]}
                shouldUpdate={(prev, curr) => prev.birthYear !== curr.birthYear}
              >
                {({ getFieldValue }) => {
                  const year = getFieldValue("birthYear")?.year();

                  let classOptions = [];
                  if (!year) classOptions = ["Chọn năm sinh trước"];
                  else if (year >= 2015) classOptions = ["Kids A", "Kids B"];
                  else if (year >= 2010) classOptions = ["Teen A", "Teen B"];
                  else classOptions = ["Adult 1", "Adult 2"];

                  return (
                    <Form.Item
                      name="class"
                      rules={[{ required: true }]}
                      noStyle
                    >
                      <Select placeholder="Chọn lớp">
                        {classOptions.map((cls) => (
                          <Select.Option key={cls} value={cls}>
                            {cls}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  );
                }}
              </Form.Item>

              {/* ✅ THAY divider bằng spacing */}
              <div className="pt-5.5" />

              <h3 className="text-sm font-bold uppercase text-slate-500 tracking-wide">
                THỜI GIAN HỌC
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  label="Bắt đầu"
                  name="startDate"
                  rules={[{ required: true }]}
                >
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item label="Kết thúc" name="endDate">
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
              </div>
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
