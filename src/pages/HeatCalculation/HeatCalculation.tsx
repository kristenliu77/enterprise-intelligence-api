import { Button, Card, Col, Descriptions, Divider, Form, Input, Progress, Row, Select, Space, Tabs, Tag, Typography, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { ChartCard } from "../../components/common/ChartCard";
import PageHeader from "../../components/common/PageHeader";
import CalculationProcess from "../../components/business/CalculationProcess";
import ConfidenceTag from "../../components/business/ConfidenceTag";
import HeatLevelTag from "../../components/business/HeatLevelTag";
import HeatScore from "../../components/business/HeatScore";
import WeightEditor from "../../components/business/WeightEditor";
import { BaseChart } from "../../components/charts/BaseChart";
import { RadarComparison } from "../../components/charts/RadarComparison";
import { productConfig } from "../../config";
import { heatTrends, industries, regions } from "../../mock/data";
import { calculateHeatResult, simulateForecast, validateWeights, weightSchemes } from "../../services/heatEngine";
import type { EntityType, HeatResult, HeatWeights, Industry } from "../../types";

const dimensionLabels: Record<keyof HeatResult["dimensions"], string> = {
  searchScore: "搜索与关注热度",
  mediaScore: "讨论与传播热度",
  investmentScore: "投资与商业信号",
  policyScore: "政策与环境匹配",
  foundationScore: "产业基础条件",
  riskScore: "综合风险"
};

function advice(result: HeatResult): string[] {
  const items = [
    result.finalHeat >= 75 ? "建议纳入近期重点招商清单，优先安排专班跟进。" : "建议作为观察对象，先补充政策和企业尽调信息。",
    result.dimensions.policyScore >= 75 ? "可优先匹配研发、固投和人才类政策组合。" : "政策匹配仍需补充项目投资强度和落地需求。",
    result.dimensions.riskScore >= 45 ? "需重点关注市场波动、产业过热和数据不确定性。" : "当前风险水平可控，可进入下一轮项目筛选。"
  ];
  if (result.trend === "up") items.push("近30天趋势向上，建议跟进周期控制在两周以内。");
  return items;
}

export default function HeatCalculation(): JSX.Element {
  const [mode, setMode] = useState("single");
  const [entityType, setEntityType] = useState<EntityType>("industry");
  const [selectedIndustryId, setSelectedIndustryId] = useState("ai");
  const [schemeName, setSchemeName] = useState("综合招商方案");
  const [weights, setWeights] = useState<HeatWeights>(weightSchemes.综合招商方案);
  const [result, setResult] = useState<HeatResult>(() => {
    const industry = industries[0];
    return calculateHeatResult(industry.id, industry.name, "industry", industry.heatMetrics, weights);
  });
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [compareIds, setCompareIds] = useState<string[]>(["ai", "nev", "bio"]);

  const selectedIndustry = useMemo<Industry>(() => industries.find((item) => item.id === selectedIndustryId) ?? industries[0], [selectedIndustryId]);

  const runCalculation = (): void => {
    if (!validateWeights(weights)) {
      message.warning("权重合计必须等于100%");
      return;
    }
    setRunning(true);
    setCurrentStep(0);
    const timer = window.setInterval(() => {
      setCurrentStep((step) => {
        if (step >= 7) {
          window.clearInterval(timer);
          setRunning(false);
          setResult(calculateHeatResult(selectedIndustry.id, selectedIndustry.name, entityType, selectedIndustry.heatMetrics, weights));
          message.success("热度测算完成");
          return 8;
        }
        return step + 1;
      });
    }, 220);
  };

  useEffect(() => {
    setResult(calculateHeatResult(selectedIndustry.id, selectedIndustry.name, entityType, selectedIndustry.heatMetrics, weights));
  }, [entityType, selectedIndustry, weights]);

  const compareResults = compareIds
    .map((id) => industries.find((item) => item.id === id))
    .filter((item): item is Industry => Boolean(item))
    .map((item) => calculateHeatResult(item.id, item.name, "industry", item.heatMetrics, weights));

  const trend = heatTrends.find((item) => item.name === selectedIndustry.name) ?? heatTrends[0];
  const forecast = simulateForecast(trend.values, 6);

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <PageHeader title="热度计算中心" description="基于统一算法对行业、区域、企业和项目进行可解释热度测算。" tags={["真实前端算法", "权重可切换", "演示数据"]} />
      <Tabs activeKey={mode} onChange={setMode} items={[{ key: "single", label: "单项查询" }, { key: "batch", label: "批量对比" }, { key: "history", label: "历史测算记录" }]} />

      {mode === "single" ? (
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={8}>
            <Card title="查询条件">
              <Form layout="vertical">
                <Form.Item label="分析对象类型">
                  <Select<EntityType> value={entityType} onChange={setEntityType} options={[
                    { value: "industry", label: "行业" },
                    { value: "region", label: "区域" },
                    { value: "enterprise", label: "企业" },
                    { value: "project", label: "项目" }
                  ]} />
                </Form.Item>
                <Form.Item label="对象名称">
                  <Select value={selectedIndustryId} onChange={setSelectedIndustryId} options={industries.map((item) => ({ value: item.id, label: item.name }))} />
                </Form.Item>
                <Form.Item label="所属区域">
                  <Select defaultValue="光谷" options={regions.slice(0, 6).map((item) => ({ value: item.name, label: item.name }))} />
                </Form.Item>
                <Form.Item label="统计时间范围">
                  <Select defaultValue="近12个月" options={["近30天", "近6个月", "近12个月"].map((item) => ({ value: item, label: item }))} />
                </Form.Item>
                <Form.Item label="数据来源">
                  <Input value="搜索趋势、媒体传播、投融资、政策、产业基础" readOnly />
                </Form.Item>
                <Divider />
                <WeightEditor
                  value={weights}
                  schemeName={schemeName}
                  onSchemeChange={(name, nextWeights) => {
                    setSchemeName(name);
                    setWeights(nextWeights);
                  }}
                  onChange={(nextWeights) => {
                    setSchemeName("自定义权重");
                    setWeights(nextWeights);
                  }}
                />
                <Space wrap>
                  <Button type="primary" loading={running} onClick={runCalculation}>开始测算</Button>
                  <Button onClick={() => setSelectedIndustryId("ai")}>重置</Button>
                  <Button onClick={() => message.success("方案已保存")}>保存方案</Button>
                  <Button onClick={() => message.info("已打开计算口径说明")}>查看计算口径</Button>
                </Space>
              </Form>
            </Card>
          </Col>
          <Col xs={24} xl={16}>
            <div className="heat-process">
              <Card title="计算过程">
                <CalculationProcess current={currentStep} running={running} />
              </Card>
              <Card title="测算结果">
                <Space direction="vertical" size={14} style={{ width: "100%" }}>
                  <Space align="center" wrap>
                    <HeatScore value={result.finalHeat} />
                    <HeatLevelTag level={result.heatLevel} />
                    <ConfidenceTag level={result.confidenceLevel} />
                    <Tag color={result.trend === "up" ? "green" : result.trend === "down" ? "red" : "blue"}>趋势：{result.trend === "up" ? "上升" : result.trend === "down" ? "下降" : "平稳"}</Tag>
                  </Space>
                  <Descriptions size="small" column={2}>
                    <Descriptions.Item label="基础热度">{result.baseHeat}</Descriptions.Item>
                    <Descriptions.Item label="风险因子">{result.riskFactor}</Descriptions.Item>
                    <Descriptions.Item label="质量因子">{result.qualityFactor}</Descriptions.Item>
                    <Descriptions.Item label="趋势因子">{result.trendFactor}</Descriptions.Item>
                    <Descriptions.Item label="数据可信度">{result.confidence}</Descriptions.Item>
                    <Descriptions.Item label="更新时间">{result.calculatedAt}</Descriptions.Item>
                  </Descriptions>
                  <Typography.Text type="secondary">{productConfig.demoNotice}</Typography.Text>
                </Space>
              </Card>
            </div>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col xs={24} lg={12}>
                <ChartCard title="分项指标雷达图" updatedAt={result.calculatedAt}>
                  <BaseChart
                    height={310}
                    option={{
                      tooltip: {},
                      radar: { indicator: Object.values(dimensionLabels).map((name) => ({ name, max: 100 })) },
                      series: [{ type: "radar", data: [{ name: result.entityName, value: Object.values(result.dimensions) }] }]
                    }}
                  />
                </ChartCard>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="分项指标解释">
                  {Object.entries(result.dimensions).map(([key, value]) => (
                    <div key={key} style={{ marginBottom: 10 }}>
                      <Space style={{ width: "100%", justifyContent: "space-between" }}>
                        <Typography.Text>{dimensionLabels[key as keyof HeatResult["dimensions"]]}</Typography.Text>
                        <Typography.Text strong>{value}</Typography.Text>
                      </Space>
                      <Progress percent={value} strokeColor={key === "riskScore" ? "#D64545" : "#1677FF"} />
                    </div>
                  ))}
                </Card>
              </Col>
              <Col xs={24} lg={14}>
                <ChartCard title="热度趋势预测" description="未来6个月为确定性趋势模拟，预留真实预测接口。">
                  <BaseChart
                    height={320}
                    option={{
                      tooltip: { trigger: "axis" },
                      legend: { top: 0 },
                      grid: { top: 42, left: 42, right: 24, bottom: 34 },
                      xAxis: { type: "category", data: [...trend.values.map((_, index) => `M-${11 - index}`), ...forecast.forecast.map((_, index) => `预测${index + 1}`)] },
                      yAxis: { max: 100 },
                      series: [
                        { name: "历史实际值", type: "line", smooth: true, data: [...forecast.actual, ...Array(forecast.forecast.length).fill(null)] },
                        { name: "预测值", type: "line", smooth: true, lineStyle: { type: "dashed" }, data: [...Array(forecast.actual.length).fill(null), ...forecast.forecast] }
                      ]
                    }}
                  />
                </ChartCard>
              </Col>
              <Col xs={24} lg={10}>
                <Card title="招商建议">
                  {advice(result).map((item) => (
                    <Typography.Paragraph key={item}>· {item}</Typography.Paragraph>
                  ))}
                  <Tag color="blue">推荐招商优先级：{result.finalHeat >= 80 ? "A" : result.finalHeat >= 65 ? "B" : "C"}</Tag>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      ) : null}

      {mode === "batch" ? (
        <Card title="批量对比">
          <Space direction="vertical" style={{ width: "100%" }} size={16}>
            <Select
              mode="multiple"
              maxCount={5}
              value={compareIds}
              onChange={setCompareIds}
              style={{ width: "100%" }}
              options={industries.map((item) => ({ value: item.id, label: item.name }))}
            />
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <BaseChart
                  height={330}
                  option={{
                    tooltip: { trigger: "axis" },
                    xAxis: { type: "category", data: compareResults.map((item) => item.entityName) },
                    yAxis: { max: 100 },
                    series: [{ type: "bar", data: compareResults.map((item) => item.finalHeat), itemStyle: { color: "#0E8A78" } }]
                  }}
                />
              </Col>
              <Col xs={24} lg={12}>
                <RadarComparison regions={regions.slice(0, 4)} />
              </Col>
            </Row>
            <Typography.Text type="secondary">
              推荐排序：{compareResults.sort((a, b) => b.finalHeat - a.finalHeat).map((item) => `${item.entityName}(${item.finalHeat})`).join(" > ")}
            </Typography.Text>
          </Space>
        </Card>
      ) : null}

      {mode === "history" ? (
        <Card title="历史测算记录">
          {industries.slice(0, 6).map((item) => (
            <Descriptions key={item.id} bordered size="small" column={4} style={{ marginBottom: 12 }}>
              <Descriptions.Item label="对象">{item.name}</Descriptions.Item>
              <Descriptions.Item label="方案">{schemeName}</Descriptions.Item>
              <Descriptions.Item label="热度">{calculateHeatResult(item.id, item.name, "industry", item.heatMetrics, weights).finalHeat}</Descriptions.Item>
              <Descriptions.Item label="时间">2026-06-15 09:30</Descriptions.Item>
            </Descriptions>
          ))}
        </Card>
      ) : null}
    </Space>
  );
}
