import { X } from "lucide-react";
import type { FeatureMetadata } from "../types";
import {
  asText,
  clusterMethodDisplayName,
  featureDisplayName,
  methodClusterDisplayName,
  pipelineDisplayName,
  spatialMethodDisplayName,
} from "../lib/formatting";

function detailValue(key: string, value: unknown, featureMetadataByKey?: Record<string, FeatureMetadata>) {
  if (typeof value !== "string") return asText(value);
  if (key === "feature" || key === "best_feature") {
    const display = featureDisplayName(value, featureMetadataByKey);
    return display === value ? value : `${display} (raw: ${value})`;
  }
  if (key === "entity_id" && featureMetadataByKey?.[value]) {
    const display = featureDisplayName(value, featureMetadataByKey);
    return display === value ? value : `${display} (raw: ${value})`;
  }
  if (key === "pipeline_id" || key === "best_pipeline_id" || key === "entity_id") {
    const display = pipelineDisplayName(value, featureMetadataByKey);
    return display === value ? value : `${display} (raw: ${value})`;
  }
  if (key === "method_cluster" || key === "best_method_cluster") {
    const display = methodClusterDisplayName(value);
    return display === value ? value : `${display} (raw: ${value})`;
  }
  if (key === "spatial_method") return spatialMethodDisplayName(value);
  if (key === "cluster_method") return clusterMethodDisplayName(value);
  if (key === "source_url" && value !== "NA") {
    return (
      <a href={value} target="_blank" rel="noreferrer" className="text-brand underline underline-offset-2">
        {value}
      </a>
    );
  }
  return asText(value);
}

export function DetailDrawer({
  title,
  row,
  onClose,
  featureMetadataByKey,
}: {
  title: string;
  row: Record<string, unknown> | null;
  onClose: () => void;
  featureMetadataByKey?: Record<string, FeatureMetadata>;
}) {
  if (!row) return null;
  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-line bg-white p-5 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <button className="rounded-md p-2 hover:bg-slate-100" onClick={onClose} aria-label="Close details">
          <X className="h-5 w-5" />
        </button>
      </div>
      <dl className="grid grid-cols-1 gap-3 text-sm">
        {Object.entries(row).map(([key, value]) => (
          <div key={key} className="rounded-md border border-line bg-slate-50 p-3">
            <dt className="text-xs font-semibold uppercase text-slate-500">{key}</dt>
            <dd className="mt-1 break-words text-slate-800">{detailValue(key, value, featureMetadataByKey)}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
