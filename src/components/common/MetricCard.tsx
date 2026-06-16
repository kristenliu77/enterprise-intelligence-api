import { Card, Space, Statistic, Tooltip, Typography } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { BaseChart } from "../charts/BaseChart";
import type { EChartsOption } from "echarts";

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  tooltip: string;
  trend: number[];
  suffix?: string;
}

export function MetricCard({ title, value, change, tooltip, trend, suffix }: MetricCardProps) {
  const option: EChartsOption = {
    grid: { left: 0, right: 0, top: 6, bottom: 0 },
    xAxis: { type: "category", show: false, data: trend.map((_, index) => index) },
    yAxis: { type: "value", show: false },
    series: [{
      type: "line",
      smooth: true,
      symbol: "none",
      data: trend,
      lineStyle: { color: "#1B5FE0", width: 2 },
      areaStyle: { color: "rgba(27,95,224,0.12)" },
    }],
  };

  return (
    <Card className="metric-card">
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <Space>
          <Typography.Text type="secondary">{title}</Typography.Text>
          <Tooltip title={tooltip}>
            <InfoCircleOutlined />
          </Tooltip>
        </Space>
        <Statistic
          value={value}
          suffix={suffix}
          valueStyle={{ fontWeight: 800 }}
          className="metric-value"
        />
        <Space>
          {change >= 0
            ? <ArrowUpOutlined style={{ color: "#059691" }} />
            : <ArrowDownOutlined style={{ color: "#DC4A3C" }} />}
          <Typography.Text type={change >= 0 ? "success" : "danger"}>
            {Math.abs(change)}%
          </Typography.Text>
          <Typography.Text type="secondary">较上期</Typography.Text>
        </Space>
        <BaseChart option={option} height={48} />
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          更新时间：2026-06-15 09:30
        </Typography.Text>
      </Space>
    </Card>
  );
}
