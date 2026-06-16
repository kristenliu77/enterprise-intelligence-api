import { BaseChart } from "./BaseChart";
import { heatTrends, trendMonths } from "../../mock/data";

export function HeatTrendChart() {
  return (
    <BaseChart
      height={340}
      option={{
        tooltip: { trigger: "axis" },
        legend: { top: 0 },
        grid: { top: 48, left: 52, right: 28, bottom: 54, containLabel: true },
        dataZoom: [{ type: "inside" }, { type: "slider", height: 18, bottom: 12 }],
        xAxis: { type: "category", data: trendMonths },
        yAxis: { type: "value", name: "热度指数", max: 100 },
        series: heatTrends.map((item) => ({
          name: item.name,
          type: "line",
          smooth: true,
          data: item.values
        }))
      }}
    />
  );
}
