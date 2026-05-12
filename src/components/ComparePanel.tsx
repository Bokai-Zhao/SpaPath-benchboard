import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { EmptyState } from "./EmptyState";

export function ComparePanel({ title, labels, a, b }: { title: string; labels: string[]; a: number[]; b: number[] }) {
  if (!labels.length) return <EmptyState title="No comparable values" />;
  const option: EChartsOption = {
    title: { text: title, left: 12, top: 8, textStyle: { fontSize: 14 } },
    tooltip: { trigger: "axis" },
    legend: { top: 8, right: 12 },
    grid: { left: 52, right: 28, bottom: 80, top: 56 },
    xAxis: { type: "category", data: labels, axisLabel: { rotate: 35 } },
    yAxis: { type: "value" },
    series: [
      { name: "A", type: "bar", data: a },
      { name: "B", type: "bar", data: b },
    ],
  };
  return <ReactECharts option={option} style={{ height: 420, width: "100%" }} />;
}
