import type { MetricInfo, ReferenceType } from "../types";

export function metricReference(metricId: string): ReferenceType {
  if (metricId.endsWith("_hvg")) return "hvg";
  if (metricId.endsWith("_gt")) return "gt";
  return "unsupervised";
}

export function metricFamily(metricId: string): string {
  return metricId.includes("_") ? metricId.split("_")[0] : metricId;
}

export function higherIsBetter(metricId: string): boolean {
  return metricId !== "PAS" && metricId !== "CHAOS";
}

export function metricLabel(metric: MetricInfo | string): string {
  const metricId = typeof metric === "string" ? metric : metric.metric_id;
  return metricId.replace("_", " ");
}
