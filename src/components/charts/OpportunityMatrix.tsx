import { BaseChart } from "./BaseChart";
import { opportunities } from "../../mock/data";
import type { CallbackDataParams, TopLevelFormatterParams } from "echarts/types/dist/shared";

function firstParam(params: TopLevelFormatterParams): CallbackDataParams {
  return Array.isArray(params) ? params[0] : params;
}

export function OpportunityMatrix() {
  return (
    <BaseChart
      height={360}
      option={{
        tooltip: {
          formatter: (params: TopLevelFormatterParams) => {
            const data = firstParam(params).data as [number, number, number, string];
            return `${data[3]}<br/>政策匹配：${data[0]}<br/>市场热度：${data[1]}<br/>投资规模：${data[2]}亿`;
          }
        },
        grid: { left: 56, right: 52, top: 44, bottom: 58, containLabel: true },
        xAxis: { name: "政策匹配度", nameLocation: "middle", nameGap: 34, max: 100 },
        yAxis: { name: "市场热度", nameLocation: "middle", nameGap: 42, max: 100 },
        visualMap: { show: false, min: 70, max: 95, dimension: 1, inRange: { color: ["#1677FF", "#0E8A78", "#F59E0B"] } },
        series: [
          {
            type: "scatter",
            symbolSize: (data: unknown) => Number((data as [number, number, number])[2]) * 3.5,
            data: opportunities.map((item) => [item.policyMatch, item.heat, Math.round(item.investmentActivity / 8), item.title])
          }
        ],
        graphic: [
          { type: "text", left: "68%", top: "20%", style: { text: "优先招商", fill: "#0E8A78", fontWeight: 700 } },
          { type: "text", left: "18%", top: "20%", style: { text: "长期培育", fill: "#667085" } },
          { type: "text", left: "18%", top: "72%", style: { text: "谨慎评估", fill: "#D64545" } },
          { type: "text", left: "68%", top: "72%", style: { text: "机会观察", fill: "#F59E0B" } }
        ]
      }}
    />
  );
}
