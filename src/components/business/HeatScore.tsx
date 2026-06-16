import { Space, Typography } from "antd";
import { heatLevel } from "../../services/heatEngine";
import { HeatLevelTag } from "./HeatLevelTag";

interface HeatScoreProps {
  score?: number;
  value?: number;
  compact?: boolean;
}

/** Map a 0–100 score to a position on the heat gradient. */
function heatColor(score: number): string {
  if (score >= 90) return "#DC4A3C";
  if (score >= 75) return "#F07B2C";
  if (score >= 60) return "#059691";
  if (score >= 40) return "#1B5FE0";
  return "#6B7C93";
}

export function HeatScore({ score, value, compact = false }: HeatScoreProps): JSX.Element {
  const current = value ?? score ?? 0;

  if (compact) {
    return (
      <Space size={6}>
        <Typography.Text strong style={{ fontVariantNumeric: "tabular-nums" }}>
          {current.toFixed(1)}
        </Typography.Text>
        <HeatLevelTag level={heatLevel(current)} />
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={8} style={{ width: "100%" }}>
      <Space align="baseline">
        <Typography.Title level={2} style={{ margin: 0, fontVariantNumeric: "tabular-nums" }}>
          {current.toFixed(2)}
        </Typography.Title>
        <HeatLevelTag level={heatLevel(current)} />
      </Space>
      {/* ── Signature heat ladder ── */}
      <div className="heat-ladder">
        <div
          className="heat-ladder-bar"
          style={{
            width: `${Math.min(100, current)}%`,
            backgroundColor: heatColor(current),
          }}
        />
      </div>
    </Space>
  );
}

export default HeatScore;
