import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";

interface BaseChartProps {
  option: EChartsOption;
  height?: number;
  onClick?: (params: unknown) => void;
}

export function BaseChart({ option, height = 320, onClick }: BaseChartProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chart.setOption(option);
    if (onClick) {
      chart.on("click", onClick);
    }
    const observer = new ResizeObserver(() => {
      chart.resize();
    });
    observer.observe(ref.current);
    window.requestAnimationFrame(() => chart.resize());
    return () => {
      if (onClick) {
        chart.off("click", onClick);
      }
      observer.disconnect();
      chart.dispose();
    };
  }, [onClick, option]);

  return <div ref={ref} className="chart-canvas" style={{ height }} />;
}
