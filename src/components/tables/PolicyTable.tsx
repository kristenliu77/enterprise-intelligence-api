import { EyeOutlined, FileAddOutlined } from "@ant-design/icons";
import { Button, Space, Table, Tag, Tooltip, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Policy } from "../../types";

interface PolicyTableProps {
  data: Policy[];
  onView: (policy: Policy) => void;
}

export default function PolicyTable({ data, onView }: PolicyTableProps): JSX.Element {
  const columns: ColumnsType<Policy> = [
    { title: "政策名称", dataIndex: "name", fixed: "left", width: 260 },
    { title: "发布机构", dataIndex: "agency" },
    { title: "发布区域", dataIndex: "region" },
    { title: "适用行业", dataIndex: "industries", render: (value: string[]) => value.map((item) => <Tag key={item}>{item}</Tag>) },
    { title: "政策类型", dataIndex: "type" },
    { title: "发布时间", dataIndex: "publishedAt", sorter: (a, b) => a.publishedAt.localeCompare(b.publishedAt) },
    {
      title: "有效状态",
      dataIndex: "status",
      render: (value: Policy["status"]) => <Tag color={value === "有效" ? "green" : value === "即将到期" ? "orange" : "red"}>{value}</Tag>
    },
    { title: "匹配企业", dataIndex: "matchedEnterpriseCount", sorter: (a, b) => a.matchedEnterpriseCount - b.matchedEnterpriseCount },
    {
      title: "操作",
      fixed: "right",
      width: 112,
      render: (_, record) => (
        <Space>
          <Tooltip title="查看政策详情">
            <Button icon={<EyeOutlined />} onClick={() => onView(record)} />
          </Tooltip>
          <Tooltip title="添加到分析报告">
            <Button icon={<FileAddOutlined />} onClick={() => message.success("已添加到报告素材")} />
          </Tooltip>
        </Space>
      )
    }
  ];

  return <Table rowKey="id" columns={columns} dataSource={data} scroll={{ x: 1100 }} pagination={{ pageSize: 8, showSizeChanger: true }} />;
}
