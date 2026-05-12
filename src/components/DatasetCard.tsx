import type { DatasetSummary } from "../types";
import { formatNumber } from "../lib/formatting";
import { Badge } from "./Badge";

export function DatasetCard({ dataset, onClick }: { dataset: DatasetSummary; onClick: () => void }) {
  return (
    <button className="rounded-lg border border-line bg-white p-4 text-left shadow-sm hover:border-brand" onClick={onClick}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="break-words text-sm font-semibold text-ink">{dataset.dataset}</h3>
        <Badge tone={dataset.dataset_type === "DLPFC" ? "violet" : "blue"}>{dataset.dataset_type}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
        <span>features {dataset.n_features}</span>
        <span>pipelines {dataset.n_pipelines}</span>
        <span>main {dataset.main_metric}</span>
        <span>k {formatNumber(dataset.n_clusters_or_k)}</span>
      </div>
      <p className="mt-3 text-xs text-slate-500">Best feature: {dataset.best_feature ?? "NA"}</p>
      {dataset.available_in_spatial_labels ? <div className="mt-2"><Badge tone="green">Spatial labels</Badge></div> : null}
    </button>
  );
}
