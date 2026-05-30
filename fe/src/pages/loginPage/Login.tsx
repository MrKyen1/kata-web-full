import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, message, Spin, Alert } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [form] = Form.useForm();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  /* ================= SUBMIT ================= */

  const handleFinish = async (values: {
    identifier: string;
    password: string;
  }) => {
    setErrorMessage(null);

    try {
      await login(values.identifier, values.password);

      // ✅ remember account
      if (rememberMe) {
        localStorage.setItem("rememberedIdentifier", values.identifier);
      } else {
        localStorage.removeItem("rememberedIdentifier");
      }

      message.success("Đăng nhập thành công!");
      navigate("/");
    } catch (error: any) {
      // ✅ interceptor đã xử lý message.error rồi
      setErrorMessage(error?.message || "Đăng nhập thất bại");
      form.setFieldValue("password", "");
    }
  };

  /* ================= LOAD REMEMBERED ================= */

  useEffect(() => {
    const remembered = localStorage.getItem("rememberedIdentifier");

    if (remembered) {
      form.setFieldsValue({
        identifier: remembered,
      });
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex">
      {/* LEFT */}
      <div className="hidden md:flex w-2/3 items-center justify-center ">
        <img
          src="/src/assets/login/login.png"
          alt="Login"
          className="w-[80%] max-w-xl"
        />
      </div>

      {/* RIGHT */}
      <div className="w-full md:w-1/3 bg-white flex items-center justify-center px-10">
        <Spin spinning={isLoading}>
          <div className="w-full max-w-sm">
            {/* LOGO */}
            <div className="flex justify-center mb-6">
              <img
                src="/src/assets/logo/logo.png"
                alt="Logo"
                className="h-14"
              />
            </div>

            <h2 className="text-2xl font-semibold text-center mb-6">
              Đăng nhập
            </h2>

            {/* ERROR */}
            {errorMessage && (
              <Alert
                type="error"
                message="Đăng nhập thất bại"
                description={errorMessage}
                closable
                onClose={() => setErrorMessage(null)}
                className="mb-4"
              />
            )}

            {/* FORM */}
            <Form form={form} layout="vertical" onFinish={handleFinish}>
              {/* identifier */}
              <Form.Item
                name="identifier"
                label="Tài khoản"
                rules={[{ required: true, message: "Nhập tài khoản" }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  size="large"
                  disabled={isLoading}
                  onChange={() => setErrorMessage(null)}
                />
              </Form.Item>

              {/* password */}
              <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[{ required: true, message: "Nhập mật khẩu" }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  size="large"
                  disabled={isLoading}
                  onChange={() => setErrorMessage(null)}
                />
              </Form.Item>

              {/* remember */}
              <div className="flex justify-between mb-4 text-sm">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="ml-2">Ghi nhớ</span>
                </label>

                <span
                  className="text-blue-600 cursor-pointer"
                  onClick={() => navigate("/forgot-password")}
                >
                  Quên mật khẩu?
                </span>
              </div>

              {/* submit */}
              <Form.Item>
                <Button
                  htmlType="submit"
                  type="primary"
                  size="large"
                  className="w-full"
                  loading={isLoading}
                >
                  ĐĂNG NHẬP
                </Button>
              </Form.Item>
            </Form>
          </div>
        </Spin>
      </div>
    </div>
  );
};

export default Login;
