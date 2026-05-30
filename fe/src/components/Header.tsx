import { useEffect, useState, memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Layout, Menu, Button, Dropdown } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";

import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/auth.service";

const { Header: AntHeader } = Layout;

const Header = memo(function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const [current, setCurrent] = useState(location.pathname);

  const isLoggedIn = !!user;

  useEffect(() => {
    setCurrent(location.pathname);
  }, [location]);

  /* ================= MENU CLICK ================= */

  const handleMenuClick = (e: any) => {
    if (e.key === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      navigate("/");
    } else if (["about", "teachers", "contact"].includes(e.key)) {
      if (location.pathname !== "/") {
        navigate(`/?scrollTo=${e.key}`);
      } else {
        const el = document.getElementById(e.key);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(e.key);
    }
  };

  /* ================= LOGOUT ================= */

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");

      // ✅ gọi API logout backend nếu có
      if (refreshToken) {
        await authService.logout({ refreshToken });
      }
    } catch {}

    logout();
    navigate("/");
  };

  /* ================= USER MENU ================= */

  const userMenuItems = [
    {
      key: "profile",
      label: user?.code || "Profile",
      onClick: () => navigate("/profile"),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  /* ================= NAV ITEMS ================= */

  const items = [
    { key: "/", label: "Trang chủ" },
    { key: "/courses", label: "Khóa học" },
    { key: "about", label: "Về chúng tôi" },
    { key: "teachers", label: "Giáo viên" },
    { key: "contact", label: "Liên hệ" },
  ];

  return (
    <AntHeader className="sticky top-0 z-50 flex items-center justify-between !bg-white px-4 md:px-12 shadow-sm">
      {/* LOGO */}
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => {
          navigate("/");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        <img
          src="/src/assets/logo/logo.png"
          alt="Logo"
          className="h-12 object-contain"
        />
      </div>

      {/* MENU */}
      <Menu
        mode="horizontal"
        selectedKeys={[current]}
        onClick={handleMenuClick}
        items={items}
        className="flex-1 justify-center border-none bg-transparent hidden md:flex"
      />

      {/* RIGHT */}
      <div className="flex items-center gap-4">
        {isLoggedIn ? (
          <div className="flex items-center gap-3">
            {/* Greeting */}
            <span className="text-sm text-gray-600">
              Xin chào,{" "}
              <span className="font-semibold text-blue-600">
                {user?.code || user?.id}
              </span>
              !
            </span>

            {/* Dropdown */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button
                type="text"
                icon={<UserOutlined />}
                className="text-blue-600"
              />
            </Dropdown>
          </div>
        ) : (
          <Button
            type="primary"
            shape="round"
            size="large"
            onClick={() => navigate("/login")}
          >
            Đăng nhập
          </Button>
        )}
      </div>
    </AntHeader>
  );
});

export default Header;
