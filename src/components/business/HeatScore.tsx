import { Progress, Space, Typography } from "antd";
import { heatLevel } from "../../services/heatEngine";
import { HeatLevelTag } from "./HeatLevelTag";

interface HeatScoreProps {
  score?: number;
  value?: number;
  compact?: boolean;
}

export function HeatScore({ score, value, compact = false }: HeatScoreProps): JSX.Element {
  const current = value ?? score ?? 0;
  if (compact) {
    return (
      <Space size={6}>
        <Typography.Text strong>{current.toFixed(1)}</Typography.Text>
        <HeatLevelTag level={heatLevel(current)} />
      </Space>
    );
  }
  return (
    <Space direction="vertical" size={6} style={{ width: "100%" }}>
      <Space align="baseline">
        <Typography.Title level={2} style={{ margin: 0 }}>
          {current.toFixed(2)}
        </Typography.Title>
        <HeatLevelTag level={heatLevel(current)} />
      </Space>
      <Progress percent={Math.round(current)} showInfo={false} strokeColor={current >= 90 ? "#E5573F" : "#1677FF"} />
    </Space>
  );
}

export default HeatScore;
