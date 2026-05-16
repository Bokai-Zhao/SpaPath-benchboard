# SpaPath-BenchBoard

Interactive Vite + React + TypeScript dashboard for SpaPath-Bench results. The app is designed for GitHub Pages and reads only lightweight files under `public/data/`.

Repository: https://github.com/Bokai-Zhao/SpaPath-benchboard

Default GitHub Pages URL: https://bokai-zhao.github.io/SpaPath-benchboard/

## Data Contract

The preprocessing script reads exactly three parquet files:

- `rank_scores_merged.parquet`: authoritative source for `global_rank_score`.
- `pfmc_metrics_11.parquet`: raw metrics for dataset-level views, details, and spatial-gallery metric panels.
- `pfmc_all_labels.parquet`: spatial points for `Result_seed0 + ccst + leiden`, split into small `dataset + feature` JSON files.

The frontend never reads parquet files directly.

## Metric Semantics

The dashboard uses exactly 11 precomputed raw metric columns: `PAS`, `CHAOS`, `ASW`, `ARI_hvg`, `NMI_hvg`, `HOM_hvg`, `COM_hvg`, `ARI_gt`, `NMI_gt`, `HOM_gt`, and `COM_gt`.

- Reference-free metrics: `PAS`, `CHAOS`, `ASW`.
- HVG-referenced metrics for transcriptomics pseudo-reference agreement: `*_hvg`.
- Expert-referenced metrics for DLPFC ground-truth agreement: `*_gt`.
- Lower is better only for `PAS` and `CHAOS`; all other metrics are higher-is-better.

The metric metadata lives in `scripts/prepare_dashboard_data.py` and is emitted to `public/data/manifest.json`; frontend controls read that manifest instead of maintaining a second metric definition table.

## Global Rank Score vs Dataset Rank Score

`global_rank_score` comes from `rank_scores_merged.parquet`. It is the benchmark-level ranking signal and is used for global leaderboards, cross-metric summaries, heatmaps, and comparisons.

`dataset_rank_score` is computed from raw metrics within each `dataset + metric_id` group. It is only used for dataset-level local analysis. Ties use average rank, and missing values are skipped.

## Prepare Data

From this project directory:

```powershell
python scripts/prepare_dashboard_data.py `
  --rank-scores "data/raw/rank_scores_merged.parquet" `
  --metrics "data/raw/pfmc_metrics_11.parquet" `
  --labels "data/raw/pfmc_all_labels.parquet" `
  --out public\data
```

Linux/server:

```bash
python scripts/prepare_dashboard_data.py \
  --rank-scores data/raw/rank_scores_merged.parquet \
  --metrics data/raw/pfmc_metrics_11.parquet \
  --labels data/raw/pfmc_all_labels.parquet \
  --out public/data
```

Use local or private storage for the raw parquet files and replace the example paths as needed. Do not commit machine-specific absolute paths.

The script generates `manifest.json`, long CSV tables, leaderboard JSON files, summary JSON files, and split files under `public/data/spatial_labels/`.

## Install

```bash
npm install
```

## Local Preview

```bash
npm run dev
```

Open the URL printed by Vite.

## Build

```bash
npm run build
```

The static site is emitted to `dist/`.

## Deploy to GitHub Pages

Commit `public/data/` after running preprocessing, then push to the `main` branch of `Bokai-Zhao/SpaPath-benchboard`. The workflow at `.github/workflows/deploy.yml` installs dependencies, runs `npm run build`, and deploys `dist/` to GitHub Pages. It does not access local machine-specific data paths.

To connect this local checkout to the target GitHub repository:

```bash
git remote set-url origin https://github.com/Bokai-Zhao/SpaPath-benchboard.git
git branch -M main
git push -u origin main
```

In the GitHub repository settings, open **Settings > Pages** and set **Build and deployment > Source** to **GitHub Actions**. If `https://bokai-zhao.github.io/SpaPath-benchboard/` still returns an HTML file that points to `/src/main.tsx`, GitHub Pages is publishing `main/root` directly instead of the built `dist/` artifact.

For this repository path, you can also build with an explicit base:

```bash
VITE_BASE_PATH=/SpaPath-benchboard/ npm run build
```

The default `base` is `./`, which works well for static GitHub Pages deployments with hash-based navigation.

## Updating Data

Replace the three parquet files, rerun `scripts/prepare_dashboard_data.py`, review the generated files under `public/data/`, and rebuild.

## Adding a Metric

Add the metric column to the upstream parquet files using either `rank_score_<metric>` for global rank scores or `<metric>` for raw metrics. Then update `METRIC_ORDER` in `scripts/prepare_dashboard_data.py` if you need a stable display order.

## Current Limitations

- Metrics are primarily based on `Result_seed0` in the raw metric table.
- Spatial labels are only available for `ccst + leiden`.
- The dashboard displays prepared benchmark outputs; it does not recompute raw algorithm metrics.

## Troubleshooting

- Missing parquet: verify the three input paths passed to the preprocessing script.
- Missing `public/data`: rerun `scripts/prepare_dashboard_data.py`.
- GitHub Pages path issue: set `VITE_BASE_PATH=/SpaPath-benchboard/` before building.
- Metric all NaN: affected charts and tables show empty states instead of failing.
