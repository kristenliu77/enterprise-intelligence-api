import { Button, Card, Form, Input, Modal, Select, Space, Statistic, Tag, Typography, message } from "antd";
import { useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import { useAppStore } from "../../store/appStore";
import type { Lead, LeadStage } from "../../types";

const stages: LeadStage[] = ["待评估", "初步接触", "需求确认", "方案洽谈", "实地考察", "签约推进", "已落地", "暂缓"];

export default function Workbench(): JSX.Element {
  const leads = useAppStore((state) => state.leads);
  const addLead = useAppStore((state) => state.addLead);
  const updateLeadStage = useAppStore((state) => state.updateLeadStage);
  const [open, setOpen] = useState(false);

  const createLead = (values: Pick<Lead, "title" | "enterpriseName" | "industry" | "region" | "owner">): void => {
    addLead({
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      ...values,
      stage: "待评估",
      priority: "中",
      followDate: "2026-06-20",
      updatedAt: "2026-06-15"
    });
    setOpen(false);
    message.success("新线索已创建");
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <PageHeader title="招商工作台" description="管理待办、招商任务、重点企业跟进和线索阶段流转。" tags={["看板视图", "阶段流转", "跟进记录"]} />
      <div className="content-grid grid-4">
        <Card><Statistic title="今日待办" value={12} /></Card>
        <Card><Statistic title="本周招商任务" value={38} /></Card>
        <Card><Statistic title="重点企业跟进" value={leads.filter((item) => item.priority === "高").length} /></Card>
        <Card><Statistic title="新增线索" value={leads.length} /></Card>
      </div>
      <Card title="招商线索看板" extra={<Button type="primary" onClick={() => setOpen(true)}>新建线索</Button>}>
        <div className="kanban">
          {stages.map((stage) => (
            <div key={stage} className="kanban-column">
              <Typography.Text strong>{stage}</Typography.Text>
              {leads.filter((lead) => lead.stage === stage).slice(0, 5).map((lead) => (
                <Card key={lead.id} size="small" className="kanban-card">
                  <Typography.Text strong>{lead.title}</Typography.Text>
                  <br />
                  <Tag color={lead.priority === "高" ? "red" : lead.priority === "中" ? "orange" : "blue"}>{lead.priority}</Tag>
                  <Typography.Text type="secondary">{lead.owner} / {lead.followDate}</Typography.Text>
                  <Select
                    size="small"
                    value={lead.stage}
                    style={{ width: "100%", marginTop: 8 }}
                    options={stages.map((item) => ({ value: item, label: item }))}
                    onChange={(next) => {
                      updateLeadStage(lead.id, next);
                      message.success("阶段已更新");
                    }}
                  />
                </Card>
              ))}
            </div>
          ))}
        </div>
      </Card>
      <Modal title="新建招商线索" open={open} onCancel={() => setOpen(false)} footer={null}>
        <Form layout="vertical" onFinish={createLead}>
          <Form.Item name="title" label="线索标题" rules={[{ required: true, message: "请输入线索标题" }]}><Input /></Form.Item>
          <Form.Item name="enterpriseName" label="企业名称" rules={[{ required: true, message: "请输入企业名称" }]}><Input /></Form.Item>
          <Form.Item name="industry" label="所属行业" rules={[{ required: true, message: "请输入行业" }]}><Input /></Form.Item>
          <Form.Item name="region" label="意向区域" rules={[{ required: true, message: "请输入区域" }]}><Input /></Form.Item>
          <Form.Item name="owner" label="负责人" rules={[{ required: true, message: "请输入负责人" }]}><Input /></Form.Item>
          <Button type="primary" htmlType="submit">保存</Button>
        </Form>
      </Modal>
    </Space>
  );
}
