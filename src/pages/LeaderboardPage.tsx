import { useMemo, useState } from "react";
import type { DashboardData, FilterState, JsonRow } from "../types";
import { FilterPanel } from "../components/FilterPanel";
import { LeaderboardTable, type SimpleColumn } from "../components/LeaderboardTable";
import { DetailDrawer } from "../components/DetailDrawer";
import { Badge } from "../components/Badge";
import { DEFAULT_FILTERS } from "../config";
import { formatNumber } from "../lib/formatting";
import { metricMatches } from "../lib/filters";

type TabId = "feature" | "method" | "pipeline" | "ccst";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "feature", label: "Feature Leaderboard" },
  { id: "method", label: "Method + Cluster" },
  { id: "pipeline", label: "Full Pipeline" },
  { id: "ccst", label: "CCST + Leiden" },
];

function filterRows(rows: JsonRow[], filters: FilterState): JsonRow[] {
  const search = filters.searchText.toLowerCase().trim();
  return rows
    .filter((row) => {
      if (typeof row.metric_id === "string" && !metricMatches(row.metric_id, filters.selectedMetric)) return false;
      if (filters.selectedReferenceType !== "all" && row.reference_type !== filters.selectedReferenceType) return false;
      if (!search) return true;
      return Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(search));
    })
    .slice(0, filters.topN);
}

const commonScoreColumns: Array<SimpleColumn<JsonRow>> = [
  { key: "mean_global_rank_score", header: "Mean rank score", render: (row) => formatNumber(row.mean_global_rank_score) },
  { key: "median_global_rank_score", header: "Median score", render: (row) => formatNumber(row.median_global_rank_score) },
  { key: "std_global_rank_score", header: "Std", render: (row) => formatNumber(row.std_global_rank_score) },
  { key: "mean_normalized_global_rank_score", header: "Norm mean score", render: (row) => formatNumber(row.mean_normalized_global_rank_score) },
  { key: "n_wins", header: "Wins" },
];

export function LeaderboardPage({ data }: { data: DashboardData }) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState<TabId>("feature");
  const [detail, setDetail] = useState<JsonRow | null>(null);

  const { rows, columns } = useMemo(() => {
    if (activeTab === "feature") {
      return {
        rows: filterRows(data.leaderboardFeature, filters),
        columns: [
          { key: "metric_id", header: "Metric" },
          { key: "reference_type", header: "Reference" },
          { key: "feature", header: "Feature" },
          { key: "is_hvg", header: "Group", render: (row: JsonRow) => <Badge tone={row.is_hvg ? "slate" : "blue"}>{row.is_hvg ? "HVG" : "pathology"}</Badge> },
          ...commonScoreColumns,
          { key: "n_contexts", header: "Contexts" },
          { key: "n_method_clusters", header: "Methods" },
          { key: "best_method_cluster", header: "Best method" },
          { key: "best_seed_label", header: "Best seed" },
        ] satisfies Array<SimpleColumn<JsonRow>>,
      };
    }
    if (activeTab === "method") {
      const methodRows = filterRows(data.leaderboardMethodCluster, { ...filters, topN: Number.MAX_SAFE_INTEGER })
        .sort((a, b) => {
          const winDelta = (typeof b.n_wins === "number" ? b.n_wins : 0) - (typeof a.n_wins === "number" ? a.n_wins : 0);
          if (winDelta !== 0) return winDelta;
          return String(a.method_cluster).localeCompare(String(b.method_cluster));
        })
        .slice(0, filters.topN);
      return {
        rows: methodRows,
        columns: [
          { key: "metric_id", header: "Metric" },
          { key: "reference_type", header: "Reference" },
          { key: "method_cluster", header: "Method cluster" },
          { key: "spatial_method", header: "Spatial" },
          { key: "cluster_method", header: "Cluster" },
          ...commonScoreColumns,
          { key: "n_features", header: "Features" },
          { key: "best_feature", header: "Best feature" },
          { key: "best_seed_label", header: "Best seed" },
        ] satisfies Array<SimpleColumn<JsonRow>>,
      };
    }
    if (activeTab === "pipeline") {
      return {
        rows: filterRows(data.leaderboardPipeline, filters),
        columns: [
          { key: "metric_id", header: "Metric" },
          { key: "reference_type", header: "Reference" },
          { key: "pipeline_id", header: "Pipeline" },
          { key: "feature", header: "Feature" },
          { key: "spatial_method", header: "Spatial" },
          { key: "cluster_method", header: "Cluster" },
          ...commonScoreColumns,
          { key: "n_seeds", header: "Seeds" },
          { key: "best_seed_label", header: "Best seed" },
          { key: "worst_seed_label", header: "Worst seed" },
        ] satisfies Array<SimpleColumn<JsonRow>>,
      };
    }
    return {
      rows: filterRows(data.leaderboardCcstLeidenFeature, { ...filters, selectedMetric: "All metrics", selectedReferenceType: "all" }),
      columns: [
        { key: "feature", header: "Feature" },
        { key: "is_hvg", header: "Group", render: (row: JsonRow) => <Badge tone={row.is_hvg ? "slate" : "blue"}>{row.is_hvg ? "HVG" : "pathology"}</Badge> },
        { key: "mean_global_rank_score", header: "Mean", render: (row: JsonRow) => formatNumber(row.mean_global_rank_score) },
        { key: "rank_score_PAS", header: "PAS", render: (row: JsonRow) => formatNumber(row.rank_score_PAS) },
        { key: "rank_score_CHAOS", header: "CHAOS", render: (row: JsonRow) => formatNumber(row.rank_score_CHAOS) },
        { key: "rank_score_ASW", header: "ASW", render: (row: JsonRow) => formatNumber(row.rank_score_ASW) },
        { key: "rank_score_ARI_hvg", header: "ARI_hvg", render: (row: JsonRow) => formatNumber(row.rank_score_ARI_hvg) },
        { key: "rank_score_ARI_gt", header: "ARI_gt", render: (row: JsonRow) => formatNumber(row.rank_score_ARI_gt) },
        { key: "n_valid_metrics", header: "Valid" },
      ] satisfies Array<SimpleColumn<JsonRow>>,
    };
  }, [activeTab, data, filters]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Leaderboard</h1>
        <p className="mt-1 text-sm text-slate-600">All global tables use `rank_scores_merged.parquet` derivatives only.</p>
      </div>
      <FilterPanel filters={filters} manifest={data.manifest} onChange={setFilters} />
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
        Rank score is a higher-is-better score from <code>rank_scores_merged.parquet</code>, not an ordinal rank number. For
        example, an ARI_gt feature score of 19 means the top global rank score among 20 feature baselines. The HVG row is the
        transcriptomic baseline evaluated against DLPFC ground truth, not the ARI_hvg reference setting.
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`rounded-md px-3 py-2 text-sm font-medium ${activeTab === tab.id ? "bg-brand text-white" : "bg-white text-slate-700 ring-1 ring-line"}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === "method" ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Method-cluster mean global rank scores are tied after averaging across all features in this table. The paper-level
          Fig.2C conclusion remains CCST + Leiden as the optimal spatial setting; this exploratory table is sorted by n_wins.
        </div>
      ) : null}
      <LeaderboardTable rows={rows} columns={columns} filename={`${activeTab}-leaderboard.csv`} onRowClick={setDetail} />
      <DetailDrawer title="Leaderboard details" row={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
