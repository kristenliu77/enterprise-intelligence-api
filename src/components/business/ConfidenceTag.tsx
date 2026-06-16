import { Tag } from "antd";
import type { ConfidenceLevel } from "../../types";

const confidenceColor: Record<ConfidenceLevel, string> = {
  高可信: "green",
  较可信: "blue",
  一般: "gold",
  数据不足: "red"
};

export function ConfidenceTag({ level }: { level: ConfidenceLevel }): JSX.Element {
  return <Tag color={confidenceColor[level]}>{level}</Tag>;
}

export default ConfidenceTag;
