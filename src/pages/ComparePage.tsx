import { useMemo, useState } from "react";
import type { DashboardData } from "../types";
import { ComparePanel } from "../components/ComparePanel";
import { SummaryCards } from "../components/SummaryCards";
import { featureDisplayName, formatNumber } from "../lib/formatting";
import { meanSkipNaN } from "../lib/aggregation";

export function ComparePage({ data }: { data: DashboardData }) {
  const features = data.manifest.features;
  const [a, setA] = useState(features[0] ?? "");
  const [b, setB] = useState(features.find((feature) => feature !== a) ?? features[0] ?? "");

  const metricCompare = useMemo(() => {
    const labels = data.manifest.metrics.map((metric) => metric.metric_id);
    const valuesA = labels.map((metric) => meanSkipNaN(data.rankScores.filter((row) => row.feature === a && row.metric_id === metric).map((row) => row.global_rank_score)) ?? 0);
    const valuesB = labels.map((metric) => meanSkipNaN(data.rankScores.filter((row) => row.feature === b && row.metric_id === metric).map((row) => row.global_rank_score)) ?? 0);
    return { labels, valuesA, valuesB };
  }, [a, b, data.manifest.metrics, data.rankScores]);

  const datasetWins = useMemo(() => {
    let aWins = 0;
    let bWins = 0;
    let ties = 0;
    data.manifest.datasets.forEach((dataset) => {
      const summary = data.datasetSummary.find((row) => row.dataset === dataset);
      const metric = summary?.main_metric ?? "ARI_hvg";
      const scoreA = meanSkipNaN(data.metricsLong.filter((row) => row.dataset === dataset && row.feature === a && row.metric_id === metric).map((row) => row.dataset_rank_score));
      const scoreB = meanSkipNaN(data.metricsLong.filter((row) => row.dataset === dataset && row.feature === b && row.metric_id === metric).map((row) => row.dataset_rank_score));
      if (scoreA === null || scoreB === null) return;
      if (Math.abs(scoreA - scoreB) < 1e-9) ties += 1;
      else if (scoreA > scoreB) aWins += 1;
      else bWins += 1;
    });
    return { aWins, bWins, ties };
  }, [a, b, data.datasetSummary, data.manifest.datasets, data.metricsLong]);

  const meanA = meanSkipNaN(data.rankScores.filter((row) => row.feature === a).map((row) => row.global_rank_score));
  const meanB = meanSkipNaN(data.rankScores.filter((row) => row.feature === b).map((row) => row.global_rank_score));
  const displayA = featureDisplayName(a, data.featureMetadataByKey);
  const displayB = featureDisplayName(b, data.featureMetadataByKey);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Compare</h1>
        <p className="mt-1 text-sm text-slate-600">Feature comparison combines global rank summaries with dataset-level local wins.</p>
      </div>
      <div className="grid gap-3 rounded-lg border border-line bg-white p-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Feature A
          <select className="rounded-md border border-line px-3 py-2 text-sm" value={a} onChange={(event) => setA(event.target.value)}>
            {features.map((feature) => <option key={feature} value={feature}>{featureDisplayName(feature, data.featureMetadataByKey)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Feature B
          <select className="rounded-md border border-line px-3 py-2 text-sm" value={b} onChange={(event) => setB(event.target.value)}>
            {features.map((feature) => <option key={feature} value={feature}>{featureDisplayName(feature, data.featureMetadataByKey)}</option>)}
          </select>
        </label>
      </div>
      <SummaryCards
        cards={[
          { label: `${displayA} global mean`, value: formatNumber(meanA) },
          { label: `${displayB} global mean`, value: formatNumber(meanB) },
          { label: `${displayA} dataset wins`, value: datasetWins.aWins },
          { label: `${displayB} dataset wins`, value: datasetWins.bWins, detail: `${datasetWins.ties} ties` },
        ]}
      />
      <div className="rounded-lg border border-line bg-white p-2 shadow-sm">
        <ComparePanel title="Metric-wise global rank score" labels={metricCompare.labels} a={metricCompare.valuesA} b={metricCompare.valuesB} seriesNames={[displayA, displayB]} />
      </div>
    </div>
  );
}
