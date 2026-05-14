import { useMemo, useState } from "react";
import type { DashboardData, FeatureSummary } from "../types";
import { FeatureCard } from "../components/FeatureCard";
import { DetailDrawer } from "../components/DetailDrawer";
import { EmptyState } from "../components/EmptyState";
import { featureSearchText } from "../lib/formatting";

export function FeaturePage({ data }: { data: DashboardData }) {
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [detail, setDetail] = useState<FeatureSummary | null>(null);
  const rows = useMemo(
    () =>
      data.featureSummary.filter((row) => {
        if (group === "hvg" && !row.is_hvg) return false;
        if (group === "pathology" && !row.is_pathology_feature) return false;
        const query = search.toLowerCase().trim();
        if (!query) return true;
        return featureSearchText(row.feature, data.featureMetadataByKey).includes(query);
      }),
    [data.featureMetadataByKey, data.featureSummary, group, search],
  );
  const detailRow = detail
    ? {
        ...detail,
        feature_display_name: data.featureMetadataByKey[detail.feature]?.display_name ?? detail.feature,
        raw_feature_key: detail.feature,
        feature_paper_name: data.featureMetadataByKey[detail.feature]?.paper_name ?? null,
        feature_formal_name: data.featureMetadataByKey[detail.feature]?.formal_name ?? null,
        feature_group: data.featureMetadataByKey[detail.feature]?.group ?? null,
        feature_note: data.featureMetadataByKey[detail.feature]?.note ?? null,
      }
    : null;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Features</h1>
        <p className="mt-1 text-sm text-slate-600">Feature summaries are ranked by mean global rank score.</p>
      </div>
      <div className="grid gap-3 rounded-lg border border-line bg-white p-4 md:grid-cols-3">
        <input
          className="rounded-md border border-line px-3 py-2 text-sm"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search feature"
        />
        <select className="rounded-md border border-line px-3 py-2 text-sm" value={group} onChange={(event) => setGroup(event.target.value)}>
          <option value="all">all features</option>
          <option value="hvg">HVG</option>
          <option value="pathology">pathology/image</option>
        </select>
      </div>
      {rows.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {rows.map((feature) => (
            <FeatureCard
              key={feature.feature}
              feature={feature}
              metadata={data.featureMetadataByKey[feature.feature]}
              onClick={() => setDetail(feature)}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No features match the filters" />
      )}
      <DetailDrawer title="Feature details" row={detailRow as Record<string, unknown> | null} featureMetadataByKey={data.featureMetadataByKey} onClose={() => setDetail(null)} />
    </div>
  );
}
