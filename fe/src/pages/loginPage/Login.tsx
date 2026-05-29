import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Spin, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [form] = Form.useForm();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const handleFinish = async (values: { identifier: string; password: string }) => {
    setErrorMessage(null);

    try {
      // Call login from AuthContext
      await login(values.identifier, values.password);

      // Save identifier if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedIdentifier', values.identifier);
      } else {
        localStorage.removeItem('rememberedIdentifier');
      }

      // Redirect to home
      message.success('Đăng nhập thành công!');
      navigate('/');
    } catch (error) {
      const err = error as any;
      const errorMsg = err?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      setErrorMessage(errorMsg);
      form.resetFields(['password']); // Clear password field only
    }
  };

  // Load remembered identifier if exists
  const rememberedIdentifier = localStorage.getItem('rememberedIdentifier');

  return (
    <div className="min-h-screen flex">
      {/* ===== LEFT: IMAGE (2/3) ===== */}
      <div className="hidden md:flex w-2/3 items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <img
          src="/src/assets/login/login.png"
          alt="Login Illustration"
          className="w-[80%] max-w-xl"
        />
      </div>

      {/* ===== RIGHT: FORM (1/3) ===== */}
      <div className="w-full md:w-1/3 bg-white flex items-center justify-center px-10">
        <Spin spinning={isLoading} size="large">
          <div className="w-full max-w-sm">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img
                src="/src/assets/logo/logo.png"
                alt="Logo"
                className="h-14 object-contain"
              />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
              Đăng nhập tài khoản
            </h2>

            {/* Error Alert */}
            {errorMessage && (
              <Alert
                message="Đăng nhập thất bại"
                description={errorMessage}
                type="error"
                showIcon
                closable
                onClose={() => setErrorMessage(null)}
                className="mb-4"
              />
            )}

            {/* ===== FORM ===== */}
            <Form
              form={form}
              layout="vertical"
              onFinish={handleFinish}
              requiredMark={false}
              initialValues={{
                identifier: rememberedIdentifier || '',
              }}
            >
              {/* Identifier (Username/Email/Phone) */}
              <Form.Item
                name="identifier"
                label="Tên đăng nhập / Email / Số điện thoại"
                rules={[
                  {
                    required: true,
                    message: 'Vui lòng nhập tên đăng nhập, email hoặc số điện thoại',
                  },
                  {
                    min: 3,
                    message: 'Tối thiểu 3 ký tự',
                  },
                ]}
              >
                <Input
                  size="large"
                  prefix={<UserOutlined />}
                  placeholder="Ví dụ: admin, admin@example.com, 0901234567"
                  disabled={isLoading}
                />
              </Form.Item>

              {/* Password */}
              <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[
                  {
                    required: true,
                    message: 'Vui lòng nhập mật khẩu',
                  },
                  {
                    min: 8,
                    message: 'Mật khẩu phải có ít nhất 8 ký tự',
                  },
                ]}
              >
                <Input.Password
                  size="large"
                  prefix={<LockOutlined />}
                  placeholder="Nhập mật khẩu của bạn"
                  disabled={isLoading}
                />
              </Form.Item>

              {/* Remember + Forgot */}
              <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                  />
                  <span>Ghi nhớ tên đăng nhập</span>
                </label>
                <span
                  className="text-blue-600 cursor-pointer hover:underline transition"
                  onClick={() => navigate('/forgot-password')}
                >
                  Quên mật khẩu?
                </span>
              </div>

              {/* Submit Button */}
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  className="w-full bg-blue-600 hover:bg-blue-700 font-semibold text-lg"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang đăng nhập...' : 'ĐĂNG NHẬP'}
                </Button>
              </Form.Item>
            </Form>

            {/* Register */}
            <p className="text-center text-sm text-gray-600 mt-6">
              Bạn chưa có tài khoản?
              <span
                className="text-blue-600 ml-1 cursor-pointer hover:underline transition font-medium"
                onClick={() => navigate('/register')}
              >
                Đăng ký ngay
              </span>
            </p>

            {/* Development Info */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500 mb-2">Tài khoản demo:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>
                  <strong>Admin:</strong> admin / password
                </li>
                <li>
                  <strong>Student:</strong> student / password
                </li>
              </ul>
            </div>
          </div>
        </Spin>
      </div>
    </div>
  );
};

export default Login;
