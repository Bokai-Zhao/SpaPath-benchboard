import type { FeatureMetadata } from "../types";

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

export const FEATURE_DISPLAY_NAMES: Record<string, string> = {
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
  vit_l_dinov3: "DINOv3-ViT-l",
  vit_b_dinov3: "DINOv3-ViT-b",
  plip: "PLIP",
  HVG: "HVG",
};

export const DEFAULT_FEATURE_METADATA: FeatureMetadata[] = Object.entries(FEATURE_DISPLAY_NAMES).map(([feature, display_name]) => ({
  feature,
  display_name,
  is_pathology_feature: feature !== "HVG",
}));

export const SPATIAL_METHOD_DISPLAY_NAMES: Record<string, string> = {
  ccst: "CCST",
  spagcn: "SpaGCN",
  stagate: "STAGATE",
  sedr: "SEDR",
  graphst: "GraphST",
  spaceflow: "SpaceFlow",
  const: "Constant baseline",
  PCA_32: "PCA-32",
  PCA_64: "PCA-64",
  PCA_128: "PCA-128",
  PCA_256: "PCA-256",
};

export const CLUSTER_METHOD_DISPLAY_NAMES: Record<string, string> = {
  kmeans: "K-means",
  leiden: "Leiden",
  louvain: "Louvain",
};

export function featureDisplayName(
  feature: string | null | undefined,
  metadataByKey?: Record<string, FeatureMetadata>,
): string {
  if (!feature) return "NA";
  return metadataByKey?.[feature]?.display_name ?? FEATURE_DISPLAY_NAMES[feature] ?? feature;
}

export function datasetTypeDisplayName(datasetType: string | null | undefined): string {
  if (!datasetType) return "NA";
  if (datasetType === "non_DLPFC") return "Other 10x";
  return datasetType;
}

export function spatialMethodDisplayName(method: string | null | undefined): string {
  if (!method) return "NA";
  return SPATIAL_METHOD_DISPLAY_NAMES[method] ?? titleCase(method);
}

export function clusterMethodDisplayName(cluster: string | null | undefined): string {
  if (!cluster) return "NA";
  return CLUSTER_METHOD_DISPLAY_NAMES[cluster] ?? titleCase(cluster);
}

export function methodClusterDisplayName(methodCluster: string | null | undefined): string {
  if (!methodCluster) return "NA";
  const parts = methodCluster.split("||").map((part) => part.trim());
  if (parts.length >= 2) return `${spatialMethodDisplayName(parts[0])} || ${clusterMethodDisplayName(parts[1])}`;
  return spatialMethodDisplayName(methodCluster);
}

export function pipelineDisplayName(
  pipelineId: string | null | undefined,
  metadataByKey?: Record<string, FeatureMetadata>,
): string {
  if (!pipelineId) return "NA";
  const parts = pipelineId.split("||").map((part) => part.trim());
  if (parts.length >= 3) {
    return `${featureDisplayName(parts[0], metadataByKey)} || ${spatialMethodDisplayName(parts[1])} || ${clusterMethodDisplayName(parts[2])}`;
  }
  return methodClusterDisplayName(pipelineId);
}

export function featureSearchText(feature: string | null | undefined, metadataByKey?: Record<string, FeatureMetadata>): string {
  if (!feature) return "";
  const metadata = metadataByKey?.[feature];
  return [feature, metadata?.display_name, metadata?.paper_name, metadata?.formal_name, metadata?.group, metadata?.note]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
