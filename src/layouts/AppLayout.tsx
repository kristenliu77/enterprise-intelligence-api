import {
  ApartmentOutlined,
  ApiOutlined,
  BarChartOutlined,
  BellOutlined,
  BookOutlined,
  BuildOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  HeatMapOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  SettingOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Avatar, Breadcrumb, Button, Drawer, Dropdown, Grid, Input, Layout, Menu, Select, Space, Tag, Typography } from "antd";
import type { MenuProps } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AIInvestmentAssistant from "../components/business/AIInvestmentAssistant";
import { productConfig } from "../config";
import { useAppStore } from "../store/appStore";
import { industries, regions } from "../mock/data";

const { Header, Sider, Content } = Layout;

const navItems: Required<MenuProps>["items"] = [
  { key: "/dashboard", icon: <DashboardOutlined />, label: "招商驾驶舱" },
  { key: "/heat-calculation", icon: <HeatMapOutlined />, label: "热度计算中心" },
  { key: "/industry-region", icon: <ApartmentOutlined />, label: "产业与区域分析" },
  { key: "/entities", icon: <DatabaseOutlined />, label: "企业项目库" },
  { key: "/matching", icon: <ApiOutlined />, label: "智能匹配" },
  { key: "/policies-reports", icon: <BookOutlined />, label: "政策与报告" },
  { key: "/workbench", icon: <BuildOutlined />, label: "招商工作台" },
  { key: "/data-management", icon: <BarChartOutlined />, label: "数据管理" },
  { key: "/settings", icon: <SettingOutlined />, label: "系统设置" }
];

const routeTitles: Record<string, string> = {
  "/dashboard": "招商驾驶舱",
  "/heat-calculation": "热度计算中心",
  "/industry-region": "产业与区域分析",
  "/entities": "企业项目库",
  "/matching": "智能匹配",
  "/policies-reports": "政策与报告",
  "/workbench": "招商工作台",
  "/data-management": "数据管理",
  "/settings": "系统设置"
};

function SidebarContent(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);
  const setMobileNavOpen = useAppStore((state) => state.setMobileNavOpen);

  return (
    <>
      <div className="brand">
        <div className="brand-mark">商</div>
        <div>
          <div className="brand-title">{productConfig.name}</div>
          <div className="brand-subtitle">Business Heat Intelligence</div>
        </div>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={navItems}
        onClick={({ key }) => {
          navigate(key);
          setMobileNavOpen(false);
        }}
        style={{ background: "transparent", borderInlineEnd: 0, paddingTop: 8 }}
      />
      <div className="side-account">
        <Typography.Text style={{ color: "rgba(255,255,255,.88)" }}>{user?.username ?? "admin"}</Typography.Text>
        <div style={{ fontSize: 12, marginTop: 4 }}>{productConfig.organization}</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>{productConfig.role}</div>
        <div style={{ fontSize: 12, marginTop: 8 }}>数据更新：{productConfig.dataUpdatedAt}</div>
        <Button
          type="link"
          icon={<LogoutOutlined />}
          style={{ padding: 0, color: "rgba(255,255,255,.86)", marginTop: 6 }}
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          退出登录
        </Button>
      </div>
    </>
  );
}

export default function AppLayout(): JSX.Element {
  const screens = Grid.useBreakpoint();
  const location = useLocation();
  const navigate = useNavigate();
  const collapsed = useAppStore((state) => state.collapsed);
  const mobileNavOpen = useAppStore((state) => state.mobileNavOpen);
  const setCollapsed = useAppStore((state) => state.setCollapsed);
  const setMobileNavOpen = useAppStore((state) => state.setMobileNavOpen);
  const logout = useAppStore((state) => state.logout);
  const title = routeTitles[location.pathname] ?? "招商驾驶舱";

  return (
    <Layout className="app-shell">
      {screens.md ? (
        <Sider className="app-sider" width={232} collapsedWidth={80} collapsed={collapsed} trigger={null}>
          <SidebarContent />
        </Sider>
      ) : (
        <Drawer
          placement="left"
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          width={260}
          bodyStyle={{ padding: 0, background: "#0B3A6E" }}
        >
          <SidebarContent />
        </Drawer>
      )}
      <Layout>
        <Header className="app-header">
          <div className="header-left">
            <Button
              type="text"
              icon={screens.md ? (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />) : <MenuOutlined />}
              onClick={() => (screens.md ? setCollapsed(!collapsed) : setMobileNavOpen(true))}
            />
            <div>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {title}
              </Typography.Title>
              <Breadcrumb items={[{ title: "商势智引" }, { title }]} style={{ fontSize: 12 }} />
            </div>
          </div>
          <div className="header-right">
            <Select
              className="desktop-only"
              value="光谷"
              style={{ width: 118 }}
              options={regions.slice(0, 6).map((item) => ({ value: item.name, label: item.name }))}
            />
            <Select
              className="desktop-only"
              value="人工智能"
              style={{ width: 132 }}
              options={industries.map((item) => ({ value: item.name, label: item.name }))}
            />
            <Tag className="desktop-only" color="blue">{productConfig.dataUpdatedAt}</Tag>
            <Input className="desktop-only" prefix={<SearchOutlined />} placeholder="搜索企业、项目、政策" style={{ width: 220 }} />
            <Button icon={<BellOutlined />} />
            <Button icon={<QuestionCircleOutlined />} />
            <Dropdown
              menu={{
                items: [
                  { key: "profile", label: "账户信息" },
                  { key: "logout", icon: <LogoutOutlined />, label: "退出登录" }
                ],
                onClick: ({ key }) => {
                  if (key === "logout") {
                    logout();
                    navigate("/login");
                  }
                }
              }}
            >
              <Space style={{ cursor: "pointer" }}>
                <Avatar size="small" icon={<UserOutlined />} />
              </Space>
            </Dropdown>
          </div>
        </Header>
        <Content className="page-content">
          <Outlet />
        </Content>
      </Layout>
      <AIInvestmentAssistant />
    </Layout>
  );
}
