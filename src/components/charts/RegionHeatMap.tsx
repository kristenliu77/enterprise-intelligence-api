import { useMemo, useState } from "react";
import { Card, Space, Tag, Typography } from "antd";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";
import chinaGeoJson from "../../assets/maps/china.json";
import { enterprises, regions } from "../../mock/data";
import { BaseChart } from "./BaseChart";
import { useAppStore } from "../../store/appStore";

interface GeoFeature {
  properties: {
    name: string;
  };
}

interface ChinaGeoJson {
  features: GeoFeature[];
}

interface ProvinceHeat {
  name: string;
  value: number;
  parks: string[];
  enterpriseCount: number;
  keyIndustries: string[];
}

const chinaMapName = "china-local";
const typedChinaGeoJson = chinaGeoJson as ChinaGeoJson;

echarts.registerMap(chinaMapName, chinaGeoJson as Parameters<typeof echarts.registerMap>[1]);

function normalizeProvinceName(province: string): string {
  const suffixMap: Record<string, string> = {
    北京: "北京市",
    上海: "上海市",
    天津: "天津市",
    重庆: "重庆市",
    广西: "广西壮族自治区",
    内蒙古: "内蒙古自治区",
    宁夏: "宁夏回族自治区",
    新疆: "新疆维吾尔自治区",
    西藏: "西藏自治区",
    香港: "香港特别行政区",
    澳门: "澳门特别行政区"
  };
  if (suffixMap[province]) {
    return suffixMap[province];
  }
  return province.endsWith("省") || province.endsWith("市") || province.endsWith("自治区") ? province : `${province}省`;
}

function readMapName(params: unknown): string | undefined {
  if (typeof params !== "object" || params === null || !("name" in params)) {
    return undefined;
  }
  const name = (params as { name?: unknown }).name;
  return typeof name === "string" ? name : undefined;
}

export function RegionHeatMap(): JSX.Element {
  const themeMode = useAppStore((state) => state.themeMode);
  const isNight = themeMode === "night";
  const provinceData = useMemo<ProvinceHeat[]>(() => {
    const provinceNames = typedChinaGeoJson.features.map((feature) => feature.properties.name);
    return provinceNames.map((provinceName) => {
      const relatedRegions = regions.filter((region) => normalizeProvinceName(region.province) === provinceName);
      const heatValues = relatedRegions.map((region) => region.heatScore);
      const value = heatValues.length > 0
        ? Math.round(heatValues.reduce((sum, score) => sum + score, 0) / heatValues.length)
        : 38;
      const regionNames = relatedRegions.map((region) => region.name);
      return {
        name: provinceName,
        value,
        parks: regionNames.length > 0 ? regionNames : ["暂无重点园区样本"],
        enterpriseCount: enterprises.filter((enterprise) => regionNames.includes(enterprise.region)).length,
        keyIndustries: Array.from(new Set(relatedRegions.flatMap((region) => region.keyIndustries))).slice(0, 4)
      };
    });
  }, []);

  const [selected, setSelected] = useState<ProvinceHeat>(() => provinceData.find((item) => item.name === "湖北省") ?? provinceData[0]);

  const option = useMemo<EChartsOption>(() => ({
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      formatter: (params: unknown) => {
        const name = readMapName(params) ?? "";
        const item = provinceData.find((province) => province.name === name);
        if (!item) {
          return `${name}<br/>暂无演示热度数据`;
        }
        return `${item.name}<br/>热度得分：${item.value}<br/>重点园区：${item.parks.join("、")}<br/>企业数量：${item.enterpriseCount}`;
      }
    },
    visualMap: {
      min: 35,
      max: 95,
      left: 18,
      bottom: 18,
      itemWidth: 12,
      itemHeight: 92,
      text: ["高热", "低热"],
      textStyle: { color: isNight ? "#B8C7DC" : "#4B5563" },
      inRange: {
        color: isNight
          ? ["#132946", "#1D5D8F", "#19A08D", "#E49B24", "#FF705F"]
          : ["#D9E7F7", "#7FB7E6", "#0E8A78", "#F59E0B", "#E5573F"]
      }
    },
    series: [
      {
        name: "区域商业热度",
        type: "map",
        map: chinaMapName,
        roam: true,
        zoom: 1.16,
        top: 20,
        bottom: 10,
        emphasis: {
          label: { show: true, color: isNight ? "#E6EDF7" : "#0B3A6E", fontWeight: "bold" },
          itemStyle: { areaColor: "#F59E0B", borderColor: "#ffffff", borderWidth: 1.2 }
        },
        select: {
          label: { show: true, color: isNight ? "#E6EDF7" : "#0B3A6E", fontWeight: "bold" },
          itemStyle: { areaColor: "#E5573F" }
        },
        label: { show: false },
        itemStyle: {
          borderColor: isNight ? "#2D4262" : "#FFFFFF",
          borderWidth: 0.8,
          areaColor: isNight ? "#132946" : "#D9E7F7"
        },
        data: provinceData
      }
    ]
  }), [isNight, provinceData]);

  return (
    <div className="region-heat-layout">
      <div className="china-heat-map">
        <BaseChart
          height={420}
          option={option}
          onClick={(params) => {
            const name = readMapName(params);
            const item = provinceData.find((province) => province.name === name);
            if (item) {
              setSelected(item);
            }
          }}
        />
      </div>
      <Card className="region-detail-card" size="small" title="区域详情">
        <Space direction="vertical" size={10}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {selected.name}
          </Typography.Title>
          <Typography.Text>热度得分：{selected.value}</Typography.Text>
          <Typography.Text>重点园区：{selected.parks.join("、")}</Typography.Text>
          <Typography.Text>企业数量：{selected.enterpriseCount}</Typography.Text>
          <Space wrap>
            {(selected.keyIndustries.length > 0 ? selected.keyIndustries : ["暂无样本行业"]).map((item) => (
              <Tag key={item} color="blue">
                {item}
              </Tag>
            ))}
          </Space>
          <Typography.Text type="secondary">点击地图省份可更新详情。地图边界数据已本地化，热力值基于演示园区样本聚合生成。</Typography.Text>
        </Space>
      </Card>
    </div>
  );
}
