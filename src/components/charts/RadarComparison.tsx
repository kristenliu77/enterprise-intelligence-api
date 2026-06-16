import { BaseChart } from "./BaseChart";
import type { Region } from "../../types";

export function RadarComparison({ regions }: { regions: Region[] }) {
  const dimensions = ["综合热度", "政策环境", "人才资源", "基础设施", "物流能力", "产业配套", "成本优势", "市场规模", "招商效率", "风险控制"];
  return (
    <BaseChart
      height={360}
      option={{
        tooltip: {},
        legend: { bottom: 0 },
        radar: {
          indicator: dimensions.map((name) => ({ name, max: 100 })),
          radius: "62%"
        },
        series: [
          {
            type: "radar",
            data: regions.map((item) => ({
              name: item.name,
              value: [
                item.heatScore,
                item.policyEnvironment,
                item.talentResource,
                item.infrastructure,
                item.logistics,
                item.industrialSupport,
                item.cost,
                item.marketSize,
                item.attractionEfficiency,
                100 - item.risk
              ]
            }))
          }
        ]
      }}
    />
  );
}
