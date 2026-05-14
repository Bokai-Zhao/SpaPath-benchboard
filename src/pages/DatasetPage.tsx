import { useMemo, useState } from "react";
import type { DashboardData, DatasetSummary } from "../types";
import { DatasetCard } from "../components/DatasetCard";
import { DetailDrawer } from "../components/DetailDrawer";
import { EmptyState } from "../components/EmptyState";

export function DatasetPage({ data }: { data: DashboardData }) {
  const [search, setSearch] = useState("");
  const [datasetType, setDatasetType] = useState("all");
  const [detail, setDetail] = useState<DatasetSummary | null>(null);
  const rows = useMemo(
    () =>
      data.datasetSummary.filter((row) => {
        if (datasetType !== "all" && row.dataset_type !== datasetType) return false;
        const source = data.datasetSourceLinksByKey[row.dataset];
        const query = search.toLowerCase().trim();
        if (!query) return true;
        return [row.dataset, source?.display_title, source?.source_name, source?.source_status, source?.search_query]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      }),
    [data.datasetSourceLinksByKey, data.datasetSummary, datasetType, search],
  );
  const detailRow = detail
    ? {
        raw_dataset_key: detail.dataset,
        display_title: data.datasetSourceLinksByKey[detail.dataset]?.display_title ?? detail.dataset,
        source_name: data.datasetSourceLinksByKey[detail.dataset]?.source_name ?? "Source pending",
        source_url: data.datasetSourceLinksByKey[detail.dataset]?.source_url ?? null,
        source_status: data.datasetSourceLinksByKey[detail.dataset]?.source_status ?? "missing",
        search_query: data.datasetSourceLinksByKey[detail.dataset]?.search_query ?? null,
        source_note: data.datasetSourceLinksByKey[detail.dataset]?.note ?? null,
        ...detail,
      }
    : null;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Datasets</h1>
        <p className="mt-1 text-sm text-slate-600">
          Dataset cards summarize local raw-metric rankings, spatial-label availability, and public source links when available.
        </p>
      </div>
      <div className="grid gap-3 rounded-lg border border-line bg-white p-4 md:grid-cols-3">
        <input
          className="rounded-md border border-line px-3 py-2 text-sm"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search dataset"
        />
        <select className="rounded-md border border-line px-3 py-2 text-sm" value={datasetType} onChange={(event) => setDatasetType(event.target.value)}>
          <option value="all">all dataset types</option>
          <option value="DLPFC">DLPFC</option>
          <option value="non_DLPFC">non_DLPFC</option>
        </select>
      </div>
      {rows.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((dataset) => (
            <DatasetCard
              key={dataset.dataset}
              dataset={dataset}
              source={data.datasetSourceLinksByKey[dataset.dataset]}
              featureMetadataByKey={data.featureMetadataByKey}
              onClick={() => setDetail(dataset)}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No datasets match the filters" />
      )}
      <DetailDrawer title="Dataset details" row={detailRow as Record<string, unknown> | null} featureMetadataByKey={data.featureMetadataByKey} onClose={() => setDetail(null)} />
    </div>
  );
}
