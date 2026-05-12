export function formatNumber(value: unknown, digits = 3): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "NA";
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function formatPercent(value: unknown, digits = 1): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "NA";
  return `${(value * 100).toLocaleString(undefined, { maximumFractionDigits: digits })}%`;
}

export function titleCase(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

export function asText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "NA";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "number") return formatNumber(value);
  return String(value);
}
