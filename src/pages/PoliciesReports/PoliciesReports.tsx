import { Button, Card, Drawer, Input, Select, Space, Tabs, Tag, Typography, message } from "antd";
import { useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import ReportPreview from "../../components/common/ReportPreview";
import PolicyTable from "../../components/tables/PolicyTable";
import { downloadCsv, printCurrentPage } from "../../services/exportService";
import { industries, policies } from "../../mock/data";
import type { Policy } from "../../types";

export default function PoliciesReports(): JSX.Element {
  const [keyword, setKeyword] = useState("");
  const [industry, setIndustry] = useState("全部行业");
  const [detail, setDetail] = useState<Policy | null>(null);
  const data = useMemo(() => policies.filter((item) =>
    item.name.includes(keyword) && (industry === "全部行业" || item.industries.includes(industry))
  ), [keyword, industry]);

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <PageHeader title="政策与报告" description="管理政策库、匹配企业，并生成适合打印或另存 PDF 的招商分析报告。" tags={["政策高亮", "报告预览", "打印PDF"]} />
      <Tabs
        items={[
          {
            key: "policies",
            label: "政策库",
            children: (
              <Space direction="vertical" style={{ width: "100%" }} size={16}>
                <Card>
                  <Space wrap>
                    <Input.Search placeholder="搜索政策名称" value={keyword} onChange={(event) => setKeyword(event.target.value)} style={{ width: 240 }} />
                    <Select value={industry} onChange={setIndustry} style={{ width: 180 }} options={["全部行业", ...industries.map((item) => item.name)].map((item) => ({ value: item, label: item }))} />
                    <Button onClick={() => { downloadCsv("policies.csv", data); message.success("政策 CSV 已导出"); }}>导出 CSV</Button>
                  </Space>
                </Card>
                <PolicyTable data={data} onView={setDetail} />
              </Space>
            )
          },
          {
            key: "reports",
            label: "报告中心",
            children: (
              <Space direction="vertical" style={{ width: "100%" }} size={16}>
                <Card title="报告模板">
                  <Space wrap>
                    {["行业商业热度分析报告", "区域招商竞争力报告", "企业招商价值评估报告", "项目落地可行性报告", "多区域对比报告"].map((item) => <Tag key={item} color="blue">{item}</Tag>)}
                  </Space>
                </Card>
                <ReportPreview />
                <Space>
                  <Button type="primary" onClick={printCurrentPage}>导出 PDF / 打印</Button>
                  <Button onClick={() => { downloadCsv("report-data.csv", [{ 模块: "核心结论", 说明: "演示数据" }]); message.success("报告数据 CSV 已导出"); }}>导出 CSV</Button>
                </Space>
              </Space>
            )
          }
        ]}
      />
      <Drawer title="政策详情" open={Boolean(detail)} onClose={() => setDetail(null)} width={560}>
        {detail ? (
          <Space direction="vertical">
            <Typography.Title level={4}>{detail.name}</Typography.Title>
            <Tag color={detail.status === "有效" ? "green" : "orange"}>{detail.status}</Tag>
            <Typography.Paragraph>{detail.summary}</Typography.Paragraph>
            <Typography.Paragraph>适用行业关键词：{detail.industries.join("、")}。建议结合企业投资额、研发投入和人才计划判断申报优先级。</Typography.Paragraph>
          </Space>
        ) : null}
      </Drawer>
    </Space>
  );
}
