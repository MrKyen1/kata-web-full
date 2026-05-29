import React from 'react';
import { Form, Input, Button, Card, Spin, message } from 'antd';
import { useApiMutation } from '@/hooks/useApi';
import { courseService } from '@/services/apiServices';
import { useNavigate } from 'react-router-dom';

interface CreateCourseFormData {
  title: string;
  description: string;
  instructor: string;
}

/**
 * EXAMPLE: Create Course Component Using Axios Interceptor
 * 
 * This component demonstrates:
 * 1. Using useApiMutation for POST requests
 * 2. Form handling with Ant Design Form
 * 3. Loading states during submission
 * 4. Success and error handling
 * 5. Redirecting after successful creation
 */
export function ExampleCreateCourseComponent() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Using custom hook for mutation
  const { mutate, loading, error } = useApiMutation({
    onSuccess: (data) => {
      message.success('Tạo khóa học thành công!');
      form.resetFields();
      
      // Redirect to course list after 1 second
      setTimeout(() => {
        navigate('/courses');
      }, 1000);
    },
    onError: (error) => {
      console.error('Create Course Error:', error);
      // Error message is already shown by interceptor
      
      // If there are field errors from backend
      if (error.errors) {
        const errorFields = Object.entries(error.errors).map(([name, errors]) => ({
          name,
          errors,
        }));
        form.setFields(errorFields as any);
      }
    },
  });

  const handleSubmit = async (values: CreateCourseFormData) => {
    try {
      await mutate(() => courseService.createCourse(values));
    } catch (err) {
      console.error('Form submission failed:', err);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto" title="Tạo Khóa Học Mới">
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            label="Tên Khóa Học"
            name="title"
            rules={[
              { required: true, message: 'Vui lòng nhập tên khóa học' },
              { min: 3, message: 'Tên khóa học phải ít nhất 3 ký tự' },
            ]}
          >
            <Input
              placeholder="Ví dụ: Toán Lớp 6"
              disabled={loading}
            />
          </Form.Item>

          <Form.Item
            label="Mô Tả"
            name="description"
            rules={[
              { required: true, message: 'Vui lòng nhập mô tả khóa học' },
              { min: 10, message: 'Mô tả phải ít nhất 10 ký tự' },
            ]}
          >
            <Input.TextArea
              placeholder="Mô tả chi tiết về khóa học..."
              rows={4}
              disabled={loading}
            />
          </Form.Item>

          <Form.Item
            label="Giáo Viên Phụ Trách"
            name="instructor"
            rules={[
              { required: true, message: 'Vui lòng nhập tên giáo viên' },
            ]}
          >
            <Input
              placeholder="Ví dụ: Cô Nguyễn Thị A"
              disabled={loading}
            />
          </Form.Item>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              <strong>Lỗi:</strong> {error.message}
              {error.errors && (
                <ul className="mt-2">
                  {Object.entries(error.errors).map(([field, messages]) => (
                    <li key={field}>
                      {field}: {messages.join(', ')}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <Form.Item>
            <div className="flex gap-2">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
              >
                {loading ? 'Đang Tạo...' : 'Tạo Khóa Học'}
              </Button>
              <Button onClick={() => navigate('/courses')}>
                Hủy
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Spin>
    </Card>
  );
}
