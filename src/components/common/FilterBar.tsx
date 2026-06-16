import { Button, DatePicker, Select, Space } from "antd";
import { DownloadOutlined, ReloadOutlined, UndoOutlined } from "@ant-design/icons";
import { industries, regions } from "../../mock/data";

interface FilterBarProps {
  region?: string;
  industry?: string;
  onRegionChange?: (value: string) => void;
  onIndustryChange?: (value: string) => void;
  onRefresh?: () => void;
  onReset?: () => void;
  onExport?: () => void;
}

export function FilterBar({
  region,
  industry,
  onRegionChange,
  onIndustryChange,
  onRefresh,
  onReset,
  onExport
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      <Space wrap>
        <DatePicker.RangePicker />
        <Select
          value={region}
          style={{ width: 160 }}
          onChange={onRegionChange}
          options={["全部区域", ...regions.map((item) => item.name)].map((item) => ({ label: item, value: item }))}
        />
        <Select
          value={industry}
          style={{ width: 180 }}
          onChange={onIndustryChange}
          options={["全部行业", ...industries.map((item) => item.name)].map((item) => ({ label: item, value: item }))}
        />
        <Select
          defaultValue="演示数据口径"
          style={{ width: 160 }}
          options={["演示数据口径", "招商口径", "产业研究口径"].map((item) => ({ label: item, value: item }))}
        />
        <Button icon={<ReloadOutlined />} onClick={onRefresh}>
          刷新
        </Button>
        <Button icon={<UndoOutlined />} onClick={onReset}>
          重置
        </Button>
        <Button type="primary" icon={<DownloadOutlined />} onClick={onExport}>
          导出报告
        </Button>
      </Space>
    </div>
  );
}
