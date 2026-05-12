export type ReferenceType = "hvg" | "gt" | "unsupervised";
export type DatasetType = "DLPFC" | "non_DLPFC";
export type AggregationMode = "mean" | "median" | "max" | "min";
export type PageId =
  | "overview"
  | "leaderboard"
  | "heatmap"
  | "datasets"
  | "features"
  | "spatial"
  | "compare"
  | "agreement"
  | "methodology";

export interface MetricInfo {
  metric_id: string;
  metric_family: string;
  reference_type: ReferenceType;
  higher_is_better: boolean;
  description?: string;
}

export interface RankScoreLongRow {
  feature: string;
  context_key: string;
  spatial_method: string;
  cluster_method: string;
  seed_label: string;
  random_seed: number | string | null;
  metric_id: string;
  metric_family: string;
  reference_type: ReferenceType;
  higher_is_better: boolean;
  global_rank_score: number | null;
  normalized_global_rank_score: number | null;
  is_hvg: boolean;
  is_pathology_feature: boolean;
  method_cluster: string;
  pipeline_id: string;
}

export interface MetricsLongRow {
  dataset: string;
  dataset_type: DatasetType;
  has_ground_truth: boolean;
  k: number | string | null;
  seed: number | string | null;
  feature: string;
  spatial_method: string;
  cluster_method: string;
  method_cluster: string;
  pipeline_id: string;
  metric_id: string;
  metric_family: string;
  reference_type: ReferenceType;
  raw_value: number | null;
  higher_is_better: boolean;
  score_for_ranking: number | null;
  dataset_rank: number | null;
  dataset_rank_score: number | null;
  normalized_dataset_rank_score: number | null;
  n_valid_in_dataset_metric: number | null;
}

export interface FeatureSummary {
  feature: string;
  is_hvg: boolean;
  is_pathology_feature: boolean;
  overall_rank: number | null;
  overall_mean_global_rank_score: number | null;
  overall_mean_normalized_global_rank_score: number | null;
  mean_ARI_hvg_global_rank_score?: number | null;
  mean_ARI_gt_global_rank_score?: number | null;
  mean_ASW_global_rank_score?: number | null;
  mean_PAS_global_rank_score?: number | null;
  mean_CHAOS_global_rank_score?: number | null;
  best_dataset?: string | null;
  best_method_cluster?: string | null;
  n_dataset_wins?: number | null;
  n_pipeline_wins?: number | null;
  available_in_spatial_labels?: boolean;
}

export interface MethodClusterSummary {
  method_cluster: string;
  spatial_method: string;
  cluster_method: string;
  overall_rank: number | null;
  overall_mean_global_rank_score: number | null;
  overall_mean_normalized_global_rank_score: number | null;
  best_feature?: string | null;
  best_metric?: string | null;
  n_feature_wins?: number | null;
  n_metric_wins?: number | null;
}

export interface PipelineSummary {
  pipeline_id: string;
  feature: string;
  spatial_method: string;
  cluster_method: string;
  method_cluster: string;
  overall_mean_global_rank_score: number | null;
}

export interface DatasetSummary {
  dataset: string;
  dataset_type: DatasetType;
  has_ground_truth: boolean;
  n_features: number;
  n_pathology_features?: number;
  n_spatial_methods: number;
  n_cluster_methods: number;
  n_method_clusters?: number;
  n_pipelines: number;
  n_clusters_or_k?: number | string | null;
  main_metric: string;
  best_feature?: string | null;
  best_method_cluster?: string | null;
  best_pipeline_id?: string | null;
  best_raw_value?: number | null;
  best_dataset_rank_score?: number | null;
  available_in_spatial_labels: boolean;
}

export interface SpatialLabelManifestItem {
  dataset: string;
  feature: string;
  safe_dataset: string;
  safe_feature: string;
  file: string;
  n_points: number;
  k: number | string | null;
  has_gt_label: boolean;
  n_pred_labels: number;
  n_gt_labels: number;
}

export interface SpatialPoint {
  x: number;
  y: number;
  label: string;
  gt_label: string | null;
}

export interface FilterState {
  selectedMetric: string;
  selectedReferenceType: "all" | ReferenceType;
  selectedDatasetType: "all" | DatasetType;
  selectedDatasets: string[];
  selectedFeatures: string[];
  selectedSpatialMethods: string[];
  selectedClusterMethods: string[];
  selectedMethodClusters: string[];
  selectedSeedLabels: string[];
  searchText: string;
  topN: number;
  aggregation: AggregationMode;
}

export interface Manifest {
  generated_at: string;
  input_files: Record<string, string>;
  n_rows_rank_scores: number;
  n_rows_metrics: number;
  n_rows_labels: number;
  n_rows_rank_scores_long: number;
  n_rows_metrics_long: number;
  n_spatial_label_files: number;
  datasets: string[];
  features: string[];
  pathology_features: string[];
  spatial_methods: string[];
  cluster_methods: string[];
  method_clusters: string[];
  seed_labels: string[];
  metrics: MetricInfo[];
  notes: string[];
}

export type JsonRow = Record<string, string | number | boolean | null | string[]>;

export interface DashboardData {
  manifest: Manifest;
  rankScores: RankScoreLongRow[];
  metricsLong: MetricsLongRow[];
  leaderboardFeature: JsonRow[];
  leaderboardMethodCluster: JsonRow[];
  leaderboardPipeline: JsonRow[];
  leaderboardCcstLeidenFeature: JsonRow[];
  crossMetricFeature: JsonRow[];
  crossMetricMethodCluster: JsonRow[];
  crossMetricPipeline: JsonRow[];
  datasetSummary: DatasetSummary[];
  featureSummary: FeatureSummary[];
  methodClusterSummary: MethodClusterSummary[];
  metricSummary: JsonRow[];
  spatialLabelsManifest: SpatialLabelManifestItem[];
}
