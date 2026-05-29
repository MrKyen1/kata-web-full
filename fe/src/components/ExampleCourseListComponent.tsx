import React, { useEffect } from 'react';
import { Table, Spin, Button, Space, message } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useApi, useApiMutation } from '@/hooks/useApi';
import { courseService } from '@/services/apiServices';

interface Course {
  id: string;
  title: string;
  description: string;
  totalStudents: number;
  instructor: string;
  createdAt: string;
}

/**
 * EXAMPLE: Course List Component Using Axios Interceptor
 * 
 * This component demonstrates:
 * 1. Using useApi hook for data fetching
 * 2. Using useApiMutation for delete operations
 * 3. Handling loading and error states
 * 4. Using API services
 * 5. Combining multiple API calls
 */
export function ExampleCourseListComponent() {
  // Hook for fetching courses
  const { data: courses, loading, error, call } = useApi<Course[]>();

  // Hook for delete mutation
  const {
    mutate: deleteCourse,
    loading: deleteLoading,
  } = useApiMutation({
    onSuccess: () => {
      message.success('Xóa khóa học thành công!');
      // Refetch courses
      fetchCourses();
    },
    onError: (error) => {
      message.error(`Lỗi: ${error.message}`);
    },
  });

  // Fetch courses on component mount
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = () => {
    call(() => courseService.getAllCourses(1, 10));
  };

  const handleDelete = (courseId: string) => {
    if (window.confirm('Bạn chắc chắn muốn xóa khóa học này?')) {
      deleteCourse(() => courseService.deleteCourse(courseId));
    }
  };

  const columns = [
    {
      title: 'Tên Khóa Học',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Mô Tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Số Học Sinh',
      dataIndex: 'totalStudents',
      key: 'totalStudents',
    },
    {
      title: 'Giáo Viên',
      dataIndex: 'instructor',
      key: 'instructor',
    },
    {
      title: 'Hành Động',
      key: 'action',
      render: (_: any, record: Course) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              // TODO: Navigate to edit page
            }}
          >
            Sửa
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            loading={deleteLoading}
            onClick={() => handleDelete(record.id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Danh Sách Khóa Học</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            // TODO: Navigate to create page
          }}
        >
          Thêm Khóa Học
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          <strong>Lỗi:</strong> {error.message}
          <Button
            type="link"
            size="small"
            onClick={fetchCourses}
            className="ml-2"
          >
            Thử Lại
          </Button>
        </div>
      )}

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={courses || []}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} khóa học`,
          }}
        />
      </Spin>
    </div>
  );
}
