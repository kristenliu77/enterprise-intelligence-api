import { CheckCircleOutlined, LoadingOutlined } from "@ant-design/icons";
import { Steps } from "antd";

interface CalculationProcessProps {
  current: number;
  running: boolean;
}

const steps = [
  "汇总多源数据",
  "清洗异常值",
  "数据标准化",
  "计算分项得分",
  "执行时间衰减",
  "评估风险与完整度",
  "生成综合热度指数",
  "生成招商建议"
];

export default function CalculationProcess({ current, running }: CalculationProcessProps): JSX.Element {
  return (
    <Steps
      direction="vertical"
      size="small"
      current={current}
      items={steps.map((title, index) => ({
        title,
        icon: running && index === current ? <LoadingOutlined /> : index < current ? <CheckCircleOutlined /> : undefined
      }))}
    />
  );
}
