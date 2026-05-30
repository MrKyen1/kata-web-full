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
} from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";

import { userService } from "../services/user.service";
import { centerService } from "../services/center.service";
import { classService } from "../services/class.service";
import { roleService } from "../services/rbac.service";

export default function CenterManagement() {
  const [students, setStudents] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [studentRoleId, setStudentRoleId] = useState<string | null>(null);
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);

  const [studentModal, setStudentModal] = useState(false);
  const [centerModal, setCenterModal] = useState(false);
  const [classModal, setClassModal] = useState(false);

  const [editingStudent, setEditingStudent] = useState<any>(null);

  const [form] = Form.useForm();
  const [centerForm] = Form.useForm();
  const [classForm] = Form.useForm();

  /* ================= LOAD DATA ================= */

  const loadStudents = async () => {
    const data = await userService.getAll({ roleCode: "student" });
    setStudents(data as any[]);
  };

  const loadCenters = async () => {
    const data = await centerService.getAll();
    const centers = data as any[];
    setCenters(centers);
    if (!selectedCenterId && centers.length > 0) {
      setSelectedCenterId(centers[0].id);
    }
  };

  const loadClasses = async (centerId?: string) => {
    if (!centerId) {
      setClasses([]);
      return;
    }

    const data = await classService.getAll({ centerId });
    setClasses(data as any[]);
  };

  const loadStudentRole = async () => {
    const roles = await roleService.getAll();
    const studentRole = roles.find((role: any) => role.code === "student");
    setStudentRoleId(studentRole?.id ?? null);
  };

  useEffect(() => {
    loadStudents();
    loadCenters();
    loadStudentRole();
  }, []);

  useEffect(() => {
    if (selectedCenterId) {
      loadClasses(selectedCenterId);
    }
  }, [selectedCenterId]);

  /* ================= CENTER ================= */

  const handleCreateCenter = async (values: any) => {
    const created = await centerService.create({
      ...values,
      isActive: true,
    });
    message.success("Tạo cơ sở thành công");
    setCenterModal(false);
    centerForm.resetFields();
    loadCenters();
    setSelectedCenterId(created?.id ?? null);
  };

  /* ================= CLASS ================= */

  const handleCreateClass = async (values: any) => {
    await classService.create({
      ...values,
      isActive: true,
    });
    message.success("Tạo lớp thành công");
    setClassModal(false);
    classForm.resetFields();
    if (values.centerId) {
      loadClasses(values.centerId);
    }
  };

  /* ================= STUDENT ================= */

  const handleSubmitStudent = async (values: any) => {
    try {
      if (!studentRoleId) {
        message.error("Không tìm thấy role học sinh");
        return;
      }

      const payload = {
        code: values.username,
        password: values.password || "12345678",
        fullName: values.fullName,
        dateOfBirth: values.dateOfBirth?.format("YYYY-MM-DD"),
        phone: values.phone,
        email: values.email,
        address: values.address,
        roleId: studentRoleId,
        studentProfile: {
          classIds: values.classIds,
        },
      };

      if (editingStudent) {
        await userService.update(editingStudent.id, payload);
        message.success("Cập nhật thành công");
      } else {
        await userService.create(payload);
        message.success("Tạo học sinh thành công");
      }

      setStudentModal(false);
      form.resetFields();
      loadStudents();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    await userService.delete(id);
    message.success("Đã xóa");
    loadStudents();
  };

  /* ================= TABLE ================= */

  const mappedStudents = students.map((s) => ({
    ...s,
    key: s.id,
    class: s.student?.classes?.map((c: any) => c.class.name).join(", ") || "",
    center: s.student?.classes?.[0]?.class?.center?.name || "",
  }));

  const centerColumns = [
    { title: "Tên", dataIndex: "name" },
    { title: "Địa chỉ", dataIndex: "address" },
    { title: "Phone", dataIndex: "phone" },
    { title: "Email", dataIndex: "email" },
    {
      title: "Mô tả",
      dataIndex: "description",
      ellipsis: true,
    },
  ];

  const classColumns = [
    { title: "Tên lớp", dataIndex: "name" },
    { title: "Trạng thái", dataIndex: "isActive", render: (active: boolean) => active ? "Hoạt động" : "Ngưng" },
  ];

  const studentColumns = [
    { title: "Username", dataIndex: "code" },
    { title: "Tên", dataIndex: "fullName" },
    { title: "Cơ sở", dataIndex: "center" },
    { title: "Lớp", dataIndex: "class" },
    {
      title: "Hành động",
      render: (_: any, record: any) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingStudent(record);
              setStudentModal(true);
            }}
          />
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
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
              <Button type="primary" onClick={() => setCenterModal(true)}>
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

      <Card
        title="Danh sách học sinh"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setStudentModal(true)}>
            Thêm học sinh
          </Button>
        }
      >
        <Table dataSource={mappedStudents} columns={studentColumns} rowKey="id" pagination={{ pageSize: 8 }} />
      </Card>

      {/* ================= CREATE CENTER ================= */}
      <Modal
        title="Tạo cơ sở"
        open={centerModal}
        onCancel={() => setCenterModal(false)}
        onOk={() => centerForm.submit()}
      >
        <Form form={centerForm} layout="vertical" onFinish={handleCreateCenter}>
          <Form.Item
            name="name"
            label="Tên"
            rules={[{ required: true, message: "Nhập tên cơ sở" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true, message: "Nhập địa chỉ" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone"
            rules={[{ required: true, message: "Nhập số điện thoại" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: "email", message: "Email không hợp lệ" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item name="mapEmbedUrl" label="Map Embed URL">
            <Input />
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

      {/* ================= CREATE STUDENT ================= */}
      <Modal
        title="Thêm học sinh"
        open={studentModal}
        onCancel={() => setStudentModal(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} onFinish={handleSubmitStudent} layout="vertical">
          <Form.Item name="username" label="Username" required>
            <Input />
          </Form.Item>

          <Form.Item name="password" label="Mật khẩu">
            <Input.Password placeholder="Mặc định 12345678 nếu để trống" />
          </Form.Item>

          <Form.Item name="fullName" label="Tên" required>
            <Input />
          </Form.Item>

          <Form.Item name="dateOfBirth" label="Ngày sinh" required>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="phone" label="Phone" required>
            <Input />
          </Form.Item>

          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>

          <Form.Item name="address" label="Địa chỉ">
            <Input />
          </Form.Item>

          {/* CENTER */}
          <Form.Item name="centerId" label="Cơ sở" required>
            <Select
              onChange={(value) => {
                form.setFieldValue("classIds", []);
                loadClasses(value);
              }}
            >
              {centers.map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* CLASS */}
          <Form.Item name="classIds" label="Lớp" required>
            <Select mode="multiple">
              {classes.map((cls) => (
                <Select.Option key={cls.id} value={cls.id}>
                  {cls.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
