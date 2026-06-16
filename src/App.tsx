import { useEffect } from "react";
import { ConfigProvider, theme } from "antd";
import zhCN from "antd/locale/zh_CN";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./router";
import { useAppStore } from "./store/appStore";
import "./styles/app.css";

export default function App(): JSX.Element {
  const themeMode = useAppStore((state) => state.themeMode);
  const isNight = themeMode === "night";

  useEffect(() => {
    document.body.classList.toggle("theme-night", isNight);
  }, [isNight]);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isNight ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#1677FF",
          colorSuccess: "#0E8A78",
          colorWarning: "#F59E0B",
          colorError: "#D64545",
          colorBgLayout: isNight ? "#08111F" : "#F3F6FA",
          colorBgContainer: isNight ? "#111C2E" : "#FFFFFF",
          colorText: isNight ? "#E6EDF7" : "#1F2937",
          colorTextSecondary: isNight ? "#9AA7BA" : "#667085",
          colorBorder: isNight ? "#26364D" : "#E4EAF1",
          borderRadius: 8,
          fontFamily:
            '"Source Han Sans SC","Noto Sans SC","Microsoft YaHei","PingFang SC",sans-serif'
        },
        components: {
          Layout: {
            headerBg: isNight ? "#0D1828" : "#ffffff",
            siderBg: "#0B3A6E",
            bodyBg: isNight ? "#08111F" : "#F3F6FA"
          },
          Card: {
            borderRadiusLG: 10,
            colorBgContainer: isNight ? "#111C2E" : "#FFFFFF"
          },
          Table: {
            headerBg: isNight ? "#16243A" : "#FAFAFA"
          }
        }
      }}
    >
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </ConfigProvider>
  );
}
