const PALETTE = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#9333ea",
  "#ea580c",
  "#0891b2",
  "#be123c",
  "#4d7c0f",
  "#7c3aed",
  "#0f766e",
  "#b45309",
  "#64748b",
];

export function featureGroupColor(feature: string): string {
  return feature === "HVG" ? "#334155" : "#4f46e5";
}

export function categoricalColor(label: string | number | null | undefined): string {
  const text = label == null ? "NA" : String(label);
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function labelPalette(labels: Array<string | null>): Record<string, string> {
  const unique = Array.from(new Set(labels.filter((label): label is string => Boolean(label)))).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
  return Object.fromEntries(unique.map((label, index) => [label, PALETTE[index % PALETTE.length]]));
}
