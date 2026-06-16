import { Tag } from "antd";
import type { HeatLevel } from "../../types";

const levelColor: Record<HeatLevel, string> = {
  低热度: "#6B7C93",
  一般热度: "#1B5FE0",
  较高热度: "#059691",
  高热度: "#F07B2C",
  极高热度: "#DC4A3C"
};

export function HeatLevelTag({ level }: { level: HeatLevel }): JSX.Element {
  return <Tag color={levelColor[level]}>{level}</Tag>;
}

export default HeatLevelTag;
