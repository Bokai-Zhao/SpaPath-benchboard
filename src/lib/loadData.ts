import Papa from "papaparse";
import { DATA_ROOT } from "../config";
import type {
  DashboardData,
  DatasetSourceLink,
  DatasetSummary,
  FeatureMetadata,
  FeatureSummary,
  JsonRow,
  Manifest,
  MethodClusterSummary,
  MetricsLongRow,
  PaperMetadata,
  RankScoreLongRow,
  SpatialLabelManifestItem,
  SpatialPoint,
} from "../types";
import { DEFAULT_FEATURE_METADATA } from "./formatting";

const NUMBER_FIELDS = new Set([
  "random_seed",
  "global_rank_score",
  "normalized_global_rank_score",
  "raw_value",
  "score_for_ranking",
  "dataset_rank",
  "dataset_rank_score",
  "normalized_dataset_rank_score",
  "n_valid_in_dataset_metric",
  "k",
  "seed",
]);

const BOOLEAN_FIELDS = new Set(["higher_is_better", "is_hvg", "is_pathology_feature", "has_ground_truth"]);

export class DataLoadError extends Error {
  constructor(
    public path: string,
    message: string,
  ) {
    super(message);
  }
}

async function fetchText(path: string): Promise<string> {
  const response = await fetch(`${DATA_ROOT}${path}`);
  if (!response.ok) {
    throw new DataLoadError(path, `Missing data file: ${path}`);
  }
  return response.text();
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${DATA_ROOT}${path}`);
  if (!response.ok) {
    throw new DataLoadError(path, `Missing data file: ${path}`);
  }
  return response.json() as Promise<T>;
}

async function fetchOptionalJson<T>(path: string, fallback: T): Promise<T> {
  try {
    return await fetchJson<T>(path);
  } catch {
    return fallback;
  }
}

const DEFAULT_PAPER_METADATA: PaperMetadata = {
  title: "SpaPath-Bench",
  subtitle: "Benchmarking pathology foundation models for spatial domain understanding",
  paper_url: null,
  preprint_url: null,
  code_url: null,
  main_figure: null,
  citation_text: null,
  status: "pending_publication",
};

function indexByKey<T extends Record<K, string>, K extends keyof T>(rows: T[], key: K): Record<string, T> {
  return Object.fromEntries(rows.map((row) => [row[key], row]));
}

function parseValue(value: string, field: string): string | number | boolean | null {
  if (value === "") return null;
  if (BOOLEAN_FIELDS.has(field)) return value.toLowerCase() === "true";
  if (NUMBER_FIELDS.has(field)) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }
  return value;
}

async function fetchCsv<T>(path: string): Promise<T[]> {
  const text = await fetchText(path);
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length) {
    throw new DataLoadError(path, parsed.errors[0].message);
  }
  return parsed.data.map((row) => {
    const output: Record<string, string | number | boolean | null> = {};
    Object.entries(row).forEach(([field, value]) => {
      output[field] = parseValue(value, field);
    });
    return output as T;
  });
}

export async function loadDashboardData(): Promise<DashboardData> {
  const [
    manifest,
    rankScores,
    metricsLong,
    leaderboardFeature,
    leaderboardMethodCluster,
    leaderboardPipeline,
    leaderboardCcstLeidenFeature,
    crossMetricFeature,
    crossMetricMethodCluster,
    crossMetricPipeline,
    datasetSummary,
    featureSummary,
    methodClusterSummary,
    metricSummary,
    spatialLabelsManifest,
    featureMetadata,
    paperMetadata,
    datasetSourceLinks,
  ] = await Promise.all([
    fetchJson<Manifest>("manifest.json"),
    fetchCsv<RankScoreLongRow>("rank_scores_long.csv"),
    fetchCsv<MetricsLongRow>("metrics_long.csv"),
    fetchJson<JsonRow[]>("leaderboard_feature.json"),
    fetchJson<JsonRow[]>("leaderboard_method_cluster.json"),
    fetchJson<JsonRow[]>("leaderboard_pipeline.json"),
    fetchJson<JsonRow[]>("leaderboard_ccst_leiden_feature.json"),
    fetchJson<JsonRow[]>("cross_metric_feature.json"),
    fetchJson<JsonRow[]>("cross_metric_method_cluster.json"),
    fetchJson<JsonRow[]>("cross_metric_pipeline.json"),
    fetchJson<DatasetSummary[]>("dataset_summary.json"),
    fetchJson<FeatureSummary[]>("feature_summary.json"),
    fetchJson<MethodClusterSummary[]>("method_cluster_summary.json"),
    fetchJson<JsonRow[]>("metric_summary.json"),
    fetchJson<SpatialLabelManifestItem[]>("spatial_labels_manifest.json"),
    fetchOptionalJson<FeatureMetadata[]>("feature_metadata.json", DEFAULT_FEATURE_METADATA),
    fetchOptionalJson<PaperMetadata>("paper_metadata.json", DEFAULT_PAPER_METADATA),
    fetchOptionalJson<DatasetSourceLink[]>("dataset_source_links.json", []),
  ]);

  const featureMetadataByKey = indexByKey(featureMetadata, "feature");
  const datasetSourceLinksByKey = indexByKey(datasetSourceLinks, "dataset");

  return {
    manifest,
    rankScores,
    metricsLong,
    leaderboardFeature,
    leaderboardMethodCluster,
    leaderboardPipeline,
    leaderboardCcstLeidenFeature,
    crossMetricFeature,
    crossMetricMethodCluster,
    crossMetricPipeline,
    datasetSummary,
    featureSummary,
    methodClusterSummary,
    metricSummary,
    spatialLabelsManifest,
    featureMetadata,
    featureMetadataByKey,
    paperMetadata,
    datasetSourceLinks,
    datasetSourceLinksByKey,
  };
}

export async function loadSpatialLabels(file: string): Promise<SpatialPoint[]> {
  return fetchJson<SpatialPoint[]>(file);
}
