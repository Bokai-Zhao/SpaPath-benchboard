import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import type { DashboardData, JsonRow } from "../types";
import { SummaryCards } from "../components/SummaryCards";
import { LeaderboardTable } from "../components/LeaderboardTable";
import { Badge } from "../components/Badge";
import { formatNumber } from "../lib/formatting";

function barOption(title: string, rows: JsonRow[], labelKey: string, valueKey: string): EChartsOption {
  const data = rows
    .filter((row) => typeof row[valueKey] === "number")
    .slice(0, 10);
  return {
    title: { text: title, left: 12, top: 8, textStyle: { fontSize: 14 } },
    tooltip: { trigger: "axis" },
    grid: { left: 120, right: 28, top: 48, bottom: 36 },
    xAxis: { type: "value" },
    yAxis: { type: "category", inverse: true, data: data.map((row) => String(row[labelKey])) },
    series: [{ type: "bar", data: data.map((row) => row[valueKey] as number), itemStyle: { color: "#4f46e5" } }],
  };
}

function pieOption(title: string, values: Array<{ name: string; value: number }>): EChartsOption {
  return {
    title: { text: title, left: 12, top: 8, textStyle: { fontSize: 14 } },
    tooltip: { trigger: "item" },
    series: [{ type: "pie", radius: ["42%", "70%"], center: ["50%", "58%"], data: values }],
  };
}

export function OverviewPage({ data }: { data: DashboardData }) {
  const bestFeature = data.crossMetricFeature[0];
  const bestPathology = data.crossMetricFeature.find((row) => row.entity_id !== "HVG");
  const bestMethod = data.crossMetricMethodCluster[0];
  const bestPipeline = data.crossMetricPipeline[0];
  const bestCcst = data.leaderboardCcstLeidenFeature[0];
  const dlpfcBest = data.datasetSummary.find((row) => row.dataset_type === "DLPFC")?.best_feature;
  const nonDlpfcBest = data.datasetSummary.find((row) => row.dataset_type === "non_DLPFC")?.best_feature;

  const championRows: JsonRow[] = [
    {
      category: "Overall best feature",
      winner: String(bestFeature?.entity_id ?? "NA"),
      metric: "All metrics",
      score: bestFeature?.overall_mean_rank_score ?? null,
      description: "Mean global rank score from rank_scores_merged.parquet",
    },
    {
      category: "Best pathology feature excluding HVG",
      winner: String(bestPathology?.entity_id ?? "NA"),
      metric: "All metrics",
      score: bestPathology?.overall_mean_rank_score ?? null,
      description: "HVG excluded from feature-level global summary",
    },
    {
      category: "Best method + cluster",
      winner: String(bestMethod?.entity_id ?? "NA"),
      metric: "All metrics",
      score: bestMethod?.overall_mean_rank_score ?? null,
      description: "Method-cluster summary over normalized global rank scores",
    },
    {
      category: "Best full pipeline",
      winner: String(bestPipeline?.entity_id ?? "NA"),
      metric: "All metrics",
      score: bestPipeline?.overall_mean_rank_score ?? null,
      description: "Feature + spatial method + cluster method",
    },
    {
      category: "Best CCST + Leiden feature",
      winner: String(bestCcst?.feature ?? "NA"),
      metric: "All metrics",
      score: bestCcst?.mean_global_rank_score ?? null,
      description: "Feature comparison restricted to ccst + leiden",
    },
    {
      category: "Best DLPFC dataset-level feature",
      winner: dlpfcBest ?? "NA",
      metric: "ARI_gt",
      score: null,
      description: "Dataset-level rank score from raw metrics",
    },
    {
      category: "Best non-DLPFC dataset-level feature",
      winner: nonDlpfcBest ?? "NA",
      metric: "ARI_hvg",
      score: null,
      description: "Dataset-level rank score from raw metrics",
    },
  ];

  const datasetTypeCounts = [
    { name: "DLPFC", value: data.datasetSummary.filter((row) => row.dataset_type === "DLPFC").length },
    { name: "non_DLPFC", value: data.datasetSummary.filter((row) => row.dataset_type === "non_DLPFC").length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Overview</h1>
        <p className="mt-1 text-sm text-slate-600">Global summaries use prepared rank scores; dataset panels use raw metric derivatives.</p>
      </div>
      <SummaryCards
        cards={[
          { label: "Datasets", value: data.manifest.datasets.length },
          { label: "Features", value: data.manifest.features.length, detail: `${data.manifest.pathology_features.length} pathology/image` },
          { label: "Method + cluster", value: data.manifest.method_clusters.length },
          { label: "Full pipelines", value: data.leaderboardPipeline.length / data.manifest.metrics.length },
          { label: "Metrics", value: data.manifest.metrics.length },
          { label: "Global rank entries", value: data.manifest.n_rows_rank_scores_long },
          { label: "Raw metric entries", value: data.manifest.n_rows_metrics_long },
          { label: "Spatial label files", value: data.manifest.n_spatial_label_files },
          { label: "Best feature", value: String(bestFeature?.entity_id ?? "NA") },
          { label: "Best pathology feature", value: String(bestPathology?.entity_id ?? "NA") },
          { label: "Best method", value: String(bestMethod?.entity_id ?? "NA") },
          { label: "Best pipeline", value: <span className="text-base">{String(bestPipeline?.entity_id ?? "NA")}</span> },
        ]}
      />

      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-ink">Champion Board</h2>
          <Badge tone="blue">global rank source</Badge>
        </div>
        <LeaderboardTable
          rows={championRows}
          filename="champion-board.csv"
          columns={[
            { key: "category", header: "Category" },
            { key: "winner", header: "Winner" },
            { key: "metric", header: "Metric" },
            { key: "score", header: "Score", render: (row) => formatNumber(row.score) },
            { key: "description", header: "Description" },
          ]}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-white p-2 shadow-sm">
          <ReactECharts option={barOption("Top 10 features", data.crossMetricFeature, "entity_id", "overall_mean_rank_score")} style={{ height: 360 }} />
        </div>
        <div className="rounded-lg border border-line bg-white p-2 shadow-sm">
          <ReactECharts option={barOption("Top 10 method clusters", data.crossMetricMethodCluster, "entity_id", "overall_mean_rank_score")} style={{ height: 360 }} />
        </div>
        <div className="rounded-lg border border-line bg-white p-2 shadow-sm">
          <ReactECharts
            option={barOption("Metric availability", data.metricSummary, "metric_id", "n_valid_global_rank_scores")}
            style={{ height: 360 }}
          />
        </div>
        <div className="rounded-lg border border-line bg-white p-2 shadow-sm">
          <ReactECharts
            option={pieOption("Dataset type distribution", datasetTypeCounts)}
            style={{ height: 360 }}
          />
        </div>
      </div>
    </div>
  );
}
