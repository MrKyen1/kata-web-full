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
} from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";

import { userService } from "../services/user.service";
import { centerService } from "../services/center.service";
import { classService } from "../services/class.service";

export default function AdminDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

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
    setStudents(data);
  };

  const loadCenters = async () => {
    const data = await centerService.getAll();
    setCenters(data);
  };

  const loadClasses = async (centerId?: string) => {
    if (!centerId) return;
    const data = await classService.getAll({ centerId });
    setClasses(data);
  };

  useEffect(() => {
    loadStudents();
    loadCenters();
  }, []);

  /* ================= CENTER ================= */

  const handleCreateCenter = async (values: any) => {
    await centerService.create(values);
    message.success("Tạo cơ sở thành công");
    setCenterModal(false);
    centerForm.resetFields();
    loadCenters();
  };

  /* ================= CLASS ================= */

  const handleCreateClass = async (values: any) => {
    await classService.create(values);
    message.success("Tạo lớp thành công");
    setClassModal(false);
    classForm.resetFields();
  };

  /* ================= STUDENT ================= */

  const handleSubmitStudent = async (values: any) => {
    try {
      const payload = {
        code: values.username,
        fullName: values.fullName,
        phone: values.phone,
        address: values.address,
        roleId: "STUDENT_ROLE_ID",

        studentProfile: {
          classIds: values.classIds,
        },
      };

      if (editingStudent) {
        await userService.update(editingStudent.id, payload);
        message.success("Cập nhật thành công");
      } else {
        await userService.create({
          ...payload,
          password: "12345678",
        });
        message.success("Tạo học sinh thành công");
      }

      setStudentModal(false);
      form.resetFields();
      loadStudents();
    } catch {}
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

  const columns = [
    { title: "Username", dataIndex: "code" },
    { title: "Tên", dataIndex: "fullName" },
    { title: "Cơ sở", dataIndex: "center" },
    { title: "Lớp", dataIndex: "class" },
    {
      title: "Action",
      render: (_: any, record: any) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingStudent(record);
              setStudentModal(true);
            }}
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ================= ACTION BUTTON ================= */}
      <Row gutter={16}>
        <Col>
          <Button onClick={() => setCenterModal(true)}>+ Tạo cơ sở</Button>
        </Col>

        <Col>
          <Button onClick={() => setClassModal(true)}>+ Tạo lớp</Button>
        </Col>

        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setStudentModal(true)}
          >
            Thêm học sinh
          </Button>
        </Col>
      </Row>

      {/* ================= TABLE ================= */}
      <Card title="Danh sách học sinh">
        <Table dataSource={mappedStudents} columns={columns} />
      </Card>

      {/* ================= CREATE CENTER ================= */}
      <Modal
        title="Tạo cơ sở"
        open={centerModal}
        onCancel={() => setCenterModal(false)}
        onOk={() => centerForm.submit()}
      >
        <Form form={centerForm} onFinish={handleCreateCenter}>
          <Form.Item name="name" label="Tên" required>
            <Input />
          </Form.Item>

          <Form.Item name="address" label="Địa chỉ">
            <Input />
          </Form.Item>

          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>

          <Form.Item name="email" label="Email">
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

          <Form.Item name="fullName" label="Tên" required>
            <Input />
          </Form.Item>

          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>

          <Form.Item name="address" label="Address">
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
