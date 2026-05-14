import type { FeatureMetadata, FeatureSummary } from "../types";
import { featureDisplayName, formatNumber, methodClusterDisplayName } from "../lib/formatting";
import { Badge } from "./Badge";

export function FeatureCard({
  feature,
  metadata,
  onClick,
}: {
  feature: FeatureSummary;
  metadata?: FeatureMetadata;
  onClick: () => void;
}) {
  const displayName = metadata?.display_name ?? featureDisplayName(feature.feature);
  const groupLabel = metadata?.group ?? (feature.is_hvg ? "Transcriptomic baseline" : "Pathology/image feature");
  return (
    <button className="rounded-lg border border-line bg-white p-4 text-left shadow-sm hover:border-brand" onClick={onClick}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="break-words text-sm font-semibold text-ink">{displayName}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{metadata?.formal_name ?? feature.feature}</p>
        </div>
        <Badge tone={feature.is_hvg ? "slate" : "blue"}>{feature.is_hvg ? "HVG" : "pathology"}</Badge>
      </div>
      <div className="mb-3">
        <Badge tone={feature.is_hvg ? "slate" : "violet"}>{groupLabel}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
        <span>rank {feature.overall_rank ?? "NA"}</span>
        <span>score {formatNumber(feature.overall_mean_global_rank_score)}</span>
        <span>wins {feature.n_dataset_wins ?? 0}</span>
        <span>pipelines {feature.n_pipeline_wins ?? 0}</span>
      </div>
      <p className="mt-3 text-xs text-slate-500">Best method: {methodClusterDisplayName(feature.best_method_cluster)}</p>
      {metadata?.note ? <p className="mt-2 text-xs text-slate-500">{metadata.note}</p> : null}
      {feature.available_in_spatial_labels ? <div className="mt-2"><Badge tone="green">Spatial labels</Badge></div> : null}
    </button>
  );
}
