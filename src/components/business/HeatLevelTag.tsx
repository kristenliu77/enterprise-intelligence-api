import { Tag } from "antd";
import type { HeatLevel } from "../../types";

const levelColor: Record<HeatLevel, string> = {
  低热度: "#6B7C93",
  一般热度: "#1677FF",
  较高热度: "#0E8A78",
  高热度: "#F59E0B",
  极高热度: "#E5573F"
};

export function HeatLevelTag({ level }: { level: HeatLevel }): JSX.Element {
  return <Tag color={levelColor[level]}>{level}</Tag>;
}

export default HeatLevelTag;
