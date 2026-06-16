import { Button, Card, Progress, Space, Tag, Typography, message } from "antd";
import type { Opportunity } from "../../types";
import HeatLevelTag from "./HeatLevelTag";
import { heatLevel } from "../../services/heatEngine";

interface RecommendationCardProps {
  opportunity: Opportunity;
}

export default function RecommendationCard({ opportunity }: RecommendationCardProps): JSX.Element {
  return (
    <Card className="opportunity-card compact-card" title={opportunity.title} extra={<HeatLevelTag level={heatLevel(opportunity.heat)} />}>
      <Space wrap style={{ marginBottom: 10 }}>
        <Tag color="blue">{opportunity.region}</Tag>
        <Tag color="green">{opportunity.industry}</Tag>
        <Tag>基于演示数据生成</Tag>
      </Space>
      <Typography.Paragraph>{opportunity.reason}</Typography.Paragraph>
      <Typography.Text type="secondary">风险提示：{opportunity.risk}</Typography.Text>
      <div style={{ marginTop: 14 }}>
        <Typography.Text>综合热度</Typography.Text>
        <Progress percent={opportunity.heat} strokeColor="#F59E0B" />
        <Typography.Text>政策匹配度</Typography.Text>
        <Progress percent={opportunity.policyMatch} strokeColor="#0E8A78" />
        <Typography.Text>投资活跃度</Typography.Text>
        <Progress percent={opportunity.investmentActivity} strokeColor="#1677FF" />
      </div>
      <Space style={{ marginTop: 12 }}>
        <Button type="primary" onClick={() => message.success("已打开分析视角")}>查看分析</Button>
        <Button onClick={() => message.success("已加入招商线索")}>加入招商线索</Button>
      </Space>
    </Card>
  );
}
