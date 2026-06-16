import { Button, Card, Form, InputNumber, Select, Space, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import { calculateMatches, type MatchInput, type MatchResultItem } from "../../services/matchingEngine";
import { industries } from "../../mock/data";

export default function Matching(): JSX.Element {
  const [results, setResults] = useState<MatchResultItem[]>([]);
  const [mode, setMode] = useState<MatchInput["mode"]>("regionToEnterprise");

  const columns: ColumnsType<MatchResultItem> = [
    { title: "匹配对象", dataIndex: "name" },
    { title: "匹配得分", dataIndex: "matchScore", sorter: (a, b) => a.matchScore - b.matchScore },
    { title: "商业热度", dataIndex: "heatScore" },
    { title: "政策匹配", dataIndex: "policyMatch" },
    { title: "产业链匹配", dataIndex: "chainMatch" },
    { title: "人才匹配", dataIndex: "talentMatch" },
    { title: "成本匹配", dataIndex: "costMatch" },
    { title: "推荐理由", dataIndex: "reason", width: 260 },
    { title: "操作", render: () => <Button size="small" onClick={() => message.success("已加入招商线索")}>加入线索</Button> }
  ];

  const submit = (values: MatchInput): void => {
    setResults(calculateMatches({ ...values, mode }));
    message.success("匹配完成");
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <PageHeader title="智能匹配" description="支持为区域匹配企业、为企业匹配区域，输出可解释的招商建议。" tags={["排序筛选", "加入线索", "演示算法"]} />
      <Card>
        <Form<MatchInput> layout="inline" onFinish={submit} initialValues={{ targetIndustry: "人工智能", investmentScale: 8000, talentNeed: 80, landNeed: 40, policyPreference: 80, costPreference: 70, riskTolerance: 60, mode }}>
          <Form.Item label="匹配方式">
            <Select value={mode} onChange={setMode} style={{ width: 160 }} options={[
              { value: "regionToEnterprise", label: "为区域匹配企业" },
              { value: "enterpriseToRegion", label: "为企业匹配区域" }
            ]} />
          </Form.Item>
          <Form.Item name="targetIndustry" label="目标产业">
            <Select style={{ width: 160 }} options={industries.map((item) => ({ value: item.name, label: item.name }))} />
          </Form.Item>
          <Form.Item name="investmentScale" label="投资规模">
            <InputNumber min={1000} addonAfter="万元" />
          </Form.Item>
          <Form.Item name="talentNeed" label="人才需求">
            <InputNumber min={0} max={100} />
          </Form.Item>
          <Form.Item name="landNeed" label="用地需求">
            <InputNumber min={0} max={300} addonAfter="亩" />
          </Form.Item>
          <Form.Item name="policyPreference" label="政策偏好">
            <InputNumber min={0} max={100} />
          </Form.Item>
          <Form.Item name="costPreference" label="成本偏好">
            <InputNumber min={0} max={100} />
          </Form.Item>
          <Form.Item name="riskTolerance" label="风险承受">
            <InputNumber min={0} max={100} />
          </Form.Item>
          <Button type="primary" htmlType="submit">开始匹配</Button>
        </Form>
      </Card>
      <Card title="匹配结果" extra={<Tag color="blue">可排序、可加入招商线索</Tag>}>
        {results.length === 0 ? <Typography.Text type="secondary">请先输入条件并开始匹配。</Typography.Text> : <Table rowKey="id" columns={columns} dataSource={results} scroll={{ x: 1180 }} />}
      </Card>
    </Space>
  );
}
