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

const FEATURE_DISPLAY_NAMES: Record<string, string> = {
  hoptimus1: "H-Optimus-1",
  hoptimus0: "H-Optimus-0",
  uni_v1: "UNI",
  uni_v2: "UNI2",
  conch_v1: "CONCH",
  conch_v15: "CONCH-V1.5",
  virchow2: "Virchow2",
  virchow: "Virchow",
  gigapath: "GigaPath",
  musk: "MUSK",
  phikon_v2: "Phikon2",
  phikon: "Phikon",
  hibou_l: "Hibou-L",
  hibou_b: "Hibou-B",
  ctranspath: "CtransPath",
  omics_clip: "OmicsCLIP",
  vit_l_dinov3: "DINOv3-ViT-L",
  vit_b_dinov3: "DINOv3-ViT-B",
  plip: "PLIP",
  HVG: "HVG",
};

export function featureDisplayName(feature: string | null | undefined): string {
  if (!feature) return "NA";
  return FEATURE_DISPLAY_NAMES[feature] ?? feature;
}

export function methodClusterDisplayName(methodCluster: string | null | undefined): string {
  if (!methodCluster) return "NA";
  return methodCluster
    .replace("ccst", "CCST")
    .replace("leiden", "Leiden")
    .replace("louvain", "Louvain")
    .replace("kmeans", "K-means");
}
