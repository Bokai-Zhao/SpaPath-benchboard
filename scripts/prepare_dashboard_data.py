#!/usr/bin/env python
"""Prepare lightweight dashboard data from the three curated parquet files."""

from __future__ import annotations

import argparse
import json
import math
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

import numpy as np
import pandas as pd


RANK_ID_COLUMNS = [
    "feature",
    "context_key",
    "spatial_method",
    "cluster_method",
    "seed_label",
    "random_seed",
]

METRIC_INFO = {
    "PAS": {
        "metric_family": "PAS",
        "reference_type": "unsupervised",
        "higher_is_better": False,
        "short_name": "PAS",
        "display_name": "Patch Adjacency Score",
        "description": "Reference-free local spatial neighborhood consistency. Lower is better.",
        "main_for": ["all"],
    },
    "CHAOS": {
        "metric_family": "CHAOS",
        "reference_type": "unsupervised",
        "higher_is_better": False,
        "short_name": "CHAOS",
        "display_name": "CHAOS",
        "description": "Reference-free spatial dispersion or spatial disorder of predicted domains. Lower is better.",
        "main_for": ["all"],
    },
    "ASW": {
        "metric_family": "ASW",
        "reference_type": "unsupervised",
        "higher_is_better": True,
        "short_name": "ASW",
        "display_name": "Average Silhouette Width",
        "description": "Reference-free latent-space cluster separation. Higher is better.",
        "main_for": ["all"],
    },
    "ARI_hvg": {
        "metric_family": "ARI",
        "reference_type": "hvg",
        "higher_is_better": True,
        "short_name": "ARI-HVG",
        "display_name": "ARI against HVG pseudo-reference",
        "description": "Adjusted Rand Index comparing predicted domains with HVG-derived pseudo-reference labels. Higher is better.",
        "main_for": ["non_DLPFC"],
    },
    "NMI_hvg": {
        "metric_family": "NMI",
        "reference_type": "hvg",
        "higher_is_better": True,
        "short_name": "NMI-HVG",
        "display_name": "NMI against HVG pseudo-reference",
        "description": "Normalized Mutual Information comparing predicted domains with HVG-derived pseudo-reference labels. Higher is better.",
        "main_for": ["non_DLPFC"],
    },
    "HOM_hvg": {
        "metric_family": "HOM",
        "reference_type": "hvg",
        "higher_is_better": True,
        "short_name": "HOM-HVG",
        "display_name": "Homogeneity against HVG pseudo-reference",
        "description": "Cluster purity relative to HVG-derived pseudo-reference labels. Higher is better.",
        "main_for": ["non_DLPFC"],
    },
    "COM_hvg": {
        "metric_family": "COM",
        "reference_type": "hvg",
        "higher_is_better": True,
        "short_name": "COM-HVG",
        "display_name": "Completeness against HVG pseudo-reference",
        "description": "Completeness of recovering each HVG-derived pseudo-reference domain. Higher is better.",
        "main_for": ["non_DLPFC"],
    },
    "ARI_gt": {
        "metric_family": "ARI",
        "reference_type": "gt",
        "higher_is_better": True,
        "short_name": "ARI-GT",
        "display_name": "ARI against expert ground truth",
        "description": "Adjusted Rand Index comparing predicted domains with expert annotations. Higher is better.",
        "main_for": ["DLPFC"],
    },
    "NMI_gt": {
        "metric_family": "NMI",
        "reference_type": "gt",
        "higher_is_better": True,
        "short_name": "NMI-GT",
        "display_name": "NMI against expert ground truth",
        "description": "Normalized Mutual Information comparing predicted domains with expert annotations. Higher is better.",
        "main_for": ["DLPFC"],
    },
    "HOM_gt": {
        "metric_family": "HOM",
        "reference_type": "gt",
        "higher_is_better": True,
        "short_name": "HOM-GT",
        "display_name": "Homogeneity against expert ground truth",
        "description": "Cluster purity relative to expert annotations. Higher is better.",
        "main_for": ["DLPFC"],
    },
    "COM_gt": {
        "metric_family": "COM",
        "reference_type": "gt",
        "higher_is_better": True,
        "short_name": "COM-GT",
        "display_name": "Completeness against expert ground truth",
        "description": "Completeness of recovering each expert-annotated domain. Higher is better.",
        "main_for": ["DLPFC"],
    },
}

METRIC_ORDER = list(METRIC_INFO.keys())


def log(message: str) -> None:
    print(f"[prepare-dashboard-data] {message}", flush=True)


def metric_record(metric_id: str) -> dict[str, Any]:
    return {"metric_id": metric_id, **METRIC_INFO[metric_id]}


def safe_name(value: Any) -> str:
    text = str(value)
    text = re.sub(r"[^A-Za-z0-9_-]+", "_", text).strip("_")
    return text or "unknown"


def jsonable(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    if value is pd.NA:
        return None
    if isinstance(value, np.generic):
        return jsonable(value.item())
    if isinstance(value, dict):
        return {str(k): jsonable(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [jsonable(v) for v in value]
    return value


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(jsonable(data), handle, ensure_ascii=False, separators=(",", ":"))


def write_records(path: Path, records: list[dict[str, Any]]) -> None:
    write_json(path, records)


def require_columns(df: pd.DataFrame, columns: Iterable[str], source: str) -> None:
    missing = [column for column in columns if column not in df.columns]
    if missing:
        raise ValueError(f"{source} is missing required columns: {missing}")


def valid_values(series: pd.Series) -> pd.Series:
    return pd.to_numeric(series, errors="coerce").dropna()


def aggregate_values(series: pd.Series) -> dict[str, Any]:
    values = valid_values(series)
    if values.empty:
        return {
            "mean": None,
            "median": None,
            "std": None,
            "min": None,
            "max": None,
            "n_valid": 0,
        }
    return {
        "mean": float(values.mean()),
        "median": float(values.median()),
        "std": float(values.std(ddof=0)),
        "min": float(values.min()),
        "max": float(values.max()),
        "n_valid": int(values.shape[0]),
    }


def first_best_row(group: pd.DataFrame, score_col: str) -> pd.Series | None:
    valid = group[pd.notna(group[score_col])]
    if valid.empty:
        return None
    return valid.loc[valid[score_col].idxmax()]


def tied_best_value(group: pd.DataFrame, score_col: str, value_col: str, plural_label: str) -> Any:
    valid = group[pd.notna(group[score_col])]
    if valid.empty or value_col not in valid.columns:
        return None
    max_score = valid[score_col].max()
    tied = valid[valid[score_col].eq(max_score)]
    values = sorted(tied[value_col].dropna().astype(str).unique().tolist())
    if not values:
        return None
    if len(values) == 1:
        return values[0]
    return f"Tie: {len(values)} {plural_label}"


def sorted_records(df: pd.DataFrame, sort_cols: list[str]) -> list[dict[str, Any]]:
    if df.empty:
        return []
    return df.sort_values(sort_cols, ascending=[False if "score" in col or col == "n_wins" else True for col in sort_cols]).to_dict(
        orient="records"
    )


def add_rank_common_columns(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out["method_cluster"] = out["spatial_method"].astype(str) + " || " + out["cluster_method"].astype(str)
    out["pipeline_id"] = (
        out["feature"].astype(str)
        + " || "
        + out["spatial_method"].astype(str)
        + " || "
        + out["cluster_method"].astype(str)
    )
    out["is_hvg"] = out["feature"].astype(str).eq("HVG")
    out["is_pathology_feature"] = ~out["is_hvg"]
    return out


def normalize_global_scores(long_df: pd.DataFrame) -> pd.DataFrame:
    out = long_df.copy()
    out["normalized_global_rank_score"] = np.nan
    for metric_id, idx in out.groupby("metric_id").groups.items():
        values = pd.to_numeric(out.loc[idx, "global_rank_score"], errors="coerce")
        max_value = values.max(skipna=True)
        if pd.notna(max_value) and float(max_value) != 0.0:
            out.loc[idx, "normalized_global_rank_score"] = values / max_value
    return out


def process_rank_scores(rank_path: Path, out_dir: Path) -> tuple[pd.DataFrame, dict[str, list[dict[str, Any]]]]:
    log(f"Reading global rank scores: {rank_path}")
    rank_df = pd.read_parquet(rank_path)
    require_columns(rank_df, RANK_ID_COLUMNS, "rank_scores_merged.parquet")
    rank_columns = [f"rank_score_{metric}" for metric in METRIC_ORDER if f"rank_score_{metric}" in rank_df.columns]
    if not rank_columns:
        raise ValueError("rank_scores_merged.parquet has no rank_score_* metric columns.")

    long_df = rank_df.melt(
        id_vars=RANK_ID_COLUMNS,
        value_vars=rank_columns,
        var_name="rank_score_column",
        value_name="global_rank_score",
    )
    long_df["metric_id"] = long_df["rank_score_column"].str.replace("rank_score_", "", regex=False)
    long_df = long_df.drop(columns=["rank_score_column"])
    for field in ["metric_family", "reference_type", "higher_is_better"]:
        long_df[field] = long_df["metric_id"].map(lambda metric: METRIC_INFO[metric][field])
    long_df = add_rank_common_columns(long_df)
    long_df = normalize_global_scores(long_df)

    column_order = [
        "feature",
        "context_key",
        "spatial_method",
        "cluster_method",
        "seed_label",
        "random_seed",
        "metric_id",
        "metric_family",
        "reference_type",
        "higher_is_better",
        "global_rank_score",
        "normalized_global_rank_score",
        "is_hvg",
        "is_pathology_feature",
        "method_cluster",
        "pipeline_id",
    ]
    long_df = long_df[column_order]
    long_df.to_csv(out_dir / "rank_scores_long.csv", index=False, na_rep="")
    log(f"Wrote {out_dir / 'rank_scores_long.csv'} with {len(long_df):,} rows")

    outputs = {
        "leaderboard_feature": build_feature_leaderboard(long_df),
        "leaderboard_method_cluster": build_method_cluster_leaderboard(long_df),
        "leaderboard_pipeline": build_pipeline_leaderboard(long_df),
        "leaderboard_ccst_leiden_feature": build_ccst_leiden_leaderboard(long_df),
        "cross_metric_feature": build_cross_metric_summary(long_df, "feature", ["feature"]),
        "cross_metric_method_cluster": build_cross_metric_summary(
            long_df, "method_cluster", ["method_cluster", "spatial_method", "cluster_method"]
        ),
        "cross_metric_pipeline": build_cross_metric_summary(
            long_df, "pipeline", ["pipeline_id", "feature", "spatial_method", "cluster_method", "method_cluster"]
        ),
    }
    for name, records in outputs.items():
        write_records(out_dir / f"{name}.json", records)
        log(f"Wrote {name}.json with {len(records):,} records")
    return long_df, outputs


def win_counts(df: pd.DataFrame, compare_cols: list[str], entity_cols: list[str]) -> dict[tuple[Any, ...], int]:
    valid = df.dropna(subset=["global_rank_score"]).copy()
    if valid.empty:
        return {}
    valid["_max_score"] = valid.groupby(compare_cols)["global_rank_score"].transform("max")
    winners = valid[valid["global_rank_score"].eq(valid["_max_score"])]
    counts = winners.groupby(entity_cols).size()
    return {key if isinstance(key, tuple) else (key,): int(value) for key, value in counts.items()}


def build_feature_leaderboard(long_df: pd.DataFrame) -> list[dict[str, Any]]:
    wins = win_counts(long_df, ["metric_id", "context_key"], ["metric_id", "feature"])
    records: list[dict[str, Any]] = []
    for (metric_id, feature), group in long_df.groupby(["metric_id", "feature"], dropna=False):
        score = aggregate_values(group["global_rank_score"])
        norm = aggregate_values(group["normalized_global_rank_score"])
        records.append(
            {
                "metric_id": metric_id,
                "metric_family": METRIC_INFO[metric_id]["metric_family"],
                "reference_type": METRIC_INFO[metric_id]["reference_type"],
                "higher_is_better": METRIC_INFO[metric_id]["higher_is_better"],
                "feature": feature,
                "is_hvg": bool(group["is_hvg"].iloc[0]),
                "is_pathology_feature": bool(group["is_pathology_feature"].iloc[0]),
                "mean_global_rank_score": score["mean"],
                "median_global_rank_score": score["median"],
                "std_global_rank_score": score["std"],
                "min_global_rank_score": score["min"],
                "max_global_rank_score": score["max"],
                "mean_normalized_global_rank_score": norm["mean"],
                "median_normalized_global_rank_score": norm["median"],
                "n_valid": score["n_valid"],
                "n_contexts": int(group["context_key"].nunique(dropna=True)),
                "n_method_clusters": int(group["method_cluster"].nunique(dropna=True)),
                "n_seeds": int(group["seed_label"].nunique(dropna=True)),
                "n_wins": wins.get((metric_id, feature), 0),
                "best_context_key": tied_best_value(group, "global_rank_score", "context_key", "contexts"),
                "best_method_cluster": tied_best_value(group, "global_rank_score", "method_cluster", "methods"),
                "best_spatial_method": tied_best_value(group, "global_rank_score", "spatial_method", "spatial methods"),
                "best_cluster_method": tied_best_value(group, "global_rank_score", "cluster_method", "cluster methods"),
                "best_seed_label": tied_best_value(group, "global_rank_score", "seed_label", "seeds"),
            }
        )
    return pd.DataFrame(records).sort_values(
        ["metric_id", "mean_global_rank_score", "median_global_rank_score", "feature"],
        ascending=[True, False, False, True],
    ).to_dict(orient="records")


def build_method_cluster_leaderboard(long_df: pd.DataFrame) -> list[dict[str, Any]]:
    wins = win_counts(long_df, ["metric_id", "feature", "seed_label"], ["metric_id", "method_cluster"])
    records: list[dict[str, Any]] = []
    for (metric_id, spatial_method, cluster_method), group in long_df.groupby(
        ["metric_id", "spatial_method", "cluster_method"], dropna=False
    ):
        score = aggregate_values(group["global_rank_score"])
        norm = aggregate_values(group["normalized_global_rank_score"])
        method_cluster = group["method_cluster"].iloc[0]
        records.append(
            {
                "metric_id": metric_id,
                "metric_family": METRIC_INFO[metric_id]["metric_family"],
                "reference_type": METRIC_INFO[metric_id]["reference_type"],
                "higher_is_better": METRIC_INFO[metric_id]["higher_is_better"],
                "spatial_method": spatial_method,
                "cluster_method": cluster_method,
                "method_cluster": method_cluster,
                "mean_global_rank_score": score["mean"],
                "median_global_rank_score": score["median"],
                "std_global_rank_score": score["std"],
                "min_global_rank_score": score["min"],
                "max_global_rank_score": score["max"],
                "mean_normalized_global_rank_score": norm["mean"],
                "median_normalized_global_rank_score": norm["median"],
                "n_valid": score["n_valid"],
                "n_features": int(group["feature"].nunique(dropna=True)),
                "n_seeds": int(group["seed_label"].nunique(dropna=True)),
                "n_wins": wins.get((metric_id, method_cluster), 0),
                "best_feature": tied_best_value(group, "global_rank_score", "feature", "features"),
                "best_context_key": tied_best_value(group, "global_rank_score", "context_key", "contexts"),
                "best_seed_label": tied_best_value(group, "global_rank_score", "seed_label", "seeds"),
            }
        )
    return pd.DataFrame(records).sort_values(
        ["metric_id", "mean_global_rank_score", "median_global_rank_score", "method_cluster"],
        ascending=[True, False, False, True],
    ).to_dict(orient="records")


def build_pipeline_leaderboard(long_df: pd.DataFrame) -> list[dict[str, Any]]:
    wins = win_counts(long_df, ["metric_id", "context_key"], ["metric_id", "pipeline_id"])
    records: list[dict[str, Any]] = []
    group_cols = ["metric_id", "feature", "spatial_method", "cluster_method"]
    for key, group in long_df.groupby(group_cols, dropna=False):
        metric_id, feature, spatial_method, cluster_method = key
        score = aggregate_values(group["global_rank_score"])
        norm = aggregate_values(group["normalized_global_rank_score"])
        worst = None
        valid = group.dropna(subset=["global_rank_score"])
        if not valid.empty:
            worst = valid.loc[valid["global_rank_score"].idxmin()]
        pipeline_id = group["pipeline_id"].iloc[0]
        records.append(
            {
                "metric_id": metric_id,
                "metric_family": METRIC_INFO[metric_id]["metric_family"],
                "reference_type": METRIC_INFO[metric_id]["reference_type"],
                "higher_is_better": METRIC_INFO[metric_id]["higher_is_better"],
                "feature": feature,
                "spatial_method": spatial_method,
                "cluster_method": cluster_method,
                "method_cluster": group["method_cluster"].iloc[0],
                "pipeline_id": pipeline_id,
                "is_hvg": bool(group["is_hvg"].iloc[0]),
                "is_pathology_feature": bool(group["is_pathology_feature"].iloc[0]),
                "mean_global_rank_score": score["mean"],
                "median_global_rank_score": score["median"],
                "std_global_rank_score": score["std"],
                "min_global_rank_score": score["min"],
                "max_global_rank_score": score["max"],
                "mean_normalized_global_rank_score": norm["mean"],
                "median_normalized_global_rank_score": norm["median"],
                "n_valid": score["n_valid"],
                "n_seeds": int(group["seed_label"].nunique(dropna=True)),
                "n_wins": wins.get((metric_id, pipeline_id), 0),
                "best_seed_label": tied_best_value(group, "global_rank_score", "seed_label", "seeds"),
                "worst_seed_label": None if worst is None else worst["seed_label"],
            }
        )
    return pd.DataFrame(records).sort_values(
        ["metric_id", "mean_global_rank_score", "median_global_rank_score", "pipeline_id"],
        ascending=[True, False, False, True],
    ).to_dict(orient="records")


def build_ccst_leiden_leaderboard(long_df: pd.DataFrame) -> list[dict[str, Any]]:
    ccst = long_df[(long_df["spatial_method"] == "ccst") & (long_df["cluster_method"] == "leiden")]
    if ccst.empty:
        return []
    pivot = (
        ccst.pivot_table(index=["feature", "is_hvg", "is_pathology_feature"], columns="metric_id", values="global_rank_score", aggfunc="mean")
        .reset_index()
        .rename_axis(None, axis=1)
    )
    for metric_id in METRIC_ORDER:
        if metric_id not in pivot.columns:
            pivot[metric_id] = np.nan
        pivot[f"rank_score_{metric_id}"] = pivot[metric_id]
    metric_score_cols = [f"rank_score_{metric}" for metric in METRIC_ORDER]
    pivot["mean_global_rank_score"] = pivot[metric_score_cols].mean(axis=1, skipna=True)
    pivot["median_global_rank_score"] = pivot[metric_score_cols].median(axis=1, skipna=True)
    pivot["n_valid_metrics"] = pivot[metric_score_cols].count(axis=1)
    output_cols = [
        "feature",
        "is_hvg",
        "is_pathology_feature",
        "mean_global_rank_score",
        "median_global_rank_score",
        *metric_score_cols,
        "n_valid_metrics",
    ]
    return pivot[output_cols].sort_values(["mean_global_rank_score", "feature"], ascending=[False, True]).to_dict(orient="records")


def build_cross_metric_summary(long_df: pd.DataFrame, entity_type: str, entity_cols: list[str]) -> list[dict[str, Any]]:
    valid = long_df.dropna(subset=["normalized_global_rank_score"]).copy()
    if valid.empty:
        return []
    metric_means = (
        valid.groupby(entity_cols + ["metric_id"], dropna=False)
        .agg(
            mean_global_rank_score=("global_rank_score", "mean"),
            mean_normalized_rank_score=("normalized_global_rank_score", "mean"),
        )
        .reset_index()
    )
    records: list[dict[str, Any]] = []
    for key, group in metric_means.groupby(entity_cols, dropna=False):
        key_tuple = key if isinstance(key, tuple) else (key,)
        entity_values = dict(zip(entity_cols, key_tuple))
        ordered = group.sort_values("mean_normalized_rank_score", ascending=False)
        best_metric = None if ordered.empty else ordered.iloc[0]["metric_id"]
        worst_metric = None if ordered.empty else ordered.iloc[-1]["metric_id"]
        entity_id = entity_values[entity_cols[0]]
        records.append(
            {
                "entity_type": entity_type,
                "entity_id": entity_id,
                **entity_values,
                "overall_mean_rank_score": float(group["mean_global_rank_score"].mean()),
                "overall_median_rank_score": float(group["mean_global_rank_score"].median()),
                "overall_mean_normalized_rank_score": float(group["mean_normalized_rank_score"].mean()),
                "overall_median_normalized_rank_score": float(group["mean_normalized_rank_score"].median()),
                "metric_std": float(group["mean_normalized_rank_score"].std(ddof=0)),
                "n_metrics": len(METRIC_ORDER),
                "n_valid_metrics": int(group["metric_id"].nunique(dropna=True)),
                "best_metric": best_metric,
                "worst_metric": worst_metric,
                "top_metrics": ordered["metric_id"].head(3).tolist(),
                "weak_metrics": ordered["metric_id"].tail(3).tolist(),
            }
        )
    return pd.DataFrame(records).sort_values(
        ["overall_mean_normalized_rank_score", "entity_id"], ascending=[False, True]
    ).to_dict(orient="records")


def process_spatial_labels(labels_path: Path, out_dir: Path) -> tuple[list[dict[str, Any]], set[tuple[str, str]], set[str]]:
    log(f"Reading spatial labels: {labels_path}")
    labels_df = pd.read_parquet(labels_path)
    require_columns(
        labels_df,
        [
            "dataset",
            "k",
            "seed",
            "feature",
            "spatial_method",
            "cluster_method",
            "label",
            "gt_label",
            "pxl_col_in_fullres",
            "pxl_row_in_fullres",
        ],
        "pfmc_all_labels.parquet",
    )
    n_rows_before = len(labels_df)
    seed_text = labels_df["seed"].astype(str)
    labels_df = labels_df[
        seed_text.isin(["0", "Result_seed0"])
        & labels_df["spatial_method"].astype(str).eq("ccst")
        & labels_df["cluster_method"].astype(str).eq("leiden")
    ].copy()
    log(f"Filtered labels from {n_rows_before:,} to {len(labels_df):,} rows for Result_seed0 + ccst + leiden")

    labels_dir = out_dir / "spatial_labels"
    labels_dir.mkdir(parents=True, exist_ok=True)
    manifest: list[dict[str, Any]] = []
    available_pairs: set[tuple[str, str]] = set()
    available_datasets: set[str] = set()

    for (dataset, feature), group in labels_df.groupby(["dataset", "feature"], sort=True, dropna=False):
        safe_dataset = safe_name(dataset)
        safe_feature = safe_name(feature)
        file_name = f"{safe_dataset}__{safe_feature}.json"
        file_path = labels_dir / file_name
        points = pd.DataFrame(
            {
                "x": pd.to_numeric(group["pxl_col_in_fullres"], errors="coerce"),
                "y": pd.to_numeric(group["pxl_row_in_fullres"], errors="coerce"),
                "label": group["label"].map(lambda value: None if pd.isna(value) else str(value)),
                "gt_label": group["gt_label"].map(lambda value: None if pd.isna(value) else str(value)),
            }
        )
        records = points.where(pd.notnull(points), None).to_dict(orient="records")
        write_records(file_path, records)
        gt_values = group["gt_label"].dropna().astype(str)
        pred_values = group["label"].dropna().astype(str)
        k_values = group["k"].dropna().unique().tolist()
        manifest.append(
            {
                "dataset": dataset,
                "feature": feature,
                "safe_dataset": safe_dataset,
                "safe_feature": safe_feature,
                "file": f"spatial_labels/{file_name}",
                "n_points": int(len(group)),
                "k": None if not k_values else jsonable(k_values[0]),
                "has_gt_label": bool(not gt_values.empty),
                "n_pred_labels": int(pred_values.nunique()),
                "n_gt_labels": int(gt_values.nunique()) if not gt_values.empty else 0,
            }
        )
        available_pairs.add((str(dataset), str(feature)))
        available_datasets.add(str(dataset))

    write_records(out_dir / "spatial_labels_manifest.json", manifest)
    log(f"Wrote spatial label manifest with {len(manifest):,} dataset-feature files")
    return manifest, available_pairs, available_datasets


def process_metrics(metrics_path: Path, out_dir: Path) -> pd.DataFrame:
    log(f"Reading raw metrics: {metrics_path}")
    metrics_df = pd.read_parquet(metrics_path)
    require_columns(
        metrics_df,
        ["dataset", "k", "seed", "feature", "spatial_method", "cluster_method"],
        "pfmc_metrics_11.parquet",
    )
    metric_columns = [metric for metric in METRIC_ORDER if metric in metrics_df.columns]
    if not metric_columns:
        raise ValueError("pfmc_metrics_11.parquet has no known raw metric columns.")

    long_df = metrics_df.melt(
        id_vars=["dataset", "k", "seed", "feature", "spatial_method", "cluster_method"],
        value_vars=metric_columns,
        var_name="metric_id",
        value_name="raw_value",
    )
    long_df["dataset_type"] = np.where(long_df["dataset"].astype(str).str.startswith("DLPFC_"), "DLPFC", "non_DLPFC")
    long_df["has_ground_truth"] = long_df["dataset_type"].eq("DLPFC")
    for field in ["metric_family", "reference_type", "higher_is_better"]:
        long_df[field] = long_df["metric_id"].map(lambda metric: METRIC_INFO[metric][field])
    long_df["method_cluster"] = long_df["spatial_method"].astype(str) + " || " + long_df["cluster_method"].astype(str)
    long_df["pipeline_id"] = (
        long_df["feature"].astype(str)
        + " || "
        + long_df["spatial_method"].astype(str)
        + " || "
        + long_df["cluster_method"].astype(str)
    )
    raw = pd.to_numeric(long_df["raw_value"], errors="coerce")
    long_df["score_for_ranking"] = np.where(long_df["higher_is_better"], raw, -raw)
    long_df.loc[raw.isna(), "score_for_ranking"] = np.nan
    group = long_df.groupby(["dataset", "metric_id"])["score_for_ranking"]
    ranks = group.rank(method="average", ascending=False)
    n_valid = group.transform("count")
    long_df["dataset_rank"] = ranks
    long_df["n_valid_in_dataset_metric"] = n_valid
    long_df["dataset_rank_score"] = n_valid - ranks + 1
    long_df["normalized_dataset_rank_score"] = long_df["dataset_rank_score"] / n_valid.replace({0: np.nan})
    invalid = raw.isna()
    rank_cols = [
        "score_for_ranking",
        "dataset_rank",
        "dataset_rank_score",
        "normalized_dataset_rank_score",
        "n_valid_in_dataset_metric",
    ]
    long_df.loc[invalid, rank_cols] = np.nan

    column_order = [
        "dataset",
        "dataset_type",
        "has_ground_truth",
        "k",
        "seed",
        "feature",
        "spatial_method",
        "cluster_method",
        "method_cluster",
        "pipeline_id",
        "metric_id",
        "metric_family",
        "reference_type",
        "raw_value",
        "higher_is_better",
        "score_for_ranking",
        "dataset_rank",
        "dataset_rank_score",
        "normalized_dataset_rank_score",
        "n_valid_in_dataset_metric",
    ]
    long_df = long_df[column_order]
    long_df.to_csv(out_dir / "metrics_long.csv", index=False, na_rep="")
    log(f"Wrote {out_dir / 'metrics_long.csv'} with {len(long_df):,} rows")
    return long_df


def best_group_value(df: pd.DataFrame, group_col: str, score_col: str) -> Any:
    valid = df.dropna(subset=[score_col])
    if valid.empty:
        return None
    means = valid.groupby(group_col)[score_col].mean().sort_values(ascending=False)
    if means.empty:
        return None
    return means.index[0]


def process_summaries(
    out_dir: Path,
    rank_long: pd.DataFrame,
    metrics_long: pd.DataFrame,
    rank_outputs: dict[str, list[dict[str, Any]]],
    spatial_manifest: list[dict[str, Any]],
    available_pairs: set[tuple[str, str]],
    available_label_datasets: set[str],
    rank_rows_count: int,
    metrics_rows_count: int,
    labels_rows_count: int,
    input_files: dict[str, str],
) -> None:
    dataset_summary = build_dataset_summary(metrics_long, available_label_datasets)
    feature_summary = build_feature_summary(rank_long, metrics_long, rank_outputs, available_pairs)
    method_summary = build_method_cluster_summary(rank_long, rank_outputs)
    metric_summary = build_metric_summary(rank_long, metrics_long, rank_outputs)

    write_records(out_dir / "dataset_summary.json", dataset_summary)
    write_records(out_dir / "feature_summary.json", feature_summary)
    write_records(out_dir / "method_cluster_summary.json", method_summary)
    write_records(out_dir / "metric_summary.json", metric_summary)
    log("Wrote dataset, feature, method_cluster, and metric summaries")

    manifest = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "input_files": input_files,
        "n_rows_rank_scores": rank_rows_count,
        "n_rows_metrics": metrics_rows_count,
        "n_rows_labels": labels_rows_count,
        "n_rows_rank_scores_long": int(len(rank_long)),
        "n_rows_metrics_long": int(len(metrics_long)),
        "n_spatial_label_files": int(len(spatial_manifest)),
        "datasets": sorted(metrics_long["dataset"].dropna().astype(str).unique().tolist()),
        "features": sorted(set(rank_long["feature"].dropna().astype(str)) | set(metrics_long["feature"].dropna().astype(str))),
        "pathology_features": sorted(
            feature
            for feature in set(rank_long["feature"].dropna().astype(str)) | set(metrics_long["feature"].dropna().astype(str))
            if feature != "HVG"
        ),
        "spatial_methods": sorted(
            set(rank_long["spatial_method"].dropna().astype(str)) | set(metrics_long["spatial_method"].dropna().astype(str))
        ),
        "cluster_methods": sorted(
            set(rank_long["cluster_method"].dropna().astype(str)) | set(metrics_long["cluster_method"].dropna().astype(str))
        ),
        "method_clusters": sorted(
            set(rank_long["method_cluster"].dropna().astype(str)) | set(metrics_long["method_cluster"].dropna().astype(str))
        ),
        "seed_labels": sorted(rank_long["seed_label"].dropna().astype(str).unique().tolist()),
        "metrics": [metric_record(metric) for metric in METRIC_ORDER],
        "notes": [
            "Global rank scores are loaded from rank_scores_merged.parquet.",
            "Raw metrics are loaded from pfmc_metrics_11.parquet.",
            "Spatial labels are only available for Result_seed0 + ccst + leiden.",
            "The frontend reads only public/data files, not parquet files.",
        ],
    }
    write_json(out_dir / "manifest.json", manifest)
    log("Wrote manifest.json")


def build_dataset_summary(metrics_long: pd.DataFrame, available_label_datasets: set[str]) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for dataset, group in metrics_long.groupby("dataset", sort=True, dropna=False):
        dataset_type = str(group["dataset_type"].iloc[0])
        main_metric = "ARI_gt" if dataset_type == "DLPFC" else "ARI_hvg"
        main = group[group["metric_id"].eq(main_metric)]
        valid_main = main.dropna(subset=["dataset_rank_score"])
        best_row = first_best_row(valid_main, "dataset_rank_score")
        records.append(
            {
                "dataset": dataset,
                "dataset_type": dataset_type,
                "has_ground_truth": bool(group["has_ground_truth"].iloc[0]),
                "n_features": int(group["feature"].nunique(dropna=True)),
                "n_pathology_features": int(group.loc[group["feature"].ne("HVG"), "feature"].nunique(dropna=True)),
                "n_spatial_methods": int(group["spatial_method"].nunique(dropna=True)),
                "n_cluster_methods": int(group["cluster_method"].nunique(dropna=True)),
                "n_method_clusters": int(group["method_cluster"].nunique(dropna=True)),
                "n_pipelines": int(group["pipeline_id"].nunique(dropna=True)),
                "n_clusters_or_k": None if group["k"].dropna().empty else jsonable(group["k"].dropna().mode().iloc[0]),
                "main_metric": main_metric,
                "best_feature": best_group_value(valid_main, "feature", "dataset_rank_score"),
                "best_method_cluster": best_group_value(valid_main, "method_cluster", "dataset_rank_score"),
                "best_pipeline_id": None if best_row is None else best_row["pipeline_id"],
                "best_raw_value": None if best_row is None else best_row["raw_value"],
                "best_dataset_rank_score": None if best_row is None else best_row["dataset_rank_score"],
                "available_in_spatial_labels": str(dataset) in available_label_datasets,
            }
        )
    return records


def build_feature_summary(
    rank_long: pd.DataFrame,
    metrics_long: pd.DataFrame,
    rank_outputs: dict[str, list[dict[str, Any]]],
    available_pairs: set[tuple[str, str]],
) -> list[dict[str, Any]]:
    global_means = (
        rank_long.groupby("feature")
        .agg(
            overall_mean_global_rank_score=("global_rank_score", "mean"),
            overall_mean_normalized_global_rank_score=("normalized_global_rank_score", "mean"),
            is_hvg=("is_hvg", "first"),
            is_pathology_feature=("is_pathology_feature", "first"),
        )
        .reset_index()
    )
    global_means = global_means.sort_values(["overall_mean_global_rank_score", "feature"], ascending=[False, True]).reset_index(drop=True)
    global_means["overall_rank"] = np.arange(1, len(global_means) + 1)

    metric_means = rank_long.groupby(["feature", "metric_id"])["global_rank_score"].mean().unstack()
    dataset_winners = metrics_long.dropna(subset=["dataset_rank_score"]).copy()
    dataset_winners["_max"] = dataset_winners.groupby(["dataset", "metric_id"])["dataset_rank_score"].transform("max")
    dataset_winners = dataset_winners[dataset_winners["dataset_rank_score"].eq(dataset_winners["_max"])]
    dataset_win_counts = dataset_winners.groupby("feature").size()
    pipeline_df = pd.DataFrame(rank_outputs["leaderboard_pipeline"])
    pipeline_wins = pipeline_df.groupby("feature")["n_wins"].sum() if not pipeline_df.empty else pd.Series(dtype=float)

    records: list[dict[str, Any]] = []
    for _, row in global_means.iterrows():
        feature = row["feature"]
        feature_metric = metric_means.loc[feature] if feature in metric_means.index else pd.Series(dtype=float)
        feature_metrics = metrics_long[metrics_long["feature"].eq(feature)].dropna(subset=["normalized_dataset_rank_score"])
        records.append(
            {
                "feature": feature,
                "is_hvg": bool(row["is_hvg"]),
                "is_pathology_feature": bool(row["is_pathology_feature"]),
                "overall_rank": int(row["overall_rank"]),
                "overall_mean_global_rank_score": row["overall_mean_global_rank_score"],
                "overall_mean_normalized_global_rank_score": row["overall_mean_normalized_global_rank_score"],
                "mean_ARI_hvg_global_rank_score": feature_metric.get("ARI_hvg", None),
                "mean_ARI_gt_global_rank_score": feature_metric.get("ARI_gt", None),
                "mean_ASW_global_rank_score": feature_metric.get("ASW", None),
                "mean_PAS_global_rank_score": feature_metric.get("PAS", None),
                "mean_CHAOS_global_rank_score": feature_metric.get("CHAOS", None),
                "best_dataset": best_group_value(feature_metrics, "dataset", "normalized_dataset_rank_score"),
                "best_method_cluster": best_group_value(rank_long[rank_long["feature"].eq(feature)], "method_cluster", "global_rank_score"),
                "n_dataset_wins": int(dataset_win_counts.get(feature, 0)),
                "n_pipeline_wins": int(pipeline_wins.get(feature, 0)),
                "available_in_spatial_labels": any(pair_feature == str(feature) for _, pair_feature in available_pairs),
            }
        )
    return records


def build_method_cluster_summary(rank_long: pd.DataFrame, rank_outputs: dict[str, list[dict[str, Any]]]) -> list[dict[str, Any]]:
    global_means = (
        rank_long.groupby(["method_cluster", "spatial_method", "cluster_method"])
        .agg(
            overall_mean_global_rank_score=("global_rank_score", "mean"),
            overall_mean_normalized_global_rank_score=("normalized_global_rank_score", "mean"),
        )
        .reset_index()
    )
    global_means = global_means.sort_values(
        ["overall_mean_global_rank_score", "method_cluster"], ascending=[False, True]
    ).reset_index(drop=True)
    global_means["overall_rank"] = np.arange(1, len(global_means) + 1)
    method_lb = pd.DataFrame(rank_outputs["leaderboard_method_cluster"])
    feature_wins = method_lb.groupby("method_cluster")["n_wins"].sum() if not method_lb.empty else pd.Series(dtype=float)
    metric_winners = method_lb.dropna(subset=["mean_global_rank_score"]).copy() if not method_lb.empty else pd.DataFrame()
    if not metric_winners.empty:
        metric_winners["_max"] = metric_winners.groupby("metric_id")["mean_global_rank_score"].transform("max")
        metric_winners = metric_winners[metric_winners["mean_global_rank_score"].eq(metric_winners["_max"])]
        metric_win_counts = metric_winners.groupby("method_cluster").size()
    else:
        metric_win_counts = pd.Series(dtype=float)

    records: list[dict[str, Any]] = []
    for _, row in global_means.iterrows():
        method_cluster = row["method_cluster"]
        subset = rank_long[rank_long["method_cluster"].eq(method_cluster)]
        records.append(
            {
                "method_cluster": method_cluster,
                "spatial_method": row["spatial_method"],
                "cluster_method": row["cluster_method"],
                "overall_rank": int(row["overall_rank"]),
                "overall_mean_global_rank_score": row["overall_mean_global_rank_score"],
                "overall_mean_normalized_global_rank_score": row["overall_mean_normalized_global_rank_score"],
                "best_feature": best_group_value(subset, "feature", "global_rank_score"),
                "best_metric": best_group_value(subset, "metric_id", "global_rank_score"),
                "n_feature_wins": int(feature_wins.get(method_cluster, 0)),
                "n_metric_wins": int(metric_win_counts.get(method_cluster, 0)),
            }
        )
    return records


def build_metric_summary(
    rank_long: pd.DataFrame,
    metrics_long: pd.DataFrame,
    rank_outputs: dict[str, list[dict[str, Any]]],
) -> list[dict[str, Any]]:
    feature_lb = pd.DataFrame(rank_outputs["leaderboard_feature"])
    method_lb = pd.DataFrame(rank_outputs["leaderboard_method_cluster"])
    pipeline_lb = pd.DataFrame(rank_outputs["leaderboard_pipeline"])
    records: list[dict[str, Any]] = []
    for metric_id in METRIC_ORDER:
        info = METRIC_INFO[metric_id]
        rank_metric = rank_long[rank_long["metric_id"].eq(metric_id)]
        raw_metric = metrics_long[metrics_long["metric_id"].eq(metric_id)]
        feature_metric = feature_lb[feature_lb["metric_id"].eq(metric_id)] if not feature_lb.empty else pd.DataFrame()
        method_metric = method_lb[method_lb["metric_id"].eq(metric_id)] if not method_lb.empty else pd.DataFrame()
        pipeline_metric = pipeline_lb[pipeline_lb["metric_id"].eq(metric_id)] if not pipeline_lb.empty else pd.DataFrame()
        records.append(
            {
                "metric_id": metric_id,
                **info,
                "n_valid_global_rank_scores": int(rank_metric["global_rank_score"].notna().sum()),
                "n_valid_raw_values": int(raw_metric["raw_value"].notna().sum()),
                "n_datasets_available": int(raw_metric.dropna(subset=["raw_value"])["dataset"].nunique()),
                "n_features_available": int(raw_metric.dropna(subset=["raw_value"])["feature"].nunique()),
                "n_method_clusters_available": int(raw_metric.dropna(subset=["raw_value"])["method_cluster"].nunique()),
                "best_feature_global": pick_top_value(feature_metric, "feature"),
                "best_method_cluster_global": pick_top_value(method_metric, "method_cluster"),
                "best_pipeline_global": pick_top_value(pipeline_metric, "pipeline_id"),
            }
        )
    return records


def pick_top_value(df: pd.DataFrame, value_col: str) -> Any:
    if df.empty or "mean_global_rank_score" not in df.columns:
        return None
    valid = df.dropna(subset=["mean_global_rank_score"])
    if valid.empty:
        return None
    return valid.sort_values(["mean_global_rank_score", value_col], ascending=[False, True]).iloc[0][value_col]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--rank-scores", required=True, type=Path, help="Path to rank_scores_merged.parquet")
    parser.add_argument("--metrics", required=True, type=Path, help="Path to pfmc_metrics_11.parquet")
    parser.add_argument("--labels", required=True, type=Path, help="Path to pfmc_all_labels.parquet")
    parser.add_argument("--out", required=True, type=Path, help="Output directory, usually public/data")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    for path in [args.rank_scores, args.metrics, args.labels]:
        if not path.exists():
            raise FileNotFoundError(path)
    args.out.mkdir(parents=True, exist_ok=True)

    rank_rows_count = int(pd.read_parquet(args.rank_scores, columns=["feature"]).shape[0])
    metrics_rows_count = int(pd.read_parquet(args.metrics, columns=["dataset"]).shape[0])
    labels_rows_count = int(pd.read_parquet(args.labels, columns=["dataset"]).shape[0])

    rank_long, rank_outputs = process_rank_scores(args.rank_scores, args.out)
    spatial_manifest, available_pairs, available_label_datasets = process_spatial_labels(args.labels, args.out)
    metrics_long = process_metrics(args.metrics, args.out)
    process_summaries(
        args.out,
        rank_long,
        metrics_long,
        rank_outputs,
        spatial_manifest,
        available_pairs,
        available_label_datasets,
        rank_rows_count,
        metrics_rows_count,
        labels_rows_count,
        {
            "rank_scores": str(args.rank_scores),
            "metrics": str(args.metrics),
            "labels": str(args.labels),
        },
    )
    log("Done")


if __name__ == "__main__":
    main()
