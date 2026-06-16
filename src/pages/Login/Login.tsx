import { LockOutlined, SafetyCertificateOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Checkbox, Form, Input, Space, Typography, message } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { productConfig } from "../../config";
import { useAppStore } from "../../store/appStore";

interface LoginFormValues {
  username: string;
  password: string;
  remember: boolean;
}

export default function Login(): JSX.Element {
  const [loading, setLoading] = useState(false);
  const login = useAppStore((state) => state.login);
  const navigate = useNavigate();

  const submit = async (values: LoginFormValues): Promise<void> => {
    setLoading(true);
    const ok = await login(values.username, values.password);
    setLoading(false);
    if (ok) {
      message.success("登录成功");
      navigate("/dashboard");
      return;
    }
    message.error("用户名或密码错误");
  };

  return (
    <div className="login-page">
      <div className="login-hero">
        <div>
          <Typography.Title style={{ color: "#ffffff", marginBottom: 8 }}>{productConfig.fullName}</Typography.Title>
          <Typography.Title level={4} style={{ color: "rgba(255,255,255,.82)", fontWeight: 400 }}>
            {productConfig.englishName}
          </Typography.Title>
          <Typography.Paragraph style={{ color: "rgba(255,255,255,.78)", maxWidth: 720, fontSize: 17 }}>
            {productConfig.slogan}
          </Typography.Paragraph>
        </div>
        <Space direction="vertical" size={12}>
          <Space>
            <SafetyCertificateOutlined />
            <span>数据导出留痕，敏感信息按权限脱敏展示。</span>
          </Space>
          <span>当前为前端 MVP 演示环境，分析结果基于模拟数据。</span>
        </Space>
      </div>
      <Card className="login-card" variant="borderless">
        <Typography.Title level={3}>登录平台</Typography.Title>
        <Typography.Paragraph type="secondary">演示账号：admin / admin123</Typography.Paragraph>
        <Alert type="info" showIcon message="本系统为招商决策辅助工具，计算结果不能替代人工尽职调查。" style={{ marginBottom: 18 }} />
        <Form<LoginFormValues>
          layout="vertical"
          initialValues={{ username: "admin", password: "admin123", remember: true }}
          onFinish={submit}
        >
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: "请输入用户名" }]}>
            <Input size="large" prefix={<UserOutlined />} placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: "请输入密码" }]}>
            <Input.Password size="large" prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>
          <Form.Item name="remember" valuePropName="checked">
            <Checkbox>记住登录状态</Checkbox>
          </Form.Item>
          <Button type="primary" size="large" htmlType="submit" loading={loading} block>
            登录
          </Button>
        </Form>
      </Card>
    </div>
  );
}
