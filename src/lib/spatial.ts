import type { SpatialLabelManifestItem, SpatialPoint } from "../types";

export function findSpatialLabel(
  manifest: SpatialLabelManifestItem[],
  dataset: string,
  feature: string,
): SpatialLabelManifestItem | undefined {
  return manifest.find((item) => item.dataset === dataset && item.feature === feature);
}

export function hasGroundTruth(points: SpatialPoint[]): boolean {
  return points.some((point) => point.gt_label !== null && point.gt_label !== "");
}

export function spatialExtent(points: SpatialPoint[]): { minX: number; maxX: number; minY: number; maxY: number } | null {
  const xs = points.map((point) => point.x).filter(Number.isFinite);
  const ys = points.map((point) => point.y).filter(Number.isFinite);
  if (!xs.length || !ys.length) return null;
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}
