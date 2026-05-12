import type { FilterState, PageId } from "./types";

export const DATA_ROOT = `${import.meta.env.BASE_URL}data/`;

export const DEFAULT_FILTERS: FilterState = {
  selectedMetric: "ARI_hvg",
  selectedReferenceType: "all",
  selectedDatasetType: "all",
  selectedDatasets: [],
  selectedFeatures: [],
  selectedSpatialMethods: [],
  selectedClusterMethods: [],
  selectedMethodClusters: [],
  selectedSeedLabels: [],
  searchText: "",
  topN: 20,
  aggregation: "mean",
};

export const PAGES: Array<{ id: PageId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "leaderboard", label: "Leaderboard" },
  { id: "heatmap", label: "Heatmap" },
  { id: "datasets", label: "Datasets" },
  { id: "features", label: "Features" },
  { id: "spatial", label: "Spatial Gallery" },
  { id: "compare", label: "Compare" },
  { id: "agreement", label: "Metric Agreement" },
  { id: "methodology", label: "Methodology" },
];

export const MAIN_METRICS = ["ARI_hvg", "ARI_gt"];
