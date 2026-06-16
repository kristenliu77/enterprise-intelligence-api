import { InboxOutlined, SyncOutlined } from "@ant-design/icons";
import { Button, Card, Progress, Space, Table, Tag, Typography, Upload, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadProps } from "antd";
import { useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import { dataSources } from "../../mock/data";
import type { DataSourceItem } from "../../types";

const { Dragger } = Upload;

export default function DataManagement(): JSX.Element {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);

  const columns: ColumnsType<DataSourceItem> = [
    { title: "数据源", dataIndex: "name" },
    {
      title: "状态",
      dataIndex: "status",
      render: (value: DataSourceItem["status"]) => <Tag color={value === "正常" ? "green" : value === "延迟" ? "orange" : "red"}>{value}</Tag>
    },
    { title: "最近同步", dataIndex: "lastSyncAt" },
    { title: "数据量", dataIndex: "recordCount" },
    { title: "数据质量", dataIndex: "quality", render: (value: number) => <Progress percent={value} size="small" /> },
    { title: "更新频率", dataIndex: "frequency" },
    { title: "负责人", dataIndex: "owner" },
    {
      title: "操作",
      render: () => <Button size="small" icon={<SyncOutlined />} onClick={() => message.success("已模拟触发同步")}>同步</Button>
    }
  ];

  const uploadProps: UploadProps = {
    accept: ".csv",
    showUploadList: false,
    beforeUpload: (file) => {
      setUploading(true);
      setProgress(18);
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? "");
        const rows = text.split(/\r?\n/).filter(Boolean).slice(0, 6).map((line) => line.split(","));
        setPreviewRows(rows);
        setProgress(100);
        setUploading(false);
        message.success("CSV 已读取，字段映射和质量检查已生成预览");
      };
      reader.readAsText(file);
      return false;
    }
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <PageHeader title="数据管理" description="管理数据源状态、模拟同步、CSV 上传、字段映射和数据质量检查。" tags={["数据源适配器", "CSV上传", "质量检查"]} />
      <Card title="数据源列表">
        <Table rowKey="id" columns={columns} dataSource={dataSources} scroll={{ x: 980 }} pagination={false} />
      </Card>
      <Card title="人工上传数据">
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p className="ant-upload-text">点击或拖拽 CSV 文件到此区域</p>
          <p className="ant-upload-hint">演示阶段仅在浏览器本地读取，不上传到服务器。</p>
        </Dragger>
        {uploading || progress > 0 ? <Progress percent={progress} style={{ marginTop: 14 }} /> : null}
      </Card>
      <Card title="字段映射与数据预览">
        {previewRows.length > 0 ? (
          <div className="scroll-table">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {previewRows.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}`}>
                    {row.map((cell, cellIndex) => (
                      <td key={`${rowIndex}-${cellIndex}`} style={{ border: "1px solid #E4EAF1", padding: 8 }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Typography.Text type="secondary">上传 CSV 后展示前 6 行预览，并模拟错误行提示与数据质量检查。</Typography.Text>
        )}
      </Card>
      <Card title="同步日志">
        <Typography.Paragraph>2026-06-15 09:30 公开统计数据同步完成，质量评分 92。</Typography.Paragraph>
        <Typography.Paragraph>2026-06-15 08:30 投融资数据同步延迟，已进入重试队列。</Typography.Paragraph>
      </Card>
    </Space>
  );
}
