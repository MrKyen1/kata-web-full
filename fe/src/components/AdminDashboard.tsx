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
  Checkbox,
} from "antd";
import {
  UserAddOutlined,
  DeleteOutlined,
  EditOutlined,
  UserOutlined,
  BookOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Center } from "../types/center";
import { centerService } from "../services/center.service";
import { userService } from "../services/user.service";
import { classService } from "../services/class.service";
import { roleService } from "../services/rbac.service";

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
import StudentRanking from "./StudentRanking";

import dayjs from "dayjs";

export default function AdminDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const [studentRoleId, setStudentRoleId] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [centerModalVisible, setCenterModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [editingCenter, setEditingCenter] = useState<any | null>(null);
  const [form] = Form.useForm();
  const [centerForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStudents();
    loadCenters();
    loadStudentRole();
  }, []);

  useEffect(() => {
    if (selectedCenterId) {
      loadClasses(selectedCenterId);
    } else {
      setClasses([]);
    }
  }, [selectedCenterId]);

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
      const centers = data as Center[];
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
      const studentRole = (roles as any[]).find(
        (role: any) => role.code === "student",
      );
      setStudentRoleId(studentRole?.id ?? null);
    } catch (err) {
      message.error("Không thể tải role học sinh");
    }
  };

  const handleAddStudent = () => {
    setEditingStudent(null);
    form.resetFields();
    setSelectedCenterId(centers[0]?.id ?? null);
    setIsModalVisible(true);
  };

  const handleAddCenter = () => {
    centerForm.resetFields();
    centerForm.setFieldsValue({ isActive: true }); // ✅ Mặc định active
    setEditingCenter(null);
    setCenterModalVisible(true);
  };

  const normalizeMapEmbedUrl = (value?: string) => {
    if (!value || typeof value !== "string") return value
    const match = value.match(/src=["']([^"']+)["']/)
    return match ? match[1] : value
  }

  const handleEditCenter = (center: any) => {
    setEditingCenter(center);
    centerForm.setFieldsValue({
      name: center.name,
      address: center.address,
      phone: center.phone,
      email: center.email,
      description: center.description,
      mapEmbedUrl: center.mapEmbedUrl,
      isActive: center.isActive,
    });
    setCenterModalVisible(true);
  };

  const handleDeleteCenter = (id: string) => {
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
        } catch (err) {
          message.error("Xóa trung tâm thất bại");
        }
      },
    });
  };

  const handleCreateCenter = async (values: {
    name: string;
    address: string;
    phone: string;
    email: string;
    description?: string;
    mapEmbedUrl?: string;
    isActive?: boolean;
  }) => {
    try {
      const payload: any = {
        name: values.name,
        address: values.address,
        phone: values.phone,
        email: values.email,
        description: values.description,
        mapEmbedUrl: normalizeMapEmbedUrl(values.mapEmbedUrl),
        isActive: values.isActive !== undefined ? values.isActive : true,
      };

      console.log("Center payload:", payload);

      if (editingCenter) {
        await centerService.update(editingCenter.id, payload);
        message.success("Cập nhật trung tâm thành công!");
      } else {
        await centerService.create(payload);
        message.success("Tạo trung tâm thành công!");
      }

      await loadCenters();
      setCenterModalVisible(false);
      centerForm.resetFields();
      setEditingCenter(null);
    } catch (err) {
      //console.error("Center operation error", err);
      message.error(editingCenter ? "Cập nhật trung tâm thất bại" : "Tạo trung tâm thất bại");
    }
  };

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
    setIsModalVisible(true);
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

      setIsModalVisible(false);
      form.resetFields();
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

      {/* Center Management */}
      <Card
        title="Quản lý Trung tâm"
        extra={
          <Button type="primary" onClick={handleAddCenter}>
            + Tạo Trung tâm
          </Button>
        }
        className="mb-6"
      >
        {centers.length > 0 ? (
          <Table
            dataSource={centers}
            columns={[
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
                      onClick={() => handleEditCenter(record)}
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
            ]}
            rowKey="id"
            pagination={false}
            scroll={{ x: 700 }}
          />
        ) : (
          <Empty description="Chưa có trung tâm nào" />
        )}
      </Card>

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

      {/* Modal for creating/editing center */}
      <Modal
        title={editingCenter ? "Chỉnh sửa Trung tâm" : "Tạo Trung tâm"}
        open={centerModalVisible}
        onOk={() => centerForm.submit()}
        onCancel={() => {
          setCenterModalVisible(false);
          setEditingCenter(null);
          centerForm.resetFields();
        }}
      >
        <Form form={centerForm} layout="vertical" onFinish={handleCreateCenter}>
          <Form.Item
            label="Tên trung tâm"
            name="name"
            rules={[{ required: true, message: "Nhập tên trung tâm" }]}
          >
            <Input placeholder="Tên trung tâm" />
          </Form.Item>

          <Form.Item label="Địa chỉ" name="address" rules={[{ required: true }]}> 
            <Input placeholder="Địa chỉ" />
          </Form.Item>

          <Form.Item label="Số điện thoại" name="phone" rules={[{ required: true }]}> 
            <Input placeholder="Số điện thoại" />
          </Form.Item>

          <Form.Item label="Email" name="email" rules={[{ required: true, type: "email" }]}> 
            <Input placeholder="Email" />
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={3} placeholder="Mô tả trung tâm" />
          </Form.Item>

          <Form.Item label="Map Embed URL" name="mapEmbedUrl">
            <Input placeholder="URL nhúng bản đồ" />
          </Form.Item>

          <Form.Item label="Trạng thái" name="isActive" valuePropName="checked">
            <Checkbox>Đang hoạt động</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

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
                <Select
                  placeholder="Chọn cơ sở"
                  disabled={centers.length === 0}
                  onChange={(value) => {
                    setSelectedCenterId(value);
                    form.setFieldsValue({ classId: undefined });
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
