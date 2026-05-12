import { useMemo, useState } from "react";
import type { DashboardData, FilterState, MetricsLongRow, RankScoreLongRow } from "../types";
import { DEFAULT_FILTERS } from "../config";
import { aggregate } from "../lib/aggregation";
import { filterMetricRows, filterRankRows } from "../lib/filters";
import { FilterPanel } from "../components/FilterPanel";
import { HeatmapView, type HeatmapDatum } from "../components/HeatmapView";

function groupHeatmap<T>(
  rows: T[],
  x: (row: T) => string,
  y: (row: T) => string,
  value: (row: T) => number | null,
  mode: FilterState["aggregation"],
  topN: number,
): HeatmapDatum[] {
  const xScore = new Map<string, number>();
  const yScore = new Map<string, number>();
  rows.forEach((row) => {
    const current = value(row);
    if (typeof current === "number" && Number.isFinite(current)) {
      xScore.set(x(row), (xScore.get(x(row)) ?? 0) + current);
      yScore.set(y(row), (yScore.get(y(row)) ?? 0) + current);
    }
  });
  const xKeep = new Set([...xScore.entries()].sort((a, b) => b[1] - a[1]).slice(0, topN).map(([key]) => key));
  const yKeep = new Set([...yScore.entries()].sort((a, b) => b[1] - a[1]).slice(0, topN).map(([key]) => key));
  const buckets = new Map<string, Array<number | null>>();
  rows.forEach((row) => {
    const xKey = x(row);
    const yKey = y(row);
    if (!xKeep.has(xKey) || !yKeep.has(yKey)) return;
    const key = `${xKey}\u0000${yKey}`;
    buckets.set(key, [...(buckets.get(key) ?? []), value(row)]);
  });
  return [...buckets.entries()].map(([key, values]) => {
    const [xKey, yKey] = key.split("\u0000");
    return { x: xKey, y: yKey, value: aggregate(values, mode) };
  });
}

export function HeatmapPage({ data }: { data: DashboardData }) {
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS, topN: 25 });
  const rankRows = useMemo(() => filterRankRows(data.rankScores, filters), [data.rankScores, filters]);
  const metricRows = useMemo(() => filterMetricRows(data.metricsLong, filters), [data.metricsLong, filters]);

  const featureMethod = groupHeatmap<RankScoreLongRow>(
    rankRows,
    (row) => row.method_cluster,
    (row) => row.feature,
    (row) => row.global_rank_score,
    filters.aggregation,
    filters.topN,
  );
  const metricFeature = groupHeatmap<RankScoreLongRow>(
    data.rankScores,
    (row) => row.metric_id,
    (row) => row.feature,
    (row) => row.global_rank_score,
    filters.aggregation,
    filters.topN,
  );
  const datasetFeature = groupHeatmap<MetricsLongRow>(
    metricRows,
    (row) => row.dataset,
    (row) => row.feature,
    (row) => row.dataset_rank_score,
    filters.aggregation,
    filters.topN,
  );
  const datasetMethod = groupHeatmap<MetricsLongRow>(
    metricRows,
    (row) => row.method_cluster,
    (row) => row.dataset,
    (row) => row.dataset_rank_score,
    filters.aggregation,
    filters.topN,
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Heatmap</h1>
        <p className="mt-1 text-sm text-slate-600">Global heatmaps use global rank scores; dataset heatmaps use dataset rank scores.</p>
      </div>
      <FilterPanel filters={filters} manifest={data.manifest} onChange={setFilters} showDatasetType showAggregation />
      <div className="space-y-4">
        <div className="rounded-lg border border-line bg-white p-2 shadow-sm">
          <HeatmapView title="Feature x method_cluster: global rank score" data={featureMethod} />
        </div>
        <div className="rounded-lg border border-line bg-white p-2 shadow-sm">
          <HeatmapView title="Metric x feature: global rank score" data={metricFeature} />
        </div>
        <div className="rounded-lg border border-line bg-white p-2 shadow-sm">
          <HeatmapView title="Feature x dataset: dataset rank score" data={datasetFeature} />
        </div>
        <div className="rounded-lg border border-line bg-white p-2 shadow-sm">
          <HeatmapView title="Dataset x method_cluster: dataset rank score" data={datasetMethod} />
        </div>
      </div>
    </div>
  );
}
