import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { EmptyState } from "./EmptyState";

export interface HeatmapDatum {
  x: string;
  y: string;
  value: number | null;
}

export function HeatmapView({ title, data }: { title: string; data: HeatmapDatum[] }) {
  const xLabels = Array.from(new Set(data.map((item) => item.x)));
  const yLabels = Array.from(new Set(data.map((item) => item.y)));
  const values = data.map((item) => item.value).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (!data.length || !values.length) return <EmptyState title="No valid values for this heatmap" />;
  const option: EChartsOption = {
    title: { text: title, left: 12, top: 8, textStyle: { fontSize: 14 } },
    tooltip: {
      position: "top",
      formatter: (params) => {
        const param = Array.isArray(params) ? params[0] : params;
        const value = param && typeof param === "object" && "value" in param && Array.isArray(param.value) ? param.value : [];
        return `${xLabels[Number(value[0])]}<br/>${yLabels[Number(value[1])]}<br/>${Number(value[2]).toFixed(3)}`;
      },
    },
    grid: { left: 110, right: 32, top: 52, bottom: 82 },
    xAxis: { type: "category", data: xLabels, axisLabel: { rotate: 45, fontSize: 10 } },
    yAxis: { type: "category", data: yLabels, axisLabel: { fontSize: 10 } },
    visualMap: {
      min: Math.min(...values),
      max: Math.max(...values),
      calculable: true,
      orient: "horizontal",
      left: "center",
      bottom: 8,
    },
    series: [
      {
        type: "heatmap",
        data: data
          .filter((item) => typeof item.value === "number")
          .map((item) => [xLabels.indexOf(item.x), yLabels.indexOf(item.y), item.value]),
        emphasis: { itemStyle: { borderColor: "#111827", borderWidth: 1 } },
      },
    ],
  };
  return <ReactECharts option={option} style={{ height: 520, width: "100%" }} notMerge />;
}
