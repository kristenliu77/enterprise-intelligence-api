import { Divider, Tag, Typography } from "antd";
import { productConfig } from "../../config";
import type { HeatResult } from "../../types";

interface ReportPreviewProps {
  result?: HeatResult;
}

export default function ReportPreview({ result }: ReportPreviewProps): JSX.Element {
  return (
    <div className="report-preview">
      <Typography.Title level={2}>{productConfig.fullName}</Typography.Title>
      <Typography.Title level={4}>招商分析报告预览</Typography.Title>
      <Tag color="blue">演示数据</Tag>
      <Divider />
      <Typography.Title level={5}>核心结论</Typography.Title>
      <Typography.Paragraph>
        {result
          ? `${result.entityName} 综合热度为 ${result.finalHeat} 分，等级为 ${result.heatLevel}，数据可信度为 ${result.confidenceLevel}。建议结合政策匹配、企业尽调和落地条件综合判断。`
          : "请选择测算对象后生成热度结果，报告将自动带入核心指标、趋势图、政策匹配和招商建议。"}
      </Typography.Paragraph>
      <Typography.Title level={5}>数据口径说明</Typography.Title>
      <Typography.Paragraph>{productConfig.demoNotice} 计算结果不能替代人工尽职调查，政策变化可能影响分析结论。</Typography.Paragraph>
    </div>
  );
}
