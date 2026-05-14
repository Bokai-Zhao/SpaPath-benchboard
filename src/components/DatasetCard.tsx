import type { DatasetSourceLink, DatasetSummary, FeatureMetadata } from "../types";
import { datasetTypeDisplayName, featureDisplayName, formatNumber, methodClusterDisplayName } from "../lib/formatting";
import { Badge } from "./Badge";

function sourceStatusLabel(source?: DatasetSourceLink): string {
  if (!source?.source_status) return "Source pending";
  if (source.source_status === "verified") return "Source verified";
  if (source.source_status === "external_non_10x") return "External source";
  if (source.source_status === "missing") return "Source missing";
  return "Needs verification";
}

export function DatasetCard({
  dataset,
  source,
  featureMetadataByKey,
  onClick,
}: {
  dataset: DatasetSummary;
  source?: DatasetSourceLink;
  featureMetadataByKey?: Record<string, FeatureMetadata>;
  onClick: () => void;
}) {
  const title = source?.display_title ?? dataset.dataset;
  return (
    <article
      className="cursor-pointer rounded-lg border border-line bg-white p-4 text-left shadow-sm hover:border-brand"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onClick();
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="break-words text-sm font-semibold text-ink">{title}</h3>
          <p className="mt-0.5 break-words text-xs text-slate-500">{dataset.dataset}</p>
        </div>
        <Badge tone={dataset.dataset_type === "DLPFC" ? "violet" : "blue"}>{datasetTypeDisplayName(dataset.dataset_type)}</Badge>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <Badge tone={source?.source_url ? "green" : "amber"}>{sourceStatusLabel(source)}</Badge>
        {source?.source_url ? (
          <a
            className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
            href={source.source_url}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
          >
            10x source
          </a>
        ) : (
          <Badge tone="amber">Source pending</Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
        <span>features {dataset.n_features}</span>
        <span>pipelines {dataset.n_pipelines}</span>
        <span>main {dataset.main_metric}</span>
        <span>k {formatNumber(dataset.n_clusters_or_k)}</span>
      </div>
      <p className="mt-3 text-xs text-slate-500">Best feature: {featureDisplayName(dataset.best_feature, featureMetadataByKey)}</p>
      <p className="mt-1 text-xs text-slate-500">Best method: {methodClusterDisplayName(dataset.best_method_cluster)}</p>
      {dataset.available_in_spatial_labels ? <div className="mt-2"><Badge tone="green">Spatial labels</Badge></div> : null}
    </article>
  );
}
