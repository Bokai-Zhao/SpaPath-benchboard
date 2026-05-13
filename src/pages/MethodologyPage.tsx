export function MethodologyPage() {
  return (
    <article className="prose prose-slate max-w-none rounded-lg border border-line bg-white p-6 shadow-sm">
      <h1>SpaPath-Bench Methodology</h1>
      <p>
        SpaPath-Bench evaluates whether pathology foundation model features encode tissue spatial organization when used with
        spatial domain identification and clustering readouts.
      </p>
      <h2>Pipeline Definition</h2>
      <p>
        A benchmark pipeline is <code>feature + spatial_method + cluster_method</code>. The dashboard derives every dataset,
        feature, metric, method cluster, and pipeline identifier from the prepared data.
      </p>
      <h2>Ranking Semantics</h2>
      <p>
        <code>global_rank_score</code> is loaded from <code>rank_scores_merged.parquet</code>. The dashboard does not recompute it
        from raw metrics and does not replace it with dataset-level ranks.
      </p>
      <p>
        <code>dataset_rank_score</code> is computed only within each <code>dataset + metric_id</code> group from raw values in
        <code>pfmc_metrics_11.parquet</code>. PAS and CHAOS are lower-is-better; ASW, ARI, NMI, HOM, and COM are higher-is-better.
        Ties use average rank, and missing values are skipped.
      </p>
      <h2>Paper-Aligned Headline Findings</h2>
      <p>
        The dashboard follows the manuscript conclusions: H-Optimus-1 is the top pathology model under the HVG-referenced
        transcriptomic proxy, MUSK is the top pathology model under expert DLPFC annotations, and CCST + Leiden is treated as
        the optimal spatial representation and clustering setting for Fig.2C/Fig.2D-style views.
      </p>
      <p>
        Some exploratory dashboard aggregates average across metric families that the paper reports separately. Those views are
        useful for browsing but should not be read as replacing the reference-specific conclusions above.
      </p>
      <h2>References</h2>
      <p>
        DLPFC datasets use ground truth layer labels for GT-referenced metrics such as ARI_gt and NMI_gt. Non-DLPFC datasets
        primarily use HVG pseudo-reference metrics such as ARI_hvg and NMI_hvg. PAS, CHAOS, and ASW are unsupervised spatial
        coherence metrics.
      </p>
      <h2>Spatial Gallery</h2>
      <p>
        Spatial labels are loaded only for <code>Result_seed0 + ccst + leiden</code>. The preprocessing script splits
        <code>pfmc_all_labels.parquet</code> into small JSON files by <code>dataset + feature</code>, each containing x, y, label,
        and optional gt_label. The y-axis is inverted in the frontend plotting layer.
      </p>
      <h2>Updating Data</h2>
      <p>
        Replace the three parquet files, rerun <code>scripts/prepare_dashboard_data.py</code>, commit <code>public/data/</code>,
        then rebuild or push to GitHub Pages.
      </p>
    </article>
  );
}
