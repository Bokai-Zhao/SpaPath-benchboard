import type { AggregationMode } from "../types";

export function cleanNumbers(values: Array<number | null | undefined>): number[] {
  return values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
}

export function meanSkipNaN(values: Array<number | null | undefined>): number | null {
  const clean = cleanNumbers(values);
  if (clean.length === 0) return null;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

export function medianSkipNaN(values: Array<number | null | undefined>): number | null {
  const clean = cleanNumbers(values).sort((a, b) => a - b);
  if (clean.length === 0) return null;
  const mid = Math.floor(clean.length / 2);
  return clean.length % 2 === 0 ? (clean[mid - 1] + clean[mid]) / 2 : clean[mid];
}

export function stdSkipNaN(values: Array<number | null | undefined>): number | null {
  const clean = cleanNumbers(values);
  if (clean.length === 0) return null;
  const mean = meanSkipNaN(clean) ?? 0;
  const variance = clean.reduce((sum, value) => sum + (value - mean) ** 2, 0) / clean.length;
  return Math.sqrt(variance);
}

export function aggregate(values: Array<number | null | undefined>, mode: AggregationMode): number | null {
  const clean = cleanNumbers(values);
  if (clean.length === 0) return null;
  if (mode === "mean") return meanSkipNaN(clean);
  if (mode === "median") return medianSkipNaN(clean);
  if (mode === "max") return Math.max(...clean);
  return Math.min(...clean);
}
