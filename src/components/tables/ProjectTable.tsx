import { EyeOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Space, Table, Tag, Tooltip, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { InvestmentProject } from "../../types";
import HeatScore from "../business/HeatScore";

interface ProjectTableProps {
  data: InvestmentProject[];
  onView: (project: InvestmentProject) => void;
}

export default function ProjectTable({ data, onView }: ProjectTableProps): JSX.Element {
  const columns: ColumnsType<InvestmentProject> = [
    { title: "项目名称", dataIndex: "name", fixed: "left", width: 230 },
    { title: "所属行业", dataIndex: "industry" },
    { title: "意向区域", dataIndex: "targetRegion" },
    { title: "预计投资额(万元)", dataIndex: "expectedInvestment", sorter: (a, b) => a.expectedInvestment - b.expectedInvestment },
    { title: "预计用地(亩)", dataIndex: "landRequirement", sorter: (a, b) => a.landRequirement - b.landRequirement },
    { title: "项目阶段", dataIndex: "stage", render: (value: string) => <Tag color="blue">{value}</Tag> },
    { title: "热度指数", dataIndex: "heatScore", sorter: (a, b) => a.heatScore - b.heatScore, render: (value: number) => <HeatScore value={value} compact /> },
    { title: "落地可行性", dataIndex: "feasibilityScore", sorter: (a, b) => a.feasibilityScore - b.feasibilityScore },
    { title: "负责人", dataIndex: "owner" },
    { title: "更新时间", dataIndex: "updatedAt" },
    {
      title: "操作",
      fixed: "right",
      width: 112,
      render: (_, record) => (
        <Space>
          <Tooltip title="查看详情">
            <Button icon={<EyeOutlined />} onClick={() => onView(record)} />
          </Tooltip>
          <Tooltip title="加入对比">
            <Button icon={<PlusOutlined />} onClick={() => message.success(`${record.name} 已加入对比`)} />
          </Tooltip>
        </Space>
      )
    }
  ];

  return <Table rowKey="id" columns={columns} dataSource={data} scroll={{ x: 1180 }} rowSelection={{}} pagination={{ pageSize: 8, showSizeChanger: true }} />;
}
