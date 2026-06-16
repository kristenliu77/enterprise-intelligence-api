import { Button, Card, Col, Divider, Row, Space, Tabs, Tag, Typography, message } from "antd";
import { useMemo, useState } from "react";
import { ChartCard } from "../../components/common/ChartCard";
import { FilterBar } from "../../components/common/FilterBar";
import { MetricCard } from "../../components/common/MetricCard";
import PageHeader from "../../components/common/PageHeader";
import RecommendationCard from "../../components/business/RecommendationCard";
import HeatLevelTag from "../../components/business/HeatLevelTag";
import { HeatTrendChart } from "../../components/charts/HeatTrendChart";
import { OpportunityMatrix } from "../../components/charts/OpportunityMatrix";
import { RegionHeatMap } from "../../components/charts/RegionHeatMap";
import { BaseChart } from "../../components/charts/BaseChart";
import { productConfig } from "../../config";
import { downloadCsv } from "../../services/exportService";
import { heatLevel } from "../../services/heatEngine";
import { enterprises, heatTrends, industries, opportunities, projects, regions } from "../../mock/data";
import type { RankingItem } from "../../types";

function miniTrend(seed: number): number[] {
  return Array.from({ length: 8 }, (_, index) => 56 + seed * 3 + index * 1.8 + ((index + seed) % 3) * 2);
}

function RankingList({ items }: { items: RankingItem[] }): JSX.Element {
  return (
    <div>
      {items.map((item, index) => (
        <div className="ranking-row" key={item.id}>
          <div className={`rank-badge ${index < 3 ? "top" : ""}`}>{index + 1}</div>
          <div>
            <Typography.Text strong>{item.name}</Typography.Text>
            <br />
            <Typography.Text type="secondary">{item.scope}</Typography.Text>
          </div>
          <Typography.Text strong>{item.score}</Typography.Text>
          <HeatLevelTag level={item.level} />
          <Typography.Text type={item.change30d >= 0 ? "success" : "danger"}>
            {item.change30d >= 0 ? "+" : ""}
            {item.change30d}%
          </Typography.Text>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard(): JSX.Element {
  const [region, setRegion] = useState("全部区域");
  const [industry, setIndustry] = useState("全部行业");

  const metrics = useMemo(
    () => [
      { title: "综合商业热度指数", value: 86.4, change: 8.2, tooltip: "多源指标加权后的区域产业综合热度。", trend: miniTrend(1) },
      { title: "高潜力行业数量", value: industries.filter((item) => item.heatScore >= 75).length, change: 4.1, tooltip: "热度高于75分的重点行业数量。", trend: miniTrend(2) },
      { title: "高潜力企业数量", value: enterprises.filter((item) => item.heatScore >= 75).length, change: 12.3, tooltip: "企业热度和政策匹配均较高的招商对象。", trend: miniTrend(3) },
      { title: "新增招商线索", value: 128, change: 6.8, tooltip: "近30天新增且已进入工作台的线索。", trend: miniTrend(4) },
      { title: "政策匹配平均分", value: 82.1, change: -1.6, tooltip: "样本企业与政策标签匹配的平均值。", trend: miniTrend(5) },
      { title: "预计投资规模", value: "468", suffix: "亿元", change: 9.4, tooltip: "演示项目预计投资额汇总。", trend: miniTrend(6) }
    ],
    []
  );

  const rankings = useMemo(() => {
    const industryItems: RankingItem[] = industries.map((item) => ({
      id: item.id,
      name: item.name,
      scope: item.lifecycle,
      score: item.heatScore,
      level: heatLevel(item.heatScore),
      change30d: item.investmentActivity - 70,
      trend: item.heatScore > 78 ? "up" : "stable"
    }));
    const regionItems: RankingItem[] = regions.map((item) => ({
      id: item.id,
      name: item.name,
      scope: item.province,
      score: item.heatScore,
      level: heatLevel(item.heatScore),
      change30d: item.attractionEfficiency - 70,
      trend: item.heatScore > 78 ? "up" : "stable"
    }));
    const enterpriseItems: RankingItem[] = enterprises.slice(0, 10).map((item) => ({
      id: item.id,
      name: item.name,
      scope: `${item.region} / ${item.industry}`,
      score: item.heatScore,
      level: heatLevel(item.heatScore),
      change30d: item.investmentActivity - 70,
      trend: item.heatScore > 76 ? "up" : "stable"
    }));
    const projectItems: RankingItem[] = projects.slice(0, 10).map((item) => ({
      id: item.id,
      name: item.name,
      scope: item.targetRegion,
      score: item.heatScore,
      level: heatLevel(item.heatScore),
      change30d: item.feasibilityScore - 70,
      trend: item.heatScore > 76 ? "up" : "stable"
    }));
    return { industryItems, regionItems, enterpriseItems, projectItems };
  }, []);

  const exportReport = (): void => {
    downloadCsv("dashboard-report.csv", [
      { 指标: "综合商业热度指数", 数值: "86.4" },
      { 指标: "高潜力行业数量", 数值: String(industries.length) }
    ]);
    message.success("驾驶舱报告 CSV 已生成");
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <PageHeader title="招商驾驶舱" description={productConfig.slogan} tags={["演示数据", "多源热度", "招商研判"]} />
      <FilterBar region={region} industry={industry} onRegionChange={setRegion} onIndustryChange={setIndustry} onReset={() => { setRegion("全部区域"); setIndustry("全部行业"); }} onRefresh={() => message.success("已按当前筛选刷新")} onExport={exportReport} />
      <div className="content-grid metric-grid">
        {metrics.map((item) => <MetricCard key={item.title} {...item} />)}
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <ChartCard title="区域商业热力地图" description="本地化招商区域热力示意，可点击查看区域详情。" updatedAt={productConfig.dataUpdatedAt}>
            <RegionHeatMap />
          </ChartCard>
        </Col>
        <Col xs={24} xl={10}>
          <ChartCard title="实时商业热度榜" description="按行业、区域、企业、项目切换。" updatedAt={productConfig.dataUpdatedAt}>
            <Tabs
              items={[
                { key: "industry", label: "热门行业", children: <RankingList items={rankings.industryItems.sort((a, b) => b.score - a.score).slice(0, 8)} /> },
                { key: "region", label: "热门区域", children: <RankingList items={rankings.regionItems.sort((a, b) => b.score - a.score).slice(0, 8)} /> },
                { key: "enterprise", label: "热门企业", children: <RankingList items={rankings.enterpriseItems.sort((a, b) => b.score - a.score).slice(0, 8)} /> },
                { key: "project", label: "热门项目", children: <RankingList items={rankings.projectItems.sort((a, b) => b.score - a.score).slice(0, 8)} /> }
              ]}
            />
          </ChartCard>
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <ChartCard title="热度趋势" description="重点产业近12个月热度变化，支持图例开关和缩放。" updatedAt={productConfig.dataUpdatedAt}>
            <HeatTrendChart />
            <Typography.Text type="secondary">单位：热度指数；数据来源：演示数据集。</Typography.Text>
          </ChartCard>
        </Col>
        <Col xs={24} xl={10}>
          <ChartCard title="产业机会矩阵" description="横轴政策匹配，纵轴市场热度，气泡代表投资规模。" updatedAt={productConfig.dataUpdatedAt}>
            <OpportunityMatrix />
          </ChartCard>
        </Col>
      </Row>
      <Card title="AI 投资机会推荐" extra={<Tag color="blue">基于演示数据生成</Tag>}>
        <div className="content-grid grid-3">
          {opportunities.map((item) => <RecommendationCard key={item.id} opportunity={item} />)}
        </div>
      </Card>
      <Card title="行业热度小结" className="compact-card">
        <BaseChart
          height={220}
          option={{
            tooltip: { trigger: "axis" },
            grid: { left: 36, right: 18, top: 20, bottom: 30 },
            xAxis: { type: "category", data: heatTrends.map((item) => item.name) },
            yAxis: { max: 100 },
            series: [{ type: "bar", data: industries.slice(0, 5).map((item) => item.heatScore), itemStyle: { color: "#1677FF" } }]
          }}
        />
        <Divider />
        <Typography.Text type="secondary">{productConfig.demoNotice}</Typography.Text>
        <Button type="link" onClick={() => message.info("已记录导出行为")}>查看数据口径</Button>
      </Card>
    </Space>
  );
}
