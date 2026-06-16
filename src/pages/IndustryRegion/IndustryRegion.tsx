import { Card, Col, Descriptions, Progress, Row, Select, Space, Tabs, Tag, Typography } from "antd";
import { useState } from "react";
import { ChartCard } from "../../components/common/ChartCard";
import PageHeader from "../../components/common/PageHeader";
import { BaseChart } from "../../components/charts/BaseChart";
import { RadarComparison } from "../../components/charts/RadarComparison";
import { enterprises, industries, regions } from "../../mock/data";

export default function IndustryRegion(): JSX.Element {
  const [industryId, setIndustryId] = useState("ai");
  const [regionIds, setRegionIds] = useState<string[]>(["r1", "r2", "r3", "r4"]);
  const industry = industries.find((item) => item.id === industryId) ?? industries[0];
  const selectedRegions = regions.filter((item) => regionIds.includes(item.id));
  const chainNodes = ["上游资源", "核心制造", "技术服务", "应用场景", "下游市场"];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <PageHeader title="产业与区域分析" description="对产业生命周期、产业链完整度与区域招商竞争力进行联动研判。" tags={["产业图谱", "区域比较", "演示数据"]} />
      <Tabs
        items={[
          {
            key: "industry",
            label: "产业分析",
            children: (
              <Space direction="vertical" style={{ width: "100%" }} size={16}>
                <Select value={industryId} onChange={setIndustryId} style={{ width: 220 }} options={industries.map((item) => ({ value: item.id, label: item.name }))} />
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={8}>
                    <Card title={`${industry.name}综合画像`}>
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="综合热度">{industry.heatScore}</Descriptions.Item>
                        <Descriptions.Item label="生命周期">{industry.lifecycle}</Descriptions.Item>
                        <Descriptions.Item label="市场规模">{industry.marketSize} 亿元</Descriptions.Item>
                        <Descriptions.Item label="企业数量">{industry.enterpriseCount}</Descriptions.Item>
                        <Descriptions.Item label="主要风险">{industry.risk}</Descriptions.Item>
                      </Descriptions>
                      <Progress percent={industry.chainCompleteness} strokeColor="#0E8A78" />
                      <Typography.Text type="secondary">产业链完整度</Typography.Text>
                    </Card>
                  </Col>
                  <Col xs={24} lg={16}>
                    <ChartCard title="上下游产业链图谱" description="点击节点可查看招商缺口和代表企业。">
                      <BaseChart
                        height={340}
                        option={{
                          tooltip: {},
                          series: [{
                            type: "graph",
                            layout: "none",
                            symbolSize: 62,
                            roam: false,
                            label: { show: true },
                            data: chainNodes.map((name, index) => ({ name, x: index * 170, y: index % 2 === 0 ? 110 : 190, value: 70 + index * 4 })),
                            links: chainNodes.slice(1).map((name, index) => ({ source: chainNodes[index], target: name })),
                            lineStyle: { color: "#1677FF", width: 2 }
                          }]
                        }}
                      />
                    </ChartCard>
                  </Col>
                </Row>
                <Card title="重点企业与招商缺口">
                  <Space wrap>
                    {enterprises.filter((item) => item.industry === industry.name).slice(0, 8).map((item) => <Tag key={item.id} color="blue">{item.name}</Tag>)}
                    <Tag color="orange">招商缺口：关键传感器</Tag>
                    <Tag color="orange">招商缺口：系统集成服务</Tag>
                  </Space>
                </Card>
              </Space>
            )
          },
          {
            key: "region",
            label: "区域分析",
            children: (
              <Space direction="vertical" style={{ width: "100%" }} size={16}>
                <Select
                  mode="multiple"
                  maxCount={4}
                  value={regionIds}
                  onChange={setRegionIds}
                  style={{ width: "100%" }}
                  options={regions.map((item) => ({ value: item.id, label: item.name }))}
                />
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={13}>
                    <ChartCard title="区域竞争力雷达图">
                      <RadarComparison regions={selectedRegions} />
                    </ChartCard>
                  </Col>
                  <Col xs={24} lg={11}>
                    <ChartCard title="区域综合排名">
                      <BaseChart
                        height={360}
                        option={{
                          tooltip: { trigger: "axis" },
                          grid: { left: 86, right: 24, top: 18, bottom: 30 },
                          xAxis: { max: 100 },
                          yAxis: { type: "category", data: selectedRegions.map((item) => item.name), inverse: true },
                          series: [{ type: "bar", data: selectedRegions.map((item) => item.heatScore), itemStyle: { color: "#1677FF" } }]
                        }}
                      />
                    </ChartCard>
                  </Col>
                </Row>
                <Card title="区域招商建议">
                  {selectedRegions.map((item) => (
                    <Typography.Paragraph key={item.id}>
                      <Typography.Text strong>{item.name}：</Typography.Text>
                      优势为{item.keyIndustries.join("、")}，建议围绕政策环境 {item.policyEnvironment} 分、产业配套 {item.industrialSupport} 分进行专项招商。
                    </Typography.Paragraph>
                  ))}
                </Card>
              </Space>
            )
          }
        ]}
      />
    </Space>
  );
}
