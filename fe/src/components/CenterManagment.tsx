import { useEffect, useState } from "react";
import {
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Row,
  Col,
  DatePicker,
  Tag,
  Empty,
  InputNumber,
  Popconfirm,
  Avatar,
  Checkbox,
} from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined, UserAddOutlined } from "@ant-design/icons";

import { userService } from "../services/user.service";
import { centerService } from "../services/center.service";
import { classService } from "../services/class.service";
import { roleService } from "../services/rbac.service";
import dayjs from "dayjs";

export default function CenterManagement() {
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [studentRoleId, setStudentRoleId] = useState<string | null>(null);
  const [teacherRoleId, setTeacherRoleId] = useState<string | null>(null);
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);

  const [studentModal, setStudentModal] = useState(false);
  const [teacherModal, setTeacherModal] = useState(false);
  const [centerModal, setCenterModal] = useState(false);
  const [classModal, setClassModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [editingCenter, setEditingCenter] = useState<any>(null);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);

  const [form] = Form.useForm();
  const [centerForm] = Form.useForm();
  const [classForm] = Form.useForm();
  const [teacherForm] = Form.useForm();

interface StudentFormValues {
  username: string;
  fullName: string;
  birthYear?: dayjs.Dayjs;
  phone?: string;
  address?: string;
  branch?: string;
  classId?: string;
  startDate?: dayjs.Dayjs;
  endDate?: dayjs.Dayjs;
}

interface TeacherFormValues {
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  subject?: string;
  yearsOfExperience?: number;
  description?: string;
}
  /* ================= LOAD DATA ================= */

  const loadStudents = async () => {
    try {
      const data = await userService.getAll({ roleCode: "student" });
      setStudents(
        (data as any[]).map((student: any) => ({
          ...student,
          username: student.code,
          class: student.student?.classes?.map((item: any) => item.class.name).join(", ") || "",
          branch:
            student.student?.classes?.[0]?.class?.center?.name || "",
          birthYear: student.dateOfBirth
            ? Number(student.dateOfBirth.split("-")[0])
            : undefined,
        })),
      );
    } catch (err) {
      message.error("Không thể tải danh sách học sinh");
    }
  };

  const loadCenters = async () => {
    try {
      const data = await centerService.getAll();
      const centers = data as any[];
      setCenters(centers);
      if (!selectedCenterId && centers.length > 0) {
        setSelectedCenterId(centers[0].id);
      }
    } catch (err) {
      message.error("Không thể tải danh sách trung tâm");
    }
  };

  const loadClasses = async (centerId?: string) => {
    if (!centerId) {
      setClasses([]);
      return;
    }

    try {
      const data = await classService.getAll({ centerId });
      setClasses(data as any[]);
    } catch (err) {
      message.error("Không thể tải danh sách lớp học");
    }
  };

  const loadStudentRole = async () => {
    try {
      const roles = await roleService.getAll();
      const studentRole = roles.find((role: any) => role.code === "student");
      setStudentRoleId(studentRole?.id ?? null);
    } catch (err) {
      message.error("Không thể tải role học sinh");
    }
  };

  const loadTeachers = async () => {
    try {
      const data = await userService.getAll({ roleCode: "teacher" });
      setTeachers(data as any[]);
    } catch (error) {
      message.error("Không thể tải danh sách giáo viên");
    }
  };

  const loadTeacherRole = async () => {
    try {
      const roles = await roleService.getAll();
      const teacherRole = roles.find((role: any) => role.code === "teacher");
      setTeacherRoleId(teacherRole?.id ?? null);
    } catch (error) {
      message.error("Không thể tải role giáo viên");
    }
  };

  useEffect(() => {
    loadStudents();
    loadTeachers();
    loadCenters();
    loadStudentRole();
    loadTeacherRole();
  }, []);

  useEffect(() => {
    if (selectedCenterId) {
      loadClasses(selectedCenterId);
    }
  }, [selectedCenterId]);

  /* ================= CENTER ================= */

  const normalizeMapEmbedUrl = (value?: string) => {
    if (!value || typeof value !== "string") return value
    const match = value.match(/src=["']([^"']+)["']/)
    return match ? match[1] : value
  }

  const handleCreateCenter = async (values: any) => {
    try {
      const payload = {
        name: values.name,
        address: values.address,
        phone: values.phone,
        email: values.email,
        description: values.description,
        mapEmbedUrl: normalizeMapEmbedUrl(values.mapEmbedUrl),
        isActive: values.isActive !== undefined ? values.isActive : true,
      };

      if (editingCenter) {
        await centerService.update(editingCenter.id, payload);
        message.success("Cập nhật trung tâm thành công!");
      } else {
        const created = await centerService.create(payload);
        setSelectedCenterId(created?.id ?? null);
        message.success("Tạo cơ sở thành công!");
      }

      setCenterModal(false);
      setEditingCenter(null);
      centerForm.resetFields();
      loadCenters();
    } catch (error: any) {
      message.error(
        error?.message || (editingCenter ? "Cập nhật trung tâm thất bại" : "Tạo trung tâm thất bại")
      );
    }
  };

  const handleDeleteCenter = async (id: string) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa trung tâm này?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await centerService.delete(id);
          message.success("Đã xóa trung tâm!");
          loadCenters();
        } catch (error: any) {
          message.error("Xóa trung tâm thất bại");
        }
      },
    });
  };

  /* ================= CLASS ================= */

  const handleCreateClass = async (values: any) => {
    try {
      await classService.create({
        ...values,
        isActive: true,
      });
      message.success("Tạo lớp thành công!");
      setClassModal(false);
      classForm.resetFields();
      if (values.centerId) {
        loadClasses(values.centerId);
      }
    } catch (error: any) {
      message.error(
        error?.message || "Tạo lớp thất bại. Vui lòng đăng nhập lại."
      );
    }
  };

  /* ================= STUDENT ================= */

   const handleEditStudent = (student: any) => {
    setEditingStudent(student);

    const centerId = student.student?.classes?.[0]?.class?.center?.id;
    const classId = student.student?.classes?.[0]?.class?.id;

    form.setFieldsValue({
      username: student.code,
      fullName: student.fullName,
      birthYear: student.dateOfBirth ? dayjs(student.dateOfBirth) : null,
      phone: student.phone,
      address: student.address,
      branch: centerId,
      classId,
      startDate: student.startDate ? dayjs(student.startDate) : null,
      endDate: student.endDate ? dayjs(student.endDate) : null,
    });

    setSelectedCenterId(centerId ?? null);
    setStudentModal(true);
  };

  const handleDeleteStudent = (id: string) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa học sinh này?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await userService.delete(id);
          message.success("Đã xóa học sinh!");
          loadStudents();
        } catch (err) {
          message.error("Xóa học sinh thất bại");
        }
      },
    });
  };

  const handleSubmit = async (values: StudentFormValues) => {
    setLoading(true);

    try {
      if (!studentRoleId) {
        message.error("Không tìm thấy vai trò học sinh");
        return;
      }

      const payload: any = {
        code: values.username,
        fullName: values.fullName,
        dateOfBirth: values.birthYear?.format("YYYY-MM-DD"),
        phone: values.phone,
        address: values.address,
        roleId: studentRoleId,
        studentProfile: {
          classIds: values.classId ? [values.classId] : [],
        },
      };

      if (!editingStudent) {
        payload.password = "12345678";
      }

      if (editingStudent) {
        await userService.update(editingStudent.id, payload);
        message.success("Cập nhật thành công!");
      } else {
        await userService.create(payload);
        message.success("Thêm thành công!");
      }

      setStudentModal(false);
      form.resetFields();
      setEditingStudent(null);
      loadStudents();
    } catch (err) {
      message.error("Có lỗi xảy ra!");
    } finally {
      setLoading(false);
    }
  };

  /* ================= TEACHER ================= */

  const handleEditTeacher = (teacher: any) => {
    setEditingTeacher(teacher);
    teacherForm.setFieldsValue({
      username: teacher.code,
      fullName: teacher.fullName,
      email: teacher.email,
      phone: teacher.phone,
      subject: teacher.teacherProfile?.subject || "",
      yearsOfExperience: teacher.teacher?.yearsOfExperience || 0,
      description: teacher.teacher?.description || "",
    });
    setTeacherModal(true);
  };

  const handleDeleteTeacher = (id: string) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa giáo viên này?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await userService.delete(id);
          message.success("Đã xóa giáo viên!");
          loadTeachers();
        } catch (err) {
          message.error("Xóa giáo viên thất bại");
        }
      },
    });
  };

  const handleSubmitTeacher = async (values: TeacherFormValues) => {
    setLoading(true);
    try {
      if (!teacherRoleId) {
        message.error("Không tìm thấy vai trò giáo viên");
        return;
      }

      const payload: any = {
        code: values.username,
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        roleId: teacherRoleId,
        teacherProfile: {
          yearsOfExperience: values.yearsOfExperience || 0,
          description: values.description || "",
        },
      };

      if (!editingTeacher) {
        payload.password = "12345678";
      }

      if (editingTeacher) {
        await userService.update(editingTeacher.id, payload);
        message.success("Cập nhật thành công!");
      } else {
        await userService.create(payload);
        message.success("Thêm thành công!");
      }

      setTeacherModal(false);
      teacherForm.resetFields();
      setEditingTeacher(null);
      loadTeachers();
    } catch (err) {
      message.error("Có lỗi xảy ra!");
    } finally {
      setLoading(false);
    }
  };

  const studentColumns = [
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
      render: (branch: string) => branch || "—",
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
      render: (_: unknown, record: any) => (
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

  /* ================= TABLE COLUMNS ================= */

  const centerColumns = [
    { title: "Tên trung tâm", dataIndex: "name" },
    { title: "Địa chỉ", dataIndex: "address" },
    { title: "SĐT", dataIndex: "phone" },
    { title: "Email", dataIndex: "email" },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      render: (active: boolean) => (
        <Tag color={active ? "green" : "default"}>
          {active ? "Đang hoạt động" : "Không hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      render: (_: unknown, record: any) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingCenter(record);
              centerForm.setFieldsValue({
                name: record.name,
                address: record.address,
                phone: record.phone,
                email: record.email,
                description: record.description,
                mapEmbedUrl: record.mapEmbedUrl,
                isActive: record.isActive,
              });
              setCenterModal(true);
            }}
          >
            Sửa
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteCenter(record.id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  const classColumns = [
    { title: "Tên lớp", dataIndex: "name" },
    { title: "Trạng thái", dataIndex: "isActive", render: (active: boolean) => active ? "Hoạt động" : "Ngưng" },
  ];

  const teacherColumns = [
    {
      title: "Username",
      dataIndex: "code",
    },
    {
      title: "Họ tên",
      dataIndex: "fullName",
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "SĐT",
      dataIndex: "phone",
    },
    {
      title: "Môn học",
      dataIndex: ["teacherProfile", "subject"],
      render: (subject: string) => subject || "—",
    },
    {
      title: "Hành động",
      render: (_: unknown, record: any) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditTeacher(record)}
          >
            Sửa
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteTeacher(record.id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

 

  const centerOptions = centers.map((center) => (
    <Select.Option key={center.id} value={center.id}>
      {center.name}
    </Select.Option>
  ));

  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="Quản lý Trung tâm"
            extra={
              <Button
                type="primary"
                onClick={() => {
                  setEditingCenter(null);
                  centerForm.resetFields();
                  centerForm.setFieldsValue({ isActive: true });
                  setCenterModal(true);
                }}
              >
                + Tạo Trung tâm
              </Button>
            }
          >
            <Table
              dataSource={centers.map((center) => ({ ...center, key: center.id }))}
              columns={centerColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              scroll={{ x: 700 }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={`Quản lý Lớp ${selectedCenterId ? `- ${centers.find((c) => c.id === selectedCenterId)?.name}` : ""}`}
            extra={
              <Button
                type="primary"
                onClick={() => {
                  if (selectedCenterId) {
                    classForm.setFieldsValue({ centerId: selectedCenterId });
                  }
                  setClassModal(true);
                }}
                disabled={!selectedCenterId}
              >
                + Tạo Lớp
              </Button>
            }
          >
            <Form layout="inline" style={{ marginBottom: 16 }}>
              <Form.Item label="Chọn Trung tâm">
                <Select
                  value={selectedCenterId}
                  onChange={(value) => setSelectedCenterId(value)}
                  style={{ minWidth: 240 }}
                >
                  {centerOptions}
                </Select>
              </Form.Item>
            </Form>

            <Table
              dataSource={classes.map((cls) => ({ ...cls, key: cls.id }))}
              columns={classColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              locale={{ emptyText: "Chưa có lớp cho trung tâm này" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Teachers */}
      <Card
        title="Quản lý Giáo viên"
        extra={
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => {
              setEditingTeacher(null);
              teacherForm.resetFields();
              setTeacherModal(true);
            }}
          >
            + Thêm Giáo viên
          </Button>
        }
      >
        {teachers.length > 0 ? (
          <Row gutter={[24, 24]}>
            {teachers.map((teacher: any) => (
              <Col xs={24} sm={12} lg={8} key={teacher.id}>
                <Card
                  hoverable
                  className="h-full flex flex-col"
                  cover={
                    <div className="bg-gray-100 p-4 flex justify-center items-center min-h-[200px]">
                      <Avatar
                        size={120}
                        src={teacher.avatar || `https://picsum.photos/seed/${teacher.code}/200/200`}
                        alt={teacher.fullName}
                      />
                    </div>
                  }
                >
                  <div className="space-y-3">
                    <h3 className="font-bold text-lg">{teacher.fullName}</h3>

                    <div>
                      <p className="text-xs text-gray-600 font-semibold">USERNAME</p>
                      <p className="text-sm">{teacher.code}</p>
                    </div>

                    {teacher.email && (
                      <div>
                        <p className="text-xs text-gray-600 font-semibold">EMAIL</p>
                        <p className="text-sm text-blue-500">{teacher.email}</p>
                      </div>
                    )}

                    {teacher.phone && (
                      <div>
                        <p className="text-xs text-gray-600 font-semibold">SĐT</p>
                        <p className="text-sm">{teacher.phone}</p>
                      </div>
                    )}

                    {teacher.teacher?.yearsOfExperience && (
                      <div>
                        <p className="text-xs text-gray-600 font-semibold">KINH NGHIỆM</p>
                        <p className="text-sm">{teacher.teacher.yearsOfExperience} năm</p>
                      </div>
                    )}

                    {teacher.teacher?.description && (
                      <div>
                        <p className="text-xs text-gray-600 font-semibold">MÔ TẢ</p>
                        <p className="text-sm text-gray-700">{teacher.teacher.description}</p>
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
                        <Button danger size="small" icon={<DeleteOutlined />}>
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
          <Empty description="Chưa có giáo viên" />
        )}
      </Card>

      {/* Students */}
      <Card
        title="Quản lý Học sinh"
        extra={
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => {
              setEditingStudent(null);
              form.resetFields();
              setSelectedCenterId(centers[0]?.id ?? null);
              setStudentModal(true);
            }}
          >
            Thêm Học sinh
          </Button>
        }
      >
        {students.length > 0 ? (
          <Table
            dataSource={students}
            columns={studentColumns}
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

      {/* ================= CREATE CENTER ================= */}
      <Modal
        title={editingCenter ? "Sửa trung tâm" : "Tạo cơ sở"}
        open={centerModal}
        onCancel={() => {
          setCenterModal(false);
          setEditingCenter(null);
          centerForm.resetFields();
        }}
        onOk={() => centerForm.submit()}
      >
        <Form form={centerForm} layout="vertical" onFinish={handleCreateCenter}>
          <Form.Item
            name="name"
            label="Tên trung tâm"
            rules={[{ required: true, message: "Nhập tên trung tâm" }]}
          >
            <Input placeholder="Tên trung tâm" />
          </Form.Item>

          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true }]}
          >
            <Input placeholder="Địa chỉ" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true }]}
          >
            <Input placeholder="Số điện thoại" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea rows={3} placeholder="Mô tả trung tâm" />
          </Form.Item>

          <Form.Item
            name="mapEmbedUrl"
            label="Map Embed URL"
          >
            <Input placeholder="URL nhúng bản đồ" />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Trạng thái"
            valuePropName="checked"
          >
            <Checkbox>Đang hoạt động</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      {/* ================= CREATE CLASS ================= */}
      <Modal
        title="Tạo lớp"
        open={classModal}
        onCancel={() => setClassModal(false)}
        onOk={() => classForm.submit()}
      >
        <Form form={classForm} onFinish={handleCreateClass}>
          <Form.Item name="centerId" label="Cơ sở" required>
            <Select>
              {centers.map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="name" label="Tên lớp" required>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* ================= CREATE TEACHER ================= */}
      <Modal
        title={editingTeacher ? "Chỉnh sửa Giáo viên" : "Thêm Giáo viên"}
        open={teacherModal}
        onOk={() => teacherForm.submit()}
        onCancel={() => {
          setTeacherModal(false);
          setEditingTeacher(null);
          teacherForm.resetFields();
        }}
        confirmLoading={loading}
        width={600}
      >
        <Form form={teacherForm} layout="vertical" onFinish={handleSubmitTeacher}>
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Nhập username!" }]}
          >
            <Input placeholder="teacher_code" />
          </Form.Item>

          <Form.Item
            label="Họ và tên"
            name="fullName"
            rules={[{ required: true, message: "Nhập tên!" }]}
          >
            <Input placeholder="Nguyễn Văn B" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Nhập email!" },
              { type: "email", message: "Email không hợp lệ!" },
            ]}
          >
            <Input placeholder="teacher@example.com" />
          </Form.Item>

          <Form.Item label="Số điện thoại" name="phone">
            <Input placeholder="0123456789" />
          </Form.Item>

          <Form.Item label="Môn học" name="subject">
            <Input placeholder="Toán, Tiếng Anh, etc." />
          </Form.Item>

          <Form.Item label="Kinh nghiệm (năm)" name="yearsOfExperience">
            <InputNumber min={0} placeholder="10" />
          </Form.Item>

          <Form.Item label="Mô tả ngắn" name="description">
            <Input.TextArea
              rows={3}
              placeholder="Ví dụ: 10 năm kinh nghiệm luyện thi, IELTS 8.5..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ================= CREATE STUDENT ================= */}
      <Modal
        title={editingStudent ? "Chỉnh sửa Học sinh" : "Thêm Học sinh"}
        open={studentModal}
        onOk={() => form.submit()}
        onCancel={() => {
          setStudentModal(false);
          setEditingStudent(null);
          form.resetFields();
        }}
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

              <Form.Item label="Cơ sở học" name="branch" rules={[{ required: true }]}>
                <Select
                  placeholder="Chọn cơ sở"
                  disabled={centers.length === 0}
                  onChange={(value) => {
                    setSelectedCenterId(value);
                    form.setFieldsValue({ classId: undefined });
                    loadClasses(value);
                  }}
                >
                  {centers.map((center) => (
                    <Select.Option key={center.id} value={center.id}>
                      {center.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="Lớp học"
                name="classId"
                rules={[{ required: true }]}
              >
                <Select placeholder="Chọn lớp" disabled={!classes.length}>
                  {classes.map((cls) => (
                    <Select.Option key={cls.id} value={cls.id}>
                      {cls.name}
                    </Select.Option>
                  ))}
                </Select>
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
