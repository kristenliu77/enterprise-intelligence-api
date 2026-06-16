import { EyeOutlined, PlusOutlined, StarFilled, StarOutlined } from "@ant-design/icons";
import { Button, Space, Table, Tag, Tooltip, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Enterprise } from "../../types";
import HeatScore from "../business/HeatScore";
import { useAppStore } from "../../store/appStore";

interface EnterpriseTableProps {
  data: Enterprise[];
  onView: (enterprise: Enterprise) => void;
}

export default function EnterpriseTable({ data, onView }: EnterpriseTableProps): JSX.Element {
  const favorites = useAppStore((state) => state.favorites);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);

  const columns: ColumnsType<Enterprise> = [
    { title: "企业名称", dataIndex: "name", fixed: "left", width: 180 },
    { title: "所属行业", dataIndex: "industry", filters: Array.from(new Set(data.map((item) => item.industry))).map((text) => ({ text, value: text })), onFilter: (value, record) => record.industry === value },
    { title: "所属地区", dataIndex: "region" },
    { title: "企业规模", dataIndex: "scale" },
    { title: "融资阶段", dataIndex: "financingStage" },
    { title: "综合热度", dataIndex: "heatScore", sorter: (a, b) => a.heatScore - b.heatScore, render: (value: number) => <HeatScore value={value} compact /> },
    { title: "投资活跃度", dataIndex: "investmentActivity", sorter: (a, b) => a.investmentActivity - b.investmentActivity },
    { title: "政策匹配度", dataIndex: "policyMatch", sorter: (a, b) => a.policyMatch - b.policyMatch },
    {
      title: "风险等级",
      dataIndex: "riskLevel",
      render: (value: string) => <Tag color={value === "高" ? "red" : value === "中" ? "orange" : "green"}>{value}</Tag>
    },
    { title: "招商状态", dataIndex: "leadStatus" },
    { title: "最近更新", dataIndex: "updatedAt" },
    {
      title: "操作",
      fixed: "right",
      width: 156,
      render: (_, record) => (
        <Space>
          <Tooltip title="查看详情">
            <Button icon={<EyeOutlined />} onClick={() => onView(record)} />
          </Tooltip>
          <Tooltip title="重点关注">
            <Button icon={favorites.includes(record.id) ? <StarFilled /> : <StarOutlined />} onClick={() => toggleFavorite(record.id)} />
          </Tooltip>
          <Tooltip title="添加招商线索">
            <Button icon={<PlusOutlined />} onClick={() => message.success(`${record.name} 已加入招商线索`)} />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      scroll={{ x: 1260 }}
      rowSelection={{}}
      pagination={{ pageSize: 8, showSizeChanger: true }}
    />
  );
}
