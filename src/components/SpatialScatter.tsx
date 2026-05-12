import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import type { SpatialPoint } from "../types";
import { labelPalette } from "../lib/color";
import { EmptyState } from "./EmptyState";

export function SpatialScatter({
  points,
  labelKey,
  pointSize,
  opacity,
  title,
}: {
  points: SpatialPoint[];
  labelKey: "label" | "gt_label";
  pointSize: number;
  opacity: number;
  title: string;
}) {
  const labels = points.map((point) => point[labelKey]).filter((value): value is string => Boolean(value));
  const palette = labelPalette(labels);
  if (!points.length || !labels.length) return <EmptyState title="No spatial labels available" />;
  const series = Object.entries(palette).map(([label, color]) => ({
    name: label,
    type: "scatter" as const,
    symbolSize: pointSize,
    itemStyle: { color, opacity },
    data: points
      .filter((point) => point[labelKey] === label)
      .map((point) => [point.x, point.y, point.label, point.gt_label]),
  }));
  const option: EChartsOption = {
    title: { text: title, left: 12, top: 8, textStyle: { fontSize: 14 } },
    tooltip: {
      formatter: (params) => {
        const param = Array.isArray(params) ? params[0] : params;
        const value = param && typeof param === "object" && "value" in param && Array.isArray(param.value) ? param.value : [];
        return `x ${value[0]}<br/>y ${value[1]}<br/>label ${value[2] ?? "NA"}<br/>gt ${value[3] ?? "NA"}`;
      },
    },
    legend: { type: "scroll", orient: "vertical", right: 0, top: 40, bottom: 20, textStyle: { fontSize: 10 } },
    grid: { left: 48, right: 120, top: 48, bottom: 42 },
    xAxis: { type: "value", scale: true, splitLine: { show: false } },
    yAxis: { type: "value", scale: true, inverse: true, splitLine: { show: false } },
    dataZoom: [{ type: "inside" }, { type: "slider", bottom: 8 }],
    series,
  };
  return <ReactECharts option={option} style={{ height: 560, width: "100%" }} notMerge />;
}
