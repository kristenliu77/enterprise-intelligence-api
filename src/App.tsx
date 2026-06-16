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
          colorPrimary: "#1B5FE0",
          colorSuccess: "#059691",
          colorWarning: "#F07B2C",
          colorError: "#DC4A3C",
          colorInfo: "#1B5FE0",
          colorBgLayout: isNight ? "#0B1420" : "#F8F9FB",
          colorBgContainer: isNight ? "#131E30" : "#FFFFFF",
          colorText: isNight ? "#E2E8F0" : "#1E293B",
          colorTextSecondary: isNight ? "#8899B4" : "#64748B",
          colorBorder: isNight ? "#1E304A" : "#E8ECF1",
          borderRadius: 8,
          borderRadiusLG: 10,
          fontFamily:
            '"Source Han Sans SC","Noto Sans SC","Microsoft YaHei","PingFang SC",sans-serif',
        },
        components: {
          Layout: {
            headerBg: isNight ? "rgba(19,30,48,0.86)" : "rgba(255,255,255,0.82)",
            siderBg: "#0F2645",
            triggerBg: "#0F2645",
            bodyBg: isNight ? "#0B1420" : "#F8F9FB",
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
          Table: {
            headerBg: isNight ? "#162238" : "#FAFAFA",
          },
        },
      }}
    >
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </ConfigProvider>
  );
}
