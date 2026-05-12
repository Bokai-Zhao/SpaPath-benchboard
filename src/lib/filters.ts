import type { FilterState, MetricsLongRow, RankScoreLongRow } from "../types";
import { MAIN_METRICS } from "../config";

export function metricMatches(metricId: string, selectedMetric: string): boolean {
  if (selectedMetric === "All metrics") return true;
  if (selectedMetric === "Main metric only") return MAIN_METRICS.includes(metricId);
  return metricId === selectedMetric;
}

export function filterRankRows(rows: RankScoreLongRow[], filters: FilterState): RankScoreLongRow[] {
  const search = filters.searchText.trim().toLowerCase();
  return rows.filter((row) => {
    if (!metricMatches(row.metric_id, filters.selectedMetric)) return false;
    if (filters.selectedReferenceType !== "all" && row.reference_type !== filters.selectedReferenceType) return false;
    if (filters.selectedFeatures.length && !filters.selectedFeatures.includes(row.feature)) return false;
    if (filters.selectedSpatialMethods.length && !filters.selectedSpatialMethods.includes(row.spatial_method)) return false;
    if (filters.selectedClusterMethods.length && !filters.selectedClusterMethods.includes(row.cluster_method)) return false;
    if (filters.selectedMethodClusters.length && !filters.selectedMethodClusters.includes(row.method_cluster)) return false;
    if (filters.selectedSeedLabels.length && !filters.selectedSeedLabels.includes(row.seed_label)) return false;
    if (!search) return true;
    return [row.feature, row.method_cluster, row.pipeline_id, row.metric_id].some((value) => value.toLowerCase().includes(search));
  });
}

export function filterMetricRows(rows: MetricsLongRow[], filters: FilterState): MetricsLongRow[] {
  const search = filters.searchText.trim().toLowerCase();
  return rows.filter((row) => {
    if (!metricMatches(row.metric_id, filters.selectedMetric)) return false;
    if (filters.selectedReferenceType !== "all" && row.reference_type !== filters.selectedReferenceType) return false;
    if (filters.selectedDatasetType !== "all" && row.dataset_type !== filters.selectedDatasetType) return false;
    if (filters.selectedDatasets.length && !filters.selectedDatasets.includes(row.dataset)) return false;
    if (filters.selectedFeatures.length && !filters.selectedFeatures.includes(row.feature)) return false;
    if (filters.selectedSpatialMethods.length && !filters.selectedSpatialMethods.includes(row.spatial_method)) return false;
    if (filters.selectedClusterMethods.length && !filters.selectedClusterMethods.includes(row.cluster_method)) return false;
    if (filters.selectedMethodClusters.length && !filters.selectedMethodClusters.includes(row.method_cluster)) return false;
    if (!search) return true;
    return [row.dataset, row.feature, row.method_cluster, row.pipeline_id, row.metric_id].some((value) =>
      value.toLowerCase().includes(search),
    );
  });
}
