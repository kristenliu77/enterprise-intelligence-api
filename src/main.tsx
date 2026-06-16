import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import "./styles/theme.css";
import App from "./App";

dayjs.locale("zh-cn");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: "#1B5FE0",
          colorSuccess: "#059691",
          colorWarning: "#F07B2C",
          colorError: "#DC4A3C",
          colorInfo: "#1B5FE0",
          borderRadius: 8,
          borderRadiusLG: 10,
          fontFamily:
            '"Source Han Sans SC","Noto Sans SC","Microsoft YaHei","PingFang SC",sans-serif',
          colorBgContainer: "#FFFFFF",
          colorBgLayout: "#F8F9FB",
          colorText: "#1E293B",
          colorTextSecondary: "#64748B",
          colorBorder: "#E8ECF1",
          colorBorderSecondary: "#E8ECF1",
        },
        components: {
          Layout: {
            headerBg: "rgba(255,255,255,0.82)",
            siderBg: "#0F2645",
            triggerBg: "#0F2645",
          },
          Menu: {
            darkItemBg: "transparent",
            darkItemSelectedBg: "rgba(27,95,224,0.22)",
            darkItemSelectedColor: "#FFFFFF",
            darkItemHoverBg: "rgba(255,255,255,0.06)",
          },
          Card: {
            borderRadiusLG: 12,
          },
          Button: {
            borderRadius: 8,
            controlHeight: 36,
          },
          Tag: {
            borderRadiusSM: 6,
          },
          Progress: {
            defaultColor: "#1B5FE0",
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
