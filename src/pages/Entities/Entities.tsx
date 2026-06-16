import { Button, Card, Drawer, Input, Select, Space, Statistic, Tabs, Tag, Typography, message } from "antd";
import { useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import EnterpriseTable from "../../components/tables/EnterpriseTable";
import ProjectTable from "../../components/tables/ProjectTable";
import { downloadCsv } from "../../services/exportService";
import { enterprises, industries, projects, regions } from "../../mock/data";
import type { Enterprise, InvestmentProject } from "../../types";

type DetailItem = Enterprise | InvestmentProject | null;

export default function Entities(): JSX.Element {
  const [keyword, setKeyword] = useState("");
  const [industry, setIndustry] = useState("全部行业");
  const [region, setRegion] = useState("全部区域");
  const [detail, setDetail] = useState<DetailItem>(null);

  const enterpriseData = useMemo(() => enterprises.filter((item) =>
    item.name.includes(keyword) &&
    (industry === "全部行业" || item.industry === industry) &&
    (region === "全部区域" || item.region === region)
  ), [keyword, industry, region]);

  const projectData = useMemo(() => projects.filter((item) =>
    item.name.includes(keyword) &&
    (industry === "全部行业" || item.industry === industry) &&
    (region === "全部区域" || item.targetRegion === region)
  ), [keyword, industry, region]);

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <PageHeader title="企业项目库" description="统一管理企业、招商项目和重点关注对象，支持搜索、筛选、分页、导出与详情查看。" tags={["企业库", "项目库", "CSV导出"]} />
      <div className="content-grid grid-4">
        <Card><Statistic title="企业总数" value={enterprises.length} /></Card>
        <Card><Statistic title="项目总数" value={projects.length} /></Card>
        <Card><Statistic title="高热企业" value={enterprises.filter((item) => item.heatScore >= 75).length} /></Card>
        <Card><Statistic title="预计投资额" value={Math.round(projects.reduce((sum, item) => sum + item.expectedInvestment, 0) / 10000)} suffix="亿元" /></Card>
      </div>
      <Card>
        <Space wrap>
          <Input.Search placeholder="搜索企业或项目" allowClear value={keyword} onChange={(event) => setKeyword(event.target.value)} style={{ width: 240 }} />
          <Select value={industry} onChange={setIndustry} style={{ width: 160 }} options={["全部行业", ...industries.map((item) => item.name)].map((item) => ({ value: item, label: item }))} />
          <Select value={region} onChange={setRegion} style={{ width: 160 }} options={["全部区域", ...regions.map((item) => item.name)].map((item) => ({ value: item, label: item }))} />
          <Button onClick={() => { setKeyword(""); setIndustry("全部行业"); setRegion("全部区域"); }}>重置</Button>
          <Button type="primary" onClick={() => { downloadCsv("entities.csv", enterpriseData); message.success("CSV 已导出"); }}>导出 CSV</Button>
          <Button onClick={() => message.success("列显示设置已保存")}>列显示设置</Button>
        </Space>
      </Card>
      <Tabs
        items={[
          { key: "enterprise", label: "企业库", children: <EnterpriseTable data={enterpriseData} onView={setDetail} /> },
          { key: "project", label: "招商项目库", children: <ProjectTable data={projectData} onView={setDetail} /> }
        ]}
      />
      <Drawer title="详情分析" open={Boolean(detail)} onClose={() => setDetail(null)} width={560}>
        {detail ? (
          <Space direction="vertical" style={{ width: "100%" }} size={12}>
            <Typography.Title level={4}>{detail.name}</Typography.Title>
            <Tag color="blue">热度分析</Tag>
            <Typography.Paragraph>基础信息、融资与投资记录、舆情趋势、政策匹配、区域推荐、风险提示和跟进记录均基于演示数据生成。</Typography.Paragraph>
            <Card title="推荐招商动作">
              <Typography.Paragraph>建议安排产业专员跟进，补充项目投资强度、用地需求和核心团队情况。</Typography.Paragraph>
              <Button type="primary" onClick={() => message.success("已添加招商线索")}>添加招商线索</Button>
            </Card>
          </Space>
        ) : null}
      </Drawer>
    </Space>
  );
}
