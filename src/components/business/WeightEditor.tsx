import { Button, Form, InputNumber, Select, Slider, Space, Typography } from "antd";
import type { HeatWeights } from "../../types";
import { validateWeights, weightSchemes } from "../../services/heatEngine";

interface WeightEditorProps {
  value: HeatWeights;
  schemeName: string;
  onSchemeChange: (schemeName: string, weights: HeatWeights) => void;
  onChange: (weights: HeatWeights) => void;
}

const labels: Record<keyof HeatWeights, string> = {
  search: "搜索关注",
  media: "媒体传播",
  investment: "投资信号",
  policy: "政策匹配",
  foundation: "产业基础"
};

export default function WeightEditor({ value, schemeName, onSchemeChange, onChange }: WeightEditorProps): JSX.Element {
  const total = value.search + value.media + value.investment + value.policy + value.foundation;
  const valid = validateWeights(value);

  const update = (key: keyof HeatWeights, nextValue: number | null): void => {
    onChange({ ...value, [key]: nextValue ?? 0 });
  };

  return (
    <div>
      <Space wrap style={{ marginBottom: 12 }}>
        <Select
          value={schemeName}
          style={{ width: 170 }}
          options={[...Object.keys(weightSchemes), "自定义权重"].map((name) => ({ value: name, label: name }))}
          onChange={(name) => onSchemeChange(name, name === "自定义权重" ? value : weightSchemes[name])}
        />
        <Button onClick={() => onSchemeChange("综合招商方案", weightSchemes.综合招商方案)}>恢复默认</Button>
        <Typography.Text type={valid ? "secondary" : "danger"}>权重合计：{total}%</Typography.Text>
      </Space>
      {(Object.keys(labels) as Array<keyof HeatWeights>).map((key) => (
        <Form.Item
          key={key}
          label={labels[key]}
          validateStatus={valid ? undefined : "warning"}
          style={{ marginBottom: 8 }}
        >
          <Space style={{ width: "100%" }} align="center">
            <Slider min={0} max={60} value={value[key]} onChange={(nextValue) => update(key, nextValue)} style={{ width: 220 }} />
            <InputNumber min={0} max={100} value={value[key]} onChange={(nextValue) => update(key, nextValue)} addonAfter="%" />
          </Space>
        </Form.Item>
      ))}
      {!valid ? <Typography.Text type="danger">自定义权重必须合计 100%，否则不能生成正式测算结果。</Typography.Text> : null}
    </div>
  );
}
