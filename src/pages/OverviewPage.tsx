import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import type { DashboardData, JsonRow } from "../types";
import { SummaryCards } from "../components/SummaryCards";
import { LeaderboardTable } from "../components/LeaderboardTable";
import { Badge } from "../components/Badge";
import { ManuscriptHeroCard } from "../components/ManuscriptHeroCard";
import { featureDisplayName, formatNumber, methodClusterDisplayName, pipelineDisplayName } from "../lib/formatting";
import { meanSkipNaN } from "../lib/aggregation";

function barOption(
  title: string,
  rows: JsonRow[],
  labelKey: string,
  valueKey: string,
  labelFormatter: (value: string) => string = (value) => value,
): EChartsOption {
  const data = rows
    .filter((row) => typeof row[valueKey] === "number")
    .slice(0, 10);
  const labels = data.map((row) => labelFormatter(String(row[labelKey])));
  return {
    title: { text: title, left: 12, top: 8, textStyle: { fontSize: 14 } },
    tooltip: { trigger: "axis" },
    grid: { left: 120, right: 28, top: 48, bottom: 36 },
    xAxis: { type: "value" },
    yAxis: { type: "category", inverse: true, data: labels },
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
  const topFeatureByMetrics = (metrics: string[]) => {
    const rows = data.manifest.pathology_features
      .map((feature) => {
        const values = data.rankScores.filter((row) => row.feature === feature && metrics.includes(row.metric_id)).map((row) => row.global_rank_score);
        return { feature, score: meanSkipNaN(values) };
      })
      .filter((row): row is { feature: string; score: number } => typeof row.score === "number")
      .sort((a, b) => b.score - a.score || a.feature.localeCompare(b.feature));
    return rows[0];
  };

  const hvgReferencedBest = topFeatureByMetrics(["ARI_hvg", "NMI_hvg", "HOM_hvg", "COM_hvg"]);
  const expertReferencedBest = topFeatureByMetrics(["ARI_gt", "NMI_gt", "HOM_gt", "COM_gt"]);
  const referenceFreeBest = topFeatureByMetrics(["PAS", "CHAOS", "ASW"]);
  const methodMeanValues = data.crossMetricMethodCluster.map((row) =>
    typeof row.overall_mean_rank_score === "number" ? row.overall_mean_rank_score : null,
  );
  const methodMeanTie =
    new Set(methodMeanValues.filter((value): value is number => typeof value === "number").map((value) => value.toFixed(8))).size === 1;
  const paperOptimalMethod = "ccst || leiden";
  const bestPipeline = data.crossMetricPipeline[0];
  const bestCcst = data.leaderboardCcstLeidenFeature.find((row) => row.feature !== "HVG");

  const championRows: JsonRow[] = [
    {
      category: "Paper Fig.2B: best HVG-referenced pathology model",
      winner: featureDisplayName(hvgReferencedBest?.feature, data.featureMetadataByKey),
      metric: "ARI/NMI/HOM/COM_hvg",
      score: hvgReferencedBest?.score ?? null,
      description: "Matches the manuscript conclusion: H-Optimus-1 ranks highest against the HVG transcriptomic proxy",
    },
    {
      category: "Paper Fig.2B: best expert-annotated pathology model",
      winner: featureDisplayName(expertReferencedBest?.feature, data.featureMetadataByKey),
      metric: "ARI/NMI/HOM/COM_gt",
      score: expertReferencedBest?.score ?? null,
      description: "Matches the manuscript conclusion: MUSK performs best on expert DLPFC annotations",
    },
    {
      category: "Paper Fig.2C: optimal spatial setting",
      winner: methodClusterDisplayName(paperOptimalMethod),
      metric: "Aggregate Fig.2C setting",
      score: null,
      description: methodMeanTie
        ? "CCST+Leiden is the paper-level optimal setting; mean method-cluster rank scores tie after averaging over all features"
        : "CCST+Leiden is the paper-level optimal setting",
    },
    {
      category: "Paper Fig.2D: best pathology model under CCST+Leiden",
      winner: featureDisplayName(String(bestCcst?.feature ?? ""), data.featureMetadataByKey),
      metric: "CCST+Leiden, all metrics",
      score: bestCcst?.mean_global_rank_score ?? null,
      description: "HVG excluded; matches the optimal-setting ranking headed by H-Optimus-1",
    },
    {
      category: "Dashboard cross-metric best full pipeline",
      winner: pipelineDisplayName(String(bestPipeline?.entity_id ?? ""), data.featureMetadataByKey),
      metric: "All metrics",
      score: bestPipeline?.overall_mean_rank_score ?? null,
      description: "Exploratory pipeline aggregate from global rank scores; not used to replace Fig.2B/C/D conclusions",
    },
    {
      category: "Dashboard reference-free spatial coherence top feature",
      winner: featureDisplayName(referenceFreeBest?.feature, data.featureMetadataByKey),
      metric: "PAS/CHAOS/ASW",
      score: referenceFreeBest?.score ?? null,
      description: "Reference-free aggregate reported separately from HVG and expert-referenced conclusions",
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
          { label: "HVG-ref best", value: featureDisplayName(hvgReferencedBest?.feature, data.featureMetadataByKey), detail: "Paper Fig.2B" },
          { label: "Expert-ref best", value: featureDisplayName(expertReferencedBest?.feature, data.featureMetadataByKey), detail: "Paper Fig.2B" },
          { label: "Optimal method", value: methodClusterDisplayName(paperOptimalMethod), detail: "Paper Fig.2C" },
          { label: "CCST+Leiden best", value: featureDisplayName(String(bestCcst?.feature ?? ""), data.featureMetadataByKey), detail: "Paper Fig.2D" },
          { label: "Best pipeline", value: <span className="text-base">{pipelineDisplayName(String(bestPipeline?.entity_id ?? ""), data.featureMetadataByKey)}</span> },
        ]}
      />

      <ManuscriptHeroCard metadata={data.paperMetadata} />

      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-ink">Champion Board</h2>
          <Badge tone="blue">paper-aligned conclusions</Badge>
        </div>
        <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          The manuscript reports reference-specific conclusions rather than a single universal winner. Cross-metric dashboard
          aggregates are exploratory and should not replace the paper-level conclusions. HVG is a transcriptomic
          baseline/reference, not a pathology foundation model.
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
          <ReactECharts
            option={barOption(
              "Exploratory cross-metric feature aggregate",
              data.crossMetricFeature,
              "entity_id",
              "overall_mean_rank_score",
              (value) => featureDisplayName(value, data.featureMetadataByKey),
            )}
            style={{ height: 360 }}
          />
          <p className="px-2 pb-2 text-xs text-slate-500">Paper-specific winners are reported in the Champion Board above.</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-2 shadow-sm">
          <ReactECharts
            option={barOption(
              methodMeanTie ? "Method clusters: tied cross-feature mean" : "Exploratory method-cluster aggregate",
              data.crossMetricMethodCluster,
              "entity_id",
              "overall_mean_rank_score",
              methodClusterDisplayName,
            )}
            style={{ height: 360 }}
          />
          {methodMeanTie ? (
            <p className="px-2 pb-2 text-xs text-slate-500">All method-cluster means are tied here; the manuscript conclusion remains CCST+Leiden.</p>
          ) : null}
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
