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
          colorPrimary: "#1677FF",
          colorSuccess: "#0E8A78",
          colorWarning: "#F59E0B",
          colorError: "#D64545",
          borderRadius: 8,
          fontFamily:
            '"Source Han Sans SC","Noto Sans SC","Microsoft YaHei","PingFang SC",sans-serif'
        },
        components: {
          Layout: {
            headerBg: "#ffffff",
            siderBg: "#0B3A6E"
          },
          Card: {
            borderRadiusLG: 10
          }
        }
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
