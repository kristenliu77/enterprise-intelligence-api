import { Card, Space, Tooltip, Typography } from "antd";
import { InfoCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  description?: string;
  updatedAt?: string;
  children: ReactNode;
  extra?: ReactNode;
}

export function ChartCard({ title, description, updatedAt, children, extra }: ChartCardProps) {
  return (
    <Card
      className="chart-card"
      title={
        <Space size={8}>
          <span>{title}</span>
          {description ? (
            <Tooltip title={description}>
              <InfoCircleOutlined />
            </Tooltip>
          ) : null}
        </Space>
      }
      extra={extra ?? <ReloadOutlined />}
    >
      {children}
      {updatedAt ? (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          更新时间：{updatedAt}
        </Typography.Text>
      ) : null}
    </Card>
  );
}
