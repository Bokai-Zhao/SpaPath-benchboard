import { useEffect, useMemo, useState } from "react";
import type { DashboardData, SpatialPoint } from "../types";
import { loadSpatialLabels } from "../lib/loadData";
import { hasGroundTruth } from "../lib/spatial";
import { formatNumber } from "../lib/formatting";
import { SpatialScatter } from "../components/SpatialScatter";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { Badge } from "../components/Badge";

type LabelMode = "prediction" | "ground_truth" | "side_by_side";

export function SpatialGalleryPage({ data }: { data: DashboardData }) {
  const datasets = useMemo(() => Array.from(new Set(data.spatialLabelsManifest.map((item) => item.dataset))).sort(), [data.spatialLabelsManifest]);
  const [dataset, setDataset] = useState(datasets[0] ?? "");
  const features = useMemo(
    () => data.spatialLabelsManifest.filter((item) => item.dataset === dataset).map((item) => item.feature).sort(),
    [data.spatialLabelsManifest, dataset],
  );
  const [feature, setFeature] = useState(features[0] ?? "");
  const [points, setPoints] = useState<SpatialPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [labelMode, setLabelMode] = useState<LabelMode>("prediction");
  const [pointSize, setPointSize] = useState(3);
  const [opacity, setOpacity] = useState(0.8);

  useEffect(() => {
    if (!features.includes(feature)) setFeature(features[0] ?? "");
  }, [feature, features]);

  const item = data.spatialLabelsManifest.find((entry) => entry.dataset === dataset && entry.feature === feature);

  useEffect(() => {
    let cancelled = false;
    if (!item) {
      setPoints([]);
      return;
    }
    setError(null);
    loadSpatialLabels(item.file)
      .then((loaded) => {
        if (!cancelled) {
          setPoints(loaded);
          setLabelMode(item.has_gt_label ? "side_by_side" : "prediction");
        }
      })
      .catch((caught: Error) => {
        if (!cancelled) setError(caught.message);
      });
    return () => {
      cancelled = true;
    };
  }, [item]);

  const gtAvailable = hasGroundTruth(points);
  const metricRows = data.metricsLong.filter(
    (row) => row.dataset === dataset && row.feature === feature && row.spatial_method === "ccst" && row.cluster_method === "leiden",
  );
  const visibleMetrics = metricRows.filter((row) => row.raw_value !== null).slice(0, 11);

  if (!data.spatialLabelsManifest.length) return <EmptyState title="No spatial label files were generated" />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Spatial Gallery</h1>
        <p className="mt-1 text-sm text-slate-600">Spatial points are loaded on demand from dataset-feature JSON files.</p>
      </div>
      <div className="grid gap-3 rounded-lg border border-line bg-white p-4 lg:grid-cols-6">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 lg:col-span-2">
          Dataset
          <select className="rounded-md border border-line px-3 py-2 text-sm" value={dataset} onChange={(event) => setDataset(event.target.value)}>
            {datasets.map((name) => <option key={name}>{name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 lg:col-span-2">
          Feature
          <select className="rounded-md border border-line px-3 py-2 text-sm" value={feature} onChange={(event) => setFeature(event.target.value)}>
            {features.map((name) => <option key={name}>{name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Point size
          <input type="range" min={1} max={8} value={pointSize} onChange={(event) => setPointSize(Number(event.target.value))} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Opacity
          <input type="range" min={0.2} max={1} step={0.05} value={opacity} onChange={(event) => setOpacity(Number(event.target.value))} />
        </label>
        <div className="flex flex-wrap items-end gap-2 lg:col-span-6">
          <button className={`rounded-md px-3 py-2 text-sm ${labelMode === "prediction" ? "bg-brand text-white" : "bg-slate-100"}`} onClick={() => setLabelMode("prediction")}>
            Prediction
          </button>
          {gtAvailable ? (
            <>
              <button className={`rounded-md px-3 py-2 text-sm ${labelMode === "ground_truth" ? "bg-brand text-white" : "bg-slate-100"}`} onClick={() => setLabelMode("ground_truth")}>
                Ground truth
              </button>
              <button className={`rounded-md px-3 py-2 text-sm ${labelMode === "side_by_side" ? "bg-brand text-white" : "bg-slate-100"}`} onClick={() => setLabelMode("side_by_side")}>
                Side-by-side
              </button>
            </>
          ) : (
            <Badge tone="amber">No ground truth labels available</Badge>
          )}
          {item ? <Badge tone="green">{item.n_points.toLocaleString()} points</Badge> : null}
        </div>
      </div>

      {error ? <ErrorState title="Spatial label file could not be loaded" path={item?.file} detail={error} /> : null}
      {!item ? <EmptyState title="No spatial file for this dataset and feature" /> : null}
      {item && !error ? (
        <div className={`grid gap-4 ${labelMode === "side_by_side" && gtAvailable ? "xl:grid-cols-2" : ""}`}>
          {(labelMode === "prediction" || labelMode === "side_by_side") && (
            <div className="rounded-lg border border-line bg-white p-2 shadow-sm">
              <SpatialScatter points={points} labelKey="label" pointSize={pointSize} opacity={opacity} title="Prediction label" />
            </div>
          )}
          {gtAvailable && (labelMode === "ground_truth" || labelMode === "side_by_side") && (
            <div className="rounded-lg border border-line bg-white p-2 shadow-sm">
              <SpatialScatter points={points} labelKey="gt_label" pointSize={pointSize} opacity={opacity} title="Ground truth label" />
            </div>
          )}
        </div>
      ) : null}

      <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-ink">Metrics for ccst + leiden</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {visibleMetrics.map((row) => (
            <div key={row.metric_id} className="rounded-md border border-line bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-500">{row.metric_id}</div>
              <div className="mt-1 text-lg font-semibold text-ink">{formatNumber(row.raw_value)}</div>
              <div className="text-xs text-slate-500">dataset rank score {formatNumber(row.dataset_rank_score)}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
