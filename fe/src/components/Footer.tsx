import { Layout, Row, Col, Typography, Space } from "antd";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "../contexts/AuthContext";
import { usePermission } from "../hooks/usePermission";

import { centerService } from "../services/center.service";
import { userService } from "../services/user.service";

const { Footer: AntFooter } = Layout;
const { Title, Text } = Typography;

const Footer = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermission();

  const [center, setCenter] = useState<any>(null);

  useEffect(() => {
    resolveCenter();
  }, [user]);

  const resolveCenter = async () => {
    try {
      // ✅ ADMIN → lấy center mặc định
      if (hasPermission("classes.manage")) {
        const centers = await centerService.getAll();
        setCenter(centers[0]); // hoặc chọn centerId config
        return;
      }

      // ✅ USER → lấy center từ class
    //   const me = await userService.getOne(user?.id);

    //   let resolvedCenter =
    //     me?.student?.classes?.[0]?.class?.center ||
    //     me?.teacher?.classes?.[0]?.class?.center;

    //   setCenter(resolvedCenter || null);
     } catch (e) {
        console.error(e);
   }
  };

  if (!center) return null;

  return (
    <AntFooter className="!bg-slate-200 py-12 px-6 md:px-16 mt-auto">
      <div className="max-w-7xl mx-auto">
        <Row gutter={[32, 32]}>
          {/* LEFT */}
          <Col xs={24} md={8}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold tracking-tight">
                {center.name}
              </span>
            </div>

            <Text className="block mb-6">
              {center.description || "Trung tâm giáo dục chất lượng cao"}
            </Text>

            <div className="flex items-center gap-2">
              <MessageCircle size={18} />
              <a href="https://fb.com/kata">Fanpage</a>
            </div>
          </Col>

          {/* CONTACT */}
          <Col xs={24} md={8}>
            <Title level={4}>Thông tin liên hệ</Title>

            <Space direction="vertical">
              <div className="flex gap-2">
                <MapPin size={18} />
                <Text>{center.address}</Text>
              </div>

              <div className="flex gap-2">
                <Phone size={18} />
                <Text>{center.phone}</Text>
              </div>

              <div className="flex gap-2">
                <Mail size={18} />
                <Text>{center.email}</Text>
              </div>
            </Space>
          </Col>

          {/* MAP */}
          <Col xs={24} md={8}>
            <Title level={4}>Bản đồ</Title>

            <div className="w-full h-48 rounded-xl overflow-hidden">
              {center.mapEmbedUrl ? (
                <iframe
                  src={center.mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                />
              ) : (
                <div>Không có bản đồ</div>
              )}
            </div>
          </Col>
        </Row>

        <div className="mt-10 text-center">
          <Text>© 2026 {center.name}</Text>
        </div>
      </div>
    </AntFooter>
  );
};

export default Footer;
