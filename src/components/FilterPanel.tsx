import { Filter } from "lucide-react";
import type { FeatureMetadata, FilterState, Manifest } from "../types";
import { datasetTypeDisplayName, featureDisplayName } from "../lib/formatting";
import { MetricSelector } from "./MetricSelector";

export function FilterPanel({
  filters,
  manifest,
  onChange,
  showDatasetType = false,
  showAggregation = false,
  featureMetadataByKey,
}: {
  filters: FilterState;
  manifest: Manifest;
  onChange: (filters: FilterState) => void;
  showDatasetType?: boolean;
  showAggregation?: boolean;
  featureMetadataByKey?: Record<string, FeatureMetadata>;
}) {
  return (
    <div className="mb-4 rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Filter className="h-4 w-4" />
        Filters
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
        <MetricSelector metrics={manifest.metrics} value={filters.selectedMetric} onChange={(selectedMetric) => onChange({ ...filters, selectedMetric })} />
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Reference
          <select
            className="rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
            value={filters.selectedReferenceType}
            onChange={(event) => onChange({ ...filters, selectedReferenceType: event.target.value as FilterState["selectedReferenceType"] })}
          >
            <option value="all">all</option>
            <option value="hvg">hvg</option>
            <option value="gt">gt</option>
            <option value="unsupervised">unsupervised</option>
          </select>
        </label>
        {showDatasetType ? (
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Dataset type
            <select
              className="rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
              value={filters.selectedDatasetType}
              onChange={(event) => onChange({ ...filters, selectedDatasetType: event.target.value as FilterState["selectedDatasetType"] })}
            >
              <option value="all">all</option>
              <option value="DLPFC">DLPFC</option>
              <option value="non_DLPFC">{datasetTypeDisplayName("non_DLPFC")}</option>
            </select>
          </label>
        ) : null}
        {showAggregation ? (
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Aggregation
            <select
              className="rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
              value={filters.aggregation}
              onChange={(event) => onChange({ ...filters, aggregation: event.target.value as FilterState["aggregation"] })}
            >
              <option value="mean">mean</option>
              <option value="median">median</option>
              <option value="max">max</option>
              <option value="min">min</option>
            </select>
          </label>
        ) : null}
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Feature
          <select
            className="rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
            value={filters.selectedFeatures[0] ?? "all"}
            onChange={(event) =>
              onChange({
                ...filters,
                selectedFeatures: event.target.value === "all" ? [] : [event.target.value],
              })
            }
          >
            <option value="all">all features</option>
            {manifest.features.map((feature) => (
              <option key={feature} value={feature}>
                {featureDisplayName(feature, featureMetadataByKey)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Top N
          <input
            className="rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
            type="number"
            min={5}
            max={200}
            value={filters.topN}
            onChange={(event) => onChange({ ...filters, topN: Number(event.target.value) || 20 })}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Search
          <input
            className="rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
            value={filters.searchText}
            onChange={(event) => onChange({ ...filters, searchText: event.target.value })}
            placeholder="Feature, method, dataset"
          />
        </label>
      </div>
    </div>
  );
}
