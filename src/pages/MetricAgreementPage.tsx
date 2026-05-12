import type { DashboardData, RankScoreLongRow } from "../types";
import { aggregate } from "../lib/aggregation";
import { HeatmapView, type HeatmapDatum } from "../components/HeatmapView";
import { LeaderboardTable } from "../components/LeaderboardTable";
import { formatNumber } from "../lib/formatting";

function metricFeatureHeatmap(rows: RankScoreLongRow[]): HeatmapDatum[] {
  const buckets = new Map<string, Array<number | null>>();
  rows.forEach((row) => {
    const key = `${row.metric_id}\u0000${row.feature}`;
    buckets.set(key, [...(buckets.get(key) ?? []), row.global_rank_score]);
  });
  return [...buckets.entries()].map(([key, values]) => {
    const [metric, feature] = key.split("\u0000");
    return { x: metric, y: feature, value: aggregate(values, "mean") };
  });
}

export function MetricAgreementPage({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Metric Agreement</h1>
        <p className="mt-1 text-sm text-slate-600">Cross-metric views use normalized global rank scores, not raw metric values.</p>
      </div>
      <div className="rounded-lg border border-line bg-white p-2 shadow-sm">
        <HeatmapView title="Metric x feature: mean global rank score" data={metricFeatureHeatmap(data.rankScores)} />
      </div>
      <LeaderboardTable
        rows={data.crossMetricFeature.slice(0, 30)}
        filename="cross-metric-feature.csv"
        columns={[
          { key: "entity_id", header: "Feature" },
          { key: "overall_mean_rank_score", header: "Mean global", render: (row) => formatNumber(row.overall_mean_rank_score) },
          { key: "overall_mean_normalized_rank_score", header: "Mean normalized", render: (row) => formatNumber(row.overall_mean_normalized_rank_score) },
          { key: "metric_std", header: "Metric std", render: (row) => formatNumber(row.metric_std) },
          { key: "best_metric", header: "Best metric" },
          { key: "worst_metric", header: "Weak metric" },
          { key: "top_metrics", header: "Top metrics" },
          { key: "weak_metrics", header: "Weak metrics" },
        ]}
      />
    </div>
  );
}
