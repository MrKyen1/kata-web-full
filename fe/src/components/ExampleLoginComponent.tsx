import React, { useState } from 'react';
import { Form, Input, Button, Card, Spin, message } from 'antd';
import { useApiMutation } from '@/hooks/useApi';
import { authService } from '@/services/apiServices';
import { useNavigate } from 'react-router-dom';

interface LoginFormData {
  username: string;
  password: string;
}

/**
 * EXAMPLE: Login Component Using Axios Interceptor
 * 
 * This component demonstrates:
 * 1. Using useApiMutation hook
 * 2. Calling API service
 * 3. Handling loading state
 * 4. Handling errors (automatically shown by interceptor)
 * 5. Saving tokens to localStorage
 * 6. Redirecting after success
 */
export function ExampleLoginComponent() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Using custom hook for mutation
  const { mutate, loading, error } = useApiMutation({
    onSuccess: (data) => {
      // Save tokens to localStorage
      localStorage.setItem('authToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      message.success('Đăng nhập thành công!');
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    },
    onError: (error) => {
      console.error('Login Error:', error);
      // Error message is already shown by interceptor
    },
  });

  const handleSubmit = async (values: LoginFormData) => {
    try {
      await mutate(() =>
        authService.login(values.username, values.password)
      );
    } catch (err) {
      // Error handling already done in interceptor
      console.error('Login failed:', err);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto" title="Đăng Nhập">
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            label="Tên Đăng Nhập"
            name="username"
            rules={[
              { required: true, message: 'Vui lòng nhập tên đăng nhập' },
            ]}
          >
            <Input
              placeholder="admin"
              disabled={loading}
            />
          </Form.Item>

          <Form.Item
            label="Mật Khẩu"
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu' },
            ]}
          >
            <Input
              type="password"
              placeholder="••••••"
              disabled={loading}
            />
          </Form.Item>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error.message}
            </div>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full"
              loading={loading}
            >
              {loading ? 'Đang Đăng Nhập...' : 'Đăng Nhập'}
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </Card>
  );
}
